# Cookies e Armazenamento Local

O site não usa cookies HTTP tradicionais (`Set-Cookie`) — usa `localStorage`, que a
LGPD e o guia da ANPD tratam da mesma forma que cookies para fins de transparência e
consentimento (é uma tecnologia de armazenamento no navegador do usuário).

## Itens realmente encontrados no código

| Chave | Onde é definida | Categoria | O que guarda | Dado pessoal? | Expira |
|---|---|---|---|---|---|
| `ps-corretor-theme` | `js/theme.js` | Necessário | `"light"` ou `"dark"` — preferência de tema | Não | Só quando o navegador limpa os dados do site |
| `ps_consent_v1` | `js/consent.js` | Necessário | Categorias de cookies aceitas + versão da política + timestamp | Não (nenhum identificador pessoal) | Reaplicado sempre que a versão da política muda (`POLICY_VERSION` em `js/consent.js`) |
| `ps_visitor_id` | `js/consent.js` | Necessário | UUID aleatório gerado no navegador | Não é um dado pessoal por si só (não identifica a pessoa, só o navegador) | Até limpar os dados do site |
| `sb-<projeto>-auth-token` (nome exato definido pela biblioteca `@supabase/supabase-js`) | Automático, ao fazer login em `/admin/login.html` | Necessário (só existe para o corretor autenticado, nunca para visitantes do site público) | Sessão de autenticação (JWT) do corretor | Sim, tecnicamente ligado à conta do corretor — mas é o próprio corretor usando o próprio painel, não um visitante rastreado | Conforme expiração da sessão configurada no Supabase Auth |

Nenhum desses itens é lido por terceiros — todos ficam só no navegador da pessoa,
exceto o registro agregado e anônimo da decisão de cookies, explicado abaixo.

## Categorias oferecidas no banner (`js/consent.js`)

| Categoria | Trava sempre ativa? | O que controla hoje | O que controlaria no futuro |
|---|---|---|---|
| **Necessários** | Sim | Tema, decisão de cookies, sessão de login do corretor, Supabase (funcionamento do site) | — |
| **Preferências** | Não | Nada além do tema hoje | Outras preferências de UI que venham a existir |
| **Analytics** | Não | Nada — nenhuma ferramenta de analytics está integrada | Uma futura ferramenta de estatísticas de uso só carregaria se esta categoria for aceita |
| **Marketing** | Não | Nada — nenhuma ferramenta de marketing está integrada | Um futuro pixel/remarketing só carregaria se esta categoria for aceita |

## Como o bloqueio funciona de verdade

Scripts não essenciais devem ser marcados no HTML como:

```html
<script type="text/plain" data-consent-category="analytics" data-consent-src="https://exemplo.com/analytics.js"></script>
```

Enquanto a categoria correspondente não for aceita, o navegador **não executa** esse
script (`type="text/plain"` faz o navegador ignorá-lo). Assim que a pessoa aceita a
categoria — pelo banner, pelo modal de preferências, ou pela Central de Privacidade —
`js/consent.js` troca o `type` para um script real e o executa. Isso foi testado
manualmente durante esta implementação: um script de exemplo só rodou depois que a
categoria "analytics" foi marcada e salva (ver `docs/lgpd/consent-management.md` para
o passo a passo de como testar isso de novo).

Hoje, **nenhum script real usa esse mecanismo** porque não existe nenhuma ferramenta de
analytics/marketing no projeto (ver [`third-parties.md`](./third-parties.md)) — a
estrutura já está pronta para quando/se isso mudar.

## Registro de consentimento (auditoria)

Cada decisão (aceitar tudo, recusar não essenciais, ou salvar preferências
personalizadas) é registrada na tabela `consentimentos` do Supabase — ver
[`consent-management.md`](./consent-management.md) para o detalhamento completo desse
registro (o que é salvo e, principalmente, o que **não** é salvo).

## Onde a pessoa muda a decisão depois

- Botão "Preferências de cookies" no rodapé de todas as páginas públicas;
- Botão "Gerenciar preferências de cookies" em `/privacidade.html#cookies`;
- Programaticamente: `window.PSConsent.openPreferences()`.
