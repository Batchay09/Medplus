-- ============================================================
-- MedPlus: Initial Database Schema
-- ============================================================

-- Custom enum types
CREATE TYPE user_role AS ENUM ('admin', 'dispatcher');
CREATE TYPE service_category AS ENUM ('iv_drip', 'injection', 'bandage', 'blood_test', 'package');
CREATE TYPE order_status AS ENUM (
  'new', 'confirmed', 'assigned', 'in_progress',
  'nurse_on_way', 'nurse_arrived', 'procedure_started',
  'completed', 'cancelled'
);
CREATE TYPE order_source AS ENUM ('telegram', 'phone', 'website');
CREATE TYPE supplies_source AS ENUM ('client', 'company');
CREATE TYPE payment_method AS ENUM ('cash', 'card_transfer');
CREATE TYPE payment_status_type AS ENUM ('pending', 'paid', 'partial');
CREATE TYPE route_status AS ENUM ('planned', 'in_progress', 'completed');
CREATE TYPE route_point_type AS ENUM (
  'pickup_nurse', 'deliver_nurse', 'pickup_supplies', 'deliver_supplies', 'return'
);
CREATE TYPE purchase_order_status AS ENUM ('pending', 'purchasing', 'purchased', 'delivered');
CREATE TYPE recipient_type AS ENUM ('patient', 'nurse', 'driver', 'admin');
CREATE TYPE notification_channel AS ENUM ('telegram', 'sms', 'push');

-- ============================================================
-- Profiles (linked to Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  role user_role NOT NULL DEFAULT 'dispatcher',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Patients
-- ============================================================
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL UNIQUE,
  telegram_id bigint UNIQUE,
  address text,
  lat double precision,
  lng double precision,
  birth_date date,
  allergies text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage patients"
  ON patients FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Nurses
-- ============================================================
CREATE TABLE nurses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  telegram_id bigint UNIQUE,
  skills text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nurses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage nurses"
  ON nurses FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Drivers
-- ============================================================
CREATE TABLE drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  telegram_id bigint UNIQUE,
  vehicle_plate text,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage drivers"
  ON drivers FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Services
-- ============================================================
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category service_category NOT NULL,
  duration_minutes int NOT NULL,
  base_price decimal(10, 2) NOT NULL,
  required_skill text,
  supplies jsonb,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage services"
  ON services FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Orders
-- ============================================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  service_id uuid NOT NULL REFERENCES services(id),
  nurse_id uuid REFERENCES nurses(id),
  driver_id uuid REFERENCES drivers(id),
  status order_status NOT NULL DEFAULT 'new',
  source order_source NOT NULL DEFAULT 'phone',

  -- Time
  requested_date date NOT NULL,
  requested_time_from time,
  requested_time_to time,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  -- Address
  address text NOT NULL,
  lat double precision,
  lng double precision,

  -- Supplies
  supplies_source supplies_source,
  prescription_photo_url text,
  custom_supplies_list text,
  supplies_cost decimal(10, 2) NOT NULL DEFAULT 0,

  -- Finances
  service_price decimal(10, 2) NOT NULL,
  surcharge decimal(10, 2) NOT NULL DEFAULT 0,
  total_price decimal(10, 2) GENERATED ALWAYS AS (service_price + surcharge + supplies_cost) STORED,
  payment_method payment_method,
  payment_status payment_status_type NOT NULL DEFAULT 'pending',

  -- Documents
  contract_url text,
  consent_url text,
  service_act_url text,

  is_urgent boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage orders"
  ON orders FOR ALL
  USING (auth.role() = 'authenticated');

-- Index for common queries
CREATE INDEX idx_orders_date ON orders(requested_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_nurse ON orders(nurse_id);
CREATE INDEX idx_orders_patient ON orders(patient_id);

-- ============================================================
-- Nurse Schedules
-- ============================================================
CREATE TABLE nurse_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id uuid NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  UNIQUE(nurse_id, date, start_time)
);

ALTER TABLE nurse_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage nurse schedules"
  ON nurse_schedules FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_nurse_schedules_date ON nurse_schedules(date);
CREATE INDEX idx_nurse_schedules_nurse ON nurse_schedules(nurse_id, date);

-- ============================================================
-- Driver Routes
-- ============================================================
CREATE TABLE driver_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES drivers(id),
  date date NOT NULL,
  status route_status NOT NULL DEFAULT 'planned',
  route_points jsonb,
  total_distance_km double precision,
  total_duration_minutes int
);

ALTER TABLE driver_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage driver routes"
  ON driver_routes FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_driver_routes_date ON driver_routes(date);

-- ============================================================
-- Route Points
-- ============================================================
CREATE TABLE route_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES driver_routes(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id),
  type route_point_type NOT NULL,
  address text,
  lat double precision,
  lng double precision,
  planned_arrival timestamptz,
  actual_arrival timestamptz,
  sequence_order int NOT NULL,
  nurse_id uuid REFERENCES nurses(id),
  notes text
);

ALTER TABLE route_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage route points"
  ON route_points FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_route_points_route ON route_points(route_id);

-- ============================================================
-- Inventory
-- ============================================================
CREATE TABLE inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  quantity int NOT NULL DEFAULT 0,
  min_quantity int NOT NULL DEFAULT 5,
  unit text,
  purchase_price decimal(10, 2)
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage inventory"
  ON inventory FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Purchase Orders
-- ============================================================
CREATE TABLE purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  status purchase_order_status NOT NULL DEFAULT 'pending',
  items jsonb,
  total_cost decimal(10, 2),
  assigned_to uuid REFERENCES drivers(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage purchase orders"
  ON purchase_orders FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Payments
-- ============================================================
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  amount decimal(10, 2) NOT NULL,
  method payment_method NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES profiles(id)
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage payments"
  ON payments FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_payments_order ON payments(order_id);

-- ============================================================
-- Notifications
-- ============================================================
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type recipient_type NOT NULL,
  recipient_id uuid,
  channel notification_channel NOT NULL DEFAULT 'telegram',
  message text,
  sent_at timestamptz DEFAULT now(),
  delivered boolean NOT NULL DEFAULT false
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage notifications"
  ON notifications FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Auto-update updated_at on orders
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'dispatcher'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
