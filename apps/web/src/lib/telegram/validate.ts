import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface ValidateResult {
  valid: boolean;
  user: TelegramUser | null;
}

/**
 * Validate Telegram WebApp initData using HMAC-SHA256.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string): ValidateResult {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return { valid: false, user: null };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { valid: false, user: null };

  // Build the data-check-string
  params.delete('hash');
  const entries = Array.from(params.entries());
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  // HMAC-SHA256 with secret key derived from bot token
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) {
    return { valid: false, user: null };
  }

  // Extract user
  const userStr = params.get('user');
  if (!userStr) return { valid: false, user: null };

  try {
    const user = JSON.parse(userStr) as TelegramUser;
    return { valid: true, user };
  } catch {
    return { valid: false, user: null };
  }
}
