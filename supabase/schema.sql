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
