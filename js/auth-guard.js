// PS Corretor de Imóveis — Proteção de rotas do painel
// Inclua depois de supabase-config.js em toda página do /admin que exigir login.
(function () {
  const isLoginPage = location.pathname.endsWith('/login.html');

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
    }
  }

  function applyUserInfo(session) {
    const nameEl = document.querySelector('[data-user-name]');
    const email = session.user.email || '';
    if (nameEl) nameEl.textContent = session.user.user_metadata?.nome || email.split('@')[0];
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
