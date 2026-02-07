'use client';

import { useEffect, useState } from 'react';
import { miniappApi } from '@/lib/miniapp/api-client';
import { useTelegram } from '@/components/miniapp/tg-provider';

interface ProfileData {
  id: string;
  full_name: string;
  phone: string;
  address: string | null;
  birth_date: string | null;
  allergies: string | null;
  total_orders: number;
  completed_orders: number;
}

export default function ProfilePage() {
  const { webApp, patient, authenticated, refreshPatient } = useTelegram();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    birth_date: '',
    allergies: '',
  });

  useEffect(() => {
    if (!authenticated) return;

    miniappApi
      .getProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          birth_date: data.birth_date || '',
          allergies: data.allergies || '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authenticated]);

  async function handleSave() {
    setSaving(true);
    try {
      await miniappApi.updateProfile(form);
      webApp?.HapticFeedback.notificationOccurred('success');
      setProfile((prev) =>
        prev ? { ...prev, ...form } : prev
      );
      setEditing(false);
      // Обновляем данные пациента в контексте
      await refreshPatient();
    } catch (err) {
      console.error(err);
      webApp?.HapticFeedback.notificationOccurred('error');
    } finally {
      setSaving(false);
    }
  }

  if (!authenticated || loading) {
    return <div className="miniapp-spinner" />;
  }

  if (!profile) {
    return <p>Профиль не найден</p>;
  }

  const initials = (profile.full_name || patient?.full_name || 'П')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="miniapp-profile-header">
        <div className="miniapp-profile-avatar">{initials}</div>
        <h1 className="miniapp-profile-name">{profile.full_name || 'Пациент'}</h1>
        <div className="miniapp-profile-stats">
          <div className="miniapp-profile-stat">
            <span className="miniapp-profile-stat-value">{profile.total_orders}</span>
            <span className="miniapp-profile-stat-label">всего</span>
          </div>
          <div className="miniapp-profile-stat">
            <span className="miniapp-profile-stat-value">{profile.completed_orders}</span>
            <span className="miniapp-profile-stat-label">завершено</span>
          </div>
        </div>
      </div>

      {!editing ? (
        <>
          <div className="miniapp-detail-section">
            {profile.phone && (
              <div className="miniapp-detail-row">
                <span className="miniapp-detail-label">Телефон</span>
                <span className="miniapp-detail-value">{profile.phone}</span>
              </div>
            )}
            {profile.address && (
              <div className="miniapp-detail-row">
                <span className="miniapp-detail-label">Адрес</span>
                <span className="miniapp-detail-value">{profile.address}</span>
              </div>
            )}
            {profile.birth_date && (
              <div className="miniapp-detail-row">
                <span className="miniapp-detail-label">Дата рождения</span>
                <span className="miniapp-detail-value">{profile.birth_date}</span>
              </div>
            )}
            {profile.allergies && (
              <div className="miniapp-detail-row">
                <span className="miniapp-detail-label">Аллергии</span>
                <span className="miniapp-detail-value">{profile.allergies}</span>
              </div>
            )}
          </div>

          <button
            className="miniapp-button-primary"
            onClick={() => setEditing(true)}
          >
            Редактировать профиль
          </button>
        </>
      ) : (
        <>
          <div className="miniapp-detail-section">
            <div className="miniapp-form-group">
              <label className="miniapp-form-label">ФИО</label>
              <input
                className="miniapp-input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div className="miniapp-form-group">
              <label className="miniapp-form-label">Телефон</label>
              <input
                className="miniapp-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+7 (928) 300-10-01"
                type="tel"
              />
            </div>
            <div className="miniapp-form-group">
              <label className="miniapp-form-label">Адрес</label>
              <input
                className="miniapp-input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="ул. Ленина, 15, кв. 42"
              />
            </div>
            <div className="miniapp-form-group">
              <label className="miniapp-form-label">Дата рождения</label>
              <input
                className="miniapp-input"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                type="date"
              />
            </div>
            <div className="miniapp-form-group">
              <label className="miniapp-form-label">Аллергии</label>
              <input
                className="miniapp-input"
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                placeholder="Не указаны"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="miniapp-button-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              className="miniapp-button-secondary"
              onClick={() => setEditing(false)}
            >
              Отмена
            </button>
          </div>
        </>
      )}
    </>
  );
}
