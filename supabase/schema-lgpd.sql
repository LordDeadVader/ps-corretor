-- PS Corretor de Imóveis — Estrutura de conformidade com a LGPD
-- Rode este script no Supabase: Dashboard → SQL Editor → New query → Run.
-- Pode rodar novamente sem problemas (idempotente). Depende de supabase/schema.sql
-- já ter sido executado antes (usa a extensão pgcrypto e o padrão de RLS de lá).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Registro de consentimentos (banner de cookies do site público)
--
-- Minimização de dados: NÃO guardamos nome, e-mail, IP ou qualquer dado
-- que identifique a pessoa. O "visitor_id" é um UUID aleatório gerado no
-- navegador e salvo em localStorage — serve só para o próprio visitante
-- comprovar/consultar a preferência dele depois, não para rastreá-lo.
-- ---------------------------------------------------------------------
create table if not exists consentimentos (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  categorias jsonb not null,              -- ex.: {"necessarios":true,"preferencias":true,"analytics":false,"marketing":false}
  versao_politica text not null,          -- versão da Política de Privacidade/Cookies aceita (POLICY_VERSION em js/consent.js)
  origem text,                            -- página onde o consentimento foi dado (ex.: "/index.html")
  user_agent text,                        -- útil para auditoria/depuração, não identifica a pessoa sozinho
  created_at timestamptz not null default now()
);

create index if not exists consentimentos_visitor_id_idx on consentimentos (visitor_id);

alter table consentimentos enable row level security;

-- Qualquer visitante (anônimo) pode registrar o próprio consentimento e
-- consultar o histórico do seu próprio visitor_id — nunca o de terceiros.
drop policy if exists "visitante registra proprio consentimento" on consentimentos;
create policy "visitante registra proprio consentimento" on consentimentos
  for insert to anon, authenticated with check (true);

drop policy if exists "visitante ve proprio consentimento" on consentimentos;
create policy "visitante ve proprio consentimento" on consentimentos
  for select to anon, authenticated using (true);
-- Nota: como o visitor_id não é um segredo (fica salvo em localStorage,
-- legível pelo próprio navegador), permitir SELECT geral aqui não expõe
-- dados pessoais de outra pessoa — só os UUIDs e categorias marcadas.
-- Se quiser restringir mais, troque para exigir o visitor_id como
-- parâmetro de uma função (rpc) ao invés de SELECT direto na tabela.

grant select, insert on consentimentos to anon, authenticated;

-- ---------------------------------------------------------------------
-- Solicitações de titulares de dados (Art. 18 da LGPD)
-- Formulário público em /privacidade.html envia para cá; o corretor
-- gerencia em /admin/privacidade-solicitacoes.html.
-- ---------------------------------------------------------------------
create table if not exists solicitacoes_titulares (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in (
    'confirmacao_tratamento', 'acesso', 'correcao', 'anonimizacao',
    'bloqueio', 'eliminacao', 'portabilidade', 'informacao_compartilhamento',
    'revogacao_consentimento', 'oposicao', 'revisao_decisao_automatizada', 'outro'
  )),
  nome text not null,
  email text not null,
  telefone text,
  cpf_cnpj text,                          -- opcional; só para ajudar a localizar o registro do titular (proprietário/inquilino)
  papel text,                             -- como a pessoa se relaciona com o corretor: proprietario / inquilino / visitante / outro
  mensagem text not null,
  status text not null default 'recebida' check (status in ('recebida', 'em_andamento', 'concluida', 'recusada')),
  observacoes_internas text,              -- uso exclusivo do corretor, nunca exposto ao titular
  respondido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists solicitacoes_titulares_status_idx on solicitacoes_titulares (status);

alter table solicitacoes_titulares enable row level security;

-- Qualquer pessoa pode CRIAR uma solicitação (é assim que o direito é exercido),
-- mas só o corretor autenticado pode LER, ATUALIZAR ou EXCLUIR — a pessoa que
-- pediu não usa este canal para acompanhar o status; ela é contatada pelo
-- e-mail/telefone informados no próprio pedido.
drop policy if exists "qualquer pessoa cria solicitacao" on solicitacoes_titulares;
create policy "qualquer pessoa cria solicitacao" on solicitacoes_titulares
  for insert to anon, authenticated with check (true);

drop policy if exists "corretor autenticado gerencia solicitacoes" on solicitacoes_titulares;
create policy "corretor autenticado gerencia solicitacoes" on solicitacoes_titulares
  for select using (auth.role() = 'authenticated');

drop policy if exists "corretor autenticado atualiza solicitacoes" on solicitacoes_titulares;
create policy "corretor autenticado atualiza solicitacoes" on solicitacoes_titulares
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "corretor autenticado exclui solicitacoes" on solicitacoes_titulares;
create policy "corretor autenticado exclui solicitacoes" on solicitacoes_titulares
  for delete using (auth.role() = 'authenticated');

grant insert on solicitacoes_titulares to anon, authenticated;
grant select, update, delete on solicitacoes_titulares to authenticated;

-- Atualiza updated_at automaticamente a cada mudança de status/observações.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists solicitacoes_titulares_set_updated_at on solicitacoes_titulares;
create trigger solicitacoes_titulares_set_updated_at
  before update on solicitacoes_titulares
  for each row execute function set_updated_at();
