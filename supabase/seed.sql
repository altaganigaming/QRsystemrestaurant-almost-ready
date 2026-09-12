-- Optional demo content. Safe to skip in production.
update public.settings set
  restaurant_name = 'Demo Diner',
  headings = '{"home_title":"Welcome to Demo Diner","home_subtitle":"Fresh food, fast service","menu_title":"Our Menu","gallery_title":"Gallery"}'::jsonb,
  buttons = '{"order_now":"Order Now","view_menu":"View Menu","track_order":"Track Order"}'::jsonb,
  content = '{"about":"A cozy place for great food.","footer_note":"Made with love."}'::jsonb
where id = 1;

insert into public.categories (name, description, sort_order) values
  ('Starters', 'Small plates to begin', 1),
  ('Mains', 'Hearty meals', 2),
  ('Beverages', 'Drinks', 3);

insert into public.products (category_id, name, description, price, discount_price, sort_order)
select c.id, 'Crispy Fries', 'Golden fried potatoes', 120, 99, 1 from public.categories c where c.name = 'Starters'
union all
select c.id, 'Paneer Tikka', 'Char-grilled cottage cheese', 240, null, 2 from public.categories c where c.name = 'Starters'
union all
select c.id, 'Veg Biryani', 'Fragrant rice with vegetables', 220, null, 1 from public.categories c where c.name = 'Mains'
union all
select c.id, 'Cold Coffee', 'Chilled coffee with ice cream', 150, null, 1 from public.categories c where c.name = 'Beverages';

insert into public.pack_sizes (product_id, label, price_delta)
select p.id, '250ml', 0 from public.products p where p.name = 'Cold Coffee'
union all select p.id, '500ml', 60 from public.products p where p.name = 'Cold Coffee';

insert into public.addons (product_id, name, price)
select p.id, 'Extra Cheese', 40 from public.products p where p.name = 'Crispy Fries';
