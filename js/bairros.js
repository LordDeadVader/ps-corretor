// PS Corretor de Imóveis — Bairros do site (galeria da home)
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('bairrosGrid');
  if (!grid) return;

  const overlay = document.getElementById('modalOverlay');
  const form = document.getElementById('bairroForm');
  const formError = document.getElementById('formError');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubmit = document.getElementById('modalSubmit');
  const fotoInput = document.getElementById('fotoInput');
  const fotoPreview = document.getElementById('fotoPreview');
  const fotoStatus = document.getElementById('fotoStatus');

  let fotoUrl = null;
  let bairros = [];

  function escapeHtml(str) {
    return (str == null ? '' : String(str)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function slugify(str) {
    return str.toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  function openModal(record) {
    form.reset();
    formError.hidden = true;
    fotoUrl = record ? record.foto_url : null;
    document.getElementById('bairroId').value = record ? record.id : '';
    modalTitle.textContent = record ? 'Editar bairro' : 'Novo bairro';
    document.getElementById('nome').value = record ? record.nome : '';
    document.getElementById('ordem').value = record ? record.ordem : bairros.length;
    fotoPreview.src = adminImgSrc(fotoUrl) || 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=200&auto=format&fit=crop';
    fotoStatus.textContent = 'JPG ou PNG, formato paisagem (16:10) funciona melhor.';
    overlay.classList.add('is-open');
  }
  function closeModal() { overlay.classList.remove('is-open'); }

  document.getElementById('btnNovoBairro').addEventListener('click', () => openModal(null));
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  fotoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fotoPreview.src = URL.createObjectURL(file);
    fotoStatus.textContent = 'Enviando foto...';

    const path = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${file.name.split('.').pop()}`;
    const { error } = await supabaseClient.storage.from('bairros').upload(path, file);
    if (error) {
      fotoStatus.textContent = 'Erro ao enviar: ' + error.message;
      return;
    }
    const { data: pub } = supabaseClient.storage.from('bairros').getPublicUrl(path);
    fotoUrl = pub.publicUrl;
    fotoStatus.textContent = 'Foto pronta. Clique em "Salvar" para confirmar.';
  });

  async function loadBairros() {
    const { data, error } = await supabaseClient.from('bairros_destaque').select('*').order('ordem', { ascending: true });

    if (error) {
      grid.innerHTML = `<p class="empty-state">Erro ao carregar: ${escapeHtml(error.message)}</p>`;
      return;
    }

    bairros = data || [];

    if (!bairros.length) {
      grid.innerHTML = `<p class="empty-state">Nenhum bairro cadastrado ainda.</p>`;
      return;
    }

    grid.innerHTML = bairros.map(b => `
      <article class="admin-property-card">
        <div class="admin-property-card__img">
          <img src="${escapeHtml(adminImgSrc(b.foto_url)) || ''}" alt="">
          <span class="status-pill status-pill--ativo admin-property-card__status">Ordem ${b.ordem}</span>
        </div>
        <div class="admin-property-card__body">
          <p class="admin-property-card__title">${escapeHtml(b.nome)}</p>
          <div class="admin-property-card__foot">
            <span class="admin-property-card__stats"></span>
            <div class="row-actions">
              <button type="button" data-action="edit" data-id="${b.id}" aria-label="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
              <button type="button" data-action="delete" data-id="${b.id}" aria-label="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
            </div>
          </div>
        </div>
      </article>`).join('');
  }

  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const record = bairros.find(b => b.id === id);

    if (btn.dataset.action === 'edit') {
      openModal(record);
    } else if (btn.dataset.action === 'delete') {
      if (!confirm(`Excluir o bairro "${record.nome}" da galeria da home?`)) return;
      const { error } = await supabaseClient.from('bairros_destaque').delete().eq('id', id);
      if (error) { alert('Não foi possível excluir: ' + error.message); return; }
      loadBairros();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    modalSubmit.disabled = true;
    modalSubmit.textContent = 'Salvando...';

    const id = document.getElementById('bairroId').value;
    const nome = document.getElementById('nome').value.trim();
    const payload = {
      nome,
      ordem: parseInt(document.getElementById('ordem').value, 10) || 0,
      foto_url: fotoUrl,
    };
    if (!id) payload.slug = `${slugify(nome)}-${Date.now().toString(36)}`;

    const query = id
      ? supabaseClient.from('bairros_destaque').update(payload).eq('id', id)
      : supabaseClient.from('bairros_destaque').insert(payload);

    const { error } = await query;

    modalSubmit.disabled = false;
    modalSubmit.textContent = 'Salvar';

    if (error) {
      formError.textContent = 'Erro ao salvar: ' + error.message;
      formError.hidden = false;
      return;
    }

    closeModal();
    loadBairros();
  });

  loadBairros();
});
