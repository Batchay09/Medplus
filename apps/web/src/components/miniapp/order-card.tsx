'use client';

import Link from 'next/link';
import { formatDate, formatTime, ORDER_STATUS_LABELS } from '@/lib/utils';

interface OrderCardProps {
  id: string;
  status: string;
  date: string;
  time: string | null;
  serviceName: string;
  serviceCategory: string;
  address: string;
  index: number;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  new: '#3B82F6',
  confirmed: '#06B6D4',
  assigned: '#8B5CF6',
  in_progress: '#F59E0B',
  nurse_on_way: '#F97316',
  nurse_arrived: '#F59E0B',
  procedure_started: '#84CC16',
  completed: '#22C55E',
  cancelled: '#EF4444',
};

const CATEGORY_ICONS: Record<string, string> = {
  iv_drip: '\uD83D\uDCA7',
  injection: '\uD83D\uDC89',
  bandage: '\uD83E\uDE79',
  blood_test: '\uD83E\uDE78',
  package: '\uD83D\uDCE6',
};

export function OrderCard({
  id,
  status,
  date,
  time,
  serviceName,
  serviceCategory,
  address,
  index,
}: OrderCardProps) {
  return (
    <Link
      href={`/miniapp/orders/${id}`}
      className="miniapp-order-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="miniapp-order-header">
        <span className="miniapp-order-icon">
          {CATEGORY_ICONS[serviceCategory] || '\uD83C\uDFE5'}
        </span>
        <div className="miniapp-order-title">
          <div className="miniapp-order-service">{serviceName}</div>
          <div className="miniapp-order-date">
            {formatDate(date)}{time ? `, ${formatTime(time)}` : ''}
          </div>
        </div>
        <div className="miniapp-order-status">
          <span
            className="miniapp-status-dot"
            style={{ backgroundColor: STATUS_DOT_COLORS[status] || '#999' }}
          />
          <span className="miniapp-status-text">
            {ORDER_STATUS_LABELS[status] || status}
          </span>
        </div>
      </div>
      <div className="miniapp-order-address">{address}</div>
    </Link>
  );
}
