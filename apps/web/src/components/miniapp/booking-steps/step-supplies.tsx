'use client';

import { useTelegram } from '../tg-provider';

interface StepSuppliesProps {
  selected: 'client' | 'company' | '';
  onSelect: (source: 'client' | 'company') => void;
}

export function StepSupplies({ selected, onSelect }: StepSuppliesProps) {
  const { webApp } = useTelegram();

  function handleSelect(source: 'client' | 'company') {
    webApp?.HapticFeedback.selectionChanged();
    onSelect(source);
  }

  return (
    <div className="miniapp-step">
      <h2 className="miniapp-step-title">Расходные материалы</h2>
      <p className="miniapp-step-subtitle">
        Выберите, кто предоставит медикаменты
      </p>

      <div className="miniapp-supplies-options">
        <button
          className={`miniapp-supplies-card ${selected === 'client' ? 'miniapp-supplies-card-active' : ''}`}
          onClick={() => handleSelect('client')}
        >
          <span className="miniapp-supplies-icon">{'\uD83D\uDECD\uFE0F'}</span>
          <span className="miniapp-supplies-title">Свои медикаменты</span>
          <span className="miniapp-supplies-desc">
            Вы купите сами по рецепту
          </span>
          <span className="miniapp-supplies-price">Бесплатно</span>
        </button>

        <button
          className={`miniapp-supplies-card ${selected === 'company' ? 'miniapp-supplies-card-active' : ''}`}
          onClick={() => handleSelect('company')}
        >
          <span className="miniapp-supplies-icon">{'\uD83D\uDE97'}</span>
          <span className="miniapp-supplies-title">Доставим мы</span>
          <span className="miniapp-supplies-desc">
            Наш курьер привезёт всё нужное
          </span>
          <span className="miniapp-supplies-price">+500 &#8381;</span>
        </button>
      </div>
    </div>
  );
}
