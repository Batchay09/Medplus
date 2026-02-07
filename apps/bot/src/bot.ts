import 'dotenv/config';
import { Bot, session, type Context } from 'grammy';
import { conversations, createConversation, type ConversationFlavor } from '@grammyjs/conversations';
import { createClient } from '@supabase/supabase-js';
import { setupCommands } from './commands/index';
import { bookingConversation } from './conversations/booking';
import { mainMenuKeyboard } from './keyboards/main-menu';

// Types
export interface SessionData {
  patient_id?: string;
}

export type BotContext = Context & ConversationFlavor & {
  session: SessionData;
};

// Supabase client for the bot
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Create bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}

const bot = new Bot<BotContext>(token);

// Session middleware
bot.use(session({ initial: (): SessionData => ({}) }));

// Conversations plugin
bot.use(conversations());
bot.use(createConversation(bookingConversation));

// Commands
setupCommands(bot);

// Main menu callback handlers
bot.callbackQuery('book_procedure', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter('bookingConversation');
});

bot.callbackQuery('my_orders', async (ctx) => {
  await ctx.answerCallbackQuery();

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('telegram_id', telegramId)
    .single();

  if (!patient) {
    await ctx.reply('У вас пока нет записей. Нажмите "Записаться на процедуру" для начала.');
    return;
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*, service:services(name)')
    .eq('patient_id', patient.id)
    .not('status', 'in', '("completed","cancelled")')
    .order('requested_date', { ascending: true })
    .limit(5);

  if (!orders || orders.length === 0) {
    await ctx.reply('У вас нет активных записей.');
    return;
  }

  const statusEmoji: Record<string, string> = {
    new: '🆕',
    confirmed: '✅',
    assigned: '👩‍⚕️',
    in_progress: '🚗',
    nurse_on_way: '🚗',
    nurse_arrived: '🏠',
    procedure_started: '💉',
  };

  const statusLabel: Record<string, string> = {
    new: 'Новая',
    confirmed: 'Подтверждена',
    assigned: 'Медсестра назначена',
    in_progress: 'Водитель в пути',
    nurse_on_way: 'Медсестра в пути',
    nurse_arrived: 'Медсестра на месте',
    procedure_started: 'Процедура идёт',
  };

  let message = '📋 *Ваши записи:*\n\n';
  for (const order of orders) {
    const emoji = statusEmoji[order.status] || '📌';
    const label = statusLabel[order.status] || order.status;
    message += `${emoji} *${order.service?.name}*\n`;
    message += `   Дата: ${order.requested_date}\n`;
    message += `   Статус: ${label}\n`;
    message += `   Адрес: ${order.address}\n\n`;
  }

  await ctx.reply(message, { parse_mode: 'Markdown' });
});

bot.callbackQuery('contact_us', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    '📞 *Связаться с нами:*\n\n' +
    'Телефон: +7 (928) 300-10-00\n' +
    'Время работы: 8:00 — 20:00\n\n' +
    'Или напишите сообщение прямо сюда, и мы ответим вам в ближайшее время.',
    { parse_mode: 'Markdown' }
  );
});

// Handle text messages (not in conversation)
bot.on('message:text', async (ctx) => {
  // If the user sends a message outside of a conversation, show the main menu
  if (ctx.message.text === '/menu' || ctx.message.text === 'Меню') {
    await ctx.reply('Главное меню:', { reply_markup: mainMenuKeyboard });
    return;
  }

  // Forward other messages as a contact request
  await ctx.reply(
    'Спасибо за сообщение! Наш менеджер свяжется с вами в ближайшее время.\n\n' +
    'Для записи на процедуру нажмите /start'
  );
});

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Start the bot
console.log('Starting MedPlus Telegram bot...');
bot.start({
  onStart: () => console.log('MedPlus bot is running'),
});
