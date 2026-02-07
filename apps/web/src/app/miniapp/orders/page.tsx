'use client';

import { useEffect, useState } from 'react';
import { miniappApi } from '@/lib/miniapp/api-client';
import { OrderCard } from '@/components/miniapp/order-card';
import { EmptyState } from '@/components/miniapp/empty-state';
import { CardSkeleton } from '@/components/miniapp/skeleton';
import Link from 'next/link';

interface OrderItem {
  id: string;
  status: string;
  requested_date: string;
  requested_time_from: string | null;
  address: string;
  service?: { name: string; category: string };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    miniappApi
      .getOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="miniapp-page-title">Мои записи</h1>

      {loading ? (
        <CardSkeleton count={4} />
      ) : orders.length === 0 ? (
        <>
          <EmptyState
            icon={'\uD83D\uDCCB'}
            title="Записей пока нет"
            description="Запишитесь на процедуру, и она появится здесь"
          />
          <div style={{ marginTop: 16 }}>
            <Link href="/miniapp/booking" className="miniapp-button-primary">
              Записаться
            </Link>
          </div>
        </>
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
