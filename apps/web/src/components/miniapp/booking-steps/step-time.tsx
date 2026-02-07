'use client';

import { useTelegram } from '../tg-provider';

interface StepTimeProps {
  selectedTime: string;
  onSelect: (time: string) => void;
}

const SLOTS = [
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00',
];

export function StepTime({ selectedTime, onSelect }: StepTimeProps) {
  const { webApp } = useTelegram();

  function handleSelect(time: string) {
    webApp?.HapticFeedback.selectionChanged();
    onSelect(time);
  }

  return (
    <div className="miniapp-step">
      <h2 className="miniapp-step-title">Выберите время</h2>
      <p className="miniapp-step-subtitle">Удобное время визита</p>

      <div className="miniapp-time-grid">
        {SLOTS.map((slot) => (
          <button
            key={slot}
            className={`miniapp-time-chip ${selectedTime === slot ? 'miniapp-time-chip-active' : ''}`}
            onClick={() => handleSelect(slot)}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}
