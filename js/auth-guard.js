// PS Corretor de Imóveis — Proteção de rotas do painel e identificação de Conta/Admin
// Inclua depois de supabase-config.js em toda página do /admin que exigir login.
(function () {
  const isLoginPage = location.pathname.endsWith('/login.html') || location.pathname.endsWith('/login');
  const ADMIN_EMAILS = ['davihenriqueded@gmail.com'];
  const PRIMARY_BROKER_ID = 'e08931fd-1c79-4d86-9e19-b4b22c1174d4';

  window.PS_AUTH_CONFIG = {
    ADMIN_EMAILS,
    PRIMARY_BROKER_ID,
    isAdminEmail(email) {
      return ADMIN_EMAILS.includes(String(email || '').trim().toLowerCase());
    },
    hasResourceAccess(resourceOwnerId, session) {
      if (!session || !session.user) return false;
      const email = String(session.user.email || '').trim().toLowerCase();
      const uid = session.user.id;
      if (this.isAdminEmail(email)) return true;
      if (email === 'paulosouzalocacao@gmail.com' && (resourceOwnerId === uid || resourceOwnerId === PRIMARY_BROKER_ID)) {
        return true;
      }
      return Boolean(resourceOwnerId && uid && resourceOwnerId === uid);
    },
    render403(targetEl, message) {
      const container = targetEl || document.querySelector('.admin-content') || document.body;
      container.textContent = '';
      const box = document.createElement('div');
      box.style.cssText = 'max-width:520px;margin:48px auto;padding:32px;border-radius:16px;background:var(--color-bg-secondary,#111d35);border:1px solid rgba(239,68,68,0.35);text-align:center;';
      const badge = document.createElement('div');
      badge.style.cssText = 'display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(239,68,68,0.15);color:#f87171;font-weight:700;font-size:12px;margin-bottom:12px;';
      badge.textContent = 'ERRO 403 · ACESSO NEGADO';
      const title = document.createElement('h2');
      title.style.cssText = 'margin:0 0 8px;font-size:20px;';
      title.textContent = 'Você não tem permissão para acessar este recurso';
      const desc = document.createElement('p');
      desc.style.cssText = 'margin:0 0 20px;color:var(--color-text-secondary,#94a3b8);font-size:14px;';
      desc.textContent = message || 'Este registro pertence a outro usuário ou exige privilégios superiores.';
      const backBtn = document.createElement('a');
      backBtn.href = 'dashboard.html';
      backBtn.className = 'btn btn-primary';
      backBtn.textContent = 'Voltar ao Painel';
      box.append(badge, title, desc, backBtn);
      container.appendChild(box);
    }
  };

  // Verificação síncrona imediata antes de qualquer renderização
  if (!isLoginPage) {
    let hasLocalToken = false;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
          const val = localStorage.getItem(k);
          if (val && val.includes('access_token')) {
            hasLocalToken = true;
            break;
          }
        }
      }
    } catch (_) {}

    if (!hasLocalToken) {
      window.location.replace('login.html');
      return;
    }
  }

  async function guard() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session && !isLoginPage) {
      window.location.replace('login.html');
      return;
    }
    if (session && isLoginPage) {
      window.location.replace('dashboard.html');
      return;
    }
    if (session) {
      // Valida o JWT diretamente no servidor Supabase Auth (impede reutilização de token revogado/antigo)
      const { data: userCheck, error: userErr } = await supabaseClient.auth.getUser();
      if (userErr || !userCheck || !userCheck.user) {
        await supabaseClient.auth.signOut({ scope: 'local' });
        if (!isLoginPage) window.location.replace('login.html');
        return;
      }
      document.documentElement.classList.add('is-authenticated');
      await loadIdentityAndPerfil(session);
    }
  }

  async function loadIdentityAndPerfil(session) {
    const email = (session.user.email || '').trim().toLowerCase();
    const isAdmin = window.PS_AUTH_CONFIG.isAdminEmail(email);
    window.isSuperAdmin = isAdmin;

    // Busca sempre o perfil principal do corretor titular (Paulo Souza)
    let { data: brokerPerfil } = await supabaseClient
      .from('corretor_perfil')
      .select('*')
      .eq('id', PRIMARY_BROKER_ID)
      .maybeSingle();

    if (!brokerPerfil) {
      const { data: list } = await supabaseClient
        .from('corretor_perfil')
        .select('*')
        .neq('creci', 'ADMIN')
        .limit(1);
      brokerPerfil = list && list[0] ? list[0] : null;
    }

    if (isAdmin) {
      document.querySelectorAll('[data-user-name]').forEach(el => {
        el.innerHTML = `Logado como Admin <span style="display:inline-block;margin-left:4px;padding:1px 6px;border-radius:999px;font-size:9px;font-weight:700;background:var(--color-gold-500,#d4a853);color:#0a1628;vertical-align:middle;">SUPORTE</span>`;
      });
      document.querySelectorAll('[data-user-role]').forEach(el => {
        el.textContent = email;
      });
      document.querySelectorAll('[data-user-avatar]').forEach(el => {
        el.src = '../assets/logo-icon.png';
        el.style.objectFit = 'contain';
        el.style.background = '#0a1628';
        el.style.padding = '3px';
      });
      return;
    }

    // Login de Corretor (Paulo Souza)
    const nome = (brokerPerfil && brokerPerfil.nome) || 'Paulo Souza';
    const creci = (brokerPerfil && brokerPerfil.creci && brokerPerfil.creci !== 'ADMIN') ? brokerPerfil.creci : 'F-18971';
    const rawFoto = (brokerPerfil && brokerPerfil.foto_url) || '../assets/logo.jpeg';
    const foto = /^(https?:\/\/|\/|\.\.?\/|assets\/|data:image\/)/i.test(String(rawFoto).trim()) ? rawFoto : '../assets/logo.jpeg';

    document.querySelectorAll('[data-user-name]').forEach(el => {
      el.textContent = nome;
    });
    document.querySelectorAll('[data-user-role]').forEach(el => {
      el.textContent = `Corretor · CRECI ${creci}`;
    });
    document.querySelectorAll('[data-user-avatar]').forEach(el => {
      el.onerror = () => { el.onerror = null; el.src = '../assets/logo.jpeg'; };
      el.src = foto;
    });

    if (location.pathname.endsWith('dashboard.html')) {
      const topSub = document.querySelector('.admin-topbar__title p');
      if (topSub) {
        topSub.textContent = 'Bem-vindo de volta, ';
        const strongEl = document.createElement('strong');
        strongEl.textContent = nome;
        const midText = document.createTextNode(' · Conta conectada: ');
        const codeEl = document.createElement('code');
        codeEl.textContent = email;
        topSub.append(strongEl, midText, codeEl);
      }
    }
  }

  // Expiração automática por inatividade (60 minutos sem interação revoga a sessão)
  const INACTIVITY_LIMIT_MS = 60 * 60 * 1000;
  let inactivityTimer = null;
  function resetInactivityTimer() {
    if (isLoginPage) return;
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(async () => {
      try { await supabaseClient.auth.signOut({ scope: 'global' }); } catch (_) {}
      window.location.replace('login.html');
    }, INACTIVITY_LIMIT_MS);
  }
  if (!isLoginPage) {
    ['click', 'keydown', 'mousemove', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, resetInactivityTimer, { passive: true });
    });
    resetInactivityTimer();
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-logout]');
    if (!btn) return;
    e.preventDefault();
    supabaseClient.auth.signOut({ scope: 'global' }).then(() => {
      window.location.replace('login.html');
    });
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (!session && !isLoginPage) window.location.replace('login.html');
  });

  guard();
})();
