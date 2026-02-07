'use client';

import { useEffect, useState } from 'react';
import { miniappApi } from '@/lib/miniapp/api-client';
import { ServiceCard } from '../service-card';
import { CardSkeleton } from '../skeleton';
import { SERVICE_CATEGORY_LABELS } from '@/lib/utils';

interface StepServiceProps {
  preselectedCategory?: string;
  onSelect: (serviceId: string, serviceName: string, servicePrice: number, serviceDuration: number) => void;
}

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration_minutes: number;
  base_price: number;
}

export function StepService({ preselectedCategory, onSelect }: StepServiceProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    miniappApi
      .getServices(preselectedCategory)
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [preselectedCategory]);

  if (loading) return <CardSkeleton count={4} />;

  // Group by category if no preset category
  const grouped = preselectedCategory
    ? { [preselectedCategory]: services }
    : services.reduce<Record<string, ServiceItem[]>>((acc, s) => {
        (acc[s.category] ||= []).push(s);
        return acc;
      }, {});

  return (
    <div className="miniapp-step">
      <h2 className="miniapp-step-title">Выберите услугу</h2>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="miniapp-service-group">
          {!preselectedCategory && (
            <div className="miniapp-service-group-title">
              {SERVICE_CATEGORY_LABELS[cat] || cat}
            </div>
          )}
          {items.map((s, i) => (
            <ServiceCard
              key={s.id}
              id={s.id}
              name={s.name}
              duration={s.duration_minutes}
              price={s.base_price}
              index={i}
              onSelect={() => onSelect(s.id, s.name, s.base_price, s.duration_minutes)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
