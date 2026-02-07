'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { miniappApi } from '@/lib/miniapp/api-client';
import { ServiceCard } from '@/components/miniapp/service-card';
import { CardSkeleton } from '@/components/miniapp/skeleton';
import { EmptyState } from '@/components/miniapp/empty-state';
import { useTelegram } from '@/components/miniapp/tg-provider';
import { SERVICE_CATEGORY_LABELS } from '@/lib/utils';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration_minutes: number;
  base_price: number;
}

export default function ServiceCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { webApp } = useTelegram();
  const category = params.category as string;

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    miniappApi
      .getServices(category)
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (!webApp) return;
    webApp.BackButton.show();
    const goBack = () => router.push('/miniapp');
    webApp.BackButton.onClick(goBack);
    return () => {
      webApp.BackButton.offClick(goBack);
      webApp.BackButton.hide();
    };
  }, [webApp, router]);

  function handleSelect(id: string) {
    webApp?.HapticFeedback.selectionChanged();
    router.push(`/miniapp/booking?service=${id}&category=${category}`);
  }

  const title = SERVICE_CATEGORY_LABELS[category] || category;

  return (
    <>
      <h1 className="miniapp-page-title">{title}</h1>

      {loading ? (
        <CardSkeleton count={4} />
      ) : services.length === 0 ? (
        <EmptyState
          icon={'\uD83D\uDD0D'}
          title="Услуг не найдено"
          description="В этой категории пока нет доступных услуг"
        />
      ) : (
        services.map((s, i) => (
          <ServiceCard
            key={s.id}
            id={s.id}
            name={s.name}
            duration={s.duration_minutes}
            price={s.base_price}
            index={i}
            onSelect={handleSelect}
          />
        ))
      )}
    </>
  );
}
