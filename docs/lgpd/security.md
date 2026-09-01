# Revisão de Segurança

Revisão feita lendo todo o código-fonte, `supabase/schema.sql`, `.gitignore` e o
histórico de commits, em setembro de 2026. Cada item abaixo reflete o que foi
efetivamente encontrado — não é uma checklist genérica.

## O que já estava correto

| Item | Situação encontrada |
|---|---|
| HTTPS | Site publicado no GitHub Pages, que serve tudo em HTTPS por padrão. |
| Senhas | Autenticação delegada ao Supabase Auth — nenhuma senha é manipulada ou armazenada pelo código deste projeto; o Supabase guarda o hash, nunca texto puro. |
| Segredos no repositório | Nenhum arquivo `.env`, chave privada ou "service role key" encontrado no código ou no histórico. A única chave presente (`js/supabase-config.js`) é a *publishable key*, que é pública por design — a segurança real vem das políticas de RLS no banco, não do sigilo dela. |
| `.gitignore` | Já exclui `informações do cliente/`, uma pasta local com dados reais de clientes que o corretor mantém fora do controle de versão. |
| Controle de acesso (RLS) | Todas as tabelas com dados pessoais (`proprietarios`, `inquilinos`, `contratos_locacao`, `recibos`) têm Row Level Security habilitado, restringindo leitura/escrita ao `corretor_id = auth.uid()`. Testado na leitura do schema, não apenas presumido pelo nome das políticas. |
| XSS | Toda renderização dinâmica de dados do banco no HTML passa por uma função `escapeHtml()` (repetida em cada arquivo JS que renderiza listas/tabelas), escapando `& < > " '`. Não foi encontrado nenhum ponto usando `innerHTML` com dado de usuário sem escapar. |
| `target="_blank"` | Todos os links externos (`wa.me`, redes sociais) usam `rel="noopener"`, prevenindo que a página aberta manipule a página de origem via `window.opener`. |
| SQL Injection | Não se aplica da forma clássica — todo acesso a dados usa o cliente `supabase-js` (`.from().select()/.insert()/.update()`), que monta as consultas de forma parametrizada internamente. Não há SQL concatenado a partir de entrada do usuário em lugar nenhum do código. |
| Exclusão com integridade referencial | Excluir um proprietário/inquilino com contrato vinculado é bloqueado pelo banco (chave estrangeira `on delete restrict`), com mensagem clara ao corretor — evita perda acidental de dados ligados a um contrato ativo. |

## Correções feitas durante esta auditoria

| Item | Problema encontrado | Correção |
|---|---|---|
| `js/consent.js` — registro de auditoria | O código checava `window.supabaseClient`, mas `supabaseClient` é declarado com `const` no topo de `js/supabase-config.js` — e `const`/`let` de nível superior **não** viram propriedade de `window` em JavaScript. Resultado: o registro de consentimento no Supabase nunca era de fato enviado (falhava silenciosamente). | Corrigido para checar o identificador solto (`typeof supabaseClient`), com nova tentativa automática por alguns segundos caso o script do Supabase ainda não tenha carregado no exato instante do clique. Validado manualmente interceptando a chamada e confirmando que o `insert` é disparado com o payload correto. |
| `.share-menu[hidden]` / `#shareBtn[hidden]` (`admin/recibo-view.html`) | Regras de CSS de autor (`.btn{display:inline-flex}`, `.share-menu{display:flex}`) tinham prioridade sobre a regra padrão do navegador para `[hidden]`, deixando o menu de compartilhar sempre visível. *(Correção já registrada no histórico do projeto antes desta auditoria de LGPD; citada aqui por ser, tecnicamente, o mesmo tipo de falha de "cascata de CSS vencendo `[hidden]`" verificado de novo nos elementos novos desta entrega — nenhum elemento novo criado para a LGPD apresentou esse problema, foi checado especificamente.)* | — |

## Pontos identificados sem correção automática (exigem decisão do responsável)

| Item | Risco | Recomendação |
|---|---|---|
| Sem "esqueci minha senha" no login do corretor | Baixo (afeta só o próprio corretor, não titulares de dados) | Configurar o fluxo de recuperação de senha do Supabase Auth (exige configurar o template de e-mail no painel do Supabase) e adicionar o link em `admin/login.html`. |
| Sem rate limiting no formulário público de solicitação (`solicitacoes_titulares`) e no registro de consentimento (`consentimentos`) | Baixo/médio — ambos aceitam `insert` de qualquer visitante anônimo (`anon`), então em teoria alguém poderia enviar um grande volume de registros | O Supabase tem proteções de infraestrutura próprias contra abuso, mas um limite específico da aplicação (ex.: captcha, ou uma Edge Function com rate limit) é uma camada extra recomendada caso o volume de spam se torne um problema real. Não implementado por exigir infraestrutura de servidor (Edge Function) fora do escopo puramente frontend deste projeto. |
| Mensagens de erro do Supabase exibidas diretamente ao usuário (ex.: `"Erro ao salvar: " + error.message`) | Baixo — as mensagens do PostgREST/Supabase são tipicamente genéricas (nome de constraint violada, etc.), não vazam stack traces nem segredos | Nenhuma ação necessária hoje; se o time notar mensagens técnicas demais aparecendo para o usuário final, trocar por uma mensagem genérica + log interno. |
| Cabeçalhos HTTP de segurança (CSP, `X-Frame-Options`, `Strict-Transport-Security`, etc.) | Baixo/médio | O GitHub Pages não permite configurar cabeçalhos HTTP customizados — isso exigiria migrar a hospedagem para um serviço que suporte isso (ex.: Cloudflare Pages, Netlify, Vercel) caso o responsável queira endurecer esse ponto. Marcado como **A DEFINIR PELO RESPONSÁVEL**, pois é uma decisão de infraestrutura/hospedagem, não de código. |
| Transferência internacional de dados (região do servidor Supabase) | A validar | Ver [`third-parties.md`](./third-parties.md) — precisa ser confirmado no painel do Supabase. |

## CORS e CSRF

- **CORS**: o Supabase controla CORS do lado da API; o frontend estático não precisa
  de configuração adicional. Não foi identificado nenhum endpoint próprio (backend
  customizado) que precisasse de política de CORS além da já gerenciada pelo Supabase.
- **CSRF**: a autenticação usa tokens JWT enviados via cabeçalho `Authorization`
  (padrão do `supabase-js`), não cookies de sessão — isso naturalmente já reduz bastante
  o risco clássico de CSRF (que depende de o navegador enviar cookies automaticamente
  entre origens). Nenhuma ação adicional identificada como necessária.

## Backups

Backups do banco de dados são gerenciados pelo próprio Supabase (frequência e retenção
dependem do plano contratado no painel do projeto) — **A VALIDAR PELO RESPONSÁVEL**,
pois não é algo visível/configurável pelo código deste repositório.
