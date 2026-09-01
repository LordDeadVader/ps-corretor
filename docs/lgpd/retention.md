# Retenção e Exclusão de Dados

## Por que os prazos não vêm preenchidos

A LGPD não define um prazo único de retenção — ele depende da finalidade de cada
dado e de obrigações legais específicas do negócio (ex.: prazos fiscais para
documentos financeiros, prazos de prescrição civil para contratos de locação, etc.).
Definir esses prazos é uma decisão jurídica/empresarial do responsável pelo
tratamento, não algo que possa ser inferido do código-fonte. Por isso, todos os
prazos neste projeto estão marcados como **A DEFINIR PELO RESPONSÁVEL** — ver
[`data-map.md`](./data-map.md).

## O que já existe tecnicamente para dar suporte a uma política de retenção

- Todas as tabelas relevantes (`proprietarios`, `inquilinos`, `contratos_locacao`,
  `recibos`, `consentimentos`, `solicitacoes_titulares`) têm coluna `created_at`,
  permitindo filtrar registros por idade a qualquer momento.
- Exclusão e edição de `proprietarios`/`inquilinos` já são possíveis pelo painel
  (`admin/locacao-proprietarios.html`, `admin/locacao-inquilinos.html`).
- A exclusão é bloqueada automaticamente pelo banco quando há um contrato vinculado
  (`on delete restrict`), evitando apagar dados que ainda sustentam um contrato ativo
  ou seu histórico financeiro — nesse caso, a alternativa é encerrar o contrato antes
  ou considerar anonimização.

## Anonimização como alternativa à exclusão

Quando a exclusão completa não for adequada (ex.: histórico financeiro precisa ser
preservado por obrigação fiscal, mas o titular pediu que os dados dele parem de ser
identificáveis), a anonimização é feita substituindo os campos identificadores por
valores genéricos. Exemplo de consulta que o responsável pode rodar manualmente no
SQL Editor do Supabase, **depois de definir os prazos/critérios** (não rode isso sem
adaptar aos dados reais e confirmar antes):

```sql
-- Exemplo de anonimização de um inquilino específico (ajuste o id antes de rodar)
update inquilinos
set nome = 'Titular anonimizado',
    cpf_cnpj = null,
    telefone = null,
    email = null,
    endereco = null,
    observacoes = null
where id = '00000000-0000-0000-0000-000000000000';
```

```sql
-- Exemplo: listar proprietários/inquilinos sem nenhum contrato há mais de X anos
-- (defina X conforme a política de retenção que for adotada)
select p.id, p.nome, p.created_at
from proprietarios p
where not exists (
  select 1 from contratos_locacao c where c.proprietario_id = p.id
)
and p.created_at < now() - interval '5 years'; -- ajustar o prazo
```

## Logs

O projeto não mantém um sistema de logs de aplicação próprio (não há `console.log` de
dados pessoais em nenhum arquivo — verificado na auditoria de segurança, ver
[`security.md`](./security.md)). Os únicos "logs" com dado pessoal são:

- **Tabela `consentimentos`**: não tem dado pessoal (ver `cookies.md`), então não
  precisa de rotina de expurgo por esse motivo — mas pode ser limpa periodicamente
  por volume, se o responsável preferir.
- **Tabela `solicitacoes_titulares`**: tem dado pessoal (nome, e-mail, etc.) e
  representa, ela mesma, o comprovante de que um pedido de titular foi atendido —
  recomenda-se manter por um prazo mínimo suficiente para eventual defesa em processo
  administrativo/judicial, a definir com orientação jurídica.
- **Logs de infraestrutura do Supabase** (acesso, erros de API): geridos pelo próprio
  Supabase, fora do controle deste código — ver política de retenção de logs do
  Supabase no painel do projeto.

## Retenção de backups

Ver [`security.md`](./security.md) — depende da configuração do plano Supabase
contratado, **A VALIDAR PELO RESPONSÁVEL**.

## Próximo passo recomendado

Quando o responsável definir os prazos de retenção, o formato sugerido para
documentá-los é atualizar a coluna "Retenção" de cada linha em
[`data-map.md`](./data-map.md), e — se desejado — automatizar a limpeza/anonimização
com uma rotina agendada (ex.: Supabase Edge Function com `pg_cron`, ou um script
manual rodado periodicamente pelo responsável). Nenhuma exclusão automática foi
implementada nesta entrega, propositalmente: excluir dados reais de clientes de forma
automática, sem prazos definidos e sem confirmação humana, seria um risco maior do que
não ter automação nenhuma ainda.
