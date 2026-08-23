// PS Corretor de Imóveis — Dashboard com dados reais
document.addEventListener('DOMContentLoaded', () => {
  const recentWrap = document.getElementById('recentPropertiesWrap');
  if (!recentWrap) return;

  function escapeHtml(str) {
    return (str == null ? '' : String(str)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const statusLabel = { ativo: 'Ativo', pendente: 'Pendente', rascunho: 'Rascunho' };
  const statusClass = { ativo: 'status-pill--ativo', pendente: 'status-pill--pendente', rascunho: 'status-pill--rascunho' };
  const operacaoLabel = { venda: 'Venda', aluguel: 'Aluguel' };

  async function loadStats() {
    const [{ count: ativos }, { count: rascunho }, { count: contratos }, { data: recibosMes }] = await Promise.all([
      supabaseClient.from('imoveis').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
      supabaseClient.from('imoveis').select('id', { count: 'exact', head: true }).neq('status', 'ativo'),
      supabaseClient.from('contratos_locacao').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
      supabaseClient.from('recibos').select('data_pagamento'),
    ]);

    document.getElementById('statAtivos').textContent = ativos ?? 0;
    document.getElementById('statRascunho').textContent = rascunho ?? 0;
    document.getElementById('statContratos').textContent = contratos ?? 0;

    const now = new Date();
    const thisMonth = (recibosMes || []).filter(r => {
      const d = new Date(r.data_pagamento);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    document.getElementById('statRecibos').textContent = thisMonth;
  }

  async function loadRecentProperties() {
    const { data, error } = await supabaseClient.from('imoveis').select('*').order('created_at', { ascending: false }).limit(5);

    if (error) {
      recentWrap.innerHTML = `<p class="empty-state">Erro ao carregar: ${escapeHtml(error.message)}</p>`;
      return;
    }

    if (!data.length) {
      recentWrap.innerHTML = `<p class="empty-state">Nenhum imóvel cadastrado ainda. <a href="add-property.html">Adicione o primeiro</a>.</p>`;
      return;
    }

    recentWrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Imóvel</th><th>Categoria</th><th>Preço</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${data.map(p => `
            <tr>
              <td class="dt-property">
                <img src="${escapeHtml(adminImgSrc(p.capa || (p.fotos && p.fotos[0])))}" alt="">
                <div><strong>${escapeHtml(p.titulo)}</strong><span>${escapeHtml(p.bairro)}, ${escapeHtml(p.cidade)}</span></div>
              </td>
              <td>${operacaoLabel[p.operacao]}</td>
              <td>${escapeHtml(p.preco_label)}</td>
              <td><span class="status-pill ${statusClass[p.status]}">${statusLabel[p.status]}</span></td>
              <td><div class="row-actions"><a href="add-property.html?id=${p.id}" aria-label="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></a></div></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  loadStats();
  loadRecentProperties();
});
