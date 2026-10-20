// PS Corretor de Imóveis — Configurações, Contas Conectadas e Lista de Corretores
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileForm');
  if (!form) return;

  const PRIMARY_BROKER_ID = 'e08931fd-1c79-4d86-9e19-b4b22c1174d4';
  const SECONDARY_BROKER_ID = '72649504-699c-4f82-acc9-2ed1ab736faa';

  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarStatus = document.getElementById('avatarStatus');

  const activeSessionBox = document.getElementById('activeSessionBox');
  const activeSessionAvatar = document.getElementById('activeSessionAvatar');
  const activeSessionTitle = document.getElementById('activeSessionTitle');
  const activeSessionDesc = document.getElementById('activeSessionDesc');
  const brokersRoster = document.getElementById('brokersRoster');
  const adminEditingNotice = document.getElementById('adminEditingNotice');

  let avatarUrl = null;
  let oldAvatarUrl = null;
  let currentSession = null;
  let isAdminUser = false;

  function escapeHtml(str) {
    return (str == null ? '' : String(str)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderSessionAndRoster(perfil) {
    const email = (currentSession && currentSession.user && currentSession.user.email) || '';
    const brokerName = (perfil && perfil.nome) || 'Paulo Souza';
    const brokerCreci = (perfil && perfil.creci && perfil.creci !== 'ADMIN') ? perfil.creci : 'F-18971';
    const brokerPhone = (perfil && perfil.telefone) || '+55 42 99954-9354';
    const brokerPhoto = (perfil && perfil.foto_url) || '../assets/logo.jpeg';

    if (activeSessionBox) {
      activeSessionBox.classList.remove('is-admin', 'is-broker');
      if (isAdminUser) {
        activeSessionBox.classList.add('is-admin');
        activeSessionAvatar.src = '../assets/logo-icon.png';
        activeSessionAvatar.style.objectFit = 'contain';
        activeSessionAvatar.style.padding = '4px';
        activeSessionTitle.innerHTML = `
          <span>Você está logado como Admin (Suporte)</span>
          <span class="account-role-pill account-role-pill--admin">● Sessão Privada Admin</span>
        `;
        activeSessionDesc.innerHTML = `Conta conectada: <code>${escapeHtml(email)}</code> · <em>Essa informação aparece somente para você. O corretor não vê seu login nem na lista abaixo.</em>`;
      } else {
        activeSessionBox.classList.add('is-broker');
        activeSessionAvatar.src = brokerPhoto;
        activeSessionAvatar.style.objectFit = 'cover';
        activeSessionAvatar.style.padding = '0';
        activeSessionTitle.innerHTML = `
          <span>${escapeHtml(brokerName)}</span>
          <span class="account-role-pill account-role-pill--online">● Conectado nesta conta</span>
        `;
        activeSessionDesc.innerHTML = `Sessão ativa · Conta conectada: <code>${escapeHtml(email)}</code> · CRECI ${escapeHtml(brokerCreci)}`;
      }
    }

    if (brokersRoster) {
      const titularBadge = isAdminUser
        ? `<span class="account-role-pill account-role-pill--online">● Corretor Principal</span>`
        : `<span class="account-role-pill account-role-pill--online">● Conectado agora (${escapeHtml(email)})</span>`;

      brokersRoster.innerHTML = `
        <div class="broker-card">
          <div class="broker-card__left">
            <img class="broker-card__avatar" src="${escapeHtml(brokerPhoto)}" alt="${escapeHtml(brokerName)}" onerror="this.onerror=null;this.src='../assets/logo.jpeg';">
            <div class="broker-card__info">
              <strong>
                <span>${escapeHtml(brokerName)}</span>
                ${titularBadge}
              </strong>
              <span>CRECI ${escapeHtml(brokerCreci)} · WhatsApp: ${escapeHtml(brokerPhone)} · Conta: paulosouzalocacao@gmail.com</span>
            </div>
          </div>
          <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);font-weight:600;">
            Corretor Titular
          </div>
        </div>

        <div class="broker-empty-slot">
          <strong>Outros corretores cadastrados (0)</strong>
          <span>Nenhum outro corretor cadastrado no momento. Espaço reservado para futuros corretores da imobiliária.</span>
        </div>
      `;
    }
  }

  async function load() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    currentSession = session;

    const email = (session.user.email || '').trim().toLowerCase();
    isAdminUser = window.PS_AUTH_CONFIG ? window.PS_AUTH_CONFIG.isAdminEmail(email) : (email === 'davihenriqueded@gmail.com');

    if (adminEditingNotice) {
      adminEditingNotice.hidden = !isAdminUser;
    }

    document.getElementById('emailLogin').value = isAdminUser
      ? `${session.user.email} (Visível apenas p/ você — Suporte Admin)`
      : session.user.email;

    // Carrega sempre o perfil principal do corretor titular (Paulo Souza)
    let { data: perfil } = await supabaseClient
      .from('corretor_perfil')
      .select('*')
      .eq('id', PRIMARY_BROKER_ID)
      .maybeSingle();

    if (!perfil) {
      const { data: fallback } = await supabaseClient
        .from('corretor_perfil')
        .select('*')
        .neq('creci', 'ADMIN')
        .limit(1);
      perfil = fallback && fallback[0] ? fallback[0] : null;
    }

    if (perfil) {
      document.getElementById('nome').value = perfil.nome || 'Paulo Souza';
      document.getElementById('creci').value = (perfil.creci && perfil.creci !== 'ADMIN') ? perfil.creci : 'F-18971';
      document.getElementById('telefone').value = perfil.telefone || '+55 42 99954-9354';
      if (perfil.foto_url) {
        avatarUrl = perfil.foto_url;
        oldAvatarUrl = perfil.foto_url;
        avatarPreview.src = perfil.foto_url;
      }
    } else {
      document.getElementById('nome').value = 'Paulo Souza';
      document.getElementById('creci').value = 'F-18971';
      document.getElementById('telefone').value = '+55 42 99954-9354';
    }

    renderSessionAndRoster(perfil);
  }

  avatarInput.addEventListener('change', async (e) => {
    const picked = e.target.files[0];
    if (!picked) return;

    avatarPreview.src = URL.createObjectURL(picked);
    avatarStatus.textContent = 'Enviando foto...';

    const { file, contentType } = await window.compressImage(picked, { maxSize: 512 });
    const { data: { session } } = await supabaseClient.auth.getSession();
    const path = `${PRIMARY_BROKER_ID}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabaseClient.storage.from('avatares').upload(path, file, { upsert: true, contentType, cacheControl: '31536000' });

    if (error) {
      avatarStatus.textContent = 'Erro ao enviar foto: ' + error.message;
      return;
    }

    const { data: pub } = supabaseClient.storage.from('avatares').getPublicUrl(path);
    avatarUrl = pub.publicUrl;
    avatarStatus.textContent = 'Foto atualizada. Clique em "Salvar Alterações" para confirmar.';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    formSuccess.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';

    const nome = document.getElementById('nome').value.trim() || 'Paulo Souza';
    const creci = document.getElementById('creci').value.trim() || 'F-18971';
    const telefone = document.getElementById('telefone').value.trim() || null;
    const nowIso = new Date().toISOString();

    const rowsToUpsert = [
      { id: PRIMARY_BROKER_ID, nome, creci, telefone, foto_url: avatarUrl, updated_at: nowIso },
      { id: SECONDARY_BROKER_ID, nome, creci, telefone, foto_url: avatarUrl, updated_at: nowIso }
    ];

    const { error } = await supabaseClient.from('corretor_perfil').upsert(rowsToUpsert);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar Alterações';

    if (error) {
      formError.textContent = 'Erro ao salvar: ' + error.message;
      formError.hidden = false;
      return;
    }

    if (oldAvatarUrl && oldAvatarUrl !== avatarUrl && window.removeStorageFiles) {
      await window.removeStorageFiles(oldAvatarUrl);
      oldAvatarUrl = avatarUrl;
    }

    formSuccess.textContent = 'Perfil do corretor titular atualizado com sucesso!';
    formSuccess.hidden = false;

    renderSessionAndRoster({ nome, creci, telefone, foto_url: avatarUrl });

    // Se quem estiver logado for o próprio corretor (e não o Admin), atualiza o rodapé da barra lateral
    if (!isAdminUser) {
      document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = nome; });
      document.querySelectorAll('[data-user-role]').forEach(el => { el.textContent = `Corretor · CRECI ${creci}`; });
      document.querySelectorAll('[data-user-avatar]').forEach(el => { if (avatarUrl) el.src = avatarUrl; });
    }
  });

  load();
});
