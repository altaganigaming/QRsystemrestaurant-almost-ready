-- Allow kitchen staff to record payment state while preserving order totals.
create or replace function public.orders_lock_financials() returns trigger
language plpgsql as $$
begin
  if not public.is_staff() then
    raise exception 'Only staff can modify orders';
  end if;
  if public.current_role() = 'kitchen' then
    if new.status not in ('new','preparing','ready','completed') then
      raise exception 'Kitchen cannot set status %', new.status;
    end if;
    if (old.status = 'completed' or old.status = 'closed' or old.status = 'cancelled') then
      raise exception 'Order already finished';
    end if;
    if new.subtotal <> old.subtotal or new.discount <> old.discount or new.tax <> old.tax
       or new.service_charge <> old.service_charge or new.grand_total <> old.grand_total
       or new.type <> old.type or new.customer_id is distinct from old.customer_id then
      raise exception 'Kitchen cannot modify financial or identity fields';
    end if;
  end if;
  if new.status in ('completed','closed') and old.status not in ('completed','closed') then
    new.completed_at = now();
  end if;
  return new;
end; $$;