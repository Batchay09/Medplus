const API_BASE = '/api/miniapp';

function getInitData(): string {
  if (typeof window === 'undefined') return '';
  return window.Telegram?.WebApp?.initData || '';
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': getInitData(),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

export const miniappApi = {
  // Auth
  auth() {
    return request<{
      patient: {
        id: string;
        full_name: string;
        phone: string;
        address: string | null;
        birth_date: string | null;
        allergies: string | null;
      };
      isNew: boolean;
    }>('/auth', { method: 'POST' });
  },

  // Services
  getServices(category?: string) {
    const params = category ? `?category=${category}` : '';
    return request<{
      id: string;
      name: string;
      category: string;
      duration_minutes: number;
      base_price: number;
      supplies: { name: string; quantity: number }[] | null;
    }[]>(`/services${params}`);
  },

  // Orders
  getOrders() {
    return request<{
      id: string;
      status: string;
      requested_date: string;
      requested_time_from: string | null;
      address: string;
      service_price: number;
      total_price: number;
      service?: { name: string; category: string };
      nurse?: { full_name: string; phone: string } | null;
    }[]>('/orders');
  },

  createOrder(data: {
    service_id: string;
    address: string;
    lat?: number | null;
    lng?: number | null;
    requested_date: string;
    requested_time_from: string;
    requested_time_to: string;
    supplies_source: 'client' | 'company';
    notes?: string;
  }) {
    return request<{ id: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getOrder(id: string) {
    return request<{
      id: string;
      status: string;
      requested_date: string;
      requested_time_from: string | null;
      requested_time_to: string | null;
      address: string;
      service_price: number;
      surcharge: number;
      supplies_cost: number;
      total_price: number;
      supplies_source: string | null;
      notes: string | null;
      created_at: string;
      service?: { name: string; category: string; duration_minutes: number };
      nurse?: { full_name: string; phone: string } | null;
    }>(`/orders/${id}`);
  },

  // Patient profile
  getProfile() {
    return request<{
      id: string;
      full_name: string;
      phone: string;
      address: string | null;
      birth_date: string | null;
      allergies: string | null;
      total_orders: number;
      completed_orders: number;
    }>('/patient');
  },

  updateProfile(data: {
    full_name?: string;
    phone?: string;
    address?: string;
    birth_date?: string;
    allergies?: string;
  }) {
    return request<{ success: boolean }>('/patient', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Geocode
  reverseGeocode(lat: number, lng: number) {
    return request<{ address: string }>('/geocode', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
  },
};
