create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  perfil text not null default 'operador' check (perfil in ('admin','gestor','operador')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  cliente text not null default '',
  modelo text not null default '',
  cor text not null default '',
  chassi text not null default '',
  vendedor text not null default '',
  telefone text not null default '',
  minuta_recebida boolean not null default true,
  data_minuta date not null default current_date,
  cliente_comunicado boolean not null default false,
  nf boolean not null default false,
  data_nf date,
  acessorio boolean not null default false,
  acessorio_pago boolean not null default false,
  insulfilm text not null default '' check (insulfilm in ('','sim')),
  insulfilm_done boolean not null default false,
  emplacamento boolean not null default false,
  placa boolean not null default false,
  carregado boolean not null default false,
  lavacao boolean not null default false,
  contato boolean not null default false,
  agendado boolean not null default false,
  data_agendada date,
  horario time,
  wallbox text not null default '',
  feedback boolean not null default false,
  data_entrega date,
  responsavel text not null default '',
  obs text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nf_requires_date check ((nf = false) or data_nf is not null),
  constraint delivery_requires_date check ((feedback = false) or data_entrega is not null)
);

create index if not exists vehicles_data_nf_idx on public.vehicles(data_nf);
create index if not exists vehicles_data_agendada_idx on public.vehicles(data_agendada);
create index if not exists vehicles_status_search_idx on public.vehicles(cliente, chassi, vendedor);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_vehicle_idx on public.audit_log(vehicle_id, created_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists vehicles_touch_updated_at on public.vehicles;
create trigger vehicles_touch_updated_at before update on public.vehicles for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();

create or replace function public.audit_vehicle() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.audit_log(vehicle_id,user_id,action,old_data,new_data)
  values(coalesce(new.id,old.id),auth.uid(),tg_op,to_jsonb(old),to_jsonb(new));
  return coalesce(new,old);
end; $$;

drop trigger if exists vehicles_audit on public.vehicles;
create trigger vehicles_audit after insert or update or delete on public.vehicles for each row execute function public.audit_vehicle();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,nome) values(new.id,coalesce(new.raw_user_meta_data->>'nome',split_part(new.email,'@',1))); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_manager_or_admin() returns boolean language sql security definer stable set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and perfil in ('admin','gestor') and ativo=true);
$$;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_manager_or_admin());
drop policy if exists profiles_update on public.profiles;
-- Somente administradores podem alterar perfil/ativo/nome de usuários.
-- Isso impede que um operador eleve a própria permissão para admin.
create policy profiles_update on public.profiles for update to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.perfil='admin' and p.ativo=true))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.perfil='admin' and p.ativo=true));

drop policy if exists vehicles_select on public.vehicles;
create policy vehicles_select on public.vehicles for select to authenticated using (true);
drop policy if exists vehicles_insert on public.vehicles;
create policy vehicles_insert on public.vehicles for insert to authenticated with check (true);
drop policy if exists vehicles_update on public.vehicles;
create policy vehicles_update on public.vehicles for update to authenticated using (true) with check (true);
drop policy if exists vehicles_delete on public.vehicles;
create policy vehicles_delete on public.vehicles for delete to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.perfil='admin' and p.ativo=true));

drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log for select to authenticated using (user_id=auth.uid() or public.is_manager_or_admin());

-- Impede marcar etapas de preparação antes da NF, no banco.
create or replace function public.validate_vehicle_workflow() returns trigger language plpgsql as $$
begin
  if (new.carregado or new.lavacao or new.contato or new.agendado) and new.data_nf is null then
    raise exception 'A NF precisa ser recebida antes das etapas de preparação/agendamento.';
  end if;
  if new.acessorio_pago and not new.acessorio then raise exception 'Acessório pago exige acessorio=true.'; end if;
  if new.insulfilm_done and new.insulfilm <> 'sim' then raise exception 'Insulfilm concluído exige insulfilm=sim.'; end if;
  if new.placa and not new.emplacamento then raise exception 'Placa concluída exige emplacamento=true.'; end if;
  if new.feedback and not new.agendado then raise exception 'A entrega só pode ser concluída após o agendamento.'; end if;
  return new;
end; $$;
drop trigger if exists vehicles_validate_workflow on public.vehicles;
create trigger vehicles_validate_workflow before insert or update on public.vehicles for each row execute function public.validate_vehicle_workflow();
