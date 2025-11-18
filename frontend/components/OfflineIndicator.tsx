'use client';

import { useState, useEffect } from 'react';
import { Badge, Tooltip } from '@mantine/core';
import { IconWifi, IconWifiOff, IconCloudCheck } from '@tabler/icons-react';
import { syncManager } from '@/lib/offline/syncManager';

/**
 * Offline Indicator Component
 * Shows online/offline status and sync status
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      checkSyncStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check sync status periodically
    const checkSyncStatus = async () => {
      const status = await syncManager.getSyncQueueStatus();
      setPendingSync(status.pending);
      setIsSyncing(syncManager.isSyncInProgress());
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 5000);

    // Listen for sync completion
    const unsubscribe = syncManager.onSync(() => {
      checkSyncStatus();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Don't show anything if online and no pending syncs
  if (isOnline && pendingSync === 0 && !isSyncing) {
    return null;
  }

  const getTooltipLabel = () => {
    if (!isOnline) {
      return 'You are offline';
    }
    if (isSyncing) {
      return 'Syncing changes...';
    }
    if (pendingSync > 0) {
      return `${pendingSync} change${pendingSync > 1 ? 's' : ''} pending sync`;
    }
    return 'All changes synced';
  };

  const getIcon = () => {
    if (!isOnline) {
      return <IconWifiOff size={14} />;
    }
    if (isSyncing) {
      return <IconCloudCheck size={14} />;
    }
    return <IconWifi size={14} />;
  };

  const getColor = () => {
    if (!isOnline) {
      return 'red';
    }
    if (isSyncing || pendingSync > 0) {
      return 'yellow';
    }
    return 'green';
  };

  return (
    <Tooltip label={getTooltipLabel()} position="bottom">
      <Badge
        size="sm"
        variant="dot"
        color={getColor()}
        leftSection={getIcon()}
        style={{ cursor: 'pointer' }}
      >
        {!isOnline ? 'Offline' : isSyncing ? 'Syncing' : pendingSync > 0 ? `${pendingSync} pending` : 'Online'}
      </Badge>
    </Tooltip>
  );
}
