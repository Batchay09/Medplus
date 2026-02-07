'use client';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/components/miniapp/tg-provider';
import { CategoryCard } from '@/components/miniapp/category-card';
import { OrderCard } from '@/components/miniapp/order-card';
import { EmptyState } from '@/components/miniapp/empty-state';
import { CategorySkeleton, CardSkeleton } from '@/components/miniapp/skeleton';
import { miniappApi } from '@/lib/miniapp/api-client';
import Link from 'next/link';

const CATEGORIES = [
  { category: 'iv_drip', label: 'Капельница', icon: '\uD83D\uDCA7', gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)' },
  { category: 'injection', label: 'Инъекция', icon: '\uD83D\uDC89', gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' },
  { category: 'bandage', label: 'Перевязка', icon: '\uD83E\uDE79', gradient: 'linear-gradient(135deg, #22C55E, #4ADE80)' },
  { category: 'blood_test', label: 'Анализы', icon: '\uD83E\uDE78', gradient: 'linear-gradient(135deg, #EF4444, #F87171)' },
];

interface RecentOrder {
  id: string;
  status: string;
  requested_date: string;
  requested_time_from: string | null;
  address: string;
  service?: { name: string; category: string };
}

export default function MiniAppHomePage() {
  const { patient, authenticated } = useTelegram();
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authenticated) return;

    miniappApi
      .getOrders()
      .then((data) => setOrders(data.slice(0, 3)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authenticated]);

  const firstName = patient?.full_name?.split(' ')[0] || 'друг';

  if (!authenticated) {
    return <CategorySkeleton />;
  }

  return (
    <>
      <div className="miniapp-page-header">
        <h1 className="miniapp-greeting">Здравствуйте, {firstName}!</h1>
        <p className="miniapp-greeting-sub">
          Выездные медицинские процедуры на дому
        </p>
      </div>

      <div className="miniapp-category-grid">
        {CATEGORIES.map((c, i) => (
          <CategoryCard key={c.category} {...c} index={i} />
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <Link href="/miniapp/booking" className="miniapp-button-primary">
          Записаться на процедуру
        </Link>
      </div>

      <h2 className="miniapp-section-title">Недавние записи</h2>

      {loading ? (
        <CardSkeleton count={2} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={'\uD83D\uDCCB'}
          title="Записей пока нет"
          description="Запишитесь на процедуру, и она появится здесь"
        />
      ) : (
        orders.map((o, i) => (
          <OrderCard
            key={o.id}
            id={o.id}
            status={o.status}
            date={o.requested_date}
            time={o.requested_time_from}
            serviceName={o.service?.name || ''}
            serviceCategory={o.service?.category || ''}
            address={o.address}
            index={i}
          />
        ))
      )}
    </>
  );
}
