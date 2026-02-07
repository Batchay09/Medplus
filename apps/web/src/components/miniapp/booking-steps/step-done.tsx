'use client';

import Link from 'next/link';

interface StepDoneProps {
  orderId: string;
}

export function StepDone({ orderId }: StepDoneProps) {
  return (
    <div className="miniapp-step miniapp-step-done">
      <div className="miniapp-done-checkmark">
        <svg width="64" height="64" viewBox="0 0 64 64" className="miniapp-done-svg">
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke="#22C55E"
            strokeWidth="3"
            className="miniapp-done-circle"
          />
          <polyline
            points="20,33 28,41 44,25"
            fill="none"
            stroke="#22C55E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="miniapp-done-check"
          />
        </svg>
      </div>

      <h2 className="miniapp-done-title">Запись создана!</h2>
      <p className="miniapp-done-text">
        Мы получили вашу заявку и свяжемся с вами для подтверждения.
      </p>

      <div className="miniapp-done-actions">
        <Link href={`/miniapp/orders/${orderId}`} className="miniapp-button-primary">
          Посмотреть запись
        </Link>
        <Link href="/miniapp" className="miniapp-button-secondary">
          На главную
        </Link>
      </div>
    </div>
  );
}
