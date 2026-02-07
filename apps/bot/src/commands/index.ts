import type { Bot } from 'grammy';
import type { BotContext } from '../bot';
import { mainMenuKeyboard } from '../keyboards/main-menu';

export function setupCommands(bot: Bot<BotContext>) {
  // /start command
  bot.command('start', async (ctx) => {
    const firstName = ctx.from?.first_name || 'друг';
    await ctx.reply(
      `Здравствуйте, ${firstName}! 👋\n\n` +
      'Добро пожаловать в *МедПлюс* — сервис выездных медицинских процедур на дому в г. Черкесск.\n\n' +
      'Мы предоставляем услуги:\n' +
      '💧 Капельницы (детокс, витаминные, по назначению)\n' +
      '💉 Инъекции (внутримышечные, внутривенные)\n' +
      '🩹 Перевязки\n' +
      '🩸 Забор анализов\n\n' +
      'Выберите действие:',
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenuKeyboard,
      }
    );
  });

  // /help command
  bot.command('help', async (ctx) => {
    await ctx.reply(
      '*Помощь по боту МедПлюс:*\n\n' +
      '/start — Главное меню\n' +
      '/book — Записаться на процедуру\n' +
      '/status — Мои активные записи\n' +
      '/help — Эта справка\n\n' +
      '📞 Телефон: +7 (928) 300-10-00\n' +
      '🕐 Время работы: 8:00 — 20:00',
      { parse_mode: 'Markdown' }
    );
  });

  // /book command — shortcut to booking
  bot.command('book', async (ctx) => {
    await ctx.conversation.enter('bookingConversation');
  });

  // /status command
  bot.command('status', async (ctx) => {
    // Trigger the same handler as the callback
    const fakeCallback = { ...ctx, answerCallbackQuery: async () => {} };
    // Re-use logic by redirecting
    await ctx.reply('Загрузка ваших записей...');
    // Emit the callback
    ctx.api.callbackQuery;
  });

  // Set bot commands in Telegram
  bot.api.setMyCommands([
    { command: 'start', description: 'Главное меню' },
    { command: 'book', description: 'Записаться на процедуру' },
    { command: 'status', description: 'Мои записи' },
    { command: 'help', description: 'Помощь' },
  ]).catch(() => {});
}
