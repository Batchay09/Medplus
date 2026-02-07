'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Service, Patient } from '@medplus/db';

export default function NewOrderPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    patient_id: '',
    service_id: '',
    requested_date: new Date().toISOString().split('T')[0],
    requested_time_from: '09:00',
    requested_time_to: '12:00',
    address: '',
    supplies_source: 'client' as 'client' | 'company',
    payment_method: 'cash' as 'cash' | 'card_transfer',
    is_urgent: false,
    notes: '',
    // New patient fields
    new_patient_name: '',
    new_patient_phone: '',
  });

  useEffect(() => {
    async function loadData() {
      const [servicesRes, patientsRes] = await Promise.all([
        supabase.from('services').select('*').eq('is_active', true).order('name'),
        supabase.from('patients').select('*').order('full_name'),
      ]);
      setServices((servicesRes.data || []) as Service[]);
      setPatients((patientsRes.data || []) as Patient[]);
    }
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let patientId = form.patient_id;

      // Create new patient if needed
      if (!patientId && form.new_patient_name && form.new_patient_phone) {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            full_name: form.new_patient_name,
            phone: form.new_patient_phone,
            address: form.address,
          })
          .select()
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      if (!patientId) {
        setError('Выберите пациента или создайте нового');
        setLoading(false);
        return;
      }

      const service = services.find((s) => s.id === form.service_id);
      if (!service) {
        setError('Выберите услугу');
        setLoading(false);
        return;
      }

      // Use the patient's address if no address specified
      const patient = patients.find((p) => p.id === patientId);
      const address = form.address || patient?.address || '';

      const { error: orderError } = await supabase.from('orders').insert({
        patient_id: patientId,
        service_id: form.service_id,
        status: 'new',
        source: 'phone',
        requested_date: form.requested_date,
        requested_time_from: form.requested_time_from,
        requested_time_to: form.requested_time_to,
        address,
        lat: patient?.lat,
        lng: patient?.lng,
        supplies_source: form.supplies_source,
        service_price: service.base_price,
        surcharge: form.is_urgent ? 500 : 0,
        payment_method: form.payment_method,
        is_urgent: form.is_urgent,
        notes: form.notes || null,
      });

      if (orderError) throw orderError;

      router.push('/orders');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ошибка создания заявки');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Новая заявка</h1>
        <p className="text-muted-foreground">Создание заявки по звонку</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Пациент</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Существующий пациент</label>
              <Select
                value={form.patient_id}
                onChange={(e) => {
                  setForm({ ...form, patient_id: e.target.value });
                  const patient = patients.find((p) => p.id === e.target.value);
                  if (patient?.address) {
                    setForm((f) => ({ ...f, patient_id: e.target.value, address: patient.address || '' }));
                  }
                }}
              >
                <option value="">-- Новый пациент --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.phone})
                  </option>
                ))}
              </Select>
            </div>

            {!form.patient_id && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">ФИО</label>
                  <Input
                    value={form.new_patient_name}
                    onChange={(e) => setForm({ ...form, new_patient_name: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Телефон</label>
                  <Input
                    value={form.new_patient_phone}
                    onChange={(e) => setForm({ ...form, new_patient_phone: e.target.value })}
                    placeholder="+79281234567"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Услуга</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Процедура</label>
              <Select
                value={form.service_id}
                onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                required
              >
                <option value="">Выберите услугу</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.base_price} руб. ({s.duration_minutes} мин)
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="urgent"
                checked={form.is_urgent}
                onChange={(e) => setForm({ ...form, is_urgent: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="urgent" className="text-sm">Срочный вызов (+500 руб.)</label>
            </div>
          </CardContent>
        </Card>

        {/* Date, Time, Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Время и адрес</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Дата</label>
                <Input
                  type="date"
                  value={form.requested_date}
                  onChange={(e) => setForm({ ...form, requested_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Время от</label>
                <Input
                  type="time"
                  value={form.requested_time_from}
                  onChange={(e) => setForm({ ...form, requested_time_from: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Время до</label>
                <Input
                  type="time"
                  value={form.requested_time_to}
                  onChange={(e) => setForm({ ...form, requested_time_to: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Адрес</label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="г. Черкесск, ул. ..."
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Supplies & Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Расходники и оплата</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Кто покупает лекарства</label>
                <Select
                  value={form.supplies_source}
                  onChange={(e) => setForm({ ...form, supplies_source: e.target.value as any })}
                >
                  <option value="client">Клиент сам</option>
                  <option value="company">Мы доставим (+500 руб.)</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Способ оплаты</label>
                <Select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value as any })}
                >
                  <option value="cash">Наличные</option>
                  <option value="card_transfer">Перевод на карту</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Заметки</label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Дополнительная информация..."
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Создание...' : 'Создать заявку'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}
