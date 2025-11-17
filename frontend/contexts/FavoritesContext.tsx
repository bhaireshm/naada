'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface FavoritesContextValue {
  favorites: Set<string>;
  isLoading: boolean;
  toggleFavorite: (songId: string) => Promise<void>;
  isFavorite: (songId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's favorites on mount
  useEffect(() => {
    refreshFavorites();
  }, []);

  // Refresh favorites from API
  const refreshFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getFavorites } = await import('@/lib/api');
      const favoritesData = await getFavorites();
      
      // Extract song IDs from favorites
      const songIds = new Set(favoritesData.favorites.map((fav: any) => fav.song.id));
      setFavorites(songIds);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if a song is favorited
  const isFavorite = useCallback((songId: string): boolean => {
    return favorites.has(songId);
  }, [favorites]);

  // Toggle favorite status with optimistic updates
  const toggleFavorite = useCallback(async (songId: string) => {
    const wasFavorited = favorites.has(songId);
    
    // Optimistic update
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (wasFavorited) {
        newFavorites.delete(songId);
      } else {
        newFavorites.add(songId);
      }
      return newFavorites;
    });

    try {
      const { addFavorite, removeFavorite } = await import('@/lib/api');
      
      if (wasFavorited) {
        await removeFavorite(songId);
      } else {
        await addFavorite(songId);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      
      // Rollback on error
      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        if (wasFavorited) {
          newFavorites.add(songId);
        } else {
          newFavorites.delete(songId);
        }
        return newFavorites;
      });
      
      throw error;
    }
  }, [favorites]);

  const value: FavoritesContextValue = {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
