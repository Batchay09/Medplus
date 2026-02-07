import { NextRequest, NextResponse } from 'next/server';

/**
 * Telegram webhook endpoint.
 * The bot can be configured to send updates here via setWebhook.
 * In development, the bot runs in polling mode, so this endpoint
 * is used only in production.
 */
export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update = await req.json();

    // Forward the update to the bot process via internal API
    // In production, the bot would process this directly
    console.log('Telegram webhook update:', JSON.stringify(update).slice(0, 200));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook endpoint active' });
}
