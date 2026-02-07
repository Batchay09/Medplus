-- ============================================================
-- MedPlus: Seed Data for Development
-- ============================================================

-- Nurses
INSERT INTO nurses (id, full_name, phone, skills, is_active) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Иванова Анна Сергеевна', '+79283001001', ARRAY['iv_drip', 'injection', 'bandage'], true),
  ('a2222222-2222-2222-2222-222222222222', 'Петрова Мария Александровна', '+79283001002', ARRAY['iv_drip', 'injection', 'blood_test'], true),
  ('a3333333-3333-3333-3333-333333333333', 'Сидорова Елена Владимировна', '+79283001003', ARRAY['injection', 'bandage', 'blood_test'], true);

-- Drivers
INSERT INTO drivers (id, full_name, phone, vehicle_plate, is_active) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Козлов Дмитрий Игоревич', '+79283002001', 'К123АА09', true);

-- Services: Капельницы
INSERT INTO services (id, name, category, duration_minutes, base_price, required_skill, supplies) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Капельница "Детокс"', 'iv_drip', 60, 3500.00, 'iv_drip',
   '[{"name": "Система для инфузий", "quantity": 1}, {"name": "Катетер", "quantity": 1}, {"name": "Физраствор 500мл", "quantity": 1}]'::jsonb),
  ('c2222222-2222-2222-2222-222222222222', 'Капельница "Витаминная"', 'iv_drip', 45, 3000.00, 'iv_drip',
   '[{"name": "Система для инфузий", "quantity": 1}, {"name": "Катетер", "quantity": 1}]'::jsonb),
  ('c3333333-3333-3333-3333-333333333333', 'Капельница "Иммунитет"', 'iv_drip', 50, 3200.00, 'iv_drip',
   '[{"name": "Система для инфузий", "quantity": 1}, {"name": "Катетер", "quantity": 1}]'::jsonb),
  ('c4444444-4444-4444-4444-444444444444', 'Капельница по назначению врача', 'iv_drip', 60, 2500.00, 'iv_drip',
   '[{"name": "Система для инфузий", "quantity": 1}, {"name": "Катетер", "quantity": 1}]'::jsonb);

-- Services: Уколы
INSERT INTO services (id, name, category, duration_minutes, base_price, required_skill) VALUES
  ('c5555555-5555-5555-5555-555555555555', 'Внутримышечная инъекция', 'injection', 15, 800.00, 'injection'),
  ('c6666666-6666-6666-6666-666666666666', 'Внутривенная инъекция', 'injection', 20, 1000.00, 'injection');

-- Services: Перевязки
INSERT INTO services (id, name, category, duration_minutes, base_price, required_skill, supplies) VALUES
  ('c7777777-7777-7777-7777-777777777777', 'Перевязка раны', 'bandage', 30, 1200.00, 'bandage',
   '[{"name": "Бинт стерильный", "quantity": 2}, {"name": "Антисептик", "quantity": 1}]'::jsonb);

-- Services: Забор анализов
INSERT INTO services (id, name, category, duration_minutes, base_price, required_skill, supplies) VALUES
  ('c8888888-8888-8888-8888-888888888888', 'Забор крови из вены', 'blood_test', 20, 600.00, 'blood_test',
   '[{"name": "Вакутейнер", "quantity": 3}, {"name": "Жгут", "quantity": 1}]'::jsonb);

-- Patients
INSERT INTO patients (id, full_name, phone, address, lat, lng) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Смирнов Алексей Петрович', '+79283003001', 'г. Черкесск, ул. Ленина, д. 15, кв. 3', 44.2233, 42.0578),
  ('d2222222-2222-2222-2222-222222222222', 'Кузнецова Ольга Ивановна', '+79283003002', 'г. Черкесск, ул. Первомайская, д. 42', 44.2280, 42.0510),
  ('d3333333-3333-3333-3333-333333333333', 'Попов Виктор Михайлович', '+79283003003', 'г. Черкесск, пр. Ленина, д. 67, кв. 12', 44.2190, 42.0620);

-- Nurse schedules (next 7 days from seed time)
INSERT INTO nurse_schedules (nurse_id, date, start_time, end_time, is_available) VALUES
  -- Anna
  ('a1111111-1111-1111-1111-111111111111', CURRENT_DATE, '08:00', '18:00', true),
  ('a1111111-1111-1111-1111-111111111111', CURRENT_DATE + 1, '08:00', '18:00', true),
  ('a1111111-1111-1111-1111-111111111111', CURRENT_DATE + 2, '08:00', '18:00', true),
  -- Maria
  ('a2222222-2222-2222-2222-222222222222', CURRENT_DATE, '09:00', '17:00', true),
  ('a2222222-2222-2222-2222-222222222222', CURRENT_DATE + 1, '09:00', '17:00', true),
  ('a2222222-2222-2222-2222-222222222222', CURRENT_DATE + 2, '09:00', '17:00', true),
  -- Elena
  ('a3333333-3333-3333-3333-333333333333', CURRENT_DATE, '10:00', '19:00', true),
  ('a3333333-3333-3333-3333-333333333333', CURRENT_DATE + 1, '10:00', '19:00', true);

-- Inventory
INSERT INTO inventory (name, category, quantity, min_quantity, unit, purchase_price) VALUES
  ('Система для инфузий', 'расходники', 50, 10, 'шт', 85.00),
  ('Катетер внутривенный', 'расходники', 40, 10, 'шт', 120.00),
  ('Физраствор 500мл', 'растворы', 30, 5, 'шт', 65.00),
  ('Шприц 5мл', 'расходники', 100, 20, 'шт', 12.00),
  ('Шприц 10мл', 'расходники', 80, 20, 'шт', 15.00),
  ('Бинт стерильный', 'перевязочные', 60, 15, 'шт', 35.00),
  ('Антисептик 100мл', 'антисептики', 25, 5, 'шт', 180.00),
  ('Вакутейнер', 'расходники', 100, 20, 'шт', 45.00),
  ('Перчатки нитриловые (пара)', 'расходники', 200, 50, 'пар', 8.00),
  ('Жгут', 'инструменты', 10, 3, 'шт', 150.00),
  ('Пластырь бактерицидный', 'расходники', 150, 30, 'шт', 5.00),
  ('Спиртовые салфетки', 'антисептики', 200, 50, 'шт', 3.00);

-- Sample orders
INSERT INTO orders (
  id, patient_id, service_id, nurse_id, driver_id,
  status, source, requested_date, requested_time_from, requested_time_to,
  scheduled_at, address, lat, lng,
  supplies_source, service_price, surcharge, payment_method, payment_status,
  is_urgent
) VALUES
  (
    'e1111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'assigned',
    'phone',
    CURRENT_DATE,
    '10:00', '12:00',
    (CURRENT_DATE || ' 10:30:00')::timestamptz,
    'г. Черкесск, ул. Ленина, д. 15, кв. 3',
    44.2233, 42.0578,
    'company',
    3500.00, 0,
    'cash', 'pending',
    false
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'd2222222-2222-2222-2222-222222222222',
    'c5555555-5555-5555-5555-555555555555',
    'a2222222-2222-2222-2222-222222222222',
    NULL,
    'new',
    'telegram',
    CURRENT_DATE,
    '14:00', '16:00',
    NULL,
    'г. Черкесск, ул. Первомайская, д. 42',
    44.2280, 42.0510,
    'client',
    800.00, 0,
    NULL, 'pending',
    false
  );
