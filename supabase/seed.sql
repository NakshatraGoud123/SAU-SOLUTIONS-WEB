-- Starter catalog for SAU SOLUTIONS.
-- Idempotent: existing categories and catalog slugs are left unchanged.
-- Review descriptions/prices and update the catalog from the Supabase dashboard as needed.

insert into public.categories (name, slug, description, is_active)
values
  ('Essential Supplies', 'essential-supplies', 'Everyday must-haves, delivered to your door.', true),
  ('Home Services', 'home-services', 'Trusted help for all the little things at home.', true),
  ('Mechanic Services', 'mechanic-services', 'Expert care for your car, bike and more.', true),
  ('Mobility Services', 'mobility-services', 'Get there comfortably, whenever you need.', true),
  ('Residential Services', 'residential-services', 'Reliable support for the place you call home.', true),
  ('Property & Lifestyle', 'property-lifestyle', 'Make more of your space and your time.', true),
  ('Home Essentials', 'home-essentials', 'Thoughtful finds for a home that works.', true),
  ('Food & Beverages', 'food-beverages', 'Good food and drinks for every kind of day.', true),
  ('Education', 'education', 'Learn something new, at your own pace.', true),
  ('Business & Professional', 'business-professional', 'Skilled people to help your business thrive.', true),
  ('Home & Lifestyle', 'home-lifestyle', 'Little upgrades for life at home.', true),
  ('Tech Services', 'tech-services', 'Friendly tech help, minus the jargon.', true),
  ('Men''s Grooming', 'mens-grooming', 'Feel your best, with a little time for you.', true),
  ('Women''s Beauty', 'womens-beauty', 'Feel-good beauty and wellness, on your terms.', true),
  ('Healthcare & Pharmacy', 'healthcare-pharmacy', 'Everyday care and essentials, made simpler.', true),
  ('More Services', 'more-services', 'There is always something more to discover.', true)
on conflict (slug) do nothing;

insert into public.services (category_id, name, slug, description, price, duration, is_active)
select c.id, seed.name, seed.slug, seed.description, seed.price, seed.duration, true
from (values
  ('home-services', 'Electrician', 'electrician', 'Electrical repairs and installations at home.', 249::numeric, 'Inspection and estimate'),
  ('home-services', 'Plumber', 'plumber', 'Help with leaks, taps, drains and plumbing repairs.', 299::numeric, 'Inspection and estimate'),
  ('home-services', 'AC Repair', 'ac-repair', 'Diagnosis and repair for home air-conditioning units.', 399::numeric, 'Schedule a time'),
  ('home-services', 'Home Cleaning', 'home-cleaning', 'Home cleaning service tailored to your space.', 899::numeric, 'Schedule a time'),
  ('home-services', 'Appliance Repair', 'appliance-repair', 'Troubleshooting and repair for household appliances.', 349::numeric, 'Inspection and estimate'),
  ('mechanic-services', 'Bike Repair', 'bike-repair', 'Two-wheeler inspection and repair at your location.', 349::numeric, 'Inspection and estimate'),
  ('mechanic-services', 'Car Repair', 'car-repair', 'Vehicle inspection and repair by a local mechanic.', 599::numeric, 'Inspection and estimate'),
  ('mechanic-services', 'Battery Assistance', 'battery-assistance', 'Battery testing and roadside assistance.', 299::numeric, 'Schedule a time'),
  ('mechanic-services', 'Tyre Service', 'tyre-service', 'Tyre inspection and puncture assistance.', 199::numeric, 'Schedule a time'),
  ('mobility-services', 'Driver Services', 'driver-services', 'Book a local driver for a planned trip.', 499::numeric, 'Schedule a time'),
  ('mobility-services', 'Moving Assistance', 'moving-assistance', 'Extra help with lifting, packing and moving.', 999::numeric, 'Schedule a time'),
  ('mens-grooming', 'Haircut', 'mens-haircut', 'Book a haircut with a local grooming professional.', 349::numeric, 'Schedule a time'),
  ('mens-grooming', 'Beard Styling', 'beard-styling', 'At-home beard trimming and styling.', 249::numeric, 'Schedule a time'),
  ('womens-beauty', 'Hair Styling', 'hair-styling', 'At-home hair styling with a local professional.', 599::numeric, 'Schedule a time'),
  ('womens-beauty', 'Makeup', 'makeup-service', 'Book an at-home makeup appointment.', 799::numeric, 'Schedule a time'),
  ('womens-beauty', 'Facial', 'facial-service', 'At-home facial appointment with a beauty professional.', 699::numeric, 'Schedule a time'),
  ('tech-services', 'Computer Repair', 'computer-repair', 'Diagnosis and support for desktop computers.', 399::numeric, 'Inspection and estimate'),
  ('tech-services', 'Laptop Repair', 'laptop-repair', 'Troubleshooting and support for laptop computers.', 399::numeric, 'Inspection and estimate'),
  ('tech-services', 'Mobile Repair', 'mobile-repair', 'Mobile device diagnosis and repair consultation.', 299::numeric, 'Inspection and estimate'),
  ('tech-services', 'Wi-Fi Setup', 'wifi-setup', 'Help setting up or troubleshooting a home Wi-Fi network.', 299::numeric, 'Schedule a time'),
  ('education', 'Home Tutoring', 'home-tutoring', 'One-to-one tutoring at home for your chosen subject.', 499::numeric, 'Per hour'),
  ('education', 'Online Tutoring', 'online-tutoring', 'One-to-one online tutoring for your chosen subject.', 399::numeric, 'Per hour'),
  ('education', 'Skill Training', 'skill-training', 'Personalised guidance to develop a practical skill.', 499::numeric, 'Schedule a time'),
  ('healthcare-pharmacy', 'Pharmacy Delivery', 'pharmacy-delivery', 'Request delivery of eligible pharmacy essentials.', 49::numeric, 'Delivery timing confirmed'),
  ('healthcare-pharmacy', 'Lab Sample Collection', 'lab-sample-collection', 'Arrange a home visit for sample collection.', 299::numeric, 'Schedule a time'),
  ('healthcare-pharmacy', 'Home Healthcare', 'home-healthcare', 'Request a home healthcare visit.', 799::numeric, 'Schedule a time')
) as seed(category_slug, name, slug, description, price, duration)
join public.categories c on c.slug = seed.category_slug
on conflict (slug) do nothing;

