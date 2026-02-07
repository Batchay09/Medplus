'use client';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="miniapp-empty">
      <span className="miniapp-empty-icon">{icon}</span>
      <div className="miniapp-empty-title">{title}</div>
      <div className="miniapp-empty-desc">{description}</div>
    </div>
  );
}
