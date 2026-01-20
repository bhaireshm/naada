'use client';

import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface FavoritesContextValue {
  favorites: Set<string>;
  isLoading: boolean;
  toggleFavorite: (songId: string) => Promise<void>;
  isFavorite: (songId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's favorites on mount
  useEffect(() => {
    // Only fetch if user might be authenticated (check for Firebase auth state)
    const checkAuthAndFetch = async () => {
      try {
        const { getIdToken, firebaseAuth } = await import('@/lib/firebase');

        // Wait for auth state to be determined
        const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
          if (user) {
            try {
              const token = await getIdToken();
              if (token) {
                await refreshFavorites();
              }
            } catch (err) {
              setIsLoading(false);
              console.error(err);
            }
          } else {
            setIsLoading(false);
          }
        });

        // Cleanup subscription
        return () => unsubscribe();
      } catch (error) {
        // User not authenticated, skip fetching favorites
        setIsLoading(false);
        console.error(error)
      }
    };

    checkAuthAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh favorites from API
  const refreshFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getFavorites } = await import('@/lib/api');
      const favoritesData = await getFavorites();

      // Extract song IDs from favorites
      const songIds = new Set<string>((favoritesData as { favorites: Array<{ song: { id: string } }> }).favorites.map((fav) => fav.song.id));
      setFavorites(songIds);
    } catch (error) {
      // Silently fail if user is not authenticated
      if (error instanceof Error && !error.message.includes('not authenticated')) {
        console.error('Failed to fetch favorites:', error);
      }
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

  const value: FavoritesContextValue = useMemo(() => ({
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
  }), [favorites, isFavorite, isLoading, refreshFavorites, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
