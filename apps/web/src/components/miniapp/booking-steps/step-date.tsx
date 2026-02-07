'use client';

import { useTelegram } from '../tg-provider';

interface StepDateProps {
  selectedDate: string;
  onSelect: (date: string) => void;
}

function getDays(): { date: string; dayName: string; dayNum: string; isToday: boolean }[] {
  const days = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);

    days.push({
      date: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : d.toLocaleDateString('ru-RU', { weekday: 'short' }),
      dayNum: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      isToday: i === 0,
    });
  }

  return days;
}

export function StepDate({ selectedDate, onSelect }: StepDateProps) {
  const days = getDays();
  const { webApp } = useTelegram();

  function handleSelect(date: string) {
    webApp?.HapticFeedback.selectionChanged();
    onSelect(date);
  }

  return (
    <div className="miniapp-step">
      <h2 className="miniapp-step-title">Выберите дату</h2>
      <p className="miniapp-step-subtitle">Ближайшие 7 дней</p>

      <div className="miniapp-date-scroll">
        {days.map((day) => (
          <button
            key={day.date}
            className={`miniapp-date-chip ${selectedDate === day.date ? 'miniapp-date-chip-active' : ''}`}
            onClick={() => handleSelect(day.date)}
          >
            <span className="miniapp-date-day">{day.dayName}</span>
            <span className="miniapp-date-num">{day.dayNum}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
