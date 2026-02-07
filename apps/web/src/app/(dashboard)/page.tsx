import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatTime, formatMoney } from '@/lib/utils';
import Link from 'next/link';
import { ClipboardList, DollarSign, Users, AlertTriangle } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  // Parallel data fetching
  const [ordersRes, inventoryRes, nursesRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*, patient:patients(full_name), service:services(name), nurse:nurses(full_name)')
      .eq('requested_date', today)
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('inventory')
      .select('*')
      .lt('quantity', 10), // Low stock items (using raw threshold for quick check)
    supabase
      .from('nurses')
      .select('*')
      .eq('is_active', true),
  ]);

  const orders = ordersRes.data || [];
  const lowStockItems = (inventoryRes.data || []).filter(
    (item: { quantity: number; min_quantity: number }) => item.quantity <= item.min_quantity
  );
  const activeNurses = nursesRes.data || [];

  const completedOrders = orders.filter((o: { status: string }) => o.status === 'completed');
  const revenue = completedOrders.reduce(
    (sum: number, o: { total_price: number | null }) => sum + (o.total_price || 0),
    0
  );
  const unassigned = orders.filter((o: { status: string }) => o.status === 'new').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Дашборд</h1>
        <p className="text-muted-foreground">Сегодня, {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Заявки сегодня</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedOrders.length} выполнено
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Выручка</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(revenue)}</div>
            <p className="text-xs text-muted-foreground">оплаченные заказы</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Медсёстры</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeNurses.length}</div>
            <p className="text-xs text-muted-foreground">активных</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Алерты</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassigned + lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              {unassigned > 0 && `${unassigned} неназначенных`}
              {unassigned > 0 && lowStockItems.length > 0 && ', '}
              {lowStockItems.length > 0 && `${lowStockItems.length} мало на складе`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Заявки на сегодня</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет заявок на сегодня</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-sm">{order.patient?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.service?.name} | {order.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.scheduled_at && (
                      <span className="text-sm text-muted-foreground">
                        {formatTime(new Date(order.scheduled_at).toTimeString())}
                      </span>
                    )}
                    <Badge className={ORDER_STATUS_COLORS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    {order.nurse?.full_name && (
                      <span className="text-xs text-muted-foreground">
                        {order.nurse.full_name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg text-orange-600">Низкий запас расходников</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {lowStockItems.map((item: any) => (
                <div key={item.id} className="p-2 bg-orange-50 rounded text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-orange-600">
                    {item.quantity} {item.unit} (мин: {item.min_quantity})
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
