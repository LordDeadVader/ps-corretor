// PS Corretor de Imóveis — Painel Administrativo

// Caminhos salvos no banco são relativos à raiz do site (ex.: "assets/imoveis/x.jpg"),
// mas as páginas do painel vivem em /admin/ — prefixa "../" para resolver certo.
// URLs completas (Supabase Storage) passam direto.
window.adminImgSrc = function (path) {
  if (!path) return '';
  return /^https?:\/\//.test(path) ? path : '../' + path;
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
