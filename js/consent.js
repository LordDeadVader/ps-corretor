/* PS Corretor de Imóveis — Gerenciador de consentimento (LGPD)
   ==========================================================================
   Documentação completa em docs/lgpd/consent-management.md e docs/lgpd/cookies.md

   O QUE ESTE ARQUIVO FAZ DE VERDADE (não é só visual):
   1. Mostra o banner de cookies só quando ainda não há uma decisão salva.
   2. Guarda a decisão em localStorage (chave PS_CONSENT_KEY) — nada de
      identificação pessoal, só um UUID aleatório do navegador + categorias.
   3. Só ativa scripts marcados como não-essenciais (analytics/marketing)
      DEPOIS da autorização correspondente — eles ficam com
      type="text/plain" no HTML até isso acontecer (ver ativarScriptsPermitidos).
   4. Registra a decisão (sem dados pessoais) na tabela `consentimentos` do
      Supabase, quando o cliente do Supabase já estiver carregado na página.
   5. Expõe window.PSConsent para o resto do site (ex.: a Central de
      Privacidade em /privacidade.html) ler/alterar a preferência.

   HOJE (auditoria de código), o site não carrega nenhum script de
   analytics/marketing — só fontes do Google (necessário) e o Supabase
   (necessário, é o banco de dados da aplicação). As categorias abaixo já
   ficam prontas para quando/se isso mudar; ver docs/lgpd/cookies.md.
   ========================================================================== */
