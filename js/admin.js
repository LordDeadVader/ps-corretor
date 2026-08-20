// PS Corretor de Imóveis — Painel Administrativo
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

  /* ---- Upload de mídia (drag & drop) ---- */
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const mediaGrid = document.getElementById('mediaGrid');
  if (!dropzone) return;

  let items = [];

  function render() {
    mediaGrid.innerHTML = items.map((item, i) => `
      <div class="media-item ${item.isCover ? 'is-cover' : ''}" data-index="${i}">
        <span class="media-item__cover-badge">Capa</span>
        ${item.type.startsWith('video') ? '<video src="' + item.url + '" muted></video>' : '<img src="' + item.url + '" alt="Mídia enviada">'}
        <div class="media-item__overlay">
          <button type="button" class="media-item__set-cover" data-action="cover" data-index="${i}">Definir como capa</button>
          <button type="button" data-action="remove" data-index="${i}" aria-label="Remover">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>`).join('');
  }

  function addFiles(fileList) {
    Array.from(fileList).forEach(file => {
      const url = URL.createObjectURL(file);
      items.push({ url, type: file.type, isCover: items.length === 0 });
    });
    render();
  }

  dropzone.addEventListener('click', (e) => {
    if (e.target === fileInput) return;
  });
  fileInput.addEventListener('change', (e) => addFiles(e.target.files));

  ['dragenter', 'dragover'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('is-dragover'); })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('is-dragover'); })
  );
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  mediaGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const index = parseInt(btn.dataset.index, 10);
    if (btn.dataset.action === 'remove') {
      items.splice(index, 1);
      if (items.length && !items.some(i => i.isCover)) items[0].isCover = true;
    } else if (btn.dataset.action === 'cover') {
      items.forEach((item, i) => { item.isCover = i === index; });
    }
    render();
  });

  /* ---- Submit do formulário (demo) ---- */
  const form = document.getElementById('propertyForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Imóvel publicado com sucesso! (demonstração — conecte a um backend para persistir os dados)');
    });
  }
});
