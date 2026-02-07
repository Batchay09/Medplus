import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, formatPhone } from '@/lib/utils';
import Link from 'next/link';

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('patients')
    .select('*, orders:orders(count)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
  }

  const { data: patients } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Пациенты</h1>
        <p className="text-muted-foreground">База клиентов</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form method="GET" className="flex gap-2">
            <input
              name="search"
              defaultValue={params.search}
              placeholder="Поиск по имени или телефону..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Найти
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Адрес</TableHead>
                <TableHead>Telegram</TableHead>
                <TableHead>Дата рождения</TableHead>
                <TableHead>Аллергии</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(patients || []).map((patient: any) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.full_name}</TableCell>
                  <TableCell>{formatPhone(patient.phone)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{patient.address || '—'}</TableCell>
                  <TableCell>{patient.telegram_id ? 'Да' : '—'}</TableCell>
                  <TableCell>{patient.birth_date ? formatDate(patient.birth_date) : '—'}</TableCell>
                  <TableCell className="max-w-[150px] truncate text-orange-600">
                    {patient.allergies || '—'}
                  </TableCell>
                </TableRow>
              ))}
              {(!patients || patients.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Пациенты не найдены
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
