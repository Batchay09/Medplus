'use client';

import { useEffect } from 'react';
import { formatDate, formatMoney } from '@/lib/utils';
import { useTelegram } from '../tg-provider';

interface BookingData {
  serviceName: string;
  servicePrice: number;
  address: string;
  date: string;
  time: string;
  suppliesSource: 'client' | 'company';
}

interface StepConfirmProps {
  data: BookingData;
  loading: boolean;
  onConfirm: () => void;
}

export function StepConfirm({ data, loading, onConfirm }: StepConfirmProps) {
  const { webApp } = useTelegram();
  const suppliesCost = data.suppliesSource === 'company' ? 500 : 0;
  const total = data.servicePrice + suppliesCost;

  useEffect(() => {
    if (!webApp) return;

    const btn = webApp.MainButton;
    btn.setParams({
      text: `Записаться \u00B7 ${formatMoney(total)}`,
      is_active: !loading,
      is_visible: true,
    });

    if (loading) {
      btn.showProgress(true);
    } else {
      btn.hideProgress();
    }

    btn.onClick(onConfirm);
    return () => {
      btn.offClick(onConfirm);
      btn.hide();
    };
  }, [webApp, onConfirm, total, loading]);

  return (
    <div className="miniapp-step">
      <h2 className="miniapp-step-title">Подтверждение</h2>

      <div className="miniapp-confirm-card">
        <div className="miniapp-confirm-row">
          <span className="miniapp-confirm-label">Услуга</span>
          <span className="miniapp-confirm-value">{data.serviceName}</span>
        </div>
        <div className="miniapp-confirm-row">
          <span className="miniapp-confirm-label">Адрес</span>
          <span className="miniapp-confirm-value">{data.address}</span>
        </div>
        <div className="miniapp-confirm-row">
          <span className="miniapp-confirm-label">Дата</span>
          <span className="miniapp-confirm-value">{formatDate(data.date)}</span>
        </div>
        <div className="miniapp-confirm-row">
          <span className="miniapp-confirm-label">Время</span>
          <span className="miniapp-confirm-value">{data.time}</span>
        </div>
        <div className="miniapp-confirm-row">
          <span className="miniapp-confirm-label">Медикаменты</span>
          <span className="miniapp-confirm-value">
            {data.suppliesSource === 'company' ? 'Доставим мы (+500 \u20BD)' : 'Свои'}
          </span>
        </div>

        <div className="miniapp-confirm-divider" />

        <div className="miniapp-confirm-row miniapp-confirm-total">
          <span className="miniapp-confirm-label">Итого</span>
          <span className="miniapp-confirm-value">{formatMoney(total)}</span>
        </div>
      </div>

      <p className="miniapp-confirm-hint">
        Нажмите кнопку ниже для подтверждения записи. Мы свяжемся с вами для уточнения деталей.
      </p>
    </div>
  );
}
