create table if not exists public.holidays (
  date date primary key,
  name text not null
);
alter table public.holidays enable row level security;
drop policy if exists holidays_select on public.holidays;
create policy holidays_select on public.holidays for select to authenticated using (true);
drop policy if exists holidays_manage on public.holidays;
create policy holidays_manage on public.holidays for all to authenticated using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());

create or replace function public.add_business_days(start_date date, days integer)
returns date language plpgsql stable as $$
declare d date := start_date; n integer := 0;
begin
  while n < days loop
    d := d + 1;
    if extract(isodow from d) < 6 and not exists(select 1 from public.holidays h where h.date=d) then n := n + 1; end if;
  end loop;
  return d;
end; $$;

create or replace function public.vehicle_deadline(p_vehicle_id uuid)
returns date language sql stable as $$
  select public.add_business_days(data_nf,5) from public.vehicles where id=p_vehicle_id and data_nf is not null;
$$;
