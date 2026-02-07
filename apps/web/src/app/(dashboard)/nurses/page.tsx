import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPhone } from '@/lib/utils';

const SKILL_LABELS: Record<string, string> = {
  iv_drip: 'Капельницы',
  injection: 'Инъекции',
  bandage: 'Перевязки',
  blood_test: 'Забор крови',
};

export default async function NursesPage() {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  const [nursesRes, ordersRes, schedulesRes] = await Promise.all([
    supabase.from('nurses').select('*').order('full_name'),
    supabase
      .from('orders')
      .select('nurse_id, status')
      .eq('requested_date', today)
      .not('status', 'in', '("completed","cancelled")'),
    supabase
      .from('nurse_schedules')
      .select('nurse_id, start_time, end_time')
      .eq('date', today)
      .eq('is_available', true),
  ]);

  const nurses = nursesRes.data || [];
  const todayOrders = ordersRes.data || [];
  const todaySchedules = schedulesRes.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Медсёстры</h1>
        <p className="text-muted-foreground">Управление персоналом</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Навыки</TableHead>
                <TableHead>Сегодня</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nurses.map((nurse: any) => {
                const activeOrders = todayOrders.filter(
                  (o: any) => o.nurse_id === nurse.id
                );
                const schedule = todaySchedules.find(
                  (s: any) => s.nurse_id === nurse.id
                );
                const isBusy = activeOrders.some(
                  (o: any) => o.status === 'procedure_started' || o.status === 'nurse_arrived'
                );

                return (
                  <TableRow key={nurse.id}>
                    <TableCell className="font-medium">{nurse.full_name}</TableCell>
                    <TableCell>{formatPhone(nurse.phone)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(nurse.skills || []).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {SKILL_LABELS[skill] || skill}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {schedule ? (
                        <span className="text-sm">
                          {schedule.start_time.slice(0, 5)} — {schedule.end_time.slice(0, 5)}
                          <span className="text-muted-foreground ml-2">
                            ({activeOrders.length} заказов)
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Выходной</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!nurse.is_active ? (
                        <Badge variant="outline">Неактивна</Badge>
                      ) : isBusy ? (
                        <Badge className="bg-yellow-100 text-yellow-700">На процедуре</Badge>
                      ) : schedule ? (
                        <Badge className="bg-green-100 text-green-700">Свободна</Badge>
                      ) : (
                        <Badge variant="outline">Выходной</Badge>
                      )}
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
