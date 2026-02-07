import type { Conversation } from '@grammyjs/conversations';
import type { BotContext } from '../bot';
import { supabase } from '../bot';
import {
  serviceCategoryKeyboard,
  suppliesKeyboard,
  confirmKeyboard,
  createDateKeyboard,
  createTimeKeyboard,
} from '../keyboards/main-menu';
import { InlineKeyboard } from 'grammy';

interface BookingData {
  category: string;
  service_id: string;
  service_name: string;
  service_price: number;
  date: string;
  time: string;
  address: string;
  supplies_source: 'client' | 'company';
  prescription_photo_url?: string;
}

type BookingConversation = Conversation<BotContext>;

export async function bookingConversation(
  conversation: BookingConversation,
  ctx: BotContext
) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.reply('Ошибка: не удалось определить пользователя.');
    return;
  }

  // Step 1: Select category
  await ctx.reply('Выберите категорию процедуры:', {
    reply_markup: serviceCategoryKeyboard,
  });

  const categoryCtx = await conversation.waitForCallbackQuery(/^cat_|cancel_booking/);
  await categoryCtx.answerCallbackQuery();

  if (categoryCtx.callbackQuery.data === 'cancel_booking') {
    await categoryCtx.editMessageText('Запись отменена.');
    return;
  }

  const categoryMap: Record<string, string> = {
    cat_iv_drip: 'iv_drip',
    cat_injection: 'injection',
    cat_bandage: 'bandage',
    cat_blood_test: 'blood_test',
  };

  const category = categoryMap[categoryCtx.callbackQuery.data!] || 'iv_drip';

  // Step 2: Select service
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('name');

  if (!services || services.length === 0) {
    await categoryCtx.editMessageText('К сожалению, услуги в данной категории временно недоступны.');
    return;
  }

  const serviceKb = new InlineKeyboard();
  for (const service of services) {
    serviceKb
      .text(`${service.name} — ${service.base_price}₽`, `svc_${service.id}`)
      .row();
  }
  serviceKb.text('❌ Отмена', 'cancel_booking');

  await categoryCtx.editMessageText('Выберите процедуру:', {
    reply_markup: serviceKb,
  });

  const serviceCtx = await conversation.waitForCallbackQuery(/^svc_|cancel_booking/);
  await serviceCtx.answerCallbackQuery();

  if (serviceCtx.callbackQuery.data === 'cancel_booking') {
    await serviceCtx.editMessageText('Запись отменена.');
    return;
  }

  const serviceId = serviceCtx.callbackQuery.data!.replace('svc_', '');
  const selectedService = services.find((s) => s.id === serviceId);

  if (!selectedService) {
    await serviceCtx.editMessageText('Ошибка: услуга не найдена.');
    return;
  }

  const booking: BookingData = {
    category,
    service_id: selectedService.id,
    service_name: selectedService.name,
    service_price: selectedService.base_price,
    date: '',
    time: '',
    address: '',
    supplies_source: 'client',
  };

  // Step 2.5: If custom prescription, ask for photo
  if (selectedService.name.toLowerCase().includes('назначени')) {
    await serviceCtx.editMessageText(
      'Отправьте фото назначения врача (или нажмите "Пропустить"):',
      {
        reply_markup: new InlineKeyboard().text('Пропустить', 'skip_photo'),
      }
    );

    const photoCtx = await conversation.wait();

    if (photoCtx.callbackQuery?.data === 'skip_photo') {
      await photoCtx.answerCallbackQuery();
    } else if (photoCtx.message?.photo) {
      const photo = photoCtx.message.photo;
      const fileId = photo[photo.length - 1].file_id;
      booking.prescription_photo_url = fileId;
      await photoCtx.reply('Фото получено ✓');
    }
  }

  // Step 3: Address
  await ctx.reply(
    '📍 Укажите адрес для выезда:\n\n' +
    'Отправьте текстом (например: "ул. Ленина, 15, кв. 3") или отправьте геолокацию.'
  );

  const addressCtx = await conversation.wait();

  if (addressCtx.message?.location) {
    booking.address = `Геолокация: ${addressCtx.message.location.latitude}, ${addressCtx.message.location.longitude}`;
  } else if (addressCtx.message?.text) {
    booking.address = addressCtx.message.text;
  } else {
    await ctx.reply('Не удалось получить адрес. Попробуйте /book заново.');
    return;
  }

  // Step 4: Date
  await ctx.reply('📅 Выберите дату:', {
    reply_markup: createDateKeyboard(),
  });

  const dateCtx = await conversation.waitForCallbackQuery(/^date_|cancel_booking/);
  await dateCtx.answerCallbackQuery();

  if (dateCtx.callbackQuery.data === 'cancel_booking') {
    await dateCtx.editMessageText('Запись отменена.');
    return;
  }

  booking.date = dateCtx.callbackQuery.data!.replace('date_', '');

  // Step 5: Time
  await dateCtx.editMessageText('🕐 Выберите удобное время:', {
    reply_markup: createTimeKeyboard(),
  });

  const timeCtx = await conversation.waitForCallbackQuery(/^time_|cancel_booking/);
  await timeCtx.answerCallbackQuery();

  if (timeCtx.callbackQuery.data === 'cancel_booking') {
    await timeCtx.editMessageText('Запись отменена.');
    return;
  }

  booking.time = timeCtx.callbackQuery.data!.replace('time_', '');

  // Step 6: Supplies
  await timeCtx.editMessageText(
    '💊 Кто обеспечивает лекарства/расходники?',
    { reply_markup: suppliesKeyboard }
  );

  const suppliesCtx = await conversation.waitForCallbackQuery(/^supplies_|cancel_booking/);
  await suppliesCtx.answerCallbackQuery();

  if (suppliesCtx.callbackQuery.data === 'cancel_booking') {
    await suppliesCtx.editMessageText('Запись отменена.');
    return;
  }

  booking.supplies_source = suppliesCtx.callbackQuery.data === 'supplies_company' ? 'company' : 'client';

  // Step 7: Confirmation
  const suppliesCost = booking.supplies_source === 'company' ? 500 : 0;
  const totalPrice = booking.service_price + suppliesCost;

  const dateFormatted = new Date(booking.date).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const summary =
    `📋 *Подтверждение записи:*\n\n` +
    `*Процедура:* ${booking.service_name}\n` +
    `*Дата:* ${dateFormatted}\n` +
    `*Время:* ${booking.time}\n` +
    `*Адрес:* ${booking.address}\n` +
    `*Лекарства:* ${booking.supplies_source === 'company' ? 'Доставка МедПлюс (+500₽)' : 'Клиент покупает сам'}\n\n` +
    `*Стоимость:* ${booking.service_price}₽\n` +
    (suppliesCost > 0 ? `*Доставка лекарств:* ${suppliesCost}₽\n` : '') +
    `*Итого: ${totalPrice}₽*`;

  await suppliesCtx.editMessageText(summary, {
    parse_mode: 'Markdown',
    reply_markup: confirmKeyboard,
  });

  const confirmCtx = await conversation.waitForCallbackQuery(
    /^confirm_booking|edit_booking|cancel_booking/
  );
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'cancel_booking') {
    await confirmCtx.editMessageText('Запись отменена.');
    return;
  }

  if (confirmCtx.callbackQuery.data === 'edit_booking') {
    await confirmCtx.editMessageText('Запись отменена. Начните заново: /book');
    return;
  }

  // Step 8: Create order
  try {
    // Find or create patient
    let { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (!patient) {
      const firstName = ctx.from?.first_name || '';
      const lastName = ctx.from?.last_name || '';

      const { data: newPatient } = await supabase
        .from('patients')
        .insert({
          full_name: `${firstName} ${lastName}`.trim() || 'Telegram User',
          phone: `tg:${telegramId}`,
          telegram_id: telegramId,
          address: booking.address,
        })
        .select()
        .single();

      patient = newPatient;
    }

    if (!patient) {
      await confirmCtx.editMessageText('Ошибка создания записи. Попробуйте позже или позвоните нам.');
      return;
    }

    // Create the order
    const timeEnd = `${parseInt(booking.time.split(':')[0]) + 2}:00`;

    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        patient_id: patient.id,
        service_id: booking.service_id,
        status: 'new',
        source: 'telegram',
        requested_date: booking.date,
        requested_time_from: booking.time,
        requested_time_to: timeEnd,
        address: booking.address,
        lat: patient.lat,
        lng: patient.lng,
        supplies_source: booking.supplies_source,
        supplies_cost: suppliesCost,
        service_price: booking.service_price,
        surcharge: 0,
        payment_method: null,
        is_urgent: false,
        prescription_photo_url: booking.prescription_photo_url || null,
      });

    if (orderError) {
      console.error('Order creation error:', orderError);
      await confirmCtx.editMessageText('Ошибка создания записи. Попробуйте позже или позвоните нам.');
      return;
    }

    await confirmCtx.editMessageText(
      `✅ *Запись успешно создана!*\n\n` +
      `*${booking.service_name}*\n` +
      `📅 ${dateFormatted}, ${booking.time}\n` +
      `📍 ${booking.address}\n\n` +
      `Мы свяжемся с вами для подтверждения.\n` +
      `Следите за статусом: /status`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Booking error:', err);
    await confirmCtx.editMessageText(
      'Произошла ошибка. Пожалуйста, позвоните нам: +7 (928) 300-10-00'
    );
  }
}
