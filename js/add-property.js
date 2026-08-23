// PS Corretor de Imóveis — Criar/editar imóvel
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('propertyForm');
  if (!form) return;

  const formError = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const mediaGrid = document.getElementById('mediaGrid');
  const uploadStatus = document.getElementById('uploadStatus');

  const params = new URLSearchParams(location.search);
  const editId = params.get('id');
  let items = []; // { url, isCover, isDestaque }
  const MAX_DESTAQUES = 3;

  function slugify(str) {
    return str.toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  function renderMedia() {
    const destaqueCount = items.filter(i => i.isDestaque).length;
    mediaGrid.innerHTML = items.map((item, i) => `
      <div class="media-item ${item.isCover ? 'is-cover' : ''} ${item.isDestaque ? 'is-destaque' : ''}" data-index="${i}">
        <span class="media-item__cover-badge">Capa</span>
        <span class="media-item__destaque-badge">Destaque</span>
        <img src="${adminImgSrc(item.url)}" alt="Foto do imóvel">
        <div class="media-item__overlay">
          <div class="media-item__row">
            <button type="button" class="media-item__set-cover" data-action="cover" data-index="${i}">Capa</button>
            <button type="button" class="media-item__set-destaque" data-action="destaque" data-index="${i}">${item.isDestaque ? '★ Destaque' : '☆ Destaque'}</button>
          </div>
          <button type="button" data-action="remove" data-index="${i}" aria-label="Remover" style="align-self:flex-end;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>`).join('');
    document.getElementById('destaqueCount').textContent = `${destaqueCount}/${MAX_DESTAQUES} fotos em destaque selecionadas (usadas na página inicial)`;
  }

  async function uploadFiles(fileList) {
    uploadStatus.textContent = `Enviando ${fileList.length} foto(s)...`;
    for (const file of Array.from(fileList)) {
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${file.name.split('.').pop()}`;
      const { error } = await supabaseClient.storage.from('imoveis-fotos').upload(path, file);
      if (error) {
        uploadStatus.textContent = 'Erro ao enviar uma das fotos: ' + error.message;
        continue;
      }
      const { data: pub } = supabaseClient.storage.from('imoveis-fotos').getPublicUrl(path);
      items.push({ url: pub.publicUrl, isCover: items.length === 0, isDestaque: false });
    }
    uploadStatus.textContent = '';
    renderMedia();
  }

  dropzone.addEventListener('click', (e) => { if (e.target === fileInput) return; });
  fileInput.addEventListener('change', (e) => uploadFiles(e.target.files));
  ['dragenter', 'dragover'].forEach(evt => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('is-dragover'); }));
  ['dragleave', 'drop'].forEach(evt => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('is-dragover'); }));
  dropzone.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files); });

  mediaGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const index = parseInt(btn.dataset.index, 10);
    if (btn.dataset.action === 'remove') {
      items.splice(index, 1);
      if (items.length && !items.some(i => i.isCover)) items[0].isCover = true;
    } else if (btn.dataset.action === 'cover') {
      items.forEach((item, i) => { item.isCover = i === index; });
    } else if (btn.dataset.action === 'destaque') {
      const item = items[index];
      const activeCount = items.filter(i => i.isDestaque).length;
      if (!item.isDestaque && activeCount >= MAX_DESTAQUES) {
        alert(`Você já selecionou ${MAX_DESTAQUES} fotos em destaque. Desmarque uma antes de escolher outra.`);
        return;
      }
      item.isDestaque = !item.isDestaque;
    }
    renderMedia();
  });

  async function populateBairroDatalist() {
    const { data } = await supabaseClient.from('imoveis').select('bairro');
    const bairros = [...new Set((data || []).map(r => r.bairro))];
    document.getElementById('bairrosExistentes').innerHTML = bairros.map(b => `<option value="${b}">`).join('');
  }

  async function loadForEdit() {
    pageTitle.textContent = 'Editar Imóvel';
    pageSubtitle.textContent = 'Atualize as informações do anúncio';
    submitBtn.textContent = 'Salvar Alterações';

    const { data: p, error } = await supabaseClient.from('imoveis').select('*').eq('id', editId).single();
    if (error || !p) {
      formError.textContent = 'Imóvel não encontrado.';
      formError.hidden = false;
      return;
    }

    document.getElementById('imovelId').value = p.id;
    document.getElementById('titulo').value = p.titulo;
    document.getElementById('tipoImovel').value = p.tipo;
    document.querySelector(`input[name="categoria"][value="${p.operacao}"]`).checked = true;
    document.getElementById('statusImovel').value = p.status;
    document.getElementById('descricao').value = p.descricao || '';
    document.getElementById('valorImovel').value = p.preco_valor != null ? p.preco_valor : '';
    document.getElementById('precoLabel').value = p.preco_label;
    document.getElementById('areaUtil').value = p.area_util != null ? p.area_util : '';
    document.getElementById('areaTerreno').value = p.area_terreno != null ? p.area_terreno : '';
    document.getElementById('quartos').value = p.quartos || 0;
    document.getElementById('suites').value = p.suites || 0;
    document.getElementById('banheiros').value = p.banheiros || 0;
    document.getElementById('vagas').value = p.vagas || 0;
    document.getElementById('bairro').value = p.bairro;
    document.getElementById('cidade').value = p.cidade;
    document.getElementById('endereco').value = p.endereco || '';
    document.getElementById('destaques').value = (p.destaques || []).join('\n');
    document.getElementById('badges').value = (p.badges || []).join(', ');

    const destaques = p.fotos_destaque || [];
    items = (p.fotos || []).map(url => ({ url, isCover: url === p.capa, isDestaque: destaques.includes(url) }));
    if (items.length && !items.some(i => i.isCover)) items[0].isCover = true;
    renderMedia();
  }

  populateBairroDatalist();
  if (editId) loadForEdit();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';

    const titulo = document.getElementById('titulo').value.trim();
    const destaques = document.getElementById('destaques').value.split('\n').map(s => s.trim()).filter(Boolean);
    const badges = document.getElementById('badges').value.split(',').map(s => s.trim()).filter(Boolean);
    const fotos = items.map(i => i.url);
    const capaItem = items.find(i => i.isCover) || items[0];

    const payload = {
      titulo,
      tipo: document.getElementById('tipoImovel').value,
      operacao: document.querySelector('input[name="categoria"]:checked').value,
      status: document.getElementById('statusImovel').value,
      descricao: document.getElementById('descricao').value.trim() || null,
      preco_valor: document.getElementById('valorImovel').value ? parseFloat(document.getElementById('valorImovel').value) : null,
      preco_label: document.getElementById('precoLabel').value.trim(),
      area_util: document.getElementById('areaUtil').value ? parseFloat(document.getElementById('areaUtil').value) : null,
      area_terreno: document.getElementById('areaTerreno').value ? parseFloat(document.getElementById('areaTerreno').value) : null,
      quartos: parseInt(document.getElementById('quartos').value, 10) || 0,
      suites: parseInt(document.getElementById('suites').value, 10) || 0,
      banheiros: parseInt(document.getElementById('banheiros').value, 10) || 0,
      vagas: parseInt(document.getElementById('vagas').value, 10) || 0,
      bairro: document.getElementById('bairro').value.trim(),
      cidade: document.getElementById('cidade').value.trim(),
      endereco: document.getElementById('endereco').value.trim() || null,
      destaques,
      badges,
      fotos,
      fotos_destaque: items.filter(i => i.isDestaque).map(i => i.url),
      capa: capaItem ? capaItem.url : null,
    };

    const id = document.getElementById('imovelId').value;
    let query;
    if (id) {
      query = supabaseClient.from('imoveis').update(payload).eq('id', id);
    } else {
      payload.slug = `${slugify(titulo)}-${Date.now().toString(36)}`;
      query = supabaseClient.from('imoveis').insert(payload);
    }

    const { error } = await query;

    submitBtn.disabled = false;
    submitBtn.textContent = id ? 'Salvar Alterações' : 'Publicar Imóvel';

    if (error) {
      formError.textContent = 'Erro ao salvar: ' + error.message;
      formError.hidden = false;
      return;
    }

    window.location.href = 'properties.html';
  });
});
