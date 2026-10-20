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
    const foto = (brokerPerfil && brokerPerfil.foto_url) || '../assets/logo.jpeg';

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
        topSub.innerHTML = `Bem-vindo de volta, <strong>${nome}</strong> · Conta conectada: <code>${email}</code>`;
      }
    }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-logout]');
    if (!btn) return;
    e.preventDefault();
    supabaseClient.auth.signOut().then(() => {
      window.location.href = 'login.html';
    });
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (!session && !isLoginPage) window.location.replace('login.html');
  });

  guard();
})();
