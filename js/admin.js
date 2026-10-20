// PS Corretor de Imóveis — Painel Administrativo

// Caminhos salvos no banco são relativos à raiz do site (ex.: "assets/imoveis/x.jpg"),
// mas as páginas do painel vivem em /admin/ — prefixa "../" para resolver certo.
// URLs completas (Supabase Storage) passam direto.
window.adminImgSrc = function (path) {
  if (!path) return '';
  return /^https?:\/\//.test(path) ? path : '../' + path;
};

// Remove arquivos órfãos do Supabase Storage quando um imóvel, foto, bairro ou
// avatar é excluído/substituído pelo painel (evita acumular lixo no limite de 1 GB).
// Ignora caminhos locais ("assets/...") e URLs externas (Unsplash, etc.).
window.removeStorageFiles = async function (urls) {
  if (!urls || !window.supabaseClient) return;
  const list = Array.isArray(urls) ? urls : [urls];
  const byBucket = {};
  const marker = '/storage/v1/object/public/';

  for (const url of list) {
    if (!url || typeof url !== 'string') continue;
    const idx = url.indexOf(marker);
    if (idx === -1) continue;
    const rest = url.slice(idx + marker.length).split('?')[0];
    const slash = rest.indexOf('/');
    if (slash <= 0) continue;
    const bucket = rest.slice(0, slash);
    const filePath = decodeURIComponent(rest.slice(slash + 1));
    if (!filePath) continue;
    (byBucket[bucket] = byBucket[bucket] || []).push(filePath);
  }

  for (const [bucket, paths] of Object.entries(byBucket)) {
    try {
      await supabaseClient.storage.from(bucket).remove(paths);
    } catch (err) {
      console.warn('Falha ao limpar arquivo antigo do Storage:', bucket, err);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Sidebar (mobile) ---- */
  const sidebar = document.getElementById('adminSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const openBtn = document.getElementById('sidebarOpen');
  const closeBtn = document.getElementById('sidebarClose');

  function openSidebar() { sidebar.classList.add('is-open'); backdrop.classList.add('is-visible'); }
  function closeSidebar() { sidebar.classList.remove('is-open'); backdrop.classList.remove('is-visible'); }

  if (openBtn) openBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  /* ---- Filtro chips (Meus Imóveis) ---- */
  document.querySelectorAll('.admin-toolbar .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.admin-toolbar .chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
    });
  });

  /* ---- Auto-importação + auto-compressão das fotos do Supabase antigo ----
     Assim que o ciclo da conta antiga (zbnnwriwfnvcmsduxtti) virar e liberar
     a leitura das 241 fotos, qualquer abertura do painel baixa cada foto antiga,
     comprime em WebP (~100 KB) e salva no banco/Storage novo automaticamente. */
  async function compressBlobToWebp(blob, maxSize = 1280, quality = 0.78) {
    const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    if (bmp.close) bmp.close();
    let out = await new Promise(r => canvas.toBlob(r, 'image/webp', quality));
    let q = quality;
    while (out && out.size > 180 * 1024 && q > 0.50) {
      q = Math.max(0.48, q - 0.12);
      const next = await new Promise(r => canvas.toBlob(r, 'image/webp', q));
      if (!next || next.size >= out.size) break;
      out = next;
    }
    return out || blob;
  }

  async function migrateSingleLegacyUrl(oldUrl, bucket) {
    if (!oldUrl || !oldUrl.includes('zbnnwriwfnvcmsduxtti.supabase.co')) return oldUrl;
    const res = await fetch(oldUrl);
    if (!res.ok) throw new Error('legacy_locked_' + res.status);
    const origBlob = await res.blob();
    const webpBlob = await compressBlobToWebp(origBlob, bucket === 'avatares' ? 512 : 1280, 0.78);
    const path = `migrated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const { error } = await supabaseClient.storage.from(bucket).upload(path, webpBlob, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true
    });
    if (error) throw error;
    return supabaseClient.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function autoMigrateLegacyPhotos() {
    if (!window.supabaseClient) return;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) return;

      // 1. Verifica imóveis que ainda apontam para o Storage antigo
      const { data: imoveis } = await supabaseClient.from('imoveis').select('id, capa, fotos, fotos_destaque');
      const legacyImoveis = (imoveis || []).filter(p =>
        (p.capa && p.capa.includes('zbnnwriwfnvcmsduxtti')) ||
        (p.fotos || []).some(u => u && u.includes('zbnnwriwfnvcmsduxtti'))
      );

      for (const p of legacyImoveis) {
        const urlMap = new Map();
        const allUrls = [...new Set([p.capa, ...(p.fotos || []), ...(p.fotos_destaque || [])].filter(Boolean))];
        for (const u of allUrls) {
          if (u.includes('zbnnwriwfnvcmsduxtti.supabase.co')) {
            const newUrl = await migrateSingleLegacyUrl(u, 'imoveis-fotos');
            urlMap.set(u, newUrl);
          }
        }
        if (urlMap.size > 0) {
          await supabaseClient.from('imoveis').update({
            capa: urlMap.get(p.capa) || p.capa,
            fotos: (p.fotos || []).map(u => urlMap.get(u) || u),
            fotos_destaque: (p.fotos_destaque || []).map(u => urlMap.get(u) || u)
          }).eq('id', p.id);
        }
      }

      // 2. Verifica avatar do corretor
      const { data: perfis } = await supabaseClient.from('corretor_perfil').select('id, foto_url');
      for (const pf of (perfis || [])) {
        if (pf.foto_url && pf.foto_url.includes('zbnnwriwfnvcmsduxtti.supabase.co')) {
          const newAvatar = await migrateSingleLegacyUrl(pf.foto_url, 'avatares');
          await supabaseClient.from('corretor_perfil').update({ foto_url: newAvatar }).eq('id', pf.id);
        }
      }
    } catch (_) {
      // Silencioso enquanto o projeto antigo estiver com bloqueio 402
    }
  }

  setTimeout(autoMigrateLegacyPhotos, 1500);

  /* ---- Medidor de Capacidade (Storage & Banco) + Alerta 80% + Central de Limpeza ---- */
  const SUPPORT_WA_NUMBER = '5542999318784';
  const SUPPORT_WA_URL = `https://wa.me/${SUPPORT_WA_NUMBER}?text=${encodeURIComponent('Olá! O painel do site Paulo Souza Corretor de Imóveis indicou que preciso contratar mais espaço no servidor.')}`;
  const WARN_THRESHOLD_PCT = 80;

  function fmtMB(bytes) {
    const mb = (bytes || 0) / (1024 * 1024);
    return mb >= 10 ? mb.toFixed(1) + ' MB' : mb.toFixed(2) + ' MB';
  }

  function escapeHtml(str) {
    return (str == null ? '' : String(str)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function levelClass(pct) {
    if (pct >= WARN_THRESHOLD_PCT) return 'is-danger';
    if (pct >= 60) return 'is-warn';
    return '';
  }

  async function fetchUsageStats() {
    if (!window.supabaseClient) return null;
    const { data, error } = await supabaseClient.rpc('get_storage_usage');
    if (error || !data) return null;
    const storageBytes = Number(data.storage_bytes || 0);
    const storageLimit = Number(data.storage_limit_bytes || 1073741824);
    const dbBytes = Number(data.db_bytes || 0);
    const dbLimit = Number(data.db_limit_bytes || 524288000);
    const storagePct = Math.min(100, (storageBytes / storageLimit) * 100);
    const dbPct = Math.min(100, (dbBytes / dbLimit) * 100);
    const mainPct = Math.max(storagePct, dbPct);
    const remainingStorageBytes = Math.max(0, storageLimit - storageBytes);
    // Estimativa conservadora: ~1.5 MB por imóvel (15 fotos comprimidas em WebP ~100 KB)
    const estimatedRemainingProperties = Math.floor(remainingStorageBytes / (1.5 * 1024 * 1024));
    return {
      storageBytes,
      storageLimit,
      storageFiles: Number(data.storage_files || 0),
      storagePct,
      dbBytes,
      dbLimit,
      dbPct,
      mainPct,
      estimatedRemainingProperties
    };
  }

  function ensureCleanupModal() {
    let overlay = document.getElementById('cleanupModalOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'cleanupModalOverlay';
    overlay.className = 'cleanup-modal-overlay';
    overlay.innerHTML = `
      <div class="cleanup-modal" role="dialog" aria-modal="true" aria-labelledby="cleanupModalTitle">
        <div class="cleanup-modal__header">
          <h3 id="cleanupModalTitle">Gerenciar Capacidade &amp; Limpeza de Imóveis</h3>
          <button type="button" class="icon-btn" id="cleanupModalClose" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="cleanup-modal__body">
          <div id="cleanupModalStats"></div>

          <div>
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <div>
                <strong style="font-size:var(--fs-sm);color:var(--color-heading);">Remover imóveis que já não estão disponíveis</strong>
                <p style="font-size:var(--fs-xs);color:var(--color-text-tertiary);margin:2px 0 0;">Selecione imóveis já vendidos/alugados ou em rascunho para apagar o anúncio e liberar o espaço das fotos no servidor.</p>
              </div>
              <div class="filter-chips" id="cleanupFilterChips">
                <button type="button" class="chip is-active" data-cfilter=" todos">Todos</button>
                <button type="button" class="chip" data-cfilter="inativos">Rascunhos / Pendentes</button>
                <button type="button" class="chip" data-cfilter="antigos">Mais antigos</button>
              </div>
            </div>
            <div class="cleanup-list" id="cleanupPropertyList">
              <p class="empty-state">Carregando imóveis...</p>
            </div>
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;">
              <span id="cleanupSelectedInfo" style="font-size:var(--fs-xs);color:var(--color-text-tertiary);">Nenhum imóvel selecionado</span>
              <button type="button" class="btn btn-primary btn-sm" id="btnDeleteSelectedCleanup" disabled style="background:var(--color-danger);border-color:var(--color-danger);">
                Excluir selecionados e liberar espaço
              </button>
            </div>
          </div>

          <div class="cleanup-upgrade-cta">
            <div>
              <strong>Prefere manter todos os imóveis e ampliar a capacidade?</strong>
              <span>Contrate mais espaço de armazenamento e tráfego dedicado para o seu site sem precisar apagar anúncios.</span>
            </div>
            <a href="${SUPPORT_WA_URL}" target="_blank" rel="noopener" class="btn-whatsapp">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.14c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.81-.11-.42-.13-.95-.31-1.64-.6-2.9-1.25-4.8-4.16-4.94-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.13 1.02-2.42.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.65.5.24.58.81 2 .88 2.14.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.37 1.47.29.15.46.13.63-.05.17-.19.72-.84.92-1.13.19-.29.38-.24.63-.14.26.1 1.64.77 1.92.91.29.15.48.22.55.34.07.13.07.72-.17 1.4Z"/></svg>
              Contratar mais espaço · (42) 99931-8784
            </a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#cleanupModalClose').addEventListener('click', () => overlay.classList.remove('is-open'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('is-open'); });

    let modalProperties = [];
    let currentFilter = 'todos';

    function updateSelectedCount() {
      const checked = overlay.querySelectorAll('.cleanup-check:checked');
      const btn = overlay.querySelector('#btnDeleteSelectedCleanup');
      const info = overlay.querySelector('#cleanupSelectedInfo');
      let totalPhotos = 0;
      checked.forEach(ch => { totalPhotos += parseInt(ch.dataset.photos || '0', 10); });
      btn.disabled = checked.length === 0;
      info.textContent = checked.length
        ? `${checked.length} imóvel(is) selecionado(s) (${totalPhotos} foto(s) serão liberadas)`
        : 'Nenhum imóvel selecionado';
    }

    function renderCleanupList() {
      const listEl = overlay.querySelector('#cleanupPropertyList');
      let filtered = [...modalProperties];
      if (currentFilter === 'inativos') {
        filtered = filtered.filter(p => p.status !== 'ativo');
      } else if (currentFilter === 'antigos') {
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      } else {
        // Prioriza rascunhos/pendentes no topo, depois mais antigos
        filtered.sort((a, b) => {
          if ((a.status !== 'ativo') !== (b.status !== 'ativo')) return a.status !== 'ativo' ? -1 : 1;
          return new Date(a.created_at) - new Date(b.created_at);
        });
      }

      if (!filtered.length) {
        listEl.innerHTML = `<p class="empty-state" style="padding:16px;">Nenhum imóvel encontrado neste filtro.</p>`;
        updateSelectedCount();
        return;
      }

      const statusBadge = { ativo: 'Ativo', pendente: 'Pendente', rascunho: 'Rascunho' };
      listEl.innerHTML = filtered.map(p => {
        const fotosCount = Array.isArray(p.fotos) ? p.fotos.length : 0;
        const capa = window.adminImgSrc(p.capa || (p.fotos && p.fotos[0])) || '../assets/logo.jpeg';
        const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '';
        return `
          <label class="cleanup-item">
            <input type="checkbox" class="cleanup-check" value="${p.id}" data-photos="${fotosCount}">
            <img src="${escapeHtml(capa)}" alt="" onerror="this.onerror=null;this.src='../assets/logo.jpeg';">
            <div class="cleanup-item__info">
              <strong>${escapeHtml(p.titulo)}</strong>
              <span>${statusBadge[p.status] || p.status} · ${escapeHtml(p.bairro)} · ${fotosCount} foto(s) · Cadastrado em ${dateStr}</span>
            </div>
            <span style="font-size:var(--fs-xs);font-weight:600;color:var(--color-text-secondary);">${escapeHtml(p.preco_label)}</span>
          </label>`;
      }).join('');

      listEl.querySelectorAll('.cleanup-check').forEach(ch => ch.addEventListener('change', updateSelectedCount));
      updateSelectedCount();
    }

    overlay.querySelectorAll('#cleanupFilterChips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        overlay.querySelectorAll('#cleanupFilterChips .chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        currentFilter = chip.dataset.cfilter.trim();
        renderCleanupList();
      });
    });

    overlay.querySelector('#btnDeleteSelectedCleanup').addEventListener('click', async () => {
      const checked = Array.from(overlay.querySelectorAll('.cleanup-check:checked'));
      if (!checked.length) return;
      if (!confirm(`Tem certeza que deseja excluir ${checked.length} imóvel(is) selecionado(s) e apagar suas fotos para liberar espaço? Essa ação não pode ser desfeita.`)) return;

      const btn = overlay.querySelector('#btnDeleteSelectedCleanup');
      btn.disabled = true;
      btn.textContent = 'Limpando espaço...';

      for (const ch of checked) {
        const id = ch.value;
        const prop = modalProperties.find(x => x.id === id);
        if (!prop) continue;
        const { error } = await supabaseClient.from('imoveis').delete().eq('id', id);
        if (!error && window.removeStorageFiles) {
          const urls = [...(prop.fotos || []), prop.capa].filter(Boolean);
          await window.removeStorageFiles(urls);
        }
      }

      btn.textContent = 'Excluir selecionados e liberar espaço';
      await openCleanupModal();
      await initCapacityMeter();
      if (location.pathname.endsWith('properties.html') || location.pathname.endsWith('dashboard.html')) {
        location.reload();
      }
    });

    overlay._loadData = async (stats) => {
      if (stats) {
        const cls = levelClass(stats.mainPct);
        overlay.querySelector('#cleanupModalStats').innerHTML = `
          <div class="capacity-grid">
            <div class="capacity-box">
              <div class="capacity-box__row">
                <span>Armazenamento de Fotos (Storage)</span>
                <strong>${fmtMB(stats.storageBytes)} / ${fmtMB(stats.storageLimit)} (${stats.storagePct.toFixed(1)}%)</strong>
              </div>
              <div class="meter-bar meter-bar--surface"><div class="meter-bar__fill ${cls}" style="width:${Math.max(2, stats.storagePct)}%"></div></div>
              <p class="capacity-box__hint">${stats.storageFiles} arquivo(s) no servidor · Espaço livre p/ aprox. <strong>+${stats.estimatedRemainingProperties} imóveis</strong></p>
            </div>
            <div class="capacity-box">
              <div class="capacity-box__row">
                <span>Banco de Dados (Contratos, Recibos e Textos)</span>
                <strong>${fmtMB(stats.dbBytes)} / ${fmtMB(stats.dbLimit)} (${stats.dbPct.toFixed(1)}%)</strong>
              </div>
              <div class="meter-bar meter-bar--surface"><div class="meter-bar__fill ${levelClass(stats.dbPct)}" style="width:${Math.max(2, stats.dbPct)}%"></div></div>
              <p class="capacity-box__hint">Alerta automático programado aos 80% de uso.</p>
            </div>
          </div>`;
      }
      const { data } = await supabaseClient.from('imoveis').select('id, titulo, bairro, preco_label, status, capa, fotos, created_at').order('created_at', { ascending: true });
      modalProperties = data || [];
      renderCleanupList();
    };

    return overlay;
  }

  let cachedStats = null;
  async function openCleanupModal() {
    const overlay = ensureCleanupModal();
    overlay.classList.add('is-open');
    cachedStats = await fetchUsageStats() || cachedStats;
    await overlay._loadData(cachedStats);
  }
  window.openCleanupModal = openCleanupModal;

  async function initCapacityMeter() {
    const stats = await fetchUsageStats();
    if (!stats) return;
    cachedStats = stats;

    const cls = levelClass(stats.mainPct);
    const pctLabel = stats.mainPct < 1 && stats.mainPct > 0 ? stats.mainPct.toFixed(1) + '%' : Math.round(stats.mainPct) + '%';

    // 1. Medidor compacto na barra lateral (presente em todas as telas do CMS)
    if (sidebar) {
      let sideMeter = document.getElementById('sidebarCapacityMeter');
      if (!sideMeter) {
        sideMeter = document.createElement('div');
        sideMeter.id = 'sidebarCapacityMeter';
        const footer = sidebar.querySelector('.admin-sidebar__footer');
        sidebar.insertBefore(sideMeter, footer);
      }
      sideMeter.className = `sidebar-meter ${cls}`;
      sideMeter.innerHTML = `
        <div class="sidebar-meter__head">
          <span>Capacidade do Site</span>
          <span class="sidebar-meter__pct">${pctLabel}</span>
        </div>
        <div class="meter-bar"><div class="meter-bar__fill ${cls}" style="width:${Math.max(3, stats.mainPct)}%"></div></div>
        <div class="sidebar-meter__meta">
          <span>${fmtMB(stats.storageBytes)} de 1 GB</span>
          <span>${stats.storageFiles} fotos</span>
        </div>
        <div class="sidebar-meter__actions">
          <button type="button" class="sidebar-meter__btn" data-open-cleanup>Limpar / Ver</button>
          <a href="${SUPPORT_WA_URL}" target="_blank" rel="noopener" class="sidebar-meter__btn sidebar-meter__btn--wa">+ Espaço</a>
        </div>
      `;
      sideMeter.querySelector('[data-open-cleanup]').addEventListener('click', openCleanupModal);
    }

    // 2. Alerta automático no topo do CMS quando atingir >= 80%
    const adminContent = document.querySelector('.admin-content');
    if (adminContent && stats.mainPct >= WARN_THRESHOLD_PCT) {
      let alertBanner = document.getElementById('capacityAlertBanner');
      if (!alertBanner) {
        alertBanner = document.createElement('div');
        alertBanner.id = 'capacityAlertBanner';
        alertBanner.className = 'capacity-alert-banner';
        adminContent.prepend(alertBanner);
      }
      alertBanner.innerHTML = `
        <div class="capacity-alert-banner__text">
          <strong>⚠️ Atenção: A capacidade do servidor atingiu ${pctLabel} (limite de segurança de 80%)</strong>
          <span>Remova imóveis que já foram vendidos ou alugados para liberar espaço, ou contrate mais capacidade pelo WhatsApp.</span>
        </div>
        <div class="capacity-alert-banner__actions">
          <button type="button" class="btn btn-outline btn-sm" id="alertBtnCleanup">Limpar imóveis indisponíveis</button>
          <a href="${SUPPORT_WA_URL}" target="_blank" rel="noopener" class="btn-whatsapp">Contratar mais espaço · (42) 99931-8784</a>
        </div>
      `;
      alertBanner.querySelector('#alertBtnCleanup').addEventListener('click', openCleanupModal);
    }

    // 3. Painel detalhado no Dashboard (admin/dashboard.html)
    const statGrid = document.getElementById('statGrid');
    if (statGrid) {
      let dashPanel = document.getElementById('dashboardCapacityPanel');
      if (!dashPanel) {
        dashPanel = document.createElement('section');
        dashPanel.id = 'dashboardCapacityPanel';
        const anchor = document.getElementById('aliveMaintenanceBanner') || statGrid;
        anchor.insertAdjacentElement('afterend', dashPanel);
      }
      dashPanel.className = `capacity-panel ${cls}`;
      dashPanel.innerHTML = `
        <div class="capacity-panel__top">
          <div class="capacity-panel__title">
            <div>
              <h2>Capacidade do Servidor &amp; Armazenamento</h2>
              <p>${stats.mainPct >= WARN_THRESHOLD_PCT
                ? '⚠️ Capacidade acima de 80%! Faça uma limpeza de imóveis antigos ou contrate mais espaço.'
                : 'Monitoramento em tempo real das fotos e banco de dados. Um lembrete automático será exibido quando atingir 80%.'}</p>
            </div>
          </div>
          <div class="capacity-panel__actions">
            <button type="button" class="btn btn-outline btn-sm" id="dashBtnCleanup">Limpar imóveis indisponíveis</button>
            <a href="${SUPPORT_WA_URL}" target="_blank" rel="noopener" class="btn-whatsapp">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.14c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.81-.11-.42-.13-.95-.31-1.64-.6-2.9-1.25-4.8-4.16-4.94-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.13 1.02-2.42.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.65.5.24.58.81 2 .88 2.14.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.37 1.47.29.15.46.13.63-.05.17-.19.72-.84.92-1.13.19-.29.38-.24.63-.14.26.1 1.64.77 1.92.91.29.15.48.22.55.34.07.13.07.72-.17 1.4Z"/></svg>
              Contratar mais espaço
            </a>
          </div>
        </div>
        <div class="capacity-grid">
          <div class="capacity-box">
            <div class="capacity-box__row">
              <span>Espaço de Fotos (Storage)</span>
              <strong>${fmtMB(stats.storageBytes)} de 1.024 MB (${stats.storagePct.toFixed(1)}%)</strong>
            </div>
            <div class="meter-bar meter-bar--surface"><div class="meter-bar__fill ${cls}" style="width:${Math.max(2, stats.storagePct)}%"></div></div>
            <p class="capacity-box__hint">${stats.storageFiles} fotos no servidor · Capacidade estimada para mais <strong>~${stats.estimatedRemainingProperties} imóveis</strong></p>
          </div>
          <div class="capacity-box">
            <div class="capacity-box__row">
              <span>Banco de Dados (Cadastros, Contratos e Recibos)</span>
              <strong>${fmtMB(stats.dbBytes)} de 500 MB (${stats.dbPct.toFixed(1)}%)</strong>
            </div>
            <div class="meter-bar meter-bar--surface"><div class="meter-bar__fill ${levelClass(stats.dbPct)}" style="width:${Math.max(2, stats.dbPct)}%"></div></div>
            <p class="capacity-box__hint">Lembrete de limpeza automático configurado em <strong>80%</strong>.</p>
          </div>
        </div>
      `;
      dashPanel.querySelector('#dashBtnCleanup').addEventListener('click', openCleanupModal);
    }
  }

  /* =====================================================================
     MÓDULO 100% ESTÁTICO: MANUTENÇÃO, SERVIDOR & SUPORTE — ALIVE
     (Zero consultas ao Supabase — apenas client-side + localStorage)
     ===================================================================== */
  const ALIVE_MAINT = {
    service: 'Manutenção, Servidor & Suporte — Alive',
    amountLabel: 'R$ 65,00',
    dueDay: 10,
    pixKey: '+5542999318784',
    beneficiary: 'Davi Henrique (Alive Agency)',
    whatsappNumber: '5542999318784',
    emvPayload: '00020126360014br.gov.bcb.pix0114+5542999318784520400005303986540565.005802BR5913DAVI HENRIQUE6012PONTA GROSSA62110507ALIVEPS6304A4C3'
  };

  const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  function getAliveMonthContext() {
    const now = new Date();
    let year = now.getFullYear();
    let monthIdx = now.getMonth(); // 0..11
    const day = now.getDate();

    // Site criado/publicado em 20–23/08/2026 com 2 meses de suporte e edição grátis (Setembro e Outubro/2026).
    // Portanto, enquanto estivermos em Outubro/2026, a próxima fatura vigente é a 1ª mensalidade em 10/11/2026.
    const inFreeSupportPeriod = (year === 2026 && monthIdx <= 9);
    if (inFreeSupportPeriod) {
      monthIdx = 10; // Novembro (0-indexed = 10)
    }

    const monthNum = String(monthIdx + 1).padStart(2, '0');
    const monthName = MONTHS_PT[monthIdx];
    const monthYearLabel = `${monthName}/${year}`;
    const storageKey = `alive_maint_paid_${year}_${monthNum}`;
    let isPaid = false;
    try { isPaid = localStorage.getItem(storageKey) === '1'; } catch (_) {}
    const isAfterDue = !inFreeSupportPeriod && (day > ALIVE_MAINT.dueDay);
    return { year, monthIdx, day, monthNum, monthName, monthYearLabel, storageKey, isPaid, isAfterDue, inFreeSupportPeriod };
  }

  // Gerador local ISO/IEC 18004 QR Code (Versão 6, Nível L, 41x41) em SVG/Canvas sem rede externa
  function generateLocalQrSvg(text) {
    const bytes = Array.from(text).map(c => c.charCodeAt(0) & 0xFF);
    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    };
    pushBits(0b0100, 4);
    pushBits(bytes.length, 8);
    for (const b of bytes) pushBits(b, 8);
    const maxBits = 136 * 8;
    for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      data.push(b);
    }
    const pad = [0xEC, 0x11];
    let pi = 0;
    while (data.length < 136) data.push(pad[pi++ % 2]);

    const exp = new Uint8Array(512);
    const log = new Uint8Array(256);
    let x = 1;
    for (let i = 0; i < 255; i++) {
      exp[i] = x; log[x] = i;
      x <<= 1; if (x & 0x100) x ^= 0x11D;
    }
    for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
    const gfMul = (a, b) => (a === 0 || b === 0) ? 0 : exp[log[a] + log[b]];

    let gen = [1];
    for (let i = 0; i < 18; i++) {
      const next = new Array(gen.length + 1).fill(0);
      for (let j = 0; j < gen.length; j++) {
        next[j] ^= gen[j];
        next[j + 1] ^= gfMul(gen[j], exp[i]);
      }
      gen = next;
    }

    function rsEncode(block) {
      const rem = new Uint8Array(18);
      for (const b of block) {
        const factor = b ^ rem[0];
        for (let i = 0; i < 17; i++) rem[i] = rem[i + 1] ^ gfMul(gen[i + 1], factor);
        rem[17] = gfMul(gen[18], factor);
      }
      return Array.from(rem);
    }

    const b1 = data.slice(0, 68), b2 = data.slice(68, 136);
    const ec1 = rsEncode(b1), ec2 = rsEncode(b2);
    const codewords = [];
    for (let i = 0; i < 68; i++) codewords.push(b1[i], b2[i]);
    for (let i = 0; i < 18; i++) codewords.push(ec1[i], ec2[i]);

    const size = 41;
    const mat = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
    const isFunc = Array.from({ length: size }, () => new Uint8Array(size));

    function setFunc(r, c, val) {
      if (r < 0 || r >= size || c < 0 || c >= size) return;
      mat[r][c] = val ? 1 : 0;
      isFunc[r][c] = 1;
    }

    function finder(r, c) {
      for (let dy = -1; dy <= 7; dy++) {
        for (let dx = -1; dx <= 7; dx++) {
          const inside = dy >= 0 && dy <= 6 && dx >= 0 && dx <= 6;
          const border = dy === 0 || dy === 6 || dx === 0 || dx === 6;
          const core = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
          setFunc(r + dy, c + dx, inside && (border || core));
        }
      }
    }
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        setFunc(34 + dy, 34 + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }

    for (let i = 8; i < size - 8; i++) {
      if (!isFunc[6][i]) setFunc(6, i, i % 2 === 0);
      if (!isFunc[i][6]) setFunc(i, 6, i % 2 === 0);
    }
    setFunc(size - 8, 8, 1);

    for (let i = 0; i < 9; i++) {
      if (!isFunc[8][i]) isFunc[8][i] = 1;
      if (!isFunc[i][8]) isFunc[i][8] = 1;
    }
    for (let i = 0; i < 8; i++) {
      isFunc[8][size - 1 - i] = 1;
      isFunc[size - 1 - i][8] = 1;
    }

    let bitIdx = 0;
    const totalBits = codewords.length * 8;
    let up = true;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        const r = up ? size - 1 - vert : vert;
        for (let j = 0; j < 2; j++) {
          const c = right - j;
          if (!isFunc[r][c]) {
            let bit = 0;
            if (bitIdx < totalBits) {
              bit = (codewords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1;
              bitIdx++;
            }
            if ((r + c) % 2 === 0) bit ^= 1;
            mat[r][c] = bit;
          }
        }
      }
      up = !up;
    }

    const fmt = 0x77C4;
    const fBits = [];
    for (let i = 0; i < 15; i++) fBits.push((fmt >>> (14 - i)) & 1);
    for (let i = 0; i <= 5; i++) mat[8][i] = fBits[i];
    mat[8][7] = fBits[6];
    mat[8][8] = fBits[7];
    mat[7][8] = fBits[8];
    for (let i = 9; i < 15; i++) mat[14 - i][8] = fBits[i];
    for (let i = 0; i < 7; i++) mat[size - 1 - i][8] = fBits[i];
    for (let i = 7; i < 15; i++) mat[8][size - 15 + i] = fBits[i];

    let paths = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (mat[r][c] === 1) paths += `M${c + 2},${r + 2}h1v1h-1z`;
      }
    }
    const totalDim = size + 4;
    return `<svg viewBox="0 0 ${totalDim} ${totalDim}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-label="QR Code PIX Alive"><rect width="${totalDim}" height="${totalDim}" fill="#ffffff"/><path d="${paths}" fill="#0a1628"/></svg>`;
  }

  function buildAliveHistoryItemsHtml() {
    const ctx = getAliveMonthContext();
    const entries = [
      {
        label: `${ctx.monthYearLabel} (1ª mensalidade)`,
        value: ALIVE_MAINT.amountLabel,
        status: ctx.isPaid ? 'Concluído' : (ctx.isAfterDue ? 'Em aberto' : `Vencimento 10/${ctx.monthNum}`),
        open: !ctx.isPaid && ctx.isAfterDue
      },
      { label: 'Outubro/2026 (2º mês de suporte/edição grátis)', value: 'Isento (Cortesia)', status: 'Concluído', open: false },
      { label: 'Setembro/2026 (1º mês de suporte/edição grátis)', value: 'Isento (Cortesia)', status: 'Concluído', open: false },
      { label: 'Implementação do Site (23/08/2026)', value: 'R$ 320,00', status: 'Pago', open: false }
    ];

    return entries.map(item => `
      <li>
        <span><strong>${escapeHtml(item.label)}</strong> — ${escapeHtml(item.value)}</span>
        <span class="alive-history-status ${item.open ? 'is-open' : ''}">${escapeHtml(item.status)}</span>
      </li>
    `).join('');
  }

  function ensureAlivePixModal() {
    let overlay = document.getElementById('alivePixModalOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'alivePixModalOverlay';
    overlay.className = 'cleanup-modal-overlay';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('is-open');
    });
    return overlay;
  }

  function openAlivePixModal() {
    const ctx = getAliveMonthContext();
    const overlay = ensureAlivePixModal();
    const waText = `Olá Davi! Segue o comprovante de pagamento da mensalidade de manutenção do site (Paulo Souza Corretor - R$ 65,00 ref. ${ctx.monthYearLabel}):`;
    const waUrl = `https://wa.me/${ALIVE_MAINT.whatsappNumber}?text=${encodeURIComponent(waText)}`;

    overlay.innerHTML = `
      <div class="cleanup-modal alive-pix-modal" role="dialog" aria-modal="true" aria-labelledby="alivePixModalTitle">
        <div class="cleanup-modal__header">
          <h3 id="alivePixModalTitle">Manutenção, Servidor &amp; Suporte — Alive</h3>
          <button type="button" class="icon-btn" id="alivePixModalClose" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="cleanup-modal__body">
          <div class="alive-pix-summary">
            <p class="alive-pix-summary__title">Manutenção do Site — ${escapeHtml(ctx.monthYearLabel)} • ${ALIVE_MAINT.amountLabel}</p>
            <p class="alive-pix-summary__sub">Beneficiário: ${escapeHtml(ALIVE_MAINT.beneficiary)} · Vencimento dia 10/${ctx.monthNum}</p>
          </div>

          <div class="alive-pix-qr-wrap">
            <div class="alive-pix-qr-box">${generateLocalQrSvg(ALIVE_MAINT.emvPayload)}</div>
            <span style="font-size:var(--fs-xs);color:var(--color-text-tertiary);text-align:center;">Escaneie o QR Code no aplicativo do seu banco ou copie a chave abaixo</span>
          </div>

          <div class="alive-pix-key-field">
            <div class="alive-pix-key-field__info">
              <span>Chave PIX Celular · ${escapeHtml(ALIVE_MAINT.beneficiary)}</span>
              <strong id="alivePixKeyValue">${escapeHtml(ALIVE_MAINT.pixKey)}</strong>
            </div>
            <button type="button" class="btn btn-outline btn-sm" id="btnCopyAlivePixKey">Copiar Chave</button>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;">
            <a href="${waUrl}" target="_blank" rel="noopener" class="btn-whatsapp" style="justify-content:center;padding:12px 16px;font-size:var(--fs-sm);">
              📱 Informar Pagamento via WhatsApp
            </a>
            <button type="button" class="btn btn-outline btn-sm" id="btnToggleAlivePaid" style="width:100%;justify-content:center;">
              ${ctx.isPaid ? '✓ Marcado como pago neste mês (clique para desmarcar)' : 'Marcar como pago este mês'}
            </button>
          </div>

          <div style="border-top:1px solid var(--color-border);padding-top:12px;">
            <strong style="display:block;font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:0.04em;color:var(--color-text-tertiary);margin-bottom:8px;">Histórico de Manutenção</strong>
            <ul class="alive-history-list">
              ${buildAliveHistoryItemsHtml()}
            </ul>
          </div>
        </div>
      </div>
    `;

    overlay.classList.add('is-open');

    overlay.querySelector('#alivePixModalClose').addEventListener('click', () => {
      overlay.classList.remove('is-open');
    });

    const copyBtn = overlay.querySelector('#btnCopyAlivePixKey');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(ALIVE_MAINT.pixKey);
      } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = ALIVE_MAINT.pixKey;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      copyBtn.textContent = '✓ Chave copiada!';
      setTimeout(() => { copyBtn.textContent = 'Copiar Chave'; }, 2200);
    });

    const togglePaidBtn = overlay.querySelector('#btnToggleAlivePaid');
    togglePaidBtn.addEventListener('click', () => {
      try {
        if (ctx.isPaid) {
          localStorage.removeItem(ctx.storageKey);
        } else {
          localStorage.setItem(ctx.storageKey, '1');
        }
      } catch (_) {}
      initAliveMaintenanceModule();
      overlay.classList.remove('is-open');
    });
  }
  window.openAlivePixModal = openAlivePixModal;

  function initAliveMaintenanceModule() {
    const ctx = getAliveMonthContext();

    // 1. Banner no Dashboard (admin/dashboard.html)
    const banner = document.getElementById('aliveMaintenanceBanner');
    if (banner) {
      let statusBadgeText = '';
      let subText = '';
      banner.classList.remove('is-overdue', 'is-paid');

      if (ctx.isPaid) {
        banner.classList.add('is-paid');
        statusBadgeText = `Concluído (${ctx.monthYearLabel})`;
        subText = `Mensalidade referente a ${ctx.monthName} marcada como paga neste navegador.`;
      } else if (ctx.isAfterDue) {
        banner.classList.add('is-overdue');
        statusBadgeText = `Mensalidade referente a ${ctx.monthName} em aberto`;
        subText = `Vencimento dia 10/${ctx.monthNum} — ${ALIVE_MAINT.amountLabel} · Beneficiário: ${ALIVE_MAINT.beneficiary}`;
      } else {
        statusBadgeText = `Vencimento em 10/${ctx.monthNum} — ${ALIVE_MAINT.amountLabel}`;
        subText = ctx.inFreeSupportPeriod
          ? `2 meses de suporte/edição grátis (23/08 a 23/10) concluídos · 1ª mensalidade em 10/${ctx.monthNum}/${ctx.year}.`
          : `Assinatura mensal de hospedagem, servidor e suporte técnico (${ctx.monthYearLabel}).`;
      }

      banner.innerHTML = `
        <div class="alive-maint-banner__info">
          <div class="alive-maint-banner__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M2 10h20M6 15h4"/>
            </svg>
          </div>
          <div class="alive-maint-banner__text">
            <strong>
              <span>${escapeHtml(ALIVE_MAINT.service)}</span>
              <span class="alive-maint-pill">${escapeHtml(statusBadgeText)}</span>
            </strong>
            <p>${escapeHtml(subText)}</p>
          </div>
        </div>
        <div class="alive-maint-banner__actions">
          <button type="button" class="btn btn-primary btn-sm" id="btnOpenAlivePixBanner">Pagar com PIX</button>
        </div>
      `;
      banner.querySelector('#btnOpenAlivePixBanner').addEventListener('click', openAlivePixModal);
    }

    // 2. Seção de Histórico em Configurações (admin/settings.html)
    const historyList = document.getElementById('aliveMaintenanceHistoryList');
    if (historyList) {
      historyList.innerHTML = buildAliveHistoryItemsHtml();
    }
    document.querySelectorAll('[data-open-alive-pix]').forEach(btn => {
      btn.onclick = openAlivePixModal;
    });
  }

  initAliveMaintenanceModule();
  initCapacityMeter();

});

