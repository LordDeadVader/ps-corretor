// PS Corretor de Imóveis — Landing page interactions
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---- Menu mobile ---- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));

  const iconBed = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18h18M5 10V6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4"/></svg>';
  const iconBath = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Z"/><path d="M7 12V6a2 2 0 0 1 3.6-1.2"/><path d="M4 12V9a1 1 0 0 1 1-1"/></svg>';
  const iconGarage = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 10 2-6h14l2 6"/><path d="M3 10h18v9H3z"/><circle cx="7.5" cy="15" r="1"/><circle cx="16.5" cy="15" r="1"/></svg>';
  const iconArea = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/></svg>';
  const iconPin = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const iconHeart = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  const iconChevron = (dir) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m${dir === 'L' ? '15 6-6 6 6 6' : '9 6 6 6-6 6'}"/></svg>`;

  function escapeHtml(str) {
    return (str == null ? '' : String(str)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function cardTemplate(p) {
    const fotos = Array.isArray(p.fotos) && p.fotos.length ? p.fotos : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=900&auto=format&fit=crop'];
    const slides = fotos.map(src => `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.titulo)}" loading="lazy">`).join('');
    const dots = fotos.map((_, i) => `<button class="${i === 0 ? 'is-active' : ''}" data-dot="${i}" aria-label="Foto ${i + 1}"></button>`).join('');
    const tagLabel = p.operacao === 'venda' ? 'Venda' : 'Aluguel';
    const badgeClass = p.operacao === 'venda' ? 'badge-venda' : 'badge-aluguel';

    const metaParts = [];
    if (p.quartos) metaParts.push(`<span>${iconBed} ${p.quartos}</span>`);
    if (p.banheiros) metaParts.push(`<span>${iconBath} ${p.banheiros}</span>`);
    if (p.vagas) metaParts.push(`<span>${iconGarage} ${p.vagas}</span>`);
    const area = p.area_util || p.area_terreno;
    if (area) metaParts.push(`<span>${iconArea} ${area} m²</span>`);

    const badges = (p.badges || []).map(b => `<span class="property-card__badge">${escapeHtml(b)}</span>`).join('');

    return `
    <article class="property-card" data-tag="${p.operacao}" data-bairro="${escapeHtml(p.bairro)}" data-cidade="${escapeHtml(p.cidade)}">
      <a class="property-card__media" data-carousel data-index="0" href="imovel.html?slug=${encodeURIComponent(p.slug)}">
        <div class="property-card__slides">${slides}</div>
        <span class="badge ${badgeClass} property-card__tag">${tagLabel}</span>
        ${badges ? `<div class="property-card__badges">${badges}</div>` : ''}
        <button class="property-card__fav" aria-label="Favoritar imóvel" onclick="event.preventDefault()">${iconHeart}</button>
        ${fotos.length > 1 ? `
        <button class="carousel-arrow carousel-arrow--prev" data-dir="-1" aria-label="Foto anterior">${iconChevron('L')}</button>
        <button class="carousel-arrow carousel-arrow--next" data-dir="1" aria-label="Próxima foto">${iconChevron('R')}</button>
        <div class="carousel-dots">${dots}</div>` : ''}
      </a>
      <a class="property-card__body" href="imovel.html?slug=${encodeURIComponent(p.slug)}">
        <p class="property-card__price">${escapeHtml(p.preco_label)}</p>
        <h3 class="property-card__title">${escapeHtml(p.titulo)}</h3>
        <p class="property-card__location">${iconPin} ${escapeHtml(p.bairro)}, ${escapeHtml(p.cidade)}</p>
        <div class="property-card__meta">${metaParts.join('')}</div>
      </a>
    </article>`;
  }

  const grid = document.getElementById('propertyGrid');
  const filtroBairro = document.getElementById('filtroBairro');
  const filtroCidade = document.getElementById('filtroCidade');
  let allProperties = [];

  function wireCarousels() {
    grid.querySelectorAll('[data-carousel]').forEach(carousel => {
      const slidesWrap = carousel.querySelector('.property-card__slides');
      const slideCount = slidesWrap.children.length;
      const dots = carousel.querySelectorAll('.carousel-dots button');

      function goTo(i) {
        const index = (i + slideCount) % slideCount;
        carousel.dataset.index = index;
        slidesWrap.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
      }

      carousel.querySelectorAll('[data-dir]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          goTo(parseInt(carousel.dataset.index, 10) + parseInt(btn.dataset.dir, 10));
        });
      });
      dots.forEach(dot => dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goTo(parseInt(dot.dataset.dot, 10));
      }));
    });
  }

  function applyFilters() {
    const activeChip = document.querySelector('.chip.is-active');
    const opFilter = activeChip ? activeChip.dataset.filter : 'todos';
    const bairro = filtroBairro.value;
    const cidade = filtroCidade.value;
    let visibleCount = 0;

    grid.querySelectorAll('.property-card').forEach(card => {
      const matchOp = opFilter === 'todos' || card.dataset.tag === opFilter;
      const matchBairro = !bairro || card.dataset.bairro === bairro;
      const matchCidade = !cidade || card.dataset.cidade === cidade;
      const match = matchOp && matchBairro && matchCidade;
      card.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });

    let emptyMsg = grid.querySelector('.property-empty');
    if (visibleCount === 0) {
      if (!emptyMsg) {
        emptyMsg = document.createElement('p');
        emptyMsg.className = 'property-empty';
        grid.appendChild(emptyMsg);
      }
      emptyMsg.textContent = 'Nenhum imóvel encontrado com esses filtros. Fale com a gente pelo WhatsApp para buscarmos algo sob medida.';
    } else if (emptyMsg) {
      emptyMsg.remove();
    }
  }

  function populateFilterOptions() {
    const bairros = [...new Set(allProperties.map(p => p.bairro))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const cidades = [...new Set(allProperties.map(p => p.cidade))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    filtroBairro.innerHTML = '<option value="">Todos os bairros</option>' + bairros.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');
    filtroCidade.innerHTML = '<option value="">Todas as cidades</option>' + cidades.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }

  async function loadProperties() {
    const { data, error } = await supabaseClient
      .from('imoveis')
      .select('*')
      .eq('status', 'ativo')
      .order('created_at', { ascending: false });

    if (error) {
      grid.innerHTML = `<p class="property-empty">Não foi possível carregar os imóveis no momento. Tente novamente em instantes.</p>`;
      return;
    }

    allProperties = data || [];
    startHeroSlideshow(allProperties);

    if (!allProperties.length) {
      grid.innerHTML = `<p class="property-empty">Nenhum imóvel publicado no momento. Volte em breve!</p>`;
      return;
    }

    grid.innerHTML = allProperties.map(cardTemplate).join('');
    populateFilterOptions();
    wireCarousels();
    applyFilters();
  }

  /* ---- Slideshow do hero: fotos de capa dos imóveis, mais recentes primeiro ---- */
  function startHeroSlideshow(properties) {
    const heroBg = document.getElementById('heroBg');
    if (!heroBg) return;

    const images = properties
      .flatMap(p => (p.fotos_destaque && p.fotos_destaque.length) ? p.fotos_destaque : [p.capa || (p.fotos && p.fotos[0])])
      .filter(Boolean);
    if (!images.length) return;

    const [imgA, imgB] = heroBg.querySelectorAll('.hero__bg-img');
    imgA.src = images[0];
    let index = 0;

    if (images.length < 2) return;

    setInterval(() => {
      index = (index + 1) % images.length;
      const active = heroBg.querySelector('.hero__bg-img.is-active');
      const next = active === imgA ? imgB : imgA;
      next.src = images[index];
      active.classList.remove('is-active');
      next.classList.add('is-active');
    }, 6000);
  }

  /* ---- Filtro Venda/Aluguel ---- */
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      applyFilters();
    });
  });

  filtroBairro.addEventListener('change', applyFilters);
  filtroCidade.addEventListener('change', applyFilters);

  /* ---- Busca do hero ---- */
  document.getElementById('searchBar').addEventListener('submit', (e) => {
    e.preventDefault();
    const acao = document.querySelector('input[name="acao"]:checked').value;
    const bairro = document.getElementById('local').value;

    document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
    const chip = document.querySelector(`.chip[data-filter="${acao === 'comprar' ? 'venda' : 'aluguel'}"]`);
    if (chip) chip.classList.add('is-active');

    if (bairro) filtroBairro.value = bairro;
    applyFilters();
    document.getElementById('comprar').scrollIntoView({ behavior: 'smooth' });
  });

  loadProperties();

  /* ---- Galeria de bairros ("sanfona") ----
     As fotos vêm do Supabase (editáveis pelo corretor em admin/bairros.html);
     o HTML estático do index.html fica como fallback caso a busca falhe.
     Funciona em qualquer largura de tela: passar o mouse expande um painel
     (só em dispositivos com hover); as setinhas fazem o mesmo em qualquer
     dispositivo, inclusive por toque. A largura do painel expandido é
     calculada em pixels reais a partir do contêiner — nunca em vw, que se
     comporta de forma inconsistente entre navegadores de celular. */
  function initNeighborhoodGallery() {
    const nPanelsEl = document.getElementById('neighborhoodPanels');
    if (!nPanelsEl) return;
    const panels = Array.from(nPanelsEl.querySelectorAll('.n-panel'));
    const gallery = document.getElementById('neighborhoodGallery');
    const isHoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const isDesktopFullBleed = () => window.matchMedia('(min-width: 1024px)').matches;

    function setActivePanel(index) {
      panels.forEach((p, i) => {
        const active = i === index;
        p.classList.toggle('is-active', active);
        // No modo full-bleed do desktop o tamanho vem do CSS (flex-grow).
        // Nos demais tamanhos, calculamos a largura real em px do painel
        // expandido a partir do contêiner, para se adaptar a qualquer tela.
        if (isDesktopFullBleed()) {
          p.style.flexBasis = '';
        } else if (active) {
          const w = Math.min(nPanelsEl.clientWidth * 0.72, 340);
          p.style.flexBasis = Math.round(w) + 'px';
        } else {
          p.style.flexBasis = '';
        }
      });
      nPanelsEl.classList.add('has-active');
      panels[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    if (isHoverCapable) {
      panels.forEach((panel, index) => panel.addEventListener('mouseenter', () => setActivePanel(index)));
      nPanelsEl.addEventListener('mouseleave', () => {
        nPanelsEl.classList.remove('has-active');
        panels.forEach(p => { p.style.flexBasis = ''; });
      });
    }

    panels.forEach(panel => panel.addEventListener('click', (e) => {
      e.preventDefault();
      const bairro = panel.dataset.bairro;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
      document.querySelector('.chip[data-filter="todos"]').classList.add('is-active');
      if (filtroBairro.querySelector(`option[value="${CSS.escape(bairro)}"]`)) {
        filtroBairro.value = bairro;
      }
      applyFilters();
      document.getElementById('comprar').scrollIntoView({ behavior: 'smooth' });
    }));

    function currentActiveIndex() {
      const active = panels.findIndex(p => p.classList.contains('is-active') && nPanelsEl.classList.contains('has-active'));
      if (active !== -1) return active;
      const center = nPanelsEl.scrollLeft + nPanelsEl.clientWidth / 2;
      let closest = 0, minDist = Infinity;
      panels.forEach((p, i) => {
        const dist = Math.abs((p.offsetLeft + p.offsetWidth / 2) - center);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      return closest;
    }

    gallery.querySelectorAll('.n-gallery__arrow').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = parseInt(btn.dataset.dir, 10);
        const next = Math.min(Math.max(currentActiveIndex() + dir, 0), panels.length - 1);
        setActivePanel(next);
      });
    });

    // Recalcula a largura do painel ativo se a tela for redimensionada
    // (rotação do celular, janela do navegador, etc.) — mantém adaptado.
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const active = panels.findIndex(p => p.classList.contains('is-active'));
        if (active !== -1 && nPanelsEl.classList.contains('has-active')) setActivePanel(active);
      }, 150);
    });
  }

  async function loadNeighborhoodPanels() {
    const nPanelsEl = document.getElementById('neighborhoodPanels');
    if (nPanelsEl) {
      const { data } = await supabaseClient.from('bairros_destaque').select('*').order('ordem', { ascending: true });
      if (data && data.length) {
        nPanelsEl.innerHTML = data.map((b, i) => `
          <a href="#comprar" class="n-panel ${i === 0 ? 'is-active' : ''}" data-index="${i}" data-bairro="${escapeHtml(b.nome)}">
            <img class="n-panel__img" src="${escapeHtml(b.foto_url || '')}" alt="${escapeHtml(b.nome)}, Ponta Grossa" loading="lazy">
            <span class="n-panel__tint"></span>
            <span class="n-panel__label"><span>${escapeHtml(b.nome)}</span></span>
          </a>`).join('');
      }
    }
    initNeighborhoodGallery();
  }

  loadNeighborhoodPanels();
});
