-- PS Corretor de Imóveis — Módulo de Locação
-- Rode este script no Supabase: Dashboard → SQL Editor → New query → Run.
-- Pode rodar novamente sem problemas (idempotente).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Proprietários
-- ---------------------------------------------------------------------
create table if not exists proprietarios (
  id uuid primary key default gen_random_uuid(),
  corretor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  cpf_cnpj text,
  telefone text,
  email text,
  endereco text,
  banco text,
  agencia text,
  conta text,
  chave_pix text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Inquilinos
-- ---------------------------------------------------------------------
create table if not exists inquilinos (
  id uuid primary key default gen_random_uuid(),
  corretor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  cpf_cnpj text,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Contratos de locação
-- ---------------------------------------------------------------------
create table if not exists contratos_locacao (
  id uuid primary key default gen_random_uuid(),
  corretor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  proprietario_id uuid not null references proprietarios(id) on delete restrict,
  inquilino_id uuid not null references inquilinos(id) on delete restrict,
  imovel_id uuid references imoveis(id) on delete set null,
  imovel_endereco text not null,
  valor_aluguel numeric(12,2) not null,
  dia_vencimento int not null default 5,
  data_inicio date not null,
  data_fim date,
  status text not null default 'ativo' check (status in ('ativo', 'encerrado')),
  observacoes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Recibos de aluguel
-- ---------------------------------------------------------------------
create table if not exists recibos (
  id uuid primary key default gen_random_uuid(),
  corretor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contrato_id uuid not null references contratos_locacao(id) on delete cascade,
  referencia text not null,
  valor numeric(12,2) not null,
  data_pagamento date not null default current_date,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security — cada corretor só vê e mexe nos próprios dados
-- ---------------------------------------------------------------------
alter table proprietarios enable row level security;
alter table inquilinos enable row level security;
alter table contratos_locacao enable row level security;
alter table recibos enable row level security;

drop policy if exists "corretor gerencia proprietarios" on proprietarios;
create policy "corretor gerencia proprietarios" on proprietarios
  for all using (auth.uid() = corretor_id) with check (auth.uid() = corretor_id);

drop policy if exists "corretor gerencia inquilinos" on inquilinos;
create policy "corretor gerencia inquilinos" on inquilinos
  for all using (auth.uid() = corretor_id) with check (auth.uid() = corretor_id);

drop policy if exists "corretor gerencia contratos" on contratos_locacao;
create policy "corretor gerencia contratos" on contratos_locacao
  for all using (auth.uid() = corretor_id) with check (auth.uid() = corretor_id);

drop policy if exists "corretor gerencia recibos" on recibos;
create policy "corretor gerencia recibos" on recibos
  for all using (auth.uid() = corretor_id) with check (auth.uid() = corretor_id);

-- ---------------------------------------------------------------------
-- Imóveis (vitrine pública do site)
-- ---------------------------------------------------------------------
create table if not exists imoveis (
  id uuid primary key default gen_random_uuid(),
  corretor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  slug text not null unique,
  titulo text not null,
  tipo text not null check (tipo in ('casa','apartamento','condominio','comercial','terreno','chacara')),
  operacao text not null check (operacao in ('venda','aluguel')),
  bairro text not null,
  cidade text not null default 'Ponta Grossa',
  endereco text,
  preco_valor numeric(14,2),
  preco_label text not null,
  quartos int not null default 0,
  suites int not null default 0,
  banheiros int not null default 0,
  vagas int not null default 0,
  area_util numeric(10,2),
  area_terreno numeric(10,2),
  destaques jsonb not null default '[]'::jsonb,
  badges jsonb not null default '[]'::jsonb,
  descricao text,
  status text not null default 'ativo' check (status in ('ativo', 'pendente', 'rascunho')),
  capa text,
  fotos jsonb not null default '[]'::jsonb,
  visualizacoes int not null default 0,
  created_at timestamptz not null default now()
);

alter table imoveis enable row level security;

drop policy if exists "qualquer pessoa ve imoveis publicados" on imoveis;
create policy "qualquer pessoa ve imoveis publicados" on imoveis
  for select using (status = 'ativo' or auth.uid() = corretor_id);

drop policy if exists "corretor cria imoveis" on imoveis;
create policy "corretor cria imoveis" on imoveis
  for insert with check (auth.uid() = corretor_id);

drop policy if exists "corretor atualiza imoveis" on imoveis;
create policy "corretor atualiza imoveis" on imoveis
  for update using (auth.uid() = corretor_id) with check (auth.uid() = corretor_id);

drop policy if exists "corretor exclui imoveis" on imoveis;
create policy "corretor exclui imoveis" on imoveis
  for delete using (auth.uid() = corretor_id);

-- ---------------------------------------------------------------------
-- Storage: bucket público para fotos de imóveis adicionadas pelo painel
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('imoveis-fotos', 'imoveis-fotos', true)
on conflict (id) do nothing;

drop policy if exists "leitura publica fotos imoveis" on storage.objects;
create policy "leitura publica fotos imoveis" on storage.objects
  for select using (bucket_id = 'imoveis-fotos');

drop policy if exists "corretor autenticado envia fotos" on storage.objects;
create policy "corretor autenticado envia fotos" on storage.objects
  for insert with check (bucket_id = 'imoveis-fotos' and auth.role() = 'authenticated');

drop policy if exists "corretor autenticado atualiza fotos" on storage.objects;
create policy "corretor autenticado atualiza fotos" on storage.objects
  for update using (bucket_id = 'imoveis-fotos' and auth.role() = 'authenticated');

drop policy if exists "corretor autenticado remove fotos" on storage.objects;
create policy "corretor autenticado remove fotos" on storage.objects
  for delete using (bucket_id = 'imoveis-fotos' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- Concessão de privilégios às roles da API (necessário pois "Automatically
-- expose new tables" ficou desativado na criação do projeto — a segurança
-- real continua sendo garantida pelas políticas de RLS acima).
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on proprietarios, inquilinos, contratos_locacao, recibos to authenticated;
grant select, insert, update, delete on imoveis to authenticated;
grant select on imoveis to anon;

-- ---------------------------------------------------------------------
-- Perfil público do corretor (nome, CRECI, telefone, foto)
-- ---------------------------------------------------------------------
create table if not exists corretor_perfil (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  nome text not null default 'Paulo Souza',
  creci text,
  telefone text,
  foto_url text,
  updated_at timestamptz not null default now()
);

alter table corretor_perfil enable row level security;

drop policy if exists "qualquer pessoa ve o perfil do corretor" on corretor_perfil;
create policy "qualquer pessoa ve o perfil do corretor" on corretor_perfil
  for select using (true);

drop policy if exists "corretor edita o proprio perfil" on corretor_perfil;
create policy "corretor edita o proprio perfil" on corretor_perfil
  for insert with check (auth.uid() = id);

drop policy if exists "corretor atualiza o proprio perfil" on corretor_perfil;
create policy "corretor atualiza o proprio perfil" on corretor_perfil
  for update using (auth.uid() = id) with check (auth.uid() = id);

grant select, insert, update on corretor_perfil to authenticated;
grant select on corretor_perfil to anon;

insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

drop policy if exists "leitura publica avatares" on storage.objects;
create policy "leitura publica avatares" on storage.objects
  for select using (bucket_id = 'avatares');

drop policy if exists "corretor autenticado envia avatar" on storage.objects;
create policy "corretor autenticado envia avatar" on storage.objects
  for insert with check (bucket_id = 'avatares' and auth.role() = 'authenticated');

drop policy if exists "corretor autenticado atualiza avatar" on storage.objects;
create policy "corretor autenticado atualiza avatar" on storage.objects
  for update using (bucket_id = 'avatares' and auth.role() = 'authenticated');
