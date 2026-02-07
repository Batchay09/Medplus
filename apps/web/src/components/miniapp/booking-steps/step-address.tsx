'use client';

import { useState, useEffect } from 'react';
import { miniappApi } from '@/lib/miniapp/api-client';
import { useTelegram } from '../tg-provider';

interface StepAddressProps {
  initialAddress: string;
  onSubmit: (address: string, lat?: number, lng?: number) => void;
}

export function StepAddress({ initialAddress, onSubmit }: StepAddressProps) {
  const { webApp, patient } = useTelegram();
  // Предзаполняем адрес из профиля пациента если не передан явно
  const [address, setAddress] = useState(initialAddress || patient?.address || '');
  const [locating, setLocating] = useState(false);

  // Обновить если patient загрузился позже
  useEffect(() => {
    if (!address && patient?.address) {
      setAddress(patient.address);
    }
  }, [patient, address]);

  function handleGeolocate() {
    if (!navigator.geolocation) return;
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const result = await miniappApi.reverseGeocode(latitude, longitude);
          setAddress(result.address);
          onSubmit(result.address, latitude, longitude);
        } catch {
          webApp?.HapticFeedback.notificationOccurred('error');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        webApp?.HapticFeedback.notificationOccurred('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleSubmit() {
    if (address.trim()) {
      webApp?.HapticFeedback.selectionChanged();
      onSubmit(address.trim());
    }
  }

  return (
    <div className="miniapp-step">
      <h2 className="miniapp-step-title">Адрес</h2>
      <p className="miniapp-step-subtitle">
        Укажите адрес для визита медсестры
      </p>

      <div className="miniapp-input-group">
        <textarea
          className="miniapp-input miniapp-textarea"
          placeholder="Например: ул. Ленина, 15, кв. 42"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
        />

        <button
          className="miniapp-geo-button"
          onClick={handleGeolocate}
          disabled={locating}
        >
          {locating ? (
            <span className="miniapp-spinner-small" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
            </svg>
          )}
          Определить по GPS
        </button>
      </div>

      <button
        className="miniapp-button-primary"
        onClick={handleSubmit}
        disabled={!address.trim()}
      >
        Далее
      </button>
    </div>
  );
}
