import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatTime } from '@/lib/utils';

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const date = params.date || new Date().toISOString().split('T')[0];

  // Get all nurses and their orders for the day
  const [nursesRes, ordersRes, schedulesRes] = await Promise.all([
    supabase.from('nurses').select('*').eq('is_active', true).order('full_name'),
    supabase
      .from('orders')
      .select('*, service:services(name, duration_minutes), patient:patients(full_name)')
      .eq('requested_date', date)
      .not('status', 'eq', 'cancelled')
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('nurse_schedules')
      .select('*')
      .eq('date', date),
  ]);

  const nurses = nursesRes.data || [];
  const orders = ordersRes.data || [];
  const schedules = schedulesRes.data || [];

  // Hours for timeline (8:00 - 20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Расписание</h1>
          <p className="text-muted-foreground">
            {new Date(date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/schedule?date=${getPrevDate(date)}`}
            className="px-3 py-1 border rounded text-sm hover:bg-muted"
          >
            &larr; Пред.
          </a>
          <a
            href="/schedule"
            className="px-3 py-1 border rounded text-sm hover:bg-muted"
          >
            Сегодня
          </a>
          <a
            href={`/schedule?date=${getNextDate(date)}`}
            className="px-3 py-1 border rounded text-sm hover:bg-muted"
          >
            След. &rarr;
          </a>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline header */}
            <div className="flex border-b pb-2 mb-4">
              <div className="w-48 flex-shrink-0 font-medium text-sm">Медсестра</div>
              <div className="flex-1 flex">
                {hours.map((h) => (
                  <div key={h} className="flex-1 text-center text-xs text-muted-foreground">
                    {h}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Nurse rows */}
            {nurses.map((nurse: any) => {
              const nurseSchedule = schedules.find(
                (s: any) => s.nurse_id === nurse.id
              );
              const nurseOrders = orders.filter(
                (o: any) => o.nurse_id === nurse.id
              );

              return (
                <div key={nurse.id} className="flex items-stretch border-b py-2 min-h-[50px]">
                  <div className="w-48 flex-shrink-0 text-sm flex items-center">
                    <div>
                      <p className="font-medium">{nurse.full_name.split(' ').slice(0, 2).join(' ')}</p>
                      {nurseSchedule ? (
                        <p className="text-xs text-muted-foreground">
                          {formatTime(nurseSchedule.start_time)} — {formatTime(nurseSchedule.end_time)}
                        </p>
                      ) : (
                        <p className="text-xs text-orange-500">Нет слотов</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 relative bg-muted/30 rounded">
                    {/* Working hours background */}
                    {nurseSchedule && (
                      <div
                        className="absolute top-0 bottom-0 bg-green-50 rounded"
                        style={{
                          left: `${((timeToHour(nurseSchedule.start_time) - 8) / 12) * 100}%`,
                          width: `${((timeToHour(nurseSchedule.end_time) - timeToHour(nurseSchedule.start_time)) / 12) * 100}%`,
                        }}
                      />
                    )}
                    {/* Order blocks */}
                    {nurseOrders.map((order: any) => {
                      const startHour = order.scheduled_at
                        ? new Date(order.scheduled_at).getHours() + new Date(order.scheduled_at).getMinutes() / 60
                        : timeToHour(order.requested_time_from || '09:00');
                      const duration = (order.service?.duration_minutes || 60) / 60;

                      return (
                        <a
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="absolute top-1 bottom-1 rounded px-1 text-xs flex items-center overflow-hidden border hover:opacity-80"
                          style={{
                            left: `${((startHour - 8) / 12) * 100}%`,
                            width: `${(duration / 12) * 100}%`,
                            backgroundColor: 'hsl(210 80% 45% / 0.15)',
                            borderColor: 'hsl(210 80% 45% / 0.3)',
                          }}
                          title={`${order.patient?.full_name} — ${order.service?.name}`}
                        >
                          <span className="truncate">
                            {order.patient?.full_name?.split(' ')[0]} — {order.service?.name}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {nurses.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Нет активных медсестёр</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unassigned orders */}
      {orders.filter((o: any) => !o.nurse_id).length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg text-orange-600">Неназначенные заявки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orders
                .filter((o: any) => !o.nurse_id)
                .map((order: any) => (
                  <a
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between p-2 rounded border hover:bg-muted/50"
                  >
                    <span className="text-sm">{order.patient?.full_name} — {order.service?.name}</span>
                    <Badge className={ORDER_STATUS_COLORS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </a>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function timeToHour(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + (m || 0) / 60;
}

function getPrevDate(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getNextDate(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
