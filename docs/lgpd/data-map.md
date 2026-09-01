# Mapa de Dados Pessoais

> Levantamento feito lendo o código-fonte do projeto (frontend, `supabase/schema.sql`,
> `supabase/schema-lgpd.sql`) em setembro de 2026. Nada aqui foi presumido — cada linha
> corresponde a um campo, tabela ou script real encontrado na auditoria.
> Onde a informação não pode ser determinada só pelo código, está marcado
> **A DEFINIR PELO RESPONSÁVEL**.

## Como ler esta tabela

- **Origem**: onde o dado é digitado/gerado.
- **Onde é armazenado**: tabela no Supabase (Postgres) e/ou navegador (localStorage).
- **Quem acessa**: qual papel do sistema consegue ler o dado (controlado por Row Level
  Security — ver `supabase/schema.sql` e `supabase/schema-lgpd.sql`).

## Dados de proprietários (locação)

Tabela `proprietarios`. Cadastrados manualmente pelo corretor em `/admin/locacao-proprietarios.html`.

| Dado | Origem | Finalidade | Base legal possível | Onde é armazenado | Quem acessa | Compartilhado com terceiros | Retenção |
|---|---|---|---|---|---|---|---|
| Nome completo | Formulário admin | Identificar o proprietário no contrato | Execução de contrato | Supabase — tabela `proprietarios` | Corretor autenticado (RLS por `corretor_id`) | Não | A DEFINIR PELO RESPONSÁVEL |
| CPF/CNPJ | Formulário admin | Identificação fiscal do proprietário | Execução de contrato / obrigação legal | Supabase — `proprietarios.cpf_cnpj` | Corretor autenticado | Não | A DEFINIR PELO RESPONSÁVEL |
| Telefone | Formulário admin | Contato sobre o imóvel/repasses | Execução de contrato | Supabase — `proprietarios.telefone` | Corretor autenticado | Não | A DEFINIR PELO RESPONSÁVEL |
| E-mail | Formulário admin | Contato | Execução de contrato | Supabase — `proprietarios.email` | Corretor autenticado | Não | A DEFINIR PELO RESPONSÁVEL |
| Endereço | Formulário admin | Correspondência/identificação | Execução de contrato | Supabase — `proprietarios.endereco` | Corretor autenticado | Não | A DEFINIR PELO RESPONSÁVEL |
| Banco, agência, conta, chave Pix | Formulário admin | Repasse de valores de aluguel | Execução de contrato | Supabase — `proprietarios.{banco,agencia,conta,chave_pix}` | Corretor autenticado | Não (repasse feito manualmente pelo corretor) | A DEFINIR PELO RESPONSÁVEL |
| Observações | Formulário admin | Anotações internas do corretor | Legítimo interesse | Supabase — `proprietarios.observacoes` | Corretor autenticado | Não | A DEFINIR PELO RESPONSÁVEL |

## Dados de inquilinos (locação)

Tabela `inquilinos`. Cadastrados manualmente pelo corretor em `/admin/locacao-inquilinos.html`.

| Dado | Origem | Finalidade | Base legal possível | Onde é armazenado | Quem acessa | Compartilhado com terceiros | Retenção |
|---|---|---|---|---|---|---|---|
| Nome completo | Formulário admin | Identificar o inquilino no contrato | Execução de contrato | Supabase — tabela `inquilinos` | Corretor autenticado | Não | A DEFINIR PELO RESPONSÁVEL |
| CPF/CNPJ | Formulário admin | Identificação fiscal | Execução de contrato | Supabase — `inquilinos.cpf_cnpj` | Corretor autenticado | Não | A DEFINIR PELO RESPONSÁVEL |
| Telefone | Formulário admin | Contato (cobrança, avisos) | Execução de contrato | Supabase — `inquilinos.telefone` | Corretor autenticado | Não (usado para gerar link `wa.me`/`mailto` manualmente, não enviado a plataforma nenhuma) | A DEFINIR PELO RESPONSÁVEL |
| E-mail | Formulário admin | Contato, envio de recibos | Execução de contrato | Supabase — `inquilinos.email` | Corretor autenticado | Não | A DEFINIR PELO RESPONSÁVEL |
| Endereço atual | Formulário admin | Referência cadastral | Execução de contrato | Supabase — `inquilinos.endereco` | Corretor autenticado | Não | A DEFINIR PELO RESPONSÁVEL |
| Observações | Formulário admin | Anotações internas | Legítimo interesse | Supabase — `inquilinos.observacoes` | Corretor autenticado | Não | A DEFINIR PELO RESPONSÁVEL |

## Contratos e recibos de locação

Tabelas `contratos_locacao` e `recibos`. Não introduzem novos tipos de dado pessoal —
referenciam `proprietarios`/`inquilinos` por ID e guardam valores financeiros do
contrato (aluguel, referência do mês, data de pagamento, observações).

