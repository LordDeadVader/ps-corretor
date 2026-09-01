# Inventário de Terceiros

> Levantado varrendo todo o código-fonte por `<script src="http...">`, `<link href="http...">`
> e chamadas de rede em JS, em setembro de 2026. Estes são **todos** os serviços de
> terceiros efetivamente carregados pelo projeto hoje — nenhuma integração de
> analytics, pixel ou marketing foi encontrada.

| Serviço | Finalidade | Dados enviados | Base legal possível | Localização | Transferência internacional | Observações |
|---|---|---|---|---|---|---|
| **Supabase** (`zbnnwriwfnvcmsduxtti.supabase.co`) | Banco de dados, autenticação e armazenamento de arquivos (fotos) da aplicação — é a infraestrutura que faz o sistema funcionar | Todos os dados pessoais listados em [`data-map.md`](./data-map.md) — proprietários, inquilinos, corretor, solicitações de titulares, registros de consentimento | Execução de contrato (é o processador/operador contratado para rodar o sistema) | A VALIDAR — a região do servidor do projeto Supabase é definida no painel do Supabase, não no código-fonte | A VALIDAR PELO RESPONSÁVEL (depende da região escolhida no projeto Supabase) | Acesso protegido por Row Level Security (RLS) — ver `supabase/schema.sql` e `supabase/schema-lgpd.sql`. A chave usada no frontend é a "publishable key" (pública por design); a segurança real vem das políticas de RLS, não do sigilo da chave. |
| **jsDelivr CDN** (`cdn.jsdelivr.net`) | Entrega a biblioteca `@supabase/supabase-js`, necessária para o site conversar com o Supabase | Nenhum dado pessoal — só a requisição HTTP em si (que naturalmente expõe o IP do visitante ao jsDelivr, como em qualquer requisição de rede) | Legítimo interesse (funcionamento técnico do site) | Rede de entrega de conteúdo global (CDN) — sem servidor fixo | A VALIDAR PELO RESPONSÁVEL | Script "necessário" — sem ele, nenhuma página que usa Supabase funciona (login, listagem de imóveis, envio de solicitações). Não seria correto oferecer para "recusar" esse script sem quebrar o site. |
| **Google Fonts** (`fonts.googleapis.com`, `fonts.gstatic.com`) | Carrega a fonte "Inter" usada em todo o site | Nenhum dado pessoal enviado deliberadamente — mas a requisição ao servidor do Google naturalmente inclui o IP do visitante, como em qualquer carregamento de recurso externo | Legítimo interesse (design/tipografia do site) | Google — infraestrutura global | A VALIDAR PELO RESPONSÁVEL. Recomendação técnica: hospedar as fontes localmente (self-host) elimina essa chamada externa por completo — ver "Recomendações" abaixo. | Não define cookies de rastreamento próprios; é puramente entrega de arquivo de fonte. |
| **api.qrserver.com** | ~~Usado anteriormente para gerar o QR Code Pix dinâmico do recibo~~ | — | — | — | — | **Removido.** O recibo (`admin/recibo-view.html`) hoje usa uma imagem de QR Code fixa, salva localmente em `assets/pix-qrcode.png` — nenhuma chamada a este serviço acontece mais. Mantido aqui só para registro histórico da auditoria. |

## O que **não** foi encontrado

Para deixar claro o que foi checado e não existe hoje no projeto:

- Nenhum Google Analytics, GA4, Google Tag Manager;
- Nenhum Meta Pixel / Facebook Pixel;
- Nenhum Hotjar, Microsoft Clarity, Mixpanel, Segment ou similar;
- Nenhum CRM externo (RD Station, HubSpot, Pipedrive, etc.);
- Nenhum serviço de e-mail transacional (SendGrid, Mailgun, etc.) — os e-mails do
  corretor (contato, recibos) são enviados manualmente pelo próprio app de e-mail do
  usuário via link `mailto:`, não pelo servidor;
- Nenhum gateway de pagamento (Stripe, Mercado Pago, PagSeguro, etc.) — os recibos
  usam Pix direto (chave/QR Code estáticos), sem processador de pagamento envolvido;
- Nenhuma rede social conectada via SDK (os ícones de Instagram/Facebook/LinkedIn no
  rodapé do site são links simples `<a href="#">`, ainda não apontam para perfis reais
  nem carregam nenhum script dessas plataformas).

## Recomendações (não implementadas — dependem de decisão do responsável)

1. **Self-host das fontes** (Inter): eliminaria a chamada a `fonts.googleapis.com`,
   reduzindo a superfície de terceiros a apenas Supabase + jsDelivr (ambos necessários
   ao funcionamento). Não implementado nesta rodada por não ser estritamente exigido
   pela LGPD — é uma melhoria de minimização de dados.
2. Antes de adicionar qualquer ferramenta de analytics/marketing no futuro, cadastrá-la
   nesta tabela e conectá-la ao sistema de consentimento (`js/consent.js`) usando o
   padrão `<script type="text/plain" data-consent-category="analytics" data-consent-src="...">`
   documentado em [`consent-management.md`](./consent-management.md) — assim ela só
   carrega depois da autorização correspondente.
3. Confirmar com o Supabase (painel do projeto → Settings → General) a região física
   do banco de dados, para preencher corretamente a coluna "Transferência internacional"
   acima e refletir isso na Política de Privacidade (`privacidade.html`).
