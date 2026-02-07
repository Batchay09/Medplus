'use client';

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="miniapp-skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="miniapp-skeleton-card">
          <div className="miniapp-skeleton-line miniapp-skeleton-short" />
          <div className="miniapp-skeleton-line miniapp-skeleton-long" />
          <div className="miniapp-skeleton-line miniapp-skeleton-medium" />
        </div>
      ))}
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="miniapp-category-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="miniapp-skeleton-category" />
      ))}
    </div>
  );
}
