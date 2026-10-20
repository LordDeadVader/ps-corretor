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
  fotos_destaque jsonb not null default '[]'::jsonb,
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

drop policy if exists "corretor autenticado remove avatar" on storage.objects;
create policy "corretor autenticado remove avatar" on storage.objects
  for delete using (bucket_id = 'avatares' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- Fotos dos bairros (galeria "efeito sanfona" da página inicial)
-- ---------------------------------------------------------------------
create table if not exists bairros_destaque (
  id uuid primary key default gen_random_uuid(),
  corretor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  slug text not null unique,
  foto_url text,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

alter table bairros_destaque enable row level security;

drop policy if exists "qualquer pessoa ve bairros" on bairros_destaque;
create policy "qualquer pessoa ve bairros" on bairros_destaque
  for select using (true);

drop policy if exists "corretor gerencia bairros" on bairros_destaque;
create policy "corretor gerencia bairros" on bairros_destaque
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

grant select, insert, update, delete on bairros_destaque to authenticated;
grant select on bairros_destaque to anon;

-- ---------------------------------------------------------------------
-- Migrações para instalações já existentes — "create table if not exists"
-- não adiciona colunas novas a tabelas que já existem, então qualquer
-- coluna adicionada depois da criação inicial precisa vir como ALTER
-- explícito aqui (idempotente, seguro rodar de novo).
-- ---------------------------------------------------------------------
alter table contratos_locacao add column if not exists imovel_id uuid references imoveis(id) on delete set null;
alter table imoveis add column if not exists fotos_destaque jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public)
values ('bairros', 'bairros', true)
on conflict (id) do nothing;

drop policy if exists "leitura publica fotos bairros" on storage.objects;
create policy "leitura publica fotos bairros" on storage.objects
  for select using (bucket_id = 'bairros');

drop policy if exists "corretor autenticado envia foto bairro" on storage.objects;
create policy "corretor autenticado envia foto bairro" on storage.objects
  for insert with check (bucket_id = 'bairros' and auth.role() = 'authenticated');

drop policy if exists "corretor autenticado atualiza foto bairro" on storage.objects;
create policy "corretor autenticado atualiza foto bairro" on storage.objects
  for update using (bucket_id = 'bairros' and auth.role() = 'authenticated');

drop policy if exists "corretor autenticado remove foto bairro" on storage.objects;
create policy "corretor autenticado remove foto bairro" on storage.objects
  for delete using (bucket_id = 'bairros' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- Medidor de capacidade do servidor (Storage + Banco de Dados) para o CMS
-- ---------------------------------------------------------------------
create or replace function public.get_storage_usage()
returns jsonb
language sql
security definer
set search_path = public, storage
as $$
  select jsonb_build_object(
    'storage_bytes', coalesce((select sum((metadata->>'size')::bigint) from storage.objects), 0),
    'storage_files', coalesce((select count(*) from storage.objects), 0),
    'storage_limit_bytes', 1073741824::bigint,
    'db_bytes', pg_database_size(current_database()),
    'db_limit_bytes', 524288000::bigint
  );
$$;

grant execute on function public.get_storage_usage() to authenticated;

-- ---------------------------------------------------------------------
-- Controle de tentativas de login (máximo 5 tentativas antes de bloqueio)
-- ---------------------------------------------------------------------
create table if not exists public.login_tentativas (
  chave text primary key,
  tentativas int not null default 0,
  bloqueado_ate timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.login_tentativas enable row level security;

create or replace function public.verificar_bloqueio_login(p_chave text default 'painel_global')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.login_tentativas%rowtype;
begin
  select * into v_reg from public.login_tentativas where chave = coalesce(nullif(trim(lower(p_chave)), ''), 'painel_global');
  if not found then
    return jsonb_build_object('bloqueado', false, 'tentativas', 0, 'restantes', 5);
  end if;

  if v_reg.bloqueado_ate is not null and v_reg.bloqueado_ate > now() then
    return jsonb_build_object(
      'bloqueado', true,
      'tentativas', v_reg.tentativas,
      'restantes', 0,
      'bloqueado_ate', v_reg.bloqueado_ate
    );
  end if;

  if (v_reg.bloqueado_ate is not null and v_reg.bloqueado_ate <= now())
     or (v_reg.updated_at < now() - interval '30 minutes') then
    update public.login_tentativas
       set tentativas = 0, bloqueado_ate = null, updated_at = now()
     where chave = v_reg.chave;
    return jsonb_build_object('bloqueado', false, 'tentativas', 0, 'restantes', 5);
  end if;

  return jsonb_build_object(
    'bloqueado', v_reg.tentativas >= 5,
    'tentativas', v_reg.tentativas,
    'restantes', greatest(0, 5 - v_reg.tentativas),
    'bloqueado_ate', v_reg.bloqueado_ate
  );
end;
$$;

create or replace function public.registrar_tentativa_login(p_chave text default 'painel_global', p_sucesso boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := coalesce(nullif(trim(lower(p_chave)), ''), 'painel_global');
  v_tentativas int;
  v_bloqueado_ate timestamptz := null;
begin
  if p_sucesso then
    delete from public.login_tentativas where chave in (v_key, 'painel_global');
    return jsonb_build_object('bloqueado', false, 'tentativas', 0, 'restantes', 5);
  end if;

  insert into public.login_tentativas (chave, tentativas, bloqueado_ate, updated_at)
  values (v_key, 1, null, now())
  on conflict (chave) do update
    set tentativas = case
          when public.login_tentativas.updated_at < now() - interval '30 minutes' then 1
          else public.login_tentativas.tentativas + 1
        end,
        bloqueado_ate = case
          when (case when public.login_tentativas.updated_at < now() - interval '30 minutes' then 1 else public.login_tentativas.tentativas + 1 end) >= 5
          then now() + interval '30 minutes'
          else public.login_tentativas.bloqueado_ate
        end,
        updated_at = now()
  returning tentativas, bloqueado_ate into v_tentativas, v_bloqueado_ate;

  return jsonb_build_object(
    'bloqueado', v_tentativas >= 5,
    'tentativas', v_tentativas,
    'restantes', greatest(0, 5 - v_tentativas),
    'bloqueado_ate', v_bloqueado_ate
  );
end;
$$;

grant execute on function public.verificar_bloqueio_login(text) to anon, authenticated;
grant execute on function public.registrar_tentativa_login(text, boolean) to anon, authenticated;

-- ============================================================
-- 11. BLINDAGEM AVANÇADA (STORAGE, IDs, PREÇOS E ANTI-SPAM/XSS)
-- ============================================================

-- 11.1 Restrição de MIME types (apenas JPEG, PNG, WEBP) e limite de 5 MB nos buckets
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
       file_size_limit = 5242880
 where id in ('imoveis-fotos', 'bairros', 'avatares');

-- 11.2 Bloqueio de alteração de ID (Primary Key Tampering)
create or replace function public.prevent_id_tampering()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if NEW.id is distinct from OLD.id then
    raise exception 'Operação negada: o identificador único (ID) do registro não pode ser alterado.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_id_tampering_imoveis on public.imoveis;
create trigger trg_prevent_id_tampering_imoveis
before update on public.imoveis
for each row execute function public.prevent_id_tampering();

-- 11.3 Validação de integridade de preços (bloqueia valores negativos ou absurdos)
alter table public.imoveis drop constraint if exists chk_imoveis_preco_valido;
alter table public.imoveis add constraint chk_imoveis_preco_valido
  check (preco >= 0 and preco <= 999999999);

-- 11.4 Blindagem da tabela pública LGPD (Rate-limit, tamanho máximo e bloqueio de HTML/JS)
create or replace function public.guard_solicitacoes_titulares()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent_count int;
begin
  select count(*) into v_recent_count
    from public.solicitacoes_titulares
   where created_at > now() - interval '15 minutes';

  if v_recent_count >= 5 then
    raise exception 'Muitas solicitações recentes. Aguarde alguns minutos antes de tentar novamente.';
  end if;

  if length(coalesce(NEW.nome, '')) > 120
     or length(coalesce(NEW.contato, '')) > 120
     or length(coalesce(NEW.detalhes, '')) > 1000 then
    raise exception 'Dados excedem o limite máximo de caracteres permitido.';
  end if;

  if coalesce(NEW.nome, '') ~* '<[a-z!/]|javascript:|onerror=|onload='
     or coalesce(NEW.contato, '') ~* '<[a-z!/]|javascript:|onerror=|onload='
     or coalesce(NEW.detalhes, '') ~* '<script|<iframe|javascript:|onerror=|onload=' then
    raise exception 'Conteúdo inválido detectado.';
  end if;

  NEW.status := 'recebida';
  return NEW;
end;
$$;

drop trigger if exists trg_guard_solicitacoes_titulares on public.solicitacoes_titulares;
create trigger trg_guard_solicitacoes_titulares
before insert on public.solicitacoes_titulares
for each row execute function public.guard_solicitacoes_titulares();
