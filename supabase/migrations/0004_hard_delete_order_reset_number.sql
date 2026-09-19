create or replace function public.hard_delete_order(target_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  deleted_id uuid;
begin
  delete from public.orders where id = target_order_id returning id into deleted_id;
  if deleted_id is null then
    return false;
  end if;

  if not exists (select 1 from public.orders) then
    perform setval(pg_get_serial_sequence('public.orders', 'order_number'), 1, false);
  end if;
  return true;
end;
$$;

revoke execute on function public.hard_delete_order(uuid) from public, anon, authenticated;
grant execute on function public.hard_delete_order(uuid) to service_role;