'use client';

import { formatMoney } from '@/lib/utils';

interface ServiceCardProps {
  id: string;
  name: string;
  duration: number;
  price: number;
  index: number;
  onSelect: (id: string) => void;
}

export function ServiceCard({ id, name, duration, price, index, onSelect }: ServiceCardProps) {
  return (
    <button
      onClick={() => onSelect(id)}
      className="miniapp-service-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="miniapp-service-info">
        <div className="miniapp-service-name">{name}</div>
        <div className="miniapp-service-meta">
          {duration} мин
        </div>
      </div>
      <div className="miniapp-service-price">{formatMoney(price)}</div>
    </button>
  );
}
