// PS Corretor de Imóveis — Meus Imóveis (admin)
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('propertyGrid');
  if (!grid) return;

  const searchInput = document.getElementById('searchInput');
  let allProperties = [];

  function escapeHtml(str) {
    return (str == null ? '' : String(str)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const statusLabel = { ativo: 'Ativo', pendente: 'Pendente', rascunho: 'Rascunho' };
  const statusClass = { ativo: 'status-pill--ativo', pendente: 'status-pill--pendente', rascunho: 'status-pill--rascunho' };

  function cardTemplate(p) {
    const capa = p.capa || (p.fotos && p.fotos[0]) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=500&auto=format&fit=crop';
    return `
    <article class="admin-property-card" data-status="${p.status}" data-search="${escapeHtml((p.titulo + ' ' + p.bairro + ' ' + p.cidade).toLowerCase())}">
      <div class="admin-property-card__img">
        <img src="${escapeHtml(capa)}" alt="">
        <span class="status-pill ${statusClass[p.status]} admin-property-card__status">${statusLabel[p.status]}</span>
      </div>
      <div class="admin-property-card__body">
        <p class="admin-property-card__price">${escapeHtml(p.preco_label)}</p>
        <p class="admin-property-card__title">${escapeHtml(p.titulo)}</p>
        <div class="admin-property-card__foot">
          <span class="admin-property-card__stats">${p.visualizacoes || 0} visualizações</span>
          <div class="row-actions">
            <a href="add-property.html?id=${p.id}" aria-label="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></a>
            <button type="button" data-action="delete" data-id="${p.id}" aria-label="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
          </div>
        </div>
      </div>
    </article>`;
  }

  function applyFilters() {
    const activeChip = document.querySelector('.filter-chips .chip.is-active');
    const status = activeChip ? activeChip.dataset.status : 'todos';
    const query = searchInput.value.trim().toLowerCase();

    grid.querySelectorAll('.admin-property-card').forEach(card => {
      const matchStatus = status === 'todos' || card.dataset.status === status;
      const matchSearch = !query || card.dataset.search.includes(query);
      card.style.display = (matchStatus && matchSearch) ? '' : 'none';
    });
  }

  async function loadProperties() {
    const { data, error } = await supabaseClient.from('imoveis').select('*').order('created_at', { ascending: false });

    if (error) {
      grid.innerHTML = `<p class="empty-state">Erro ao carregar: ${escapeHtml(error.message)}</p>`;
      return;
    }

    allProperties = data || [];

    if (!allProperties.length) {
      grid.innerHTML = `<p class="empty-state">Nenhum imóvel cadastrado ainda. Clique em "+ Novo imóvel" para começar.</p>`;
      return;
    }

    grid.innerHTML = allProperties.map(cardTemplate).join('');
    applyFilters();
  }

  document.querySelectorAll('.filter-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      applyFilters();
    });
  });
  searchInput.addEventListener('input', applyFilters);

  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="delete"]');
    if (!btn) return;
    const id = btn.dataset.id;
    const p = allProperties.find(x => x.id === id);
    if (!confirm(`Excluir o imóvel "${p.titulo}"? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabaseClient.from('imoveis').delete().eq('id', id);
    if (error) { alert('Não foi possível excluir: ' + error.message); return; }
    loadProperties();
  });

  loadProperties();
});
