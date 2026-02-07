import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/telegram/validate';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getServices, getServicesByCategory } from '@medplus/db';
import type { ServiceCategory } from '@medplus/db';

export async function GET(req: NextRequest) {
  const initData = req.headers.get('x-telegram-init-data');
  if (!initData) {
    return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
  }

  const { valid } = validateInitData(initData);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') as ServiceCategory | null;

  const services = category
    ? await getServicesByCategory(supabase, category)
    : await getServices(supabase, { active_only: true });

  return NextResponse.json(services);
}
