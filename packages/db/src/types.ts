// ============================================================
// MedPlus Database Types
// These types mirror the Supabase schema.
// When Supabase CLI is available, regenerate with:
//   supabase gen types typescript --local > types.generated.ts
// ============================================================

export type UserRole = 'admin' | 'dispatcher';

export type ServiceCategory = 'iv_drip' | 'injection' | 'bandage' | 'blood_test' | 'package';

export type NurseSkill = 'iv_drip' | 'injection' | 'bandage' | 'blood_test';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'nurse_on_way'
  | 'nurse_arrived'
  | 'procedure_started'
  | 'completed'
  | 'cancelled';

export type OrderSource = 'telegram' | 'phone' | 'website';

export type SuppliesSource = 'client' | 'company';

export type PaymentMethod = 'cash' | 'card_transfer';

export type PaymentStatus = 'pending' | 'paid' | 'partial';

export type RouteStatus = 'planned' | 'in_progress' | 'completed';

export type RoutePointType =
  | 'pickup_nurse'
  | 'deliver_nurse'
  | 'pickup_supplies'
  | 'deliver_supplies'
  | 'return';

export type PurchaseOrderStatus = 'pending' | 'purchasing' | 'purchased' | 'delivered';

export type RecipientType = 'patient' | 'nurse' | 'driver' | 'admin';

export type NotificationChannel = 'telegram' | 'sms' | 'push';

// ============================================================
// Table Row Types
// ============================================================

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  full_name: string;
  phone: string;
  telegram_id: number | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  birth_date: string | null;
  allergies: string | null;
  notes: string | null;
  created_at: string;
}

export interface Nurse {
  id: string;
  full_name: string;
  phone: string;
  telegram_id: number | null;
  skills: NurseSkill[];
  is_active: boolean;
  created_at: string;
}

export interface Driver {
  id: string;
  full_name: string;
  phone: string;
  telegram_id: number | null;
  vehicle_plate: string | null;
  is_active: boolean;
}

export interface SupplyItem {
  name: string;
  quantity: number;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  duration_minutes: number;
  base_price: number;
  required_skill: NurseSkill | null;
  supplies: SupplyItem[] | null;
  is_active: boolean;
}

export interface Order {
  id: string;
  patient_id: string;
  service_id: string;
  nurse_id: string | null;
  driver_id: string | null;
  status: OrderStatus;
  source: OrderSource;

  requested_date: string;
  requested_time_from: string | null;
  requested_time_to: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;

  address: string;
  lat: number | null;
  lng: number | null;

  supplies_source: SuppliesSource | null;
  prescription_photo_url: string | null;
  custom_supplies_list: string | null;
  supplies_cost: number;

  service_price: number;
  surcharge: number;
  total_price: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;

  contract_url: string | null;
  consent_url: string | null;
  service_act_url: string | null;

  is_urgent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NurseSchedule {
  id: string;
  nurse_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface DriverRoute {
  id: string;
  driver_id: string;
  date: string;
  status: RouteStatus;
  route_points: RoutePointData[] | null;
  total_distance_km: number | null;
  total_duration_minutes: number | null;
}

export interface RoutePointData {
  address: string;
  lat: number;
  lng: number;
  type: RoutePointType;
  sequence: number;
}

export interface RoutePoint {
  id: string;
  route_id: string;
  order_id: string | null;
  type: RoutePointType;
  address: string | null;
  lat: number | null;
  lng: number | null;
  planned_arrival: string | null;
  actual_arrival: string | null;
  sequence_order: number;
  nurse_id: string | null;
  notes: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  min_quantity: number;
  unit: string | null;
  purchase_price: number | null;
}

export interface PurchaseOrderItem {
  name: string;
  quantity: number;
  pharmacy?: string;
}

export interface PurchaseOrder {
  id: string;
  order_id: string | null;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[] | null;
  total_cost: number | null;
  assigned_to: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'confirmed';
  confirmed_at: string | null;
  confirmed_by: string | null;
}

export interface Notification {
  id: string;
  recipient_type: RecipientType;
  recipient_id: string | null;
  channel: NotificationChannel;
  message: string | null;
  sent_at: string | null;
  delivered: boolean;
}

// ============================================================
// Extended types (with joined data)
// ============================================================

export interface OrderWithRelations extends Order {
  patient?: Patient;
  service?: Service;
  nurse?: Nurse;
  driver?: Driver;
  payments?: Payment[];
}

export interface NurseWithSchedule extends Nurse {
  schedules?: NurseSchedule[];
  orders_today?: Order[];
}

export interface DriverRouteWithPoints extends DriverRoute {
  points?: RoutePoint[];
  driver?: Driver;
}

// ============================================================
// Insert types (omit auto-generated fields)
// ============================================================

export type PatientInsert = Omit<Patient, 'id' | 'created_at'> & {
  id?: string;
};

export type NurseInsert = Omit<Nurse, 'id' | 'created_at'> & {
  id?: string;
};

export type DriverInsert = Omit<Driver, 'id'> & {
  id?: string;
};

export type ServiceInsert = Omit<Service, 'id'> & {
  id?: string;
};

export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'total_price'> & {
  id?: string;
};

export type NurseScheduleInsert = Omit<NurseSchedule, 'id'> & {
  id?: string;
};

export type PaymentInsert = Omit<Payment, 'id'> & {
  id?: string;
};

export type InventoryItemInsert = Omit<InventoryItem, 'id'> & {
  id?: string;
};
