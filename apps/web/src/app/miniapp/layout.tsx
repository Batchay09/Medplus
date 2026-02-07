'use client';

import Script from 'next/script';
import { TelegramProvider } from '@/components/miniapp/tg-provider';
import { BottomTabs } from '@/components/miniapp/bottom-tabs';
import './miniapp.css';

export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <TelegramProvider>
        <div className="miniapp-shell">
          <div className="miniapp-content">{children}</div>
          <BottomTabs />
        </div>
      </TelegramProvider>
    </>
  );
}
