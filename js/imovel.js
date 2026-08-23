// PS Corretor de Imóveis — Página de detalhe do imóvel
document.addEventListener('DOMContentLoaded', () => {
  const page = document.getElementById('imovelPage');

  function escapeHtml(str) {
    return (str == null ? '' : String(str)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const iconBed = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18h18M5 10V6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4"/></svg>';
  const iconBath = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Z"/><path d="M7 12V6a2 2 0 0 1 3.6-1.2"/><path d="M4 12V9a1 1 0 0 1 1-1"/></svg>';
  const iconGarage = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 10 2-6h14l2 6"/><path d="M3 10h18v9H3z"/><circle cx="7.5" cy="15" r="1"/><circle cx="16.5" cy="15" r="1"/></svg>';
  const iconArea = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/></svg>';
  const iconTerreno = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M4 21V10l8-6 8 6v11"/></svg>';
  const iconPin = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const iconCheck = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 13 4 4L19 7"/></svg>';
  const iconChevron = (dir) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m${dir === 'L' ? '15 6-6 6 6 6' : '9 6 6 6-6 6'}"/></svg>`;

  function renderNotFound() {
    page.innerHTML = `<p class="empty-state-page">Imóvel não encontrado. <a href="index.html#comprar">Voltar para a vitrine</a>.</p>`;
  }

  async function load() {
    const params = new URLSearchParams(location.search);
    const slug = params.get('slug');
    if (!slug) { renderNotFound(); return; }

    const { data: p, error } = await supabaseClient
      .from('imoveis')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !p) { renderNotFound(); return; }

    document.title = `${p.titulo} — Paulo Souza Corretor de Imóveis`;

    const fotos = Array.isArray(p.fotos) && p.fotos.length ? p.fotos : [p.capa].filter(Boolean);
    const badges = (p.badges || []).map(b => `<span class="badge badge-success">${escapeHtml(b)}</span>`).join('');
    const tagLabel = p.operacao === 'venda' ? 'Venda' : 'Aluguel';
    const badgeClass = p.operacao === 'venda' ? 'badge-venda' : 'badge-aluguel';

    const specs = [];
    if (p.quartos) specs.push({ icon: iconBed, value: p.quartos, label: p.quartos > 1 ? 'Quartos' : 'Quarto' });
    if (p.suites) specs.push({ icon: iconBed, value: p.suites, label: p.suites > 1 ? 'Suítes' : 'Suíte' });
    if (p.banheiros) specs.push({ icon: iconBath, value: p.banheiros, label: p.banheiros > 1 ? 'Banheiros' : 'Banheiro' });
    if (p.vagas) specs.push({ icon: iconGarage, value: p.vagas, label: 'Vagas' });
    if (p.area_util) specs.push({ icon: iconArea, value: `${p.area_util} m²`, label: 'Área útil' });
    if (p.area_terreno) specs.push({ icon: iconTerreno, value: `${p.area_terreno} m²`, label: 'Área do terreno' });

    const destaques = (p.destaques || []).map(d => `<li>${iconCheck}<span>${escapeHtml(d)}</span></li>`).join('');
    const whatsappMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel "${p.titulo}" (${p.bairro}, ${p.cidade}). Pode me passar mais informações?`);

    const { data: perfil } = await supabaseClient.from('corretor_perfil').select('*').eq('id', p.corretor_id).maybeSingle();
    const corretorNome = perfil?.nome || 'Paulo Souza';
    const corretorCreci = perfil?.creci ? `CRECI ${escapeHtml(perfil.creci)}` : 'Corretor de Imóveis';
    const corretorFoto = perfil?.foto_url || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop';

    page.innerHTML = `
      <nav class="imovel-breadcrumb">
        <a href="index.html">Início</a> / <a href="index.html#comprar">Imóveis</a> / <span>${escapeHtml(p.titulo)}</span>
      </nav>

      <div class="imovel-gallery">
        <div class="imovel-gallery__main">
          <img id="galleryMain" src="${escapeHtml(fotos[0])}" alt="${escapeHtml(p.titulo)}">
          ${fotos.length > 1 ? `
          <button class="imovel-gallery__arrow imovel-gallery__arrow--prev" id="galleryPrev" aria-label="Foto anterior">${iconChevron('L')}</button>
          <button class="imovel-gallery__arrow imovel-gallery__arrow--next" id="galleryNext" aria-label="Próxima foto">${iconChevron('R')}</button>
          <span class="imovel-gallery__count" id="galleryCount">1 / ${fotos.length}</span>` : ''}
        </div>
        ${fotos.length > 1 ? `<div class="imovel-gallery__thumbs" id="galleryThumbs">
          ${fotos.map((src, i) => `<img src="${escapeHtml(src)}" data-index="${i}" class="${i === 0 ? 'is-active' : ''}" alt="Foto ${i + 1}">`).join('')}
        </div>` : ''}
      </div>

      <div class="imovel-layout">
        <div class="imovel-main">
          <div class="imovel-header">
            <div class="imovel-header__badges">
              <span class="badge ${badgeClass}">${tagLabel}</span>
              ${badges}
            </div>
            <h1>${escapeHtml(p.titulo)}</h1>
            <p class="imovel-header__location">${iconPin} ${escapeHtml(p.endereco || `${p.bairro}, ${p.cidade}`)}</p>
          </div>

          ${specs.length ? `<div class="imovel-specs">${specs.map(s => `
            <div class="imovel-specs__item">${s.icon}<div><strong>${s.value}</strong><span>${s.label}</span></div></div>`).join('')}</div>` : ''}

          <div class="imovel-section">
            <h2>Sobre o imóvel</h2>
            <p class="imovel-desc">${escapeHtml(p.descricao || '')}</p>
          </div>

          ${destaques ? `<div class="imovel-section">
            <h2>Destaques</h2>
            <ul class="imovel-destaques">${destaques}</ul>
          </div>` : ''}
        </div>

        <aside class="imovel-sidebar">
          <div class="imovel-price-card">
            <p class="imovel-price-card__label">${p.operacao === 'venda' ? 'Valor de venda' : 'Valor de locação'}</p>
            <p class="imovel-price-card__value">${escapeHtml(p.preco_label)}</p>
            <a href="https://wa.me/5542999000000?text=${whatsappMsg}" target="_blank" rel="noopener" class="btn btn-primary btn-lg btn-block">Falar no WhatsApp</a>
            <p class="imovel-price-card__note">Resposta rápida em horário comercial</p>
          </div>
          <div class="imovel-agent-card">
            <img src="${escapeHtml(corretorFoto)}" alt="${escapeHtml(corretorNome)}">
            <div><strong>${escapeHtml(corretorNome)}</strong><span>${corretorCreci}</span></div>
          </div>
        </aside>
      </div>
    `;

    if (fotos.length > 1) {
      let index = 0;
      const mainImg = document.getElementById('galleryMain');
      const countEl = document.getElementById('galleryCount');
      const thumbs = document.querySelectorAll('#galleryThumbs img');

      function goTo(i) {
        index = (i + fotos.length) % fotos.length;
        mainImg.src = fotos[index];
        countEl.textContent = `${index + 1} / ${fotos.length}`;
        thumbs.forEach((t, ti) => t.classList.toggle('is-active', ti === index));
      }

      document.getElementById('galleryPrev').addEventListener('click', () => goTo(index - 1));
      document.getElementById('galleryNext').addEventListener('click', () => goTo(index + 1));
      thumbs.forEach(t => t.addEventListener('click', () => goTo(parseInt(t.dataset.index, 10))));
    }
  }

  load();
});
