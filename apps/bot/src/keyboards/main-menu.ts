import { InlineKeyboard } from 'grammy';

export const mainMenuKeyboard = new InlineKeyboard()
  .text('📋 Записаться на процедуру', 'book_procedure')
  .row()
  .text('📊 Мои записи', 'my_orders')
  .row()
  .text('📞 Связаться с нами', 'contact_us');

export const serviceCategoryKeyboard = new InlineKeyboard()
  .text('💧 Капельница', 'cat_iv_drip')
  .row()
  .text('💉 Укол', 'cat_injection')
  .row()
  .text('🩹 Перевязка', 'cat_bandage')
  .row()
  .text('🩸 Забор анализов', 'cat_blood_test')
  .row()
  .text('❌ Отмена', 'cancel_booking');

export const suppliesKeyboard = new InlineKeyboard()
  .text('🛒 Сам куплю', 'supplies_client')
  .row()
  .text('🚗 Вы доставите (+500₽)', 'supplies_company')
  .row()
  .text('❌ Отмена', 'cancel_booking');

export const confirmKeyboard = new InlineKeyboard()
  .text('✅ Подтвердить', 'confirm_booking')
  .row()
  .text('✏️ Изменить', 'edit_booking')
  .row()
  .text('❌ Отменить', 'cancel_booking');

export function createDateKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
    const dayNum = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    const dateStr = date.toISOString().split('T')[0];

    kb.text(`${dayName} ${dayNum}`, `date_${dateStr}`);
    if (i % 2 === 1) kb.row();
  }

  kb.row().text('❌ Отмена', 'cancel_booking');
  return kb;
}

export function createTimeKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  const slots = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00',
  ];

  for (let i = 0; i < slots.length; i++) {
    kb.text(slots[i], `time_${slots[i]}`);
    if (i % 3 === 2) kb.row();
  }

  kb.row().text('❌ Отмена', 'cancel_booking');
  return kb;
}
