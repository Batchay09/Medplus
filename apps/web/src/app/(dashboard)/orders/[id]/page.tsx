import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  formatDate,
  formatTime,
  formatMoney,
  formatPhone,
  SERVICE_CATEGORY_LABELS,
} from '@/lib/utils';
import { notFound } from 'next/navigation';
import { OrderActions } from './order-actions';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      patient:patients(*),
      service:services(*),
      nurse:nurses(*),
      driver:drivers(*),
      payments(*)
    `)
    .eq('id', id)
    .single();

  if (!order) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Заявка</h1>
          <p className="text-muted-foreground text-xs">ID: {order.id}</p>
        </div>
        <Badge className={`text-base px-4 py-1 ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Пациент</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">ФИО:</span> {order.patient?.full_name}</p>
            <p><span className="text-muted-foreground">Телефон:</span> {formatPhone(order.patient?.phone || '')}</p>
            <p><span className="text-muted-foreground">Адрес:</span> {order.address}</p>
            {order.patient?.allergies && (
              <p className="text-orange-600">
                <span className="text-muted-foreground">Аллергии:</span> {order.patient.allergies}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Service info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Услуга</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Процедура:</span> {order.service?.name}</p>
            <p><span className="text-muted-foreground">Категория:</span> {SERVICE_CATEGORY_LABELS[order.service?.category || '']}</p>
            <p><span className="text-muted-foreground">Длительность:</span> {order.service?.duration_minutes} мин.</p>
            <p><span className="text-muted-foreground">Источник:</span> {order.source === 'telegram' ? 'Telegram' : order.source === 'phone' ? 'Телефон' : 'Сайт'}</p>
            {order.is_urgent && <Badge className="bg-red-100 text-red-700">Срочный</Badge>}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Время</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Дата:</span> {formatDate(order.requested_date)}</p>
            {order.requested_time_from && (
              <p><span className="text-muted-foreground">Желаемое время:</span> {formatTime(order.requested_time_from)} — {formatTime(order.requested_time_to || '')}</p>
            )}
            {order.scheduled_at && (
              <p><span className="text-muted-foreground">Назначенное:</span> {new Date(order.scheduled_at).toLocaleString('ru-RU')}</p>
            )}
            {order.started_at && (
              <p><span className="text-muted-foreground">Начало:</span> {new Date(order.started_at).toLocaleString('ru-RU')}</p>
            )}
            {order.completed_at && (
              <p><span className="text-muted-foreground">Завершение:</span> {new Date(order.completed_at).toLocaleString('ru-RU')}</p>
            )}
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Назначение</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Медсестра:</span>{' '}
              {order.nurse?.full_name || <span className="text-orange-600">Не назначена</span>}
            </p>
            <p>
              <span className="text-muted-foreground">Водитель:</span>{' '}
              {order.driver?.full_name || <span className="text-muted-foreground">Не назначен</span>}
            </p>
          </CardContent>
        </Card>

        {/* Finances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Финансы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Стоимость услуги:</span> {formatMoney(order.service_price)}</p>
            <p><span className="text-muted-foreground">Расходники:</span> {formatMoney(order.supplies_cost)}</p>
            <p><span className="text-muted-foreground">Доплата:</span> {formatMoney(order.surcharge)}</p>
            <p className="font-bold"><span className="text-muted-foreground">Итого:</span> {formatMoney(order.total_price || 0)}</p>
            <p><span className="text-muted-foreground">Оплата:</span> {order.payment_method === 'cash' ? 'Наличные' : 'Перевод на карту'}</p>
            <p>
              <span className="text-muted-foreground">Статус оплаты:</span>{' '}
              <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'}>
                {order.payment_status === 'paid' ? 'Оплачено' : order.payment_status === 'partial' ? 'Частично' : 'Ожидает'}
              </Badge>
            </p>
          </CardContent>
        </Card>

        {/* Notes */}
        {order.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Заметки</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <OrderActions order={order} />
    </div>
  );
}
