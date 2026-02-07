import type { Patient, Order, Service, Nurse } from '@medplus/db';
import { formatDate, formatMoney } from './styles';

/**
 * Returns the text content for the service completion act.
 */
export function getServiceActContent(
  patient: Patient,
  order: Order,
  service: Service,
  nurse: Nurse
): { title: string; sections: { heading: string; body: string }[] } {
  const completedDate = order.completed_at
    ? formatDate(order.completed_at)
    : formatDate(new Date().toISOString());

  return {
    title: 'АКТ ОКАЗАНИЯ МЕДИЦИНСКИХ УСЛУГ',
    sections: [
      {
        heading: '',
        body: `г. Черкесск                                                                    ${completedDate}\n\nНастоящий акт составлен в том, что ИП "МедПлюс" (Исполнитель) оказал медицинские услуги ${patient.full_name} (Заказчик).`,
      },
      {
        heading: 'Оказанная услуга',
        body: `Наименование: ${service.name}\nКатегория: ${categoryLabel(service.category)}\nАдрес оказания: ${order.address}\nМедицинская сестра: ${nurse.full_name}`,
      },
      {
        heading: 'Время оказания',
        body: `Начало: ${order.started_at ? new Date(order.started_at).toLocaleString('ru-RU') : 'N/A'}\nОкончание: ${order.completed_at ? new Date(order.completed_at).toLocaleString('ru-RU') : 'N/A'}`,
      },
      {
        heading: 'Стоимость',
        body: `Стоимость услуги: ${formatMoney(order.service_price)}\nРасходные материалы: ${formatMoney(order.supplies_cost)}\nДоплата: ${formatMoney(order.surcharge)}\n\nИтого: ${formatMoney(order.total_price)}\nСпособ оплаты: ${order.payment_method === 'cash' ? 'Наличные' : 'Перевод на карту'}`,
      },
      {
        heading: 'Подписи',
        body: `Заказчик претензий к качеству и объёму оказанных услуг не имеет.\n\nИсполнитель: _______________          Заказчик: _______________\n                                       ${patient.full_name}`,
      },
    ],
  };
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    iv_drip: 'Капельница',
    injection: 'Инъекция',
    bandage: 'Перевязка',
    blood_test: 'Забор анализов',
    package: 'Пакет услуг',
  };
  return labels[category] || category;
}
