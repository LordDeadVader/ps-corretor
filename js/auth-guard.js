// PS Corretor de Imóveis — Proteção de rotas do painel
// Inclua depois de supabase-config.js em toda página do /admin que exigir login.
(function () {
  const isLoginPage = location.pathname.endsWith('/login.html') || location.pathname.endsWith('/login');

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
      document.documentElement.classList.add('is-authenticated');
      applyUserInfo(session);
      loadPerfil(session);
    }
  }

  function applyUserInfo(session) {
    const nameEl = document.querySelector('[data-user-name]');
    const email = session.user.email || '';
    if (nameEl) nameEl.textContent = email.split('@')[0];
  }

  async function loadPerfil(session) {
    let { data: perfil } = await supabaseClient.from('corretor_perfil').select('*').eq('id', session.user.id).maybeSingle();
    if (!perfil) {
      const res = await supabaseClient.from('corretor_perfil').select('*').limit(1).maybeSingle();
      perfil = res.data;
    }
    if (!perfil) return;
    document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = perfil.nome; });
    document.querySelectorAll('[data-user-role]').forEach(el => { el.textContent = `Corretor${perfil.creci ? ' · CRECI ' + perfil.creci : ''}`; });
    document.querySelectorAll('[data-user-avatar]').forEach(el => {
      if (perfil.foto_url) {
        el.onerror = () => { el.onerror = null; el.src = '../assets/logo.jpeg'; };
        el.src = perfil.foto_url;
      }
    });
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