| Dado | Origem | Finalidade | Base legal possível | Onde é armazenado | Quem acessa | Compartilhado com terceiros | Retenção |
|---|---|---|---|---|---|---|---|
| Valor do aluguel / recibo | Formulário admin | Gestão financeira do contrato | Execução de contrato | Supabase — `contratos_locacao.valor_aluguel`, `recibos.valor` | Corretor autenticado | Não | A DEFINIR PELO RESPONSÁVEL |
| Recibo em PDF/impressão (`admin/recibo-view.html`) | Gerado a partir do recibo salvo | Comprovante de pagamento / aviso de pagamento (Pix) | Execução de contrato | Não persistido — gerado sob demanda no navegador do corretor | Corretor autenticado | Sim, se o corretor optar por compartilhar via WhatsApp/e-mail (ação manual do corretor, fora do banco de dados) | Não se aplica (não armazenado) |

## Corretor (usuário do painel)

Tabela `corretor_perfil` + autenticação nativa do Supabase (`auth.users`, fora do
schema do projeto, gerida pelo próprio Supabase).

| Dado | Origem | Finalidade | Base legal possível | Onde é armazenado | Quem acessa | Compartilhado com terceiros | Retenção |
|---|---|---|---|---|---|---|---|
| E-mail de login | Cadastro do corretor no Supabase Auth | Autenticação no painel | Execução de contrato / legítimo interesse | Supabase Auth (`auth.users`) | O próprio corretor; administradores do projeto Supabase | Supabase (processador) | A DEFINIR PELO RESPONSÁVEL |
| Senha (hash) | Cadastro do corretor no Supabase Auth | Autenticação | Execução de contrato | Supabase Auth, com hash — nunca em texto puro | Ninguém lê em texto puro (hash) | Supabase (processador) | Enquanto a conta existir |
| Nome, CRECI, telefone | `/admin/settings.html` | Exibidos publicamente no site (identificação profissional) | Legítimo interesse / cumprimento de obrigação profissional (CRECI) | Supabase — `corretor_perfil` | Público (leitura), corretor autenticado (escrita) | Não | Enquanto a conta existir |
| Foto de perfil | Upload em `/admin/settings.html` | Exibida publicamente no site | Legítimo interesse | Supabase Storage — bucket `avatares` (público) | Público (leitura), corretor autenticado (escrita) | Não | Enquanto a conta existir |

## Visitantes do site público (`index.html`, `imovel.html`)

| Dado | Origem | Finalidade | Base legal possível | Onde é armazenado | Quem acessa | Compartilhado com terceiros | Retenção |
|---|---|---|---|---|---|---|---|
| Preferência de tema (claro/escuro) | Botão de alternância de tema | Personalização da interface | Legítimo interesse (necessário) | `localStorage` do navegador do visitante (`ps-corretor-theme`) | Só o próprio navegador | Não | Até o visitante limpar os dados do navegador |
| Decisão de cookies | Banner de consentimento | Controlar quais categorias de cookies ficam ativas | Consentimento / legítimo interesse (necessário) | `localStorage` do navegador (`ps_consent_v1`) + tabela `consentimentos` (sem dados pessoais, ver abaixo) | Só o próprio navegador; corretor autenticado (log agregado) | Não | `localStorage`: até limpar o navegador. `consentimentos`: A DEFINIR PELO RESPONSÁVEL |
| Identificador aleatório do navegador (`visitor_id`) | Gerado automaticamente pelo `js/consent.js` | Permitir ao próprio visitante localizar seu histórico de consentimento | Legítimo interesse | `localStorage` (`ps_visitor_id`) + tabela `consentimentos.visitor_id` | Só o próprio navegador; corretor autenticado | Não | Mesma da decisão de cookies |
| **Não coletado hoje**: nome, e-mail, telefone de visitantes que só navegam pelo site (não existe formulário de captação de leads ativo — ver `docs/lgpd/README.md`) | — | — | — | — | — | — | — |

## Solicitações de titulares (Central de Privacidade)

Tabela `solicitacoes_titulares`, criada por este trabalho de adequação (ver
`supabase/schema-lgpd.sql`). Preenchida por qualquer pessoa em `/privacidade.html`.

| Dado | Origem | Finalidade | Base legal possível | Onde é armazenado | Quem acessa | Compartilhado com terceiros | Retenção |
|---|---|---|---|---|---|---|---|
| Nome, e-mail, telefone, CPF/CNPJ (opcional), mensagem | Formulário público `/privacidade.html` | Processar o pedido de direitos do titular (art. 18 LGPD) | Cumprimento de obrigação legal | Supabase — tabela `solicitacoes_titulares` | Corretor autenticado (nunca outros visitantes) | Não | A DEFINIR PELO RESPONSÁVEL — recomenda-se manter pelo menos o prazo de prescrição para provar que a solicitação foi atendida |
| Observações internas sobre a solicitação | Preenchido pelo corretor em `/admin/privacidade-solicitacoes.html` | Controle interno do atendimento | Cumprimento de obrigação legal | Supabase — `solicitacoes_titulares.observacoes_internas` | Só o corretor (nunca exposto ao titular) | Não | Mesma da linha acima |

## Cookies/armazenamento local — visão consolidada

Ver detalhamento técnico completo em [`cookies.md`](./cookies.md).

## Terceiros que recebem dados

Ver inventário completo em [`third-parties.md`](./third-parties.md).
