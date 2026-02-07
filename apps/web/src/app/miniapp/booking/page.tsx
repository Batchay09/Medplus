'use client';

import { Suspense, useReducer, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTelegram } from '@/components/miniapp/tg-provider';
import { miniappApi } from '@/lib/miniapp/api-client';
import { StepService } from '@/components/miniapp/booking-steps/step-service';
import { StepAddress } from '@/components/miniapp/booking-steps/step-address';
import { StepDate } from '@/components/miniapp/booking-steps/step-date';
import { StepTime } from '@/components/miniapp/booking-steps/step-time';
import { StepSupplies } from '@/components/miniapp/booking-steps/step-supplies';
import { StepConfirm } from '@/components/miniapp/booking-steps/step-confirm';
import { StepDone } from '@/components/miniapp/booking-steps/step-done';

interface BookingState {
  step: number;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  address: string;
  lat?: number;
  lng?: number;
  date: string;
  time: string;
  suppliesSource: 'client' | 'company' | '';
  orderId: string;
  loading: boolean;
  category: string;
}

type BookingAction =
  | { type: 'SET_SERVICE'; serviceId: string; serviceName: string; servicePrice: number; serviceDuration: number }
  | { type: 'SET_ADDRESS'; address: string; lat?: number; lng?: number }
  | { type: 'SET_DATE'; date: string }
  | { type: 'SET_TIME'; time: string }
  | { type: 'SET_SUPPLIES'; source: 'client' | 'company' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_DONE'; orderId: string }
  | { type: 'BACK' };

function reducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_SERVICE':
      return {
        ...state,
        step: 2,
        serviceId: action.serviceId,
        serviceName: action.serviceName,
        servicePrice: action.servicePrice,
        serviceDuration: action.serviceDuration,
      };
    case 'SET_ADDRESS':
      return { ...state, step: 3, address: action.address, lat: action.lat, lng: action.lng };
    case 'SET_DATE':
      return { ...state, step: 4, date: action.date };
    case 'SET_TIME':
      return { ...state, step: 5, time: action.time };
    case 'SET_SUPPLIES':
      return { ...state, step: 6, suppliesSource: action.source };
    case 'SUBMIT_START':
      return { ...state, loading: true };
    case 'SUBMIT_DONE':
      return { ...state, step: 7, loading: false, orderId: action.orderId };
    case 'BACK':
      return { ...state, step: Math.max(1, state.step - 1) };
    default:
      return state;
  }
}

const TOTAL_STEPS = 7;

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="miniapp-spinner" />}>
      <BookingContent />
    </Suspense>
  );
}

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { webApp } = useTelegram();

  const preselectedService = searchParams.get('service');
  const preselectedCategory = searchParams.get('category');

  const [state, dispatch] = useReducer(reducer, {
    step: 1,
    serviceId: preselectedService || '',
    serviceName: '',
    servicePrice: 0,
    serviceDuration: 0,
    address: '',
    date: '',
    time: '',
    suppliesSource: '',
    orderId: '',
    loading: false,
    category: preselectedCategory || '',
  });

  // Back button
  useEffect(() => {
    if (!webApp) return;
    if (state.step > 1 && state.step < 7) {
      webApp.BackButton.show();
      const goBack = () => dispatch({ type: 'BACK' });
      webApp.BackButton.onClick(goBack);
      return () => {
        webApp.BackButton.offClick(goBack);
        webApp.BackButton.hide();
      };
    } else if (state.step === 1) {
      webApp.BackButton.show();
      const goHome = () => router.push('/miniapp');
      webApp.BackButton.onClick(goHome);
      return () => {
        webApp.BackButton.offClick(goHome);
        webApp.BackButton.hide();
      };
    } else {
      webApp.BackButton.hide();
    }
  }, [webApp, state.step, router]);

  const handleConfirm = useCallback(async () => {
    dispatch({ type: 'SUBMIT_START' });
    webApp?.HapticFeedback.impactOccurred('medium');

    try {
      const timeFrom = state.time + ':00';
      // Calculate end time based on service duration
      const [h, m] = state.time.split(':').map(Number);
      const endMinutes = h * 60 + m + state.serviceDuration;
      const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
      const endM = (endMinutes % 60).toString().padStart(2, '0');
      const timeTo = `${endH}:${endM}:00`;

      const result = await miniappApi.createOrder({
        service_id: state.serviceId,
        address: state.address,
        lat: state.lat || null,
        lng: state.lng || null,
        requested_date: state.date,
        requested_time_from: timeFrom,
        requested_time_to: timeTo,
        supplies_source: state.suppliesSource as 'client' | 'company',
      });

      webApp?.HapticFeedback.notificationOccurred('success');
      dispatch({ type: 'SUBMIT_DONE', orderId: result.id });
    } catch (err) {
      console.error(err);
      webApp?.HapticFeedback.notificationOccurred('error');
      dispatch({ type: 'SUBMIT_DONE', orderId: '' });
    }
  }, [state, webApp]);

  return (
    <>
      {state.step < 7 && (
        <div className="miniapp-booking-progress">
          {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
            <div
              key={i}
              className={`miniapp-progress-bar ${i < state.step ? 'miniapp-progress-bar-active' : ''}`}
            />
          ))}
        </div>
      )}

      {state.step === 1 && (
        <StepService
          preselectedCategory={state.category || undefined}
          onSelect={(id, name, price, duration) =>
            dispatch({ type: 'SET_SERVICE', serviceId: id, serviceName: name, servicePrice: price, serviceDuration: duration })
          }
        />
      )}

      {state.step === 2 && (
        <StepAddress
          initialAddress={state.address}
          onSubmit={(address, lat, lng) =>
            dispatch({ type: 'SET_ADDRESS', address, lat, lng })
          }
        />
      )}

      {state.step === 3 && (
        <StepDate
          selectedDate={state.date}
          onSelect={(date) => dispatch({ type: 'SET_DATE', date })}
        />
      )}

      {state.step === 4 && (
        <StepTime
          selectedTime={state.time}
          onSelect={(time) => dispatch({ type: 'SET_TIME', time })}
        />
      )}

      {state.step === 5 && (
        <StepSupplies
          selected={state.suppliesSource}
          onSelect={(source) => dispatch({ type: 'SET_SUPPLIES', source })}
        />
      )}

      {state.step === 6 && (
        <StepConfirm
          data={{
            serviceName: state.serviceName,
            servicePrice: state.servicePrice,
            address: state.address,
            date: state.date,
            time: state.time,
            suppliesSource: state.suppliesSource as 'client' | 'company',
          }}
          loading={state.loading}
          onConfirm={handleConfirm}
        />
      )}

      {state.step === 7 && <StepDone orderId={state.orderId} />}
    </>
  );
}
