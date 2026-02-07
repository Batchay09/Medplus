import type { Order, Payment } from '@medplus/db';
import { formatDate, formatMoney } from './styles';

/**
 * Returns the text content for a payment receipt.
 */
export function getReceiptContent(
  order: Order,
  payment: Payment,
  patientName: string,
  serviceName: string
): { title: string; sections: { heading: string; body: string }[] } {
  const date = payment.confirmed_at
    ? formatDate(payment.confirmed_at)
    : formatDate(new Date().toISOString());

  return {
    title: 'КВИТАНЦИЯ ОБ ОПЛАТЕ',
    sections: [
      {
        heading: '',
        body: `ИП "МедПлюс"                                                 Квитанция\nг. Черкесск                                                   ${date}`,
      },
      {
        heading: 'Плательщик',
        body: patientName,
      },
      {
        heading: 'Услуга',
        body: `${serviceName}\nДата оказания: ${formatDate(order.requested_date)}\nАдрес: ${order.address}`,
      },
      {
        heading: 'Оплата',
        body: `Сумма: ${formatMoney(payment.amount)}\nСпособ оплаты: ${payment.method === 'cash' ? 'Наличные' : 'Перевод на карту'}\nСтатус: ${payment.status === 'confirmed' ? 'Оплачено' : 'Ожидает подтверждения'}`,
      },
      {
        heading: '',
        body: `\n\nПодпись получателя: _______________`,
      },
    ],
  };
}
