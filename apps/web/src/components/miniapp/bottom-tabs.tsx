'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  {
    href: '/miniapp',
    label: 'Главная',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--tg-theme-button-color, #3B82F6)' : 'var(--tg-theme-hint-color, #999)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/miniapp/orders',
    label: 'Записи',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--tg-theme-button-color, #3B82F6)' : 'var(--tg-theme-hint-color, #999)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: '/miniapp/profile',
    label: 'Профиль',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--tg-theme-button-color, #3B82F6)' : 'var(--tg-theme-hint-color, #999)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export function BottomTabs() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/miniapp') {
      return pathname === '/miniapp' || pathname === '/miniapp/';
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="miniapp-bottom-tabs">
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`miniapp-tab ${active ? 'miniapp-tab-active' : ''}`}
          >
            {tab.icon(active)}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
