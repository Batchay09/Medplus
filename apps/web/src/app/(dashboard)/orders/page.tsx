import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatDate, formatMoney } from '@/lib/utils';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('orders')
    .select('*, patient:patients(full_name, phone), service:services(name, category), nurse:nurses(full_name)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (params.status) query = query.eq('status', params.status);
  if (params.date) query = query.eq('requested_date', params.date);

  const { data: orders } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Заявки</h1>
          <p className="text-muted-foreground">Управление заявками на медицинские услуги</p>
        </div>
        <Link href="/orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Новая заявка
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Link href="/orders">
              <Badge variant={!params.status ? 'default' : 'outline'} className="cursor-pointer">
                Все
              </Badge>
            </Link>
            {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
              <Link key={key} href={`/orders?status=${key}`}>
                <Badge
                  variant={params.status === key ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  {label}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пациент</TableHead>
                <TableHead>Услуга</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Медсестра</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(orders || []).map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                      {order.patient?.full_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{order.patient?.phone}</p>
                  </TableCell>
                  <TableCell>{order.service?.name}</TableCell>
                  <TableCell>{formatDate(order.requested_date)}</TableCell>
                  <TableCell>{order.nurse?.full_name || '—'}</TableCell>
                  <TableCell>{formatMoney(order.total_price || 0)}</TableCell>
                  <TableCell>
                    <Badge className={ORDER_STATUS_COLORS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!orders || orders.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Заявки не найдены
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
