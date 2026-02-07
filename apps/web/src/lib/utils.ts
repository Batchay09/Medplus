import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(time: string): string {
  return time.slice(0, 5); // "HH:MM:SS" -> "HH:MM"
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatPhone(phone: string): string {
  // +79283001001 -> +7 (928) 300-10-01
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  assigned: 'Назначена',
  in_progress: 'В работе',
  nurse_on_way: 'Медсестра в пути',
  nurse_arrived: 'Медсестра на месте',
  procedure_started: 'Процедура идёт',
  completed: 'Завершена',
  cancelled: 'Отменена',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-cyan-100 text-cyan-700',
  assigned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  nurse_on_way: 'bg-orange-100 text-orange-700',
  nurse_arrived: 'bg-amber-100 text-amber-700',
  procedure_started: 'bg-lime-100 text-lime-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  iv_drip: 'Капельница',
  injection: 'Инъекция',
  bandage: 'Перевязка',
  blood_test: 'Забор анализов',
  package: 'Пакет услуг',
};
