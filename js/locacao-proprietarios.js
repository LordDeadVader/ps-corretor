// PS Corretor de Imóveis — Proprietários (Locação)
document.addEventListener('DOMContentLoaded', () => {
  const tableWrap = document.getElementById('tableWrap');
  const overlay = document.getElementById('modalOverlay');
  const form = document.getElementById('proprietarioForm');
  const formError = document.getElementById('formError');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubmit = document.getElementById('modalSubmit');

  const fields = ['nome', 'cpfCnpj', 'telefone', 'email', 'endereco', 'banco', 'agencia', 'conta', 'chavePix', 'observacoes'];
  const dbColumn = { cpfCnpj: 'cpf_cnpj', chavePix: 'chave_pix' };

  function openModal(record) {
    form.reset();
    formError.hidden = true;
    document.getElementById('proprietarioId').value = record ? record.id : '';
    modalTitle.textContent = record ? 'Editar proprietário' : 'Novo proprietário';
    fields.forEach(f => {
      const col = dbColumn[f] || f;
      document.getElementById(f).value = record ? (record[col] || '') : '';
    });
    overlay.classList.add('is-open');
  }
  function closeModal() { overlay.classList.remove('is-open'); }

  document.getElementById('btnNovoProprietario').addEventListener('click', () => openModal(null));
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  async function loadProprietarios() {
    const { data, error } = await supabaseClient
      .from('proprietarios')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      tableWrap.innerHTML = `<p class="empty-state">Erro ao carregar: ${escapeHtml(error.message)}</p>`;
      return;
    }

    if (!data.length) {
      tableWrap.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>
          <p>Nenhum proprietário cadastrado ainda.</p>
        </div>`;
      return;
    }

    tableWrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>Telefone</th><th>E-mail</th><th></th></tr></thead>
        <tbody>
          ${data.map(p => `
            <tr>
              <td class="dt-property"><div><strong>${escapeHtml(p.nome)}</strong></div></td>
              <td>${escapeHtml(p.cpf_cnpj) || '—'}</td>
              <td>${escapeHtml(p.telefone) || '—'}</td>
              <td>${escapeHtml(p.email) || '—'}</td>
              <td>
                <div class="row-actions">
                  <button type="button" data-action="edit" data-id="${p.id}" aria-label="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                  <button type="button" data-action="delete" data-id="${p.id}" aria-label="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    window.__proprietarios = data;
  }

  tableWrap.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const record = (window.__proprietarios || []).find(p => p.id === id);

    if (btn.dataset.action === 'edit') {
      openModal(record);
    } else if (btn.dataset.action === 'delete') {
      if (!confirm(`Excluir o proprietário "${record.nome}"? Essa ação não pode ser desfeita.`)) return;
      const { error } = await supabaseClient.from('proprietarios').delete().eq('id', id);
      if (error) {
        alert('Não foi possível excluir: ' + error.message + (error.message.includes('foreign key') ? '\n\nEsse proprietário possui contratos vinculados.' : ''));
        return;
      }
      loadProprietarios();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    modalSubmit.disabled = true;
    modalSubmit.textContent = 'Salvando...';

    const id = document.getElementById('proprietarioId').value;
    const payload = {};
    fields.forEach(f => { payload[dbColumn[f] || f] = document.getElementById(f).value.trim() || null; });

    const query = id
      ? supabaseClient.from('proprietarios').update(payload).eq('id', id)
      : supabaseClient.from('proprietarios').insert(payload);

    const { error } = await query;

    modalSubmit.disabled = false;
    modalSubmit.textContent = 'Salvar';

    if (error) {
      formError.textContent = 'Erro ao salvar: ' + error.message;
      formError.hidden = false;
      return;
    }

    closeModal();
    loadProprietarios();
  });

  loadProprietarios();
});
