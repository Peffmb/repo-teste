'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushToggle() {
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe, error } = usePushNotifications();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
    
    setIsToggling(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
      }
    } finally {
      setIsToggling(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={isSubscribed ? 'outline' : 'primary'}
        size="sm"
        onClick={handleToggle}
        isLoading={isToggling || loading}
      >
        {isSubscribed ? (
          <>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications On
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Enable Notifications
          </>
        )}
      </Button>
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
}
