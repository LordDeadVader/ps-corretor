// PS Corretor de Imóveis — Alternância de tema claro/escuro
// Carregado de forma síncrona no <head> para aplicar o tema ANTES da primeira
// pintura da página (evita flash de tema errado).
(function () {
  var STORAGE_KEY = 'ps-corretor-theme';

  function getPreferredTheme() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  applyTheme(getPreferredTheme());

  // Exposto para o clique do botão, ligado após o DOM carregar.
  window.__psTheme = {
    toggle: function () {
      var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.__psTheme.toggle(); });
    });
  });
})();
