'use client';

import { ORDER_STATUS_LABELS } from '@/lib/utils';

const STATUS_ORDER = [
  'new',
  'confirmed',
  'assigned',
  'nurse_on_way',
  'nurse_arrived',
  'procedure_started',
  'completed',
];

const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  confirmed: '#06B6D4',
  assigned: '#8B5CF6',
  nurse_on_way: '#F97316',
  nurse_arrived: '#F59E0B',
  procedure_started: '#84CC16',
  completed: '#22C55E',
  cancelled: '#EF4444',
};

interface StatusTimelineProps {
  currentStatus: string;
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="miniapp-timeline">
        <div className="miniapp-timeline-item miniapp-timeline-cancelled">
          <div
            className="miniapp-timeline-dot"
            style={{ backgroundColor: STATUS_COLORS.cancelled }}
          />
          <div className="miniapp-timeline-label">
            {ORDER_STATUS_LABELS.cancelled}
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="miniapp-timeline">
      {STATUS_ORDER.map((status, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;

        return (
          <div
            key={status}
            className={`miniapp-timeline-item ${
              isPast ? 'miniapp-timeline-past' : ''
            } ${isCurrent ? 'miniapp-timeline-current' : ''} ${
              isFuture ? 'miniapp-timeline-future' : ''
            }`}
          >
            <div className="miniapp-timeline-track">
              <div
                className="miniapp-timeline-dot"
                style={{
                  backgroundColor: isFuture
                    ? 'var(--tg-theme-hint-color, #ccc)'
                    : STATUS_COLORS[status],
                }}
              >
                {isPast && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div
                  className="miniapp-timeline-line"
                  style={{
                    backgroundColor: i < currentIndex
                      ? STATUS_COLORS[status]
                      : 'var(--tg-theme-hint-color, #ddd)',
                  }}
                />
              )}
            </div>
            <div className="miniapp-timeline-label">
              {ORDER_STATUS_LABELS[status]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
