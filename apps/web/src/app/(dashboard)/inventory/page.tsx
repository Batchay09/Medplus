import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMoney } from '@/lib/utils';

export default async function InventoryPage() {
  const supabase = await createSupabaseServerClient();

  const { data: items } = await supabase
    .from('inventory')
    .select('*')
    .order('category')
    .order('name');

  const allItems = items || [];
  const lowStock = allItems.filter((i: any) => i.quantity <= i.min_quantity);
  const totalValue = allItems.reduce(
    (sum: number, i: any) => sum + (i.quantity * (i.purchase_price || 0)),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Склад</h1>
        <p className="text-muted-foreground">Учёт расходных материалов</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего позиций</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Низкий запас</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStock.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Стоимость склада</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg text-orange-600">Требуется закупка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((item: any) => (
                <Badge key={item.id} className="bg-orange-100 text-orange-700">
                  {item.name}: {item.quantity} {item.unit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full inventory table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Наименование</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Количество</TableHead>
                <TableHead>Мин. запас</TableHead>
                <TableHead>Ед. изм.</TableHead>
                <TableHead>Цена закупки</TableHead>
                <TableHead>Стоимость</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allItems.map((item: any) => {
                const isLow = item.quantity <= item.min_quantity;
                return (
                  <TableRow key={item.id} className={isLow ? 'bg-orange-50' : ''}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category || '—'}</TableCell>
                    <TableCell>
                      <span className={isLow ? 'text-orange-600 font-bold' : ''}>
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{item.min_quantity}</TableCell>
                    <TableCell>{item.unit || '—'}</TableCell>
                    <TableCell>{item.purchase_price ? formatMoney(item.purchase_price) : '—'}</TableCell>
                    <TableCell>
                      {item.purchase_price ? formatMoney(item.quantity * item.purchase_price) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
