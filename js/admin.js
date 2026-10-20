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
        statGrid.insertAdjacentElement('afterend', dashPanel);
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

  initCapacityMeter();

});
