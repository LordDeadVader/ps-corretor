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

});