insert into public.products (category_id, name, slug, description, price, stock, is_active)
select c.id, seed.name, seed.slug, seed.description, seed.price, seed.stock, true
from (values
  ('essential-supplies', 'Rice', 'rice', 'Everyday rice for home cooking.', 75::numeric, 100),
  ('essential-supplies', 'Wheat Flour', 'wheat-flour', 'Wheat flour for everyday cooking.', 55::numeric, 100),
  ('essential-supplies', 'Cooking Oil', 'cooking-oil', 'Cooking oil for everyday meals.', 145::numeric, 100),
  ('essential-supplies', 'Milk', 'milk', 'Fresh milk for home delivery.', 32::numeric, 100),
  ('essential-supplies', 'Bread', 'bread', 'Fresh bread for everyday meals.', 40::numeric, 100),
  ('essential-supplies', 'Eggs', 'eggs', 'Eggs for everyday cooking.', 72::numeric, 100),
  ('essential-supplies', 'Vegetables', 'vegetables', 'Seasonal vegetables selected for your order.', 99::numeric, 100),
  ('essential-supplies', 'Fruits', 'fruits', 'Seasonal fruit selected for your order.', 129::numeric, 100),
  ('essential-supplies', 'Drinking Water', 'drinking-water', 'Sealed drinking water for home delivery.', 20::numeric, 100),
  ('home-essentials', 'Cleaning Supplies', 'cleaning-supplies', 'Everyday household cleaning essentials.', 149::numeric, 100),
  ('home-essentials', 'Stationery', 'stationery', 'Basic stationery for home, school or work.', 99::numeric, 100),
  ('home-essentials', 'Household Essentials', 'household-essentials', 'Useful household essentials for everyday needs.', 199::numeric, 100),
  ('food-beverages', 'Packaged Foods', 'packaged-foods', 'Packaged food items for your pantry.', 99::numeric, 100),
  ('food-beverages', 'Beverages', 'beverages', 'Everyday beverages for home delivery.', 69::numeric, 100)
) as seed(category_slug, name, slug, description, price, stock)
join public.categories c on c.slug = seed.category_slug
on conflict (slug) do nothing;
