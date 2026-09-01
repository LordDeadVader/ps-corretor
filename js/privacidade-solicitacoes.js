// PS Corretor de Imóveis — Solicitações de titulares (LGPD)
document.addEventListener('DOMContentLoaded', () => {
  const tableWrap = document.getElementById('tableWrap');
  const overlay = document.getElementById('modalOverlay');
  const formError = document.getElementById('formError');
  let currentId = null;
  let allRows = [];
  let statusFilter = 'todos';

  const TIPO_LABEL = {
    confirmacao_tratamento: 'Confirmação da existência de tratamento',
    acesso: 'Acesso aos dados',
    correcao: 'Correção de dados',
    anonimizacao: 'Anonimização',
    bloqueio: 'Bloqueio',
    eliminacao: 'Eliminação / exclusão',
    portabilidade: 'Portabilidade',
    informacao_compartilhamento: 'Informação sobre compartilhamento',
    revogacao_consentimento: 'Revogação de consentimento',
    oposicao: 'Oposição ao tratamento',
    revisao_decisao_automatizada: 'Revisão de decisão automatizada',
    outro: 'Outro assunto de privacidade'
  };
  const STATUS_LABEL = { recebida: 'Recebida', em_andamento: 'Em andamento', concluida: 'Concluída', recusada: 'Recusada' };
  const STATUS_CLASS = { recebida: 'status-pill--pendente', em_andamento: 'status-pill--pendente', concluida: 'status-pill--ativo', recusada: 'status-pill--rascunho' };
  const PAPEL_LABEL = { proprietario: 'Proprietário(a)', inquilino: 'Inquilino(a)', visitante: 'Visitante do site', outro: 'Outro' };

  function escapeHtml(str) {
    return (str == null ? '' : String(str)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function formatDateTime(v) {
    if (!v) return '—';
    return new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function renderStats() {
    document.getElementById('statTotal').textContent = allRows.length;
    document.getElementById('statRecebida').textContent = allRows.filter(r => r.status === 'recebida').length;
    document.getElementById('statAndamento').textContent = allRows.filter(r => r.status === 'em_andamento').length;
    document.getElementById('statConcluida').textContent = allRows.filter(r => r.status === 'concluida').length;
  }

  function renderTable() {
    const rows = statusFilter === 'todos' ? allRows : allRows.filter(r => r.status === statusFilter);

    if (!rows.length) {
      tableWrap.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>
          <p>${allRows.length ? 'Nenhuma solicitação com esse status.' : 'Nenhuma solicitação recebida ainda.'}</p>
        </div>`;
      return;
    }

    tableWrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Solicitante</th><th>Tipo</th><th>Recebida em</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr data-id="${r.id}" style="cursor:pointer;">
              <td class="dt-property"><div><strong>${escapeHtml(r.nome)}</strong><span>${escapeHtml(r.email)}</span></div></td>
              <td>${escapeHtml(TIPO_LABEL[r.tipo] || r.tipo)}</td>
              <td>${formatDateTime(r.created_at)}</td>
              <td><span class="status-pill ${STATUS_CLASS[r.status] || ''}">${STATUS_LABEL[r.status] || r.status}</span></td>
              <td><div class="row-actions"><button type="button" data-action="open" data-id="${r.id}" aria-label="Ver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg></button></div></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  async function loadSolicitacoes() {
    const { data, error } = await supabaseClient
      .from('solicitacoes_titulares')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      tableWrap.innerHTML = `<p class="empty-state">Erro ao carregar: ${escapeHtml(error.message)}</p>`;
      return;
    }
    allRows = data || [];
    renderStats();
    renderTable();
  }

  document.querySelectorAll('.filter-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      statusFilter = chip.dataset.status;
      renderTable();
    });
  });

  function openModal(record) {
    currentId = record.id;
    formError.hidden = true;
    document.getElementById('modalSubtitle').textContent = 'Recebida em ' + formatDateTime(record.created_at);
    document.getElementById('viewNome').textContent = record.nome;
    document.getElementById('viewTipo').textContent = TIPO_LABEL[record.tipo] || record.tipo;
    document.getElementById('viewEmail').textContent = record.email;
    document.getElementById('viewTelefone').textContent = record.telefone || '—';
    document.getElementById('viewCpf').textContent = record.cpf_cnpj || '—';
    document.getElementById('viewPapel').textContent = PAPEL_LABEL[record.papel] || record.papel || '—';
    document.getElementById('viewCreated').textContent = formatDateTime(record.created_at);
    document.getElementById('viewUpdated').textContent = formatDateTime(record.updated_at);
    document.getElementById('viewMensagem').textContent = record.mensagem;
    document.getElementById('editStatus').value = record.status;
    document.getElementById('editObs').value = record.observacoes_internas || '';
    overlay.classList.add('is-open');
  }
  function closeModal() { overlay.classList.remove('is-open'); currentId = null; }

  tableWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="open"]');
    const row = e.target.closest('tr[data-id]');
    const id = (btn && btn.dataset.id) || (row && row.dataset.id);
    if (!id) return;
    const record = allRows.find(r => r.id === id);
    if (record) openModal(record);
  });

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  document.getElementById('modalSave').addEventListener('click', async () => {
    if (!currentId) return;
    const payload = {
      status: document.getElementById('editStatus').value,
      observacoes_internas: document.getElementById('editObs').value.trim() || null
    };
    if (payload.status === 'concluida' || payload.status === 'recusada') {
      payload.respondido_em = new Date().toISOString();
    }
    const { error } = await supabaseClient.from('solicitacoes_titulares').update(payload).eq('id', currentId);
    if (error) {
      formError.textContent = 'Erro ao salvar: ' + error.message;
      formError.hidden = false;
      return;
    }
    closeModal();
    loadSolicitacoes();
  });

  loadSolicitacoes();
});
