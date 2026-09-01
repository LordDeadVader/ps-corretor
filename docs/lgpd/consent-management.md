# Gestão de Consentimento

Implementação: `js/consent.js` (banner + modal + lógica de bloqueio) e a tabela
`consentimentos` (`supabase/schema-lgpd.sql`).

## O que é registrado (e o que propositalmente não é)

Cada vez que a pessoa toma uma decisão (aceitar tudo, recusar não essenciais, ou
salvar preferências personalizadas), dois registros são feitos:

1. **`localStorage` do navegador** (`ps_consent_v1`) — é o que efetivamente controla
   o comportamento do site nessa visita e nas seguintes.
2. **Tabela `consentimentos` no Supabase** — um registro de auditoria, para o
   controlador conseguir demonstrar, se precisar, que a autorização foi dada e sob
   qual versão da política.

Por minimização de dados, o registro de auditoria **não contém**:

- Nome, e-mail, telefone ou qualquer identificador da pessoa;
- Endereço IP (o Supabase pode registrar o IP de origem da requisição em seus
  próprios logs de infraestrutura, fora do controle desta aplicação — isso é do
  processador, não desta tabela);
- Qualquer coisa que ligue o registro a uma conta ou CPF.

O que a tabela `consentimentos` guarda:

| Coluna | Conteúdo | Por quê |
|---|---|---|
| `visitor_id` | UUID aleatório gerado no navegador (`crypto.randomUUID()`) | Permite ao próprio visitante localizar seu histórico, sem identificá-lo pessoalmente |
| `categorias` | `{"necessarios":true,"preferencias":true,"analytics":false,"marketing":false}` | O que foi de fato autorizado |
| `versao_politica` | Ex.: `"1.0.0-2026-09"` | Provar qual versão da política a pessoa aceitou |
| `origem` | Qual ação gerou o registro (`banner-accept`, `banner-reject`, `modal-save`, etc.) | Auditoria/depuração |
| `user_agent` | String do navegador | Auditoria/depuração — não é, por si só, um identificador de pessoa |
| `created_at` | Data/hora | Quando aconteceu |

## Versão da política

A constante `POLICY_VERSION` no topo de `js/consent.js` (hoje `"1.0.0-2026-09"`) deve
ser incrementada sempre que a Política de Privacidade/Cookies mudar de forma
relevante. Quando isso acontece, o `js/consent.js` automaticamente ignora qualquer
consentimento salvo com versão antiga e mostra o banner de novo — é assim que o
sistema "demonstra qual versão do consentimento foi aceita" e garante que mudanças
relevantes peçam uma nova autorização.

## Como testar que o bloqueio funciona de verdade

1. Abra o site com o DevTools aberto e limpe o `localStorage` (`localStorage.clear()`).
2. Recarregue a página — o banner deve aparecer.
3. No console, adicione um script de teste bloqueado:
   ```js
   const s = document.createElement('script');
   s.type = 'text/plain';
   s.setAttribute('data-consent-category', 'analytics');
   s.text = 'window.__teste = true;';
   document.body.appendChild(s);
   ```
4. Clique em "Recusar não essenciais" — rode `window.__teste` no console: deve dar
   `undefined` (o script não rodou).
5. Recarregue, repita o passo 3, mas agora clique em "Personalizar" → marque
   "Analytics" → "Salvar preferências". Rode `window.__teste`: agora deve ser `true`.

Esse é exatamente o teste que foi feito durante a implementação (ver histórico do
projeto) — o comportamento foi validado, não é só uma interface visual.

## API disponível para outras páginas/scripts

```js
window.PSConsent.hasConsent('analytics')   // true/false
window.PSConsent.get()                     // registro completo salvo, ou null
window.PSConsent.openPreferences()         // abre o modal de preferências
window.PSConsent.acceptAll()
window.PSConsent.rejectAll()
window.PSConsent.setCategories({ preferencias: true, analytics: false, marketing: false })
window.PSConsent.getVisitorId()
```

## Limitações conhecidas

- O registro de auditoria no Supabase é "best effort": se a rede estiver
  indisponível, o consentimento continua funcionando normalmente (controlado pelo
  `localStorage`), só o registro de auditoria remoto pode não ser gravado. O código
  tenta novamente por alguns segundos caso o cliente do Supabase ainda não tenha
  carregado no exato instante do clique.
- Por ser `localStorage` (não um cookie `HttpOnly`), qualquer script rodando na
  mesma origem consegue ler `ps_consent_v1`. Isso é esperado e não é um problema de
  segurança — é exatamente essa leitura que permite o site "lembrar" a escolha da
  pessoa.
