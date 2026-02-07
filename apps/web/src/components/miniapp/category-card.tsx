'use client';

import Link from 'next/link';

interface CategoryCardProps {
  category: string;
  label: string;
  icon: string;
  gradient: string;
  index: number;
}

export function CategoryCard({ category, label, icon, gradient, index }: CategoryCardProps) {
  return (
    <Link
      href={`/miniapp/services/${category}`}
      className="miniapp-category-card"
      style={{
        background: gradient,
        animationDelay: `${index * 80}ms`,
      }}
    >
      <span className="miniapp-category-icon">{icon}</span>
      <span className="miniapp-category-label">{label}</span>
    </Link>
  );
}
