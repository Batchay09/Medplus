'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OrderStatus } from '@medplus/db';

const STATUS_TRANSITIONS: Record<string, { label: string; next: OrderStatus; variant?: string }[]> = {
  new: [
    { label: 'Подтвердить', next: 'confirmed' },
    { label: 'Отменить', next: 'cancelled', variant: 'destructive' },
  ],
  confirmed: [
    { label: 'Автоназначить медсестру', next: 'assigned' },
    { label: 'Отменить', next: 'cancelled', variant: 'destructive' },
  ],
  assigned: [
    { label: 'Водитель выехал', next: 'in_progress' },
    { label: 'Отменить', next: 'cancelled', variant: 'destructive' },
  ],
  in_progress: [
    { label: 'Медсестра в пути', next: 'nurse_on_way' },
  ],
  nurse_on_way: [
    { label: 'Медсестра на месте', next: 'nurse_arrived' },
  ],
  nurse_arrived: [
    { label: 'Процедура началась', next: 'procedure_started' },
  ],
  procedure_started: [
    { label: 'Процедура завершена', next: 'completed' },
  ],
};

export function OrderActions({ order }: { order: any }) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState<string | null>(null);

  const transitions = STATUS_TRANSITIONS[order.status] || [];

  async function handleStatusChange(nextStatus: OrderStatus) {
    setLoading(nextStatus);
    try {
      if (nextStatus === 'assigned') {
        // Call the auto-assignment API
        const res = await fetch(`/api/scheduling/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: order.id }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Ошибка автоназначения');
          return;
        }
      } else {
        const { error } = await supabase
          .from('orders')
          .update({
            status: nextStatus,
            updated_at: new Date().toISOString(),
            ...(nextStatus === 'procedure_started' ? { started_at: new Date().toISOString() } : {}),
            ...(nextStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
          })
          .eq('id', order.id);

        if (error) {
          alert('Ошибка: ' + error.message);
          return;
        }
      }

      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleConfirmPayment() {
    setLoading('payment');
    try {
      await supabase.from('payments').insert({
        order_id: order.id,
        amount: order.total_price || 0,
        method: order.payment_method || 'cash',
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      });

      await supabase
        .from('orders')
        .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', order.id);

      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerateDocument(type: 'contract' | 'consent' | 'act') {
    setLoading(type);
    try {
      const res = await fetch(`/api/documents/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, type }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Ошибка генерации');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } finally {
      setLoading(null);
    }
  }

  if (order.status === 'cancelled' || order.status === 'completed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Документы</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => handleGenerateDocument('contract')} disabled={!!loading}>
            Договор (PDF)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleGenerateDocument('consent')} disabled={!!loading}>
            Согласие (PDF)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleGenerateDocument('act')} disabled={!!loading}>
            Акт (PDF)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Действия</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          {transitions.map((t) => (
            <Button
              key={t.next}
              variant={(t.variant as any) || 'default'}
              onClick={() => handleStatusChange(t.next)}
              disabled={loading === t.next}
            >
              {loading === t.next ? 'Загрузка...' : t.label}
            </Button>
          ))}

          {order.payment_status !== 'paid' && (
            <Button
              variant="outline"
              onClick={handleConfirmPayment}
              disabled={loading === 'payment'}
            >
              {loading === 'payment' ? '...' : 'Подтвердить оплату'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Документы</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => handleGenerateDocument('contract')} disabled={!!loading}>
            Договор (PDF)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleGenerateDocument('consent')} disabled={!!loading}>
            Согласие (PDF)
          </Button>
          {order.status === 'completed' && (
            <Button variant="outline" size="sm" onClick={() => handleGenerateDocument('act')} disabled={!!loading}>
              Акт (PDF)
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