(function () {
  var POLICY_VERSION = '1.0.0-2026-09';
  var CONSENT_KEY = 'ps_consent_v1';
  var VISITOR_KEY = 'ps_visitor_id';

  var CATEGORIES = {
    necessarios: { label: 'Necessários', locked: true, default: true,
      desc: 'Fazem o site funcionar (navegação, tema claro/escuro, exibição dos imóveis). Não podem ser desativados.' },
    preferencias: { label: 'Preferências', locked: false, default: true,
      desc: 'Lembram escolhas que você já fez no site, como o tema claro/escuro.' },
    analytics: { label: 'Analytics', locked: false, default: false,
      desc: 'Ajudariam a entender como o site é usado, de forma agregada. Nenhuma ferramenta desse tipo está ativa hoje.' },
    marketing: { label: 'Marketing', locked: false, default: false,
      desc: 'Usados por ferramentas de anúncio/remarketing. Nenhuma ferramenta desse tipo está ativa hoje.' }
  };

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getVisitorId() {
    try {
      var id = localStorage.getItem(VISITOR_KEY);
      if (!id) { id = uuid(); localStorage.setItem(VISITOR_KEY, id); }
      return id;
    } catch (e) { return uuid(); } // navegação privada sem storage: funciona, só não persiste
  }

  function readConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed.versao_politica !== POLICY_VERSION) return null; // política mudou, pede de novo
      return parsed;
    } catch (e) { return null; }
  }

  function writeConsent(categorias, origem) {
    var record = { categorias: categorias, versao_politica: POLICY_VERSION, ts: Date.now() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(record)); } catch (e) {}
    logToSupabase(categorias, origem);
    ativarScriptsPermitidos(categorias);
    document.dispatchEvent(new CustomEvent('ps-consent-changed', { detail: categorias }));
    return record;
  }

  function logToSupabase(categorias, origem, tentativas) {
    tentativas = tentativas || 0;
    // Best-effort: o consentimento já está salvo localmente (é isso que
    // efetivamente controla os scripts). Se o supabase-js ainda não tiver
    // carregado nesta página no exato instante do clique — comum se a
    // pessoa decide muito rápido — tenta de novo por alguns segundos antes
    // de desistir do registro de auditoria, sem bloquear nada no site.
    // Nota: `supabaseClient` é declarado com `const` no topo de
    // js/supabase-config.js, então NÃO vira propriedade de `window` — por
    // isso o teste é com o identificador solto, via typeof (seguro mesmo
    // se a variável nunca tiver sido declarada nesta página).
    if (typeof supabaseClient === 'undefined') {
      if (tentativas < 10) setTimeout(function () { logToSupabase(categorias, origem, tentativas + 1); }, 400);
      return;
    }
    try {
      supabaseClient.from('consentimentos').insert({
        visitor_id: getVisitorId(),
        categorias: categorias,
        versao_politica: POLICY_VERSION,
        origem: origem || location.pathname,
        user_agent: navigator.userAgent
      }).then(function () {}, function () {});
    } catch (e) { /* rede indisponível, RLS, etc. — não impede o uso do site */ }
  }

  function ativarScriptsPermitidos(categorias) {
    document.querySelectorAll('script[type="text/plain"][data-consent-category]').forEach(function (tag) {
      var categoria = tag.getAttribute('data-consent-category');
      if (!categorias[categoria]) return;
      var s = document.createElement('script');
      for (var i = 0; i < tag.attributes.length; i++) {
        var attr = tag.attributes[i];
        if (attr.name === 'type') continue;
        s.setAttribute(attr.name === 'data-consent-src' ? 'src' : attr.name, attr.value);
      }
      s.text = tag.text;
      tag.replaceWith(s);
    });
  }

  function allCategories(value) {
    var out = {};
    Object.keys(CATEGORIES).forEach(function (k) { out[k] = CATEGORIES[k].locked ? true : value; });
    out.necessarios = true;
    return out;
  }

  /* ---------------------------------------------------------------- UI ---- */
  function injectStyles() {
    if (document.getElementById('ps-consent-styles')) return;
    var css = ''
      + '.ps-consent-banner{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:var(--color-navy-900);color:#fff;padding:18px 20px;box-shadow:0 -8px 24px rgba(0,0,0,.25);}'
      + '.ps-consent-banner__inner{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:14px;}'
      + '.ps-consent-banner p{margin:0;font-size:13px;line-height:1.55;color:rgba(255,255,255,.85);}'
      + '.ps-consent-banner a{color:var(--color-gold-400,#D9AF5F);text-decoration:underline;}'
      + '.ps-consent-actions{display:flex;flex-wrap:wrap;gap:8px;}'
      + '.ps-consent-actions button{border-radius:8px;padding:10px 16px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;}'
      + '.ps-consent-actions button.ps-primary{background:var(--color-gold-500,#C99A3E);border-color:var(--color-gold-500,#C99A3E);color:#1a1200;}'
      + '.ps-consent-actions button:hover{opacity:.9;}'
      + '.ps-consent-modal-overlay{position:fixed;inset:0;background:rgba(6,14,26,.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;}'
      + '.ps-consent-modal{background:var(--color-surface,#fff);color:var(--color-text-primary,#101828);max-width:520px;width:100%;max-height:85vh;overflow:auto;border-radius:14px;padding:24px;}'
      + '.ps-consent-modal h2{margin:0 0 6px;font-size:18px;font-weight:800;}'
      + '.ps-consent-modal>p{margin:0 0 18px;font-size:13px;color:var(--color-text-secondary,#475467);}'
      + '.ps-consent-cat{border:1px solid var(--color-border,#E4E7EC);border-radius:10px;padding:12px 14px;margin-bottom:10px;}'
      + '.ps-consent-cat__head{display:flex;align-items:center;justify-content:space-between;gap:10px;}'
      + '.ps-consent-cat__head strong{font-size:14px;}'
      + '.ps-consent-cat p{margin:6px 0 0;font-size:12px;color:var(--color-text-tertiary,#8A94A6);}'
      + '.ps-consent-modal-actions{display:flex;gap:8px;margin-top:18px;flex-wrap:wrap;}'
      + '.ps-consent-modal-actions button{flex:1;min-width:120px;border-radius:8px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid var(--color-border-strong,#D3D8E0);background:#fff;color:var(--color-text-primary,#101828);}'
      + '.ps-consent-modal-actions button.ps-primary{background:var(--color-gold-500,#C99A3E);border-color:var(--color-gold-500,#C99A3E);color:#1a1200;}'
      + '.ps-switch{position:relative;display:inline-block;width:38px;height:22px;flex-shrink:0;}'
      + '.ps-switch input{opacity:0;width:0;height:0;}'
      + '.ps-switch span{position:absolute;inset:0;background:#C6CBD4;border-radius:999px;transition:.15s;}'
      + '.ps-switch span:before{content:"";position:absolute;height:16px;width:16px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.15s;}'
      + '.ps-switch input:checked+span{background:var(--color-navy-800,#0F2647);}'
      + '.ps-switch input:checked+span:before{transform:translateX(16px);}'
      + '.ps-switch input:disabled+span{opacity:.5;}';
    var styleTag = document.createElement('style');
    styleTag.id = 'ps-consent-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
  }

  function buildBanner() {
    var el = document.createElement('div');
    el.className = 'ps-consent-banner';
    el.id = 'psConsentBanner';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Preferências de cookies');
    el.innerHTML =
      '<div class="ps-consent-banner__inner">' +
      '<p>Usamos cookies e armazenamento local para o site funcionar e lembrar suas preferências. ' +
      'Veja detalhes na <a href="' + rel('privacidade.html') + '#cookies">Política de Cookies</a>.</p>' +
      '<div class="ps-consent-actions">' +
      '<button type="button" data-ps-action="reject">Recusar não essenciais</button>' +
      '<button type="button" data-ps-action="prefs">Personalizar</button>' +
      '<button type="button" class="ps-primary" data-ps-action="accept">Aceitar todos</button>' +
      '</div></div>';
    return el;
  }

  function rel(path) {
    // funciona tanto em / (index.html) quanto em /admin/ ou em subpáginas
    var depth = location.pathname.split('/').filter(Boolean);
    var inAdmin = location.pathname.indexOf('/admin/') !== -1;
    return (inAdmin ? '../' : '') + path;
  }

  function buildModal(current) {
    var overlay = document.createElement('div');
    overlay.className = 'ps-consent-modal-overlay';
    overlay.id = 'psConsentModalOverlay';

    var catsHtml = Object.keys(CATEGORIES).map(function (key) {
      var c = CATEGORIES[key];
      var checked = current ? !!current[key] : c.default;
      return '' +
        '<div class="ps-consent-cat">' +
        '<div class="ps-consent-cat__head"><strong>' + c.label + '</strong>' +
        '<label class="ps-switch"><input type="checkbox" data-ps-cat="' + key + '" ' +
        (checked ? 'checked' : '') + (c.locked ? ' disabled' : '') + '><span></span></label>' +
        '</div><p>' + c.desc + '</p></div>';
    }).join('');

    overlay.innerHTML =
      '<div class="ps-consent-modal" role="dialog" aria-modal="true" aria-label="Preferências de cookies">' +
      '<h2>Preferências de cookies</h2>' +
      '<p>Escolha o que pode ficar ativo. Você pode alterar isso quando quiser em ' +
      '<a href="' + rel('privacidade.html') + '#cookies">Central de Privacidade</a>.</p>' +
      catsHtml +
      '<div class="ps-consent-modal-actions">' +
      '<button type="button" data-ps-action="reject-modal">Recusar não essenciais</button>' +
      '<button type="button" class="ps-primary" data-ps-action="save-modal">Salvar preferências</button>' +
      '</div></div>';
    return overlay;
  }

  function showBanner() {
    if (document.getElementById('psConsentBanner')) return;
    injectStyles();
    var banner = buildBanner();
    document.body.appendChild(banner);
    banner.addEventListener('click', function (e) {
      var action = e.target.getAttribute('data-ps-action');
      if (action === 'accept') { writeConsent(allCategories(true), 'banner-accept'); closeBanner(); }
      else if (action === 'reject') { writeConsent(allCategories(false), 'banner-reject'); closeBanner(); }
      else if (action === 'prefs') { openPreferences(); }
    });
  }

  function closeBanner() {
    var b = document.getElementById('psConsentBanner');
    if (b) b.remove();
  }

  function openPreferences() {
    injectStyles();
    var existing = document.getElementById('psConsentModalOverlay');
    if (existing) existing.remove();
    var current = readConsent();
    var overlay = buildModal(current ? current.categorias : null);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { overlay.remove(); return; }
      var action = e.target.getAttribute('data-ps-action');
      if (action === 'reject-modal') {
        writeConsent(allCategories(false), 'modal-reject');
        overlay.remove(); closeBanner();
      } else if (action === 'save-modal') {
        var cats = {};
        overlay.querySelectorAll('[data-ps-cat]').forEach(function (input) {
          cats[input.getAttribute('data-ps-cat')] = input.checked;
        });
        cats.necessarios = true;
        writeConsent(cats, 'modal-save');
        overlay.remove(); closeBanner();
      }
    });
  }

  function init() {
    var current = readConsent();
    if (current) {
      ativarScriptsPermitidos(current.categorias);
    } else {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
      } else {
        showBanner();
      }
    }
  }

  window.PSConsent = {
    version: POLICY_VERSION,
    categories: CATEGORIES,
    getVisitorId: getVisitorId,
    get: readConsent,
    hasConsent: function (categoria) {
      var c = readConsent();
      return !!(c && c.categorias && c.categorias[categoria]);
    },
    acceptAll: function () { writeConsent(allCategories(true), 'api-accept'); closeBanner(); },
    rejectAll: function () { writeConsent(allCategories(false), 'api-reject'); closeBanner(); },
    setCategories: function (cats) { cats.necessarios = true; writeConsent(cats, 'api-set'); closeBanner(); },
    openPreferences: openPreferences
  };

  init();
})();
