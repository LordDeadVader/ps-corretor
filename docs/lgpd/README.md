# Adequação à LGPD — PS Corretor de Imóveis

Este diretório documenta a auditoria e a implementação de conformidade com a Lei Geral
de Proteção de Dados (Lei nº 13.709/2018) feitas neste projeto em setembro de 2026.

**Metodologia**: tudo aqui parte de uma leitura real do código-fonte (frontend, schema
do banco, scripts, formulários) — nada foi presumido. Onde uma informação depende de
decisão jurídica/empresarial do responsável (razão social, CNPJ, DPO, prazos de
retenção, etc.), ela está marcada como `[PLACEHOLDER]` ou **A DEFINIR PELO RESPONSÁVEL**
em vez de inventada.

## Índice desta pasta

| Documento | Conteúdo |
|---|---|
| [`data-map.md`](./data-map.md) | Tabela completa de todo dado pessoal encontrado: origem, finalidade, base legal, onde fica armazenado, quem acessa, retenção |
| [`third-parties.md`](./third-parties.md) | Inventário de serviços de terceiros que recebem dados (spoiler: só Supabase, jsDelivr e Google Fonts) |
| [`cookies.md`](./cookies.md) | Detalhamento técnico de cada item salvo no navegador (localStorage) |
| [`consent-management.md`](./consent-management.md) | Como o banner de cookies e o registro de consentimento funcionam por dentro |
| [`data-subject-rights.md`](./data-subject-rights.md) | Como o fluxo de direitos dos titulares (art. 18 LGPD) funciona, do formulário público à gestão no painel |
| [`security.md`](./security.md) | Revisão de segurança: o que já estava correto, o que foi corrigido, o que fica pendente de decisão |
| [`retention.md`](./retention.md) | Por que os prazos de retenção não estão definidos ainda, e o que já existe para dar suporte a uma política futura |

## O que foi implementado (funciona de verdade, não é só visual)

- **Banner de cookies** (`js/consent.js`) em todas as páginas públicas, com 4
  categorias (Necessários / Preferências / Analytics / Marketing), opções de
  "Aceitar todos", "Recusar não essenciais" e "Personalizar".
- **Bloqueio real de scripts não essenciais**: scripts marcados com
  `type="text/plain" data-consent-category="..."` só são executados depois da
  autorização correspondente — testado manualmente disparando um script de exemplo e
  confirmando que ele só roda após o consentimento (ver `consent-management.md`).
- **Registro de consentimento** na tabela `consentimentos`, sem nenhum dado pessoal —
  só um UUID aleatório do navegador, as categorias aceitas e a versão da política.
- **Central de Privacidade** pública em `/privacidade.html`: Política de Privacidade
  completa, Política de Cookies, botão para gerenciar preferências, e formulário para
  exercer qualquer um dos direitos do art. 18 da LGPD.
- **Backend para solicitações de titulares**: tabela `solicitacoes_titulares` +
  painel de gestão em `/admin/privacidade-solicitacoes.html`, com status
  (recebida/em andamento/concluída/recusada), estatísticas e campo de observações
  internas (nunca exposto ao titular).
- **Row Level Security** confirmada em todas as tabelas com dado pessoal, escopada
  por corretor (auditoria, não criação — já existia).
- **Correção e exclusão de dados de proprietários/inquilinos**: já existiam no painel
  antes desta rodada (não foram recriadas) — documentado em `data-subject-rights.md`.
- **Correção de bug de segurança/funcional real**: o registro de consentimento no
  Supabase estava silenciosamente falhando por checar `window.supabaseClient` em vez
  do identificador correto (`supabaseClient` é `const`, não vira propriedade de
  `window`) — corrigido e validado. Ver `security.md`.

## O que foi encontrado na auditoria (resumo)

- **Dados pessoais existem principalmente no painel administrativo**: nomes, CPF/CNPJ,
  telefone, e-mail e endereço de proprietários e inquilinos de locação, cadastrados
  manualmente pelo corretor — não pelos próprios titulares através de um formulário
  web. Proprietários também têm dados bancários (para repasse de aluguel).
- **O site público não tem formulário de captação de leads hoje** (nome/e-mail/
  telefone de visitantes) — o contato acontece por WhatsApp/telefone/e-mail, fora do
  site. Se isso mudar no futuro, o novo formulário deve seguir o mesmo padrão de
  minimização e consentimento já estabelecido aqui.
- **Nenhuma ferramenta de analytics, pixel ou marketing** está integrada — ver
  `third-parties.md` para a lista completa (e vazia) do que foi procurado e não
  encontrado.
- **Terceiros que recebem dados**: só Supabase (banco de dados/autenticação/storage,
  necessário ao funcionamento) e, indiretamente, jsDelivr (biblioteca) e Google Fonts
  (tipografia) — nenhum deles recebe dados pessoais além do necessário para entregar
  o próprio recurso técnico.

## O que precisa ser configurado pelo responsável

Estas são as ações que **exigem uma pessoa**, não código — a tabela completa com
todos os placeholders está em `privacidade.html` e nos documentos desta pasta:

1. **Rodar o script `supabase/schema-lgpd.sql`** no SQL Editor do Supabase (Dashboard →
   SQL Editor → New query → colar o conteúdo → Run). Sem isso, o banner de cookies e o
   formulário de solicitações continuam funcionando localmente no navegador, mas o
   registro de auditoria e o recebimento de solicitações não terão onde salvar.
2. Preencher em `privacidade.html`: CNPJ/razão social (se houver), nome do encarregado
   (DPO) e um e-mail dedicado de privacidade, se o responsável quiser um diferente do
   e-mail de contato geral já usado (`contato@paulosouzaimoveis.com.br`).
3. Confirmar a região do servidor Supabase (para a seção de transferência
   internacional da política) — painel do Supabase → Settings → General.
4. Definir prazos de retenção de dados (ver `retention.md`) e, se desejado, uma
   rotina de limpeza/anonimização.
5. Validar juridicamente as bases legais sugeridas em cada tabela deste diretório —
   elas refletem a finalidade técnica identificada em código, não um parecer jurídico.
6. Decidir sobre o self-host das fontes do Google (recomendação de minimização de
   dados, não obrigatória — ver `third-parties.md`).

## O que ainda depende de decisão empresarial/jurídica (não implementável só em código)

- Designação formal de um encarregado (DPO), se aplicável ao porte do negócio;
- Prazos específicos de retenção e o que fazer com dados de contratos encerrados;
- Se/quando um formulário de captação de leads for criado no site público, decidir
  quais campos são realmente necessários (minimização) antes de implementar;
- Política de resposta a incidentes de segurança (quem comunica a ANPD e os titulares,
  em que prazo) — nenhum incidente foi identificado nesta auditoria, e o projeto não
  tinha, e continua sem, um processo formal de resposta a incidentes documentado.

## Fluxos, em uma frase cada

- **Consentimento**: banner → escolha → salva local + Supabase → controla quais
  scripts rodam → pode ser revisto a qualquer momento no rodapé ou em `/privacidade.html`.
- **Cookies**: hoje só armazenamento técnico necessário (tema, decisão de cookies,
  sessão do corretor) — zero rastreamento de terceiros.
- **Direitos dos titulares**: formulário público → tabela no banco → painel do
  corretor → resposta manual por e-mail/telefone/WhatsApp, fora do sistema.
