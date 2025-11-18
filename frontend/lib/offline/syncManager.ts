/**
 * Sync Manager
 * Handles synchronization of offline actions with the server
 */

import { offlineStorage } from './offlineStorage';
import { requestBackgroundSync } from '../sw/register';
import { getIdToken } from '../firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

class SyncManager {
  private isSyncing = false;
  private syncCallbacks: Array<(result: SyncResult) => void> = [];

  /**
   * Queue an action for syncing
   */
  async queueAction(
    type: 'favorite' | 'unfavorite' | 'playlist-create' | 'playlist-update' | 'playlist-delete',
    data: Record<string, unknown>
  ): Promise<void> {
    await offlineStorage.addToSyncQueue(type, data);
    console.log('[Sync] Action queued:', type, data);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncPendingActions();
    } else {
      // Register for background sync when back online
      try {
        await requestBackgroundSync('sync-all');
      } catch (error) {
        console.warn('[Sync] Background sync not available:', error);
      }
    }
  }

  /**
   * Sync all pending actions
   */
  async syncPendingActions(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[Sync] Already syncing, skipping...');
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    if (!navigator.onLine) {
      console.log('[Sync] Offline, cannot sync');
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    this.isSyncing = true;
    console.log('[Sync] Starting sync...');

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      const syncQueue = await offlineStorage.getSyncQueue();
      console.log(`[Sync] Found ${syncQueue.length} items to sync`);

      for (const item of syncQueue) {
        try {
          await this.syncItem(item);
          await offlineStorage.removeFromSyncQueue(item.id);
          result.synced++;
          console.log('[Sync] Synced item:', item.id);
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: item.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          console.error('[Sync] Failed to sync item:', item.id, error);

          // Update retry count
          await offlineStorage.updateSyncQueueRetry(item.id);

          // Remove from queue if too many retries
          if (item.retryCount >= 3) {
            console.log('[Sync] Max retries reached, removing from queue:', item.id);
            await offlineStorage.removeFromSyncQueue(item.id);
          }
        }
      }

      result.success = result.failed === 0;
      console.log('[Sync] Sync complete:', result);

      // Notify callbacks
      this.syncCallbacks.forEach(callback => callback(result));
    } catch (error) {
      console.error('[Sync] Sync failed:', error);
      result.success = false;
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: {
    id: string;
    type: 'favorite' | 'unfavorite' | 'playlist-create' | 'playlist-update' | 'playlist-delete';
    data: Record<string, unknown>;
  }): Promise<void> {
    const token = await getIdToken();

    switch (item.type) {
      case 'favorite':
        await this.syncFavorite(item.data.songId as string, token);
        break;
      case 'unfavorite':
        await this.syncUnfavorite(item.data.songId as string, token);
        break;
      case 'playlist-create':
        await this.syncPlaylistCreate(item.data, token);
        break;
      case 'playlist-update':
        await this.syncPlaylistUpdate(item.data, token);
        break;
      case 'playlist-delete':
        await this.syncPlaylistDelete(item.data.id as string, token);
        break;
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }

  /**
   * Sync favorite action
   */
  private async syncFavorite(songId: string, token: string | null): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ songId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync favorite: ${response.statusText}`);
    }

    // Mark as synced in local storage
    await offlineStorage.markFavoriteSynced(songId);
  }

  /**
   * Sync unfavorite action
   */
  private async syncUnfavorite(songId: string, token: string | null): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/favorites/${songId}`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to sync unfavorite: ${response.statusText}`);
    }
  }

  /**
   * Sync playlist create action
   */
  private async syncPlaylistCreate(data: Record<string, unknown>, token: string | null): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync playlist create: ${response.statusText}`);
    }
  }

  /**
   * Sync playlist update action
   */
  private async syncPlaylistUpdate(data: Record<string, unknown>, token: string | null): Promise<void> {
    const playlistId = data.id as string;
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync playlist update: ${response.statusText}`);
    }
  }

  /**
   * Sync playlist delete action
   */
  private async syncPlaylistDelete(playlistId: string, token: string | null): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to sync playlist delete: ${response.statusText}`);
    }
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    await offlineStorage.clearSyncQueue();
    console.log('[Sync] Sync queue cleared');
  }

  /**
   * Get sync queue status
   */
  async getSyncQueueStatus(): Promise<{
    pending: number;
    items: Array<{ id: string; type: string; retryCount: number }>;
  }> {
    const queue = await offlineStorage.getSyncQueue();
    return {
      pending: queue.length,
      items: queue.map(item => ({
        id: item.id,
        type: item.type,
        retryCount: item.retryCount,
      })),
    };
  }

  /**
   * Register sync callback
   */
  onSync(callback: (result: SyncResult) => void): () => void {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Sync] Back online, syncing...');
    syncManager.syncPendingActions();
  });
}
