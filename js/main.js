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

  /* ---- Dados mock de imóveis (Ponta Grossa, PR) ---- */
  const properties = [
    {
      id: 1, tag: 'venda', code: 'COD. PG-1042', price: 'R$ 1.250.000', title: 'Casa contemporânea com piscina',
      location: 'Jardim Carvalho, Ponta Grossa', badges: ['Novidade', 'Alto Padrão'], beds: 4, baths: 3, garage: 2, area: 320,
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=900&auto=format&fit=crop'
      ]
    },
    {
      id: 2, tag: 'aluguel', code: 'COD. PG-0987', price: 'R$ 2.800/mês', title: 'Apartamento moderno com vista',
      location: 'Centro, Ponta Grossa', badges: ['Semi Mobiliado'], beds: 3, baths: 2, garage: 2, area: 145,
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560184897-ae75f418493e?q=80&w=900&auto=format&fit=crop'
      ]
    },
    {
      id: 3, tag: 'venda', code: 'COD. PG-1015', price: 'R$ 890.000', title: 'Cobertura duplex reformada',
      location: 'Uvaranas, Ponta Grossa', badges: ['Novidade', 'Exclusivo'], beds: 3, baths: 3, garage: 2, area: 210,
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1615874959474-d609969a20ed?q=80&w=900&auto=format&fit=crop'
      ]
    },
    {
      id: 4, tag: 'aluguel', code: 'COD. PG-0902', price: 'R$ 1.700/mês', title: 'Studio elegante no centro',
      location: 'Centro, Ponta Grossa', badges: ['Mobiliado'], beds: 1, baths: 1, garage: 1, area: 58,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=900&auto=format&fit=crop'
      ]
    },
    {
      id: 5, tag: 'venda', code: 'COD. PG-1101', price: 'R$ 2.100.000', title: 'Casa de condomínio com jardim',
      location: 'Colônia Dona Luíza, Ponta Grossa', badges: ['Alto Padrão', 'Exclusivo'], beds: 5, baths: 4, garage: 4, area: 480,
      images: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=900&auto=format&fit=crop'
      ]
    },
    {
      id: 6, tag: 'venda', code: 'COD. PG-0865', price: 'R$ 420.000', title: 'Terreno plano em condomínio fechado',
      location: 'Nova Rússia, Ponta Grossa', badges: ['Investimento'], beds: 0, baths: 0, garage: 0, area: 500,
      images: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1500534623283-312aade485b7?q=80&w=900&auto=format&fit=crop'
      ]
    }
  ];

  const iconBed = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18h18M5 10V6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4"/></svg>';
  const iconBath = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Z"/><path d="M7 12V6a2 2 0 0 1 3.6-1.2"/><path d="M4 12V9a1 1 0 0 1 1-1"/></svg>';
  const iconGarage = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 10 2-6h14l2 6"/><path d="M3 10h18v9H3z"/><circle cx="7.5" cy="15" r="1"/><circle cx="16.5" cy="15" r="1"/></svg>';
  const iconArea = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/></svg>';
  const iconPin = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const iconHeart = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  const iconChevron = (dir) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m${dir === 'L' ? '15 6-6 6 6 6' : '9 6 6 6-6 6'}"/></svg>`;

  function cardTemplate(p) {
    const slides = p.images.map(src => `<img src="${src}" alt="${p.title}" loading="lazy">`).join('');
    const dots = p.images.map((_, i) => `<button class="${i === 0 ? 'is-active' : ''}" data-dot="${i}" aria-label="Foto ${i + 1}"></button>`).join('');
    const tagLabel = p.tag === 'venda' ? 'Venda' : 'Aluguel';
    const badgeClass = p.tag === 'venda' ? 'badge-venda' : 'badge-aluguel';

    const metaParts = [];
    if (p.beds) metaParts.push(`<span>${iconBed} ${p.beds}</span>`);
    if (p.baths) metaParts.push(`<span>${iconBath} ${p.baths}</span>`);
    if (p.garage) metaParts.push(`<span>${iconGarage} ${p.garage}</span>`);
    metaParts.push(`<span>${iconArea} ${p.area} m²</span>`);

    const badges = (p.badges || []).map(b => `<span class="property-card__badge">${b}</span>`).join('');

    return `
    <article class="property-card" data-tag="${p.tag}">
      <div class="property-card__media" data-carousel data-index="0">
        <div class="property-card__slides">${slides}</div>
        <span class="badge ${badgeClass} property-card__tag">${tagLabel}</span>
        ${badges ? `<div class="property-card__badges">${badges}</div>` : ''}
        <button class="property-card__fav" aria-label="Favoritar imóvel">${iconHeart}</button>
        ${p.images.length > 1 ? `
        <button class="carousel-arrow carousel-arrow--prev" data-dir="-1" aria-label="Foto anterior">${iconChevron('L')}</button>
        <button class="carousel-arrow carousel-arrow--next" data-dir="1" aria-label="Próxima foto">${iconChevron('R')}</button>
        <div class="carousel-dots">${dots}</div>` : ''}
      </div>
      <div class="property-card__body">
        <p class="property-card__price">${p.price}</p>
        <h3 class="property-card__title">${p.title}</h3>
        <p class="property-card__location">${iconPin} ${p.location}</p>
        <div class="property-card__meta">${metaParts.join('')}</div>
        <span class="property-card__code">${p.code}</span>
      </div>
    </article>`;
  }

  const grid = document.getElementById('propertyGrid');
  grid.innerHTML = properties.map(cardTemplate).join('');

  /* ---- Carrossel dentro do card ---- */
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
        goTo(parseInt(carousel.dataset.index, 10) + parseInt(btn.dataset.dir, 10));
      });
    });
    dots.forEach(dot => dot.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(parseInt(dot.dataset.dot, 10));
    }));
  });

  /* ---- Filtro Venda/Aluguel ---- */
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      const filter = chip.dataset.filter;
      grid.querySelectorAll('.property-card').forEach(card => {
        const match = filter === 'todos' || card.dataset.tag === filter;
        card.style.display = match ? '' : 'none';
      });
    });
  });

  /* ---- Busca (demo) ---- */
  document.getElementById('searchBar').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('comprar').scrollIntoView({ behavior: 'smooth' });
  });
});
