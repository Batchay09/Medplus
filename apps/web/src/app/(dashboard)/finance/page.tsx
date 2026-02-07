import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatMoney } from '@/lib/utils';

export default async function FinancePage() {
  const supabase = await createSupabaseServerClient();
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [paymentsRes, ordersDebtRes, todayOrdersRes] = await Promise.all([
    supabase
      .from('payments')
      .select('*, order:orders(id, patient_id, patient:patients(full_name))')
      .eq('status', 'confirmed')
      .gte('confirmed_at', startOfMonth + 'T00:00:00')
      .lte('confirmed_at', endOfMonth + 'T23:59:59')
      .order('confirmed_at', { ascending: false }),
    supabase
      .from('orders')
      .select('*, patient:patients(full_name)')
      .eq('payment_status', 'pending')
      .eq('status', 'completed'),
    supabase
      .from('orders')
      .select('total_price, payment_status')
      .eq('requested_date', todayStr)
      .eq('status', 'completed'),
  ]);

  const payments = paymentsRes.data || [];
  const debts = ordersDebtRes.data || [];
  const todayOrders = todayOrdersRes.data || [];

  const monthTotal = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const monthCash = payments.filter((p: any) => p.method === 'cash').reduce((sum: number, p: any) => sum + p.amount, 0);
  const monthCard = payments.filter((p: any) => p.method === 'card_transfer').reduce((sum: number, p: any) => sum + p.amount, 0);
  const todayRevenue = todayOrders
    .filter((o: any) => o.payment_status === 'paid')
    .reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
  const totalDebt = debts.reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Финансы</h1>
        <p className="text-muted-foreground">
          {today.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Выручка за месяц</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(monthTotal)}</div>
            <p className="text-xs text-muted-foreground">{payments.length} платежей</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(todayRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Наличные / Карта</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatMoney(monthCash)} / {formatMoney(monthCard)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Задолженности</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatMoney(totalDebt)}</div>
            <p className="text-xs text-muted-foreground">{debts.length} неоплаченных</p>
          </CardContent>
        </Card>
      </div>

      {/* Debts */}
      {debts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg text-orange-600">Неоплаченные заказы</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пациент</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <a href={`/orders/${order.id}`} className="hover:underline font-medium">
                        {order.patient?.full_name}
                      </a>
                    </TableCell>
                    <TableCell>{formatDate(order.requested_date)}</TableCell>
                    <TableCell className="font-bold text-orange-600">
                      {formatMoney(order.total_price || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Последние платежи</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Пациент</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Способ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.slice(0, 20).map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.confirmed_at ? formatDate(payment.confirmed_at) : '—'}</TableCell>
                  <TableCell>{payment.order?.patient?.full_name || '—'}</TableCell>
                  <TableCell className="font-medium">{formatMoney(payment.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {payment.method === 'cash' ? 'Наличные' : 'Перевод'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Нет платежей за этот месяц
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
