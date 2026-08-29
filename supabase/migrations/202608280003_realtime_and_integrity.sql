-- Entrega360: sincronização em tempo real e integridade adicional.
-- Execute no SQL Editor do Supabase depois das migrations 001 e 002.

-- Chassi, quando informado, não pode ser duplicado.
create unique index if not exists vehicles_chassi_unique_idx
  on public.vehicles (upper(trim(chassi)))
  where nullif(trim(chassi), '') is not null;

-- Atualizações feitas por outro usuário aparecem no painel sem precisar recarregar a página.
alter table public.vehicles replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.vehicles;
exception when duplicate_object then
  null;
end $$;
