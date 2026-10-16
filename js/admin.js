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

});
