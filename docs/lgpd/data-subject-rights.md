# Direitos dos Titulares

Implementação: formulário público em `privacidade.html#solicitar`, tabela
`solicitacoes_titulares` (`supabase/schema-lgpd.sql`), e painel de gestão em
`admin/privacidade-solicitacoes.html`.

## Fluxo completo

```
Titular preenche o formulário          Corretor gerencia no painel
em /privacidade.html#solicitar    ─►    /admin/privacidade-solicitacoes.html
        │                                        │
        ▼                                        ▼
  INSERT em solicitacoes_titulares      Corretor abre o pedido, lê a
  (qualquer pessoa pode inserir,        mensagem, muda o status e anota
  ninguém além do corretor pode         observações internas (nunca
  ler/editar — RLS)                     visíveis ao titular)
                                                  │
                                                  ▼
                                     Corretor responde ao titular por
                                     e-mail/telefone/WhatsApp — FORA do
                                     sistema, usando o contato informado
                                     no próprio pedido
```

O titular **não** tem login no sistema — ele não acompanha o status pelo site. O
retorno é sempre feito diretamente pelo corretor, pelo canal que a pessoa informou no
formulário (e-mail obrigatório, telefone opcional).

## Tipos de solicitação suportados

O campo `tipo` da tabela aceita os valores abaixo, todos com base no rol do art. 18
da LGPD:

| Valor | Direito |
|---|---|
| `confirmacao_tratamento` | Confirmação da existência de tratamento |
| `acesso` | Acesso aos dados |
| `correcao` | Correção de dados incompletos, inexatos ou desatualizados |
| `anonimizacao` | Anonimização |
| `bloqueio` | Bloqueio |
| `eliminacao` | Eliminação / exclusão |
| `portabilidade` | Portabilidade a outro fornecedor de serviço |
| `informacao_compartilhamento` | Informação sobre com quem os dados foram compartilhados |
| `revogacao_consentimento` | Revogação de consentimento |
| `oposicao` | Oposição a tratamento baseado em legítimo interesse |
| `revisao_decisao_automatizada` | Revisão de decisão automatizada (reservado — o sistema não toma decisões automatizadas sobre pessoas hoje) |
| `outro` | Qualquer outro assunto de privacidade |

## Ciclo de vida de uma solicitação

Coluna `status`, com transições livres (o corretor decide manualmente):

`recebida` → `em_andamento` → `concluida` **ou** `recusada`

Ao marcar como `concluida` ou `recusada`, o campo `respondido_em` é preenchido
automaticamente pelo painel (`js/privacidade-solicitacoes.js`) com a data/hora atual.
Isso serve como evidência de quando o pedido foi atendido.

## Prazo de resposta

O texto do formulário público informa **até 15 dias**, alinhado ao prazo do art. 19 da
LGPD para confirmação da existência de tratamento (o prazo específico para cada tipo
de solicitação pode variar — ver orientação jurídica do responsável). O sistema não
força esse prazo automaticamente (não há um lembrete/alerta de atraso); isso é uma
melhoria possível para o futuro, marcada em [`README.md`](./README.md).

## Ações que já existem fora deste fluxo

Algumas ações da LGPD já eram tecnicamente possíveis antes desta implementação, pelo
CRUD que já existia no painel — não foram recriadas, só documentadas aqui:

- **Correção e exclusão dos dados de proprietários/inquilinos**: o corretor já podia
  editar e excluir esses registros diretamente em `admin/locacao-proprietarios.html`
  e `admin/locacao-inquilinos.html` (botões "Editar"/"Excluir" em cada linha da
  tabela). A exclusão é bloqueada pelo próprio banco quando há um contrato vinculado
  (chave estrangeira), com uma mensagem clara para o corretor — isso evita apagar um
  proprietário/inquilino que ainda tem histórico financeiro ativo. Se o titular pedir
  exclusão de um cadastro com contrato ativo, a orientação é encerrar o contrato
  primeiro ou avaliar anonimização em vez de exclusão física.

## O que fica de fora desta implementação (depende de decisão/infraestrutura)

- **Exclusão da conta do próprio corretor** (login do painel): não é possível de forma
  segura só com o frontend, porque apagar uma conta do Supabase Auth exige a
  "service role key" (chave de administrador), que **nunca deve** ficar exposta no
  código do navegador. Um pedido de exclusão de conta do corretor deve ser tratado
  manualmente pelo próprio responsável no painel do Supabase (Authentication → Users),
  ou automatizado futuramente por uma Supabase Edge Function com a service role key
  guardada como *secret* do lado do servidor — infraestrutura que não foi criada aqui
  por não haver acesso de deploy a Edge Functions neste projeto.
- **Portabilidade automatizada** (exportar os dados em um arquivo): hoje seria um
  processo manual do corretor (consultar as tabelas no Supabase). Um botão de
  exportação automática é uma melhoria futura possível.
