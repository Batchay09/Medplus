'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { miniappApi } from '@/lib/miniapp/api-client';
import { useTelegram } from '@/components/miniapp/tg-provider';
import { StatusTimeline } from '@/components/miniapp/status-timeline';
import { formatDate, formatTime, formatMoney, ORDER_STATUS_LABELS, SERVICE_CATEGORY_LABELS } from '@/lib/utils';

interface OrderDetail {
  id: string;
  status: string;
  requested_date: string;
  requested_time_from: string | null;
  requested_time_to: string | null;
  address: string;
  service_price: number;
  surcharge: number;
  supplies_cost: number;
  total_price: number;
  supplies_source: string | null;
  notes: string | null;
  created_at: string;
  service?: { name: string; category: string; duration_minutes: number };
  nurse?: { full_name: string; phone: string } | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { webApp } = useTelegram();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    miniappApi
      .getOrder(id)
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!webApp) return;
    webApp.BackButton.show();
    const goBack = () => router.push('/miniapp/orders');
    webApp.BackButton.onClick(goBack);
    return () => {
      webApp.BackButton.offClick(goBack);
      webApp.BackButton.hide();
    };
  }, [webApp, router]);

  if (loading) {
    return <div className="miniapp-spinner" />;
  }

  if (!order) {
    return <p>Запись не найдена</p>;
  }

  const canCancel = ['new', 'confirmed'].includes(order.status);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="miniapp-page-title" style={{ margin: 0 }}>
          {order.service?.name || 'Запись'}
        </h1>
        <span style={{
          fontSize: 12,
          padding: '4px 10px',
          borderRadius: 8,
          backgroundColor: 'var(--miniapp-secondary-bg)',
          color: 'var(--miniapp-hint)',
          fontWeight: 500,
        }}>
          {ORDER_STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="miniapp-detail-section">
        <div className="miniapp-detail-title">Статус</div>
        <StatusTimeline currentStatus={order.status} />
      </div>

      <div className="miniapp-detail-section">
        <div className="miniapp-detail-title">Информация</div>
        <div className="miniapp-detail-row">
          <span className="miniapp-detail-label">Услуга</span>
          <span className="miniapp-detail-value">{order.service?.name}</span>
        </div>
        {order.service?.category && (
          <div className="miniapp-detail-row">
            <span className="miniapp-detail-label">Категория</span>
            <span className="miniapp-detail-value">
              {SERVICE_CATEGORY_LABELS[order.service.category] || order.service.category}
            </span>
          </div>
        )}
        <div className="miniapp-detail-row">
          <span className="miniapp-detail-label">Дата</span>
          <span className="miniapp-detail-value">{formatDate(order.requested_date)}</span>
        </div>
        {order.requested_time_from && (
          <div className="miniapp-detail-row">
            <span className="miniapp-detail-label">Время</span>
            <span className="miniapp-detail-value">
              {formatTime(order.requested_time_from)}
              {order.requested_time_to ? ` — ${formatTime(order.requested_time_to)}` : ''}
            </span>
          </div>
        )}
        <div className="miniapp-detail-row">
          <span className="miniapp-detail-label">Адрес</span>
          <span className="miniapp-detail-value">{order.address}</span>
        </div>
        {order.supplies_source && (
          <div className="miniapp-detail-row">
            <span className="miniapp-detail-label">Медикаменты</span>
            <span className="miniapp-detail-value">
              {order.supplies_source === 'company' ? 'Доставка' : 'Свои'}
            </span>
          </div>
        )}
      </div>

      {order.nurse && (
        <div className="miniapp-detail-section">
          <div className="miniapp-detail-title">Медсестра</div>
          <div className="miniapp-detail-row">
            <span className="miniapp-detail-label">Имя</span>
            <span className="miniapp-detail-value">{order.nurse.full_name}</span>
          </div>
          <div className="miniapp-detail-row">
            <span className="miniapp-detail-label">Телефон</span>
            <span className="miniapp-detail-value">
              <a href={`tel:${order.nurse.phone}`} style={{ color: 'var(--miniapp-link)' }}>
                {order.nurse.phone}
              </a>
            </span>
          </div>
        </div>
      )}

      <div className="miniapp-detail-section">
        <div className="miniapp-detail-title">Стоимость</div>
        <div className="miniapp-detail-row">
          <span className="miniapp-detail-label">Услуга</span>
          <span className="miniapp-detail-value">{formatMoney(order.service_price)}</span>
        </div>
        {order.supplies_cost > 0 && (
          <div className="miniapp-detail-row">
            <span className="miniapp-detail-label">Доставка медикаментов</span>
            <span className="miniapp-detail-value">{formatMoney(order.supplies_cost)}</span>
          </div>
        )}
        {order.surcharge > 0 && (
          <div className="miniapp-detail-row">
            <span className="miniapp-detail-label">Доплата</span>
            <span className="miniapp-detail-value">{formatMoney(order.surcharge)}</span>
          </div>
        )}
        <div className="miniapp-detail-row" style={{ borderTop: '1px solid var(--miniapp-secondary-bg)', paddingTop: 10, marginTop: 4 }}>
          <span className="miniapp-detail-label" style={{ fontWeight: 600 }}>Итого</span>
          <span className="miniapp-detail-value" style={{ fontWeight: 700, color: 'var(--miniapp-btn)' }}>
            {formatMoney(order.total_price)}
          </span>
        </div>
      </div>

      {order.notes && (
        <div className="miniapp-detail-section">
          <div className="miniapp-detail-title">Примечания</div>
          <p style={{ margin: 0, fontSize: 14 }}>{order.notes}</p>
        </div>
      )}

      {canCancel && (
        <button className="miniapp-button-destructive" style={{ marginTop: 8 }}>
          Отменить запись
        </button>
      )}
    </>
  );
}
