/**
 * Shared PDF styling constants for MedPlus documents.
 */

export const COLORS = {
  black: { r: 0, g: 0, b: 0 },
  gray: { r: 0.4, g: 0.4, b: 0.4 },
  lightGray: { r: 0.85, g: 0.85, b: 0.85 },
  primary: { r: 0.13, g: 0.53, b: 0.8 },   // Blue accent
} as const;

export const FONTS = {
  titleSize: 18,
  headingSize: 14,
  bodySize: 11,
  smallSize: 9,
} as const;

export const LAYOUT = {
  marginLeft: 50,
  marginRight: 50,
  marginTop: 50,
  marginBottom: 60,
  lineSpacing: 16,
} as const;

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
}
