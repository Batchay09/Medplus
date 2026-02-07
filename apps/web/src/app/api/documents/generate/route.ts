import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import {
  generateContract,
  generateConsent,
  generateServiceAct,
  generateReceipt,
} from '@medplus/documents';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseAdmin();
  const { order_id, type } = await req.json();

  if (!order_id || !type) {
    return NextResponse.json({ error: 'order_id and type are required' }, { status: 400 });
  }

  // Get order with all relations
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, patient:patients(*), service:services(*), nurse:nurses(*)')
    .eq('id', order_id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  let pdfBytes: Uint8Array;
  let filename: string;

  switch (type) {
    case 'contract':
      pdfBytes = await generateContract(order.patient, order, order.service);
      filename = `contract-${order_id.slice(0, 8)}.pdf`;
      break;

    case 'consent':
      pdfBytes = await generateConsent(order.patient, order.service);
      filename = `consent-${order_id.slice(0, 8)}.pdf`;
      break;

    case 'act':
      if (!order.nurse) {
        return NextResponse.json({ error: 'Nurse not assigned' }, { status: 400 });
      }
      pdfBytes = await generateServiceAct(order.patient, order, order.service, order.nurse);
      filename = `act-${order_id.slice(0, 8)}.pdf`;
      break;

    default:
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
  }

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}
