'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { WebApp, WebAppUser } from '@/lib/telegram/types';
import { miniappApi } from '@/lib/miniapp/api-client';

export interface PatientData {
  id: string;
  full_name: string;
  phone: string;
  address: string | null;
  birth_date: string | null;
  allergies: string | null;
}

interface TelegramContextValue {
  webApp: WebApp | null;
  user: WebAppUser | null;
  patient: PatientData | null;
  initData: string;
  ready: boolean;
  authenticated: boolean;
  colorScheme: 'light' | 'dark';
  refreshPatient: () => Promise<void>;
}

const TelegramContext = createContext<TelegramContextValue>({
  webApp: null,
  user: null,
  patient: null,
  initData: '',
  ready: false,
  authenticated: false,
  colorScheme: 'light',
  refreshPatient: async () => {},
});

export function useTelegram() {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [ready, setReady] = useState(false);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  const init = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      setWebApp(tg);
      setReady(true);
    }
  }, []);

  // Инициализация Telegram SDK
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      init();
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.Telegram?.WebApp) {
        clearInterval(checkInterval);
        init();
      }
    }, 50);

    return () => clearInterval(checkInterval);
  }, [init]);

  // Автоматическая авторизация при готовности SDK
  useEffect(() => {
    if (!ready) return;

    miniappApi
      .auth()
      .then((result) => {
        setPatient(result.patient);
        setAuthenticated(true);
      })
      .catch((err) => {
        console.error('Auto-auth failed:', err);
      });
  }, [ready]);

  const refreshPatient = useCallback(async () => {
    try {
      const result = await miniappApi.auth();
      setPatient(result.patient);
    } catch (err) {
      console.error('Failed to refresh patient:', err);
    }
  }, []);

  const value: TelegramContextValue = {
    webApp,
    user: webApp?.initDataUnsafe?.user || null,
    patient,
    initData: webApp?.initData || '',
    ready,
    authenticated,
    colorScheme: webApp?.colorScheme || 'light',
    refreshPatient,
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}
