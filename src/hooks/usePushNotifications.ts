'use client';

import { useEffect, useState, useCallback } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  loading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    loading: true,
    error: null,
  });

  const urlBase64ToUint8Array = useCallback((base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState(prev => ({ ...prev, isSupported: false, loading: false }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        isSupported: true,
        isSubscribed: !!subscription,
        subscription,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSupported: true,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      }));
    }
  }, []);

  const subscribe = useCallback(async (vapidPublicKey: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: subscription.getKey('p256dh') 
            ? Buffer.from(subscription.getKey('p256dh')!).toString('base64')
            : '',
          auth: subscription.getKey('auth')
            ? Buffer.from(subscription.getKey('auth')!).toString('base64')
            : '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe on server');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
        loading: false,
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe',
      }));
      return false;
    }
  }, [urlBase64ToUint8Array]);

  const unsubscribe = useCallback(async () => {
    if (!state.subscription) {
      return false;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      await state.subscription.unsubscribe();

      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe on server');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        loading: false,
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe',
      }));
      return false;
    }
  }, [state.subscription]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored');
    };
    const handleOffline = () => {
      console.log('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    refreshSubscription: checkSubscription,
  };
}
