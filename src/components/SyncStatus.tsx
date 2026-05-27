'use client';

import { useEffect, useState } from 'react';
import { cn } from './ui';

interface SyncStatusProps {
  pendingCount?: number;
}

export function SyncStatus({ pendingCount = 0 }: SyncStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && pendingCount === 0) {
      setLastSync(new Date());
    }
  }, [isOnline, pendingCount]);

  return (
    <div className={cn(
      'flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm',
      isOnline ? 'bg-green-50' : 'bg-yellow-50'
    )}>
      <span className={cn(
        'w-2 h-2 rounded-full',
        isOnline ? 'bg-green-500' : 'bg-yellow-500'
      )} />
      <span className={cn(
        'font-medium',
        isOnline ? 'text-green-700' : 'text-yellow-700'
      )}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {pendingCount > 0 && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-yellow-700">{pendingCount} pending</span>
        </>
      )}
      {lastSync && !isOnline && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 text-xs">
            Last sync: {lastSync.toLocaleTimeString()}
          </span>
        </>
      )}
    </div>
  );
}
