import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/telegram/validate';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getPatientByTelegramId, createPatient } from '@medplus/db';

export async function POST(req: NextRequest) {
  const initData = req.headers.get('x-telegram-init-data');
  if (!initData) {
    return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
  }

  const { valid, user } = validateInitData(initData);
  if (!valid || !user) {
    return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Find existing patient by telegram_id
  let patient = await getPatientByTelegramId(supabase, user.id);
  let isNew = false;

  if (!patient) {
    // Auto-create patient
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    patient = await createPatient(supabase, {
      full_name: fullName,
      phone: '',
      telegram_id: user.id,
      address: null,
      lat: null,
      lng: null,
      birth_date: null,
      allergies: null,
      notes: null,
    });
    isNew = true;
  }

  return NextResponse.json({
    patient: {
      id: patient.id,
      full_name: patient.full_name,
      phone: patient.phone,
      address: patient.address,
      birth_date: patient.birth_date,
      allergies: patient.allergies,
    },
    isNew,
  });
}
