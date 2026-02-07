import { Bot } from 'grammy';
import { supabase } from './bot';

/**
 * Send a notification to a patient via Telegram.
 */
export async function notifyPatient(
  bot: Bot,
  patientId: string,
  message: string
): Promise<boolean> {
  const { data: patient } = await supabase
    .from('patients')
    .select('telegram_id')
    .eq('id', patientId)
    .single();

  if (!patient?.telegram_id) return false;

  try {
    await bot.api.sendMessage(patient.telegram_id, message, {
      parse_mode: 'Markdown',
    });
    await logNotification('patient', patientId, 'telegram', message);
    return true;
  } catch (err) {
    console.error(`Failed to notify patient ${patientId}:`, err);
    return false;
  }
}

/**
 * Send a notification to a nurse via Telegram.
 */
export async function notifyNurse(
  bot: Bot,
  nurseId: string,
  message: string
): Promise<boolean> {
  const { data: nurse } = await supabase
    .from('nurses')
    .select('telegram_id')
    .eq('id', nurseId)
    .single();

  if (!nurse?.telegram_id) return false;

  try {
    await bot.api.sendMessage(nurse.telegram_id, message, {
      parse_mode: 'Markdown',
    });
    await logNotification('nurse', nurseId, 'telegram', message);
    return true;
  } catch (err) {
    console.error(`Failed to notify nurse ${nurseId}:`, err);
    return false;
  }
}

/**
 * Send a notification to a driver via Telegram.
 */
export async function notifyDriver(
  bot: Bot,
  driverId: string,
  message: string
): Promise<boolean> {
  const { data: driver } = await supabase
    .from('drivers')
    .select('telegram_id')
    .eq('id', driverId)
    .single();

  if (!driver?.telegram_id) return false;

  try {
    await bot.api.sendMessage(driver.telegram_id, message, {
      parse_mode: 'Markdown',
    });
    await logNotification('driver', driverId, 'telegram', message);
    return true;
  } catch (err) {
    console.error(`Failed to notify driver ${driverId}:`, err);
    return false;
  }
}

/**
 * Log a notification in the database.
 */
async function logNotification(
  recipientType: string,
  recipientId: string,
  channel: string,
  message: string
) {
  await supabase.from('notifications').insert({
    recipient_type: recipientType,
    recipient_id: recipientId,
    channel,
    message,
    delivered: true,
  });
}

// ============================================================
// Pre-built notification messages
// ============================================================

export const messages = {
  orderConfirmed: (serviceName: string, date: string, time: string) =>
    `✅ *Ваша заявка подтверждена!*\n\n` +
    `*${serviceName}*\n` +
    `📅 ${date}, ${time}\n\n` +
    `Мы назначим медсестру и сообщим вам.`,

  nurseAssigned: (nurseName: string) =>
    `👩‍⚕️ *Вам назначена медсестра:* ${nurseName}\n\n` +
    `Мы сообщим, когда водитель выедет.`,

  driverOnWay: () =>
    `🚗 *Водитель выехал за медсестрой.*\n\n` +
    `Скоро медсестра будет у вас.`,

  nurseOnWay: (minutes: number) =>
    `👩‍⚕️ *Медсестра в пути!*\n\n` +
    `Ориентировочное время прибытия: ~${minutes} мин.`,

  procedureStarted: () =>
    `💉 *Процедура началась.*\n\n` +
    `Желаем скорейшего выздоровления!`,

  procedureCompleted: () =>
    `✅ *Процедура завершена!*\n\n` +
    `Спасибо, что выбрали МедПлюс. Будем рады видеть вас снова!`,

  reminder: (serviceName: string, date: string, time: string) =>
    `⏰ *Напоминание:*\n\n` +
    `Завтра у вас запланирована процедура:\n` +
    `*${serviceName}*\n` +
    `📅 ${date}, ${time}\n\n` +
    `Если хотите отменить или перенести — свяжитесь с нами.`,

  // Nurse messages
  nurseNewOrder: (patientName: string, address: string, serviceName: string, time: string) =>
    `📋 *Новый заказ:*\n\n` +
    `*${serviceName}*\n` +
    `👤 ${patientName}\n` +
    `📍 ${address}\n` +
    `🕐 ${time}`,

  nurseOrderCompleted: () =>
    `✅ *Заказ отмечен как завершённый.*\n` +
    `Ожидайте водителя.`,

  // Driver messages
  driverNewPoint: (address: string, nurseName: string) =>
    `📍 *Новая точка в маршруте:*\n\n` +
    `Адрес: ${address}\n` +
    `Медсестра: ${nurseName}`,

  driverPickupNurse: (address: string, nurseName: string) =>
    `🚗 *Заберите медсестру:*\n\n` +
    `${nurseName}\n` +
    `📍 ${address}`,
};
