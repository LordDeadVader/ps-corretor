// PS Corretor de Imóveis — Contratos de Locação e Recibos
document.addEventListener('DOMContentLoaded', () => {
  const contratosWrap = document.getElementById('contratosWrap');
  const recibosWrap = document.getElementById('recibosWrap');

  const modalContrato = document.getElementById('modalContrato');
  const contratoForm = document.getElementById('contratoForm');
  const contratoFormError = document.getElementById('contratoFormError');
  const contratoModalTitle = document.getElementById('contratoModalTitle');
  const contratoSubmit = document.getElementById('contratoSubmit');
  const proprietarioSelect = document.getElementById('proprietarioSelect');
  const inquilinoSelect = document.getElementById('inquilinoSelect');
  const imovelSelect = document.getElementById('imovelSelect');
  let imoveisCadastrados = [];

  const modalRecibo = document.getElementById('modalRecibo');
  const reciboForm = document.getElementById('reciboForm');
  const reciboFormError = document.getElementById('reciboFormError');
  const reciboSubtitle = document.getElementById('reciboSubtitle');
  const reciboSubmit = document.getElementById('reciboSubmit');

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(document.getElementById(btn.dataset.close)));
  });
  [modalContrato, modalRecibo].forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
  });
  function closeModal(overlay) { overlay.classList.remove('is-open'); }
  function openModal(overlay) { overlay.classList.add('is-open'); }

  function escapeHtml(str) {
    return (str == null ? '' : String(str)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function formatMoney(v) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function formatDate(d) {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  // ---------------- Contratos ----------------
  async function populateSelects() {
    const [{ data: proprietarios }, { data: inquilinos }, { data: imoveis }] = await Promise.all([
      supabaseClient.from('proprietarios').select('id, nome').order('nome'),
      supabaseClient.from('inquilinos').select('id, nome').order('nome'),
      supabaseClient.from('imoveis').select('id, titulo, endereco, bairro, cidade, preco_valor, operacao').order('titulo'),
    ]);
    proprietarioSelect.innerHTML = '<option value="">Selecione...</option>' +
      (proprietarios || []).map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');
    inquilinoSelect.innerHTML = '<option value="">Selecione...</option>' +
      (inquilinos || []).map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');

    imoveisCadastrados = imoveis || [];
    imovelSelect.innerHTML = '<option value="">Nenhum — digitar endereço manualmente</option>' +
      imoveisCadastrados.map(i => `<option value="${i.id}">${escapeHtml(i.titulo)} — ${escapeHtml(i.bairro)} (${i.operacao === 'venda' ? 'Venda' : 'Aluguel'})</option>`).join('');
  }

  imovelSelect.addEventListener('change', () => {
    const imovel = imoveisCadastrados.find(i => i.id === imovelSelect.value);
    if (!imovel) return;
    document.getElementById('imovelEndereco').value = imovel.endereco || `${imovel.titulo} — ${imovel.bairro}, ${imovel.cidade}`;
    if (imovel.preco_valor != null) document.getElementById('valorAluguel').value = imovel.preco_valor;
  });

  async function openContratoModal(record) {
    contratoForm.reset();
    contratoFormError.hidden = true;
    await populateSelects();
    document.getElementById('contratoId').value = record ? record.id : '';
    contratoModalTitle.textContent = record ? 'Editar contrato' : 'Novo contrato de locação';
    proprietarioSelect.value = record ? record.proprietario_id : '';
    inquilinoSelect.value = record ? record.inquilino_id : '';
    imovelSelect.value = record ? (record.imovel_id || '') : '';
    document.getElementById('imovelEndereco').value = record ? record.imovel_endereco : '';
    document.getElementById('valorAluguel').value = record ? record.valor_aluguel : '';
    document.getElementById('diaVencimento').value = record ? record.dia_vencimento : 5;
    document.getElementById('dataInicio').value = record ? record.data_inicio : '';
    document.getElementById('dataFim').value = record ? (record.data_fim || '') : '';
    document.getElementById('statusContrato').value = record ? record.status : 'ativo';
    document.getElementById('contratoObs').value = record ? (record.observacoes || '') : '';
    openModal(modalContrato);
  }

  document.getElementById('btnNovoContrato').addEventListener('click', () => openContratoModal(null));

  async function loadContratos() {
    const { data, error } = await supabaseClient
      .from('contratos_locacao')
      .select('*, proprietarios(nome), inquilinos(nome)')
      .order('created_at', { ascending: false });

    if (error) {
      contratosWrap.innerHTML = `<p class="empty-state">Erro ao carregar: ${escapeHtml(error.message)}</p>`;
      return;
    }

    if (!data.length) {
      contratosWrap.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 3v5h5"/><path d="M6 3h8l5 5v13H6z"/></svg>
          <p>Nenhum contrato cadastrado ainda. Cadastre proprietários e inquilinos primeiro.</p>
        </div>`;
      window.__contratos = [];
      return;
    }

    contratosWrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Imóvel</th><th>Proprietário</th><th>Inquilino</th><th>Aluguel</th><th>Vencimento</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${data.map(c => `
            <tr>
              <td class="dt-property"><div><strong>${escapeHtml(c.imovel_endereco)}</strong></div></td>
              <td>${escapeHtml(c.proprietarios?.nome) || '—'}</td>
              <td>${escapeHtml(c.inquilinos?.nome) || '—'}</td>
              <td>${formatMoney(c.valor_aluguel)}</td>
              <td>dia ${c.dia_vencimento}</td>
              <td><span class="status-pill ${c.status === 'ativo' ? 'status-pill--ativo' : 'status-pill--rascunho'}">${c.status === 'ativo' ? 'Ativo' : 'Encerrado'}</span></td>
              <td>
                <div class="row-actions">
                  <button type="button" class="btn btn-outline btn-sm" data-action="recibo" data-id="${c.id}" style="width:auto; height:auto;">Gerar recibo</button>
                  <button type="button" data-action="edit" data-id="${c.id}" aria-label="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                  <button type="button" data-action="delete" data-id="${c.id}" aria-label="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    window.__contratos = data;
  }

  contratosWrap.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const record = (window.__contratos || []).find(c => c.id === id);

    if (btn.dataset.action === 'edit') {
      openContratoModal(record);
    } else if (btn.dataset.action === 'delete') {
      if (!confirm(`Excluir o contrato do imóvel "${record.imovel_endereco}"? Recibos vinculados também serão excluídos.`)) return;
      const { error } = await supabaseClient.from('contratos_locacao').delete().eq('id', id);
      if (error) { alert('Não foi possível excluir: ' + error.message); return; }
      loadContratos();
      loadRecibos();
    } else if (btn.dataset.action === 'recibo') {
      openReciboModal(record);
    }
  });

  contratoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    contratoFormError.hidden = true;
    contratoSubmit.disabled = true;
    contratoSubmit.textContent = 'Salvando...';

    const id = document.getElementById('contratoId').value;
    const payload = {
      proprietario_id: proprietarioSelect.value,
      inquilino_id: inquilinoSelect.value,
      imovel_id: imovelSelect.value || null,
      imovel_endereco: document.getElementById('imovelEndereco').value.trim(),
      valor_aluguel: parseFloat(document.getElementById('valorAluguel').value),
      dia_vencimento: parseInt(document.getElementById('diaVencimento').value, 10) || 5,
      data_inicio: document.getElementById('dataInicio').value,
      data_fim: document.getElementById('dataFim').value || null,
      status: document.getElementById('statusContrato').value,
      observacoes: document.getElementById('contratoObs').value.trim() || null,
    };

    const query = id
      ? supabaseClient.from('contratos_locacao').update(payload).eq('id', id)
      : supabaseClient.from('contratos_locacao').insert(payload);

    const { error } = await query;

    contratoSubmit.disabled = false;
    contratoSubmit.textContent = 'Salvar';

    if (error) {
      contratoFormError.textContent = 'Erro ao salvar: ' + error.message;
      contratoFormError.hidden = false;
      return;
    }

    closeModal(modalContrato);
    loadContratos();
  });

  // ---------------- Recibos ----------------
  function mesAnoAtualExtenso() {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const hoje = new Date();
    return `${meses[hoje.getMonth()]}/${hoje.getFullYear()}`;
  }

  function openReciboModal(contrato) {
    reciboForm.reset();
    reciboFormError.hidden = true;
    document.getElementById('reciboContratoId').value = contrato.id;
    reciboSubtitle.textContent = `${contrato.imovel_endereco} — Inquilino: ${contrato.inquilinos?.nome || '—'}`;
    document.getElementById('reciboReferencia').value = mesAnoAtualExtenso();
    document.getElementById('reciboValor').value = contrato.valor_aluguel;
    document.getElementById('reciboData').value = new Date().toISOString().slice(0, 10);
    openModal(modalRecibo);
  }

  reciboForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    reciboFormError.hidden = true;
    reciboSubmit.disabled = true;
    reciboSubmit.textContent = 'Gerando...';

    const payload = {
      contrato_id: document.getElementById('reciboContratoId').value,
      referencia: document.getElementById('reciboReferencia').value.trim(),
      valor: parseFloat(document.getElementById('reciboValor').value),
      data_pagamento: document.getElementById('reciboData').value,
      observacoes: document.getElementById('reciboObs').value.trim() || null,
    };

    const { data, error } = await supabaseClient.from('recibos').insert(payload).select().single();

    reciboSubmit.disabled = false;
    reciboSubmit.textContent = 'Gerar e imprimir';

    if (error) {
      reciboFormError.textContent = 'Erro ao gerar recibo: ' + error.message;
      reciboFormError.hidden = false;
      return;
    }

    window.location.href = `recibo-view.html?id=${data.id}`;
  });

  async function loadRecibos() {
    const { data, error } = await supabaseClient
      .from('recibos')
      .select('*, contratos_locacao(imovel_endereco, inquilinos(nome))')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      recibosWrap.innerHTML = `<p class="empty-state">Erro ao carregar: ${escapeHtml(error.message)}</p>`;
      return;
    }

    if (!data.length) {
      recibosWrap.innerHTML = `<div class="empty-state"><p>Nenhum recibo emitido ainda.</p></div>`;
      return;
    }

    recibosWrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Referência</th><th>Imóvel</th><th>Inquilino</th><th>Valor</th><th>Pago em</th><th></th></tr></thead>
        <tbody>
          ${data.map(r => `
            <tr>
              <td>${escapeHtml(r.referencia)}</td>
              <td>${escapeHtml(r.contratos_locacao?.imovel_endereco) || '—'}</td>
              <td>${escapeHtml(r.contratos_locacao?.inquilinos?.nome) || '—'}</td>
              <td>${formatMoney(r.valor)}</td>
              <td>${formatDate(r.data_pagamento)}</td>
              <td><a href="recibo-view.html?id=${r.id}" class="btn btn-outline btn-sm" style="width:auto; height:auto;">Ver / Imprimir</a></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  loadContratos();
  loadRecibos();
});
