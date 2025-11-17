'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type SearchFilter = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

export interface SongResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  matchType: 'title' | 'artist' | 'album';
}

export interface ArtistResult {
  name: string;
  songCount: number;
  albums: string[];
}

export interface AlbumResult {
  name: string;
  artist: string;
  songCount: number;
  year?: number;
}

export interface PlaylistResult {
  id: string;
  name: string;
  songCount: number;
  createdAt: string;
}

export interface SearchResults {
  query: string;
  filter: SearchFilter;
  results: {
    songs: SongResult[];
    artists: ArtistResult[];
    albums: AlbumResult[];
    playlists: PlaylistResult[];
  };
  totalCounts: {
    songs: number;
    artists: number;
    albums: number;
    playlists: number;
  };
  hasMore: boolean;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  filter?: SearchFilter;
}

interface SearchContextValue {
  // State
  query: string;
  isOpen: boolean;
  activeFilter: SearchFilter;
  results: SearchResults | null;
  isLoading: boolean;
  searchHistory: SearchHistoryItem[];
  selectedIndex: number;

  // Actions
  setQuery: (query: string) => void;
  setIsOpen: (isOpen: boolean) => void;
  setActiveFilter: (filter: SearchFilter) => void;
  performSearch: (query: string, filter?: SearchFilter) => Promise<void>;
  clearSearch: () => void;
  clearHistory: () => void;
  addToHistory: (query: string, filter?: SearchFilter) => void;
  setSelectedIndex: (index: number) => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

const SEARCH_HISTORY_KEY = 'musicPlayerSearchHistory';
const MAX_HISTORY_ITEMS = 10;
const DEBOUNCE_DELAY = 300;

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored) as SearchHistoryItem[];
        setSearchHistory(history);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage whenever it changes
  const saveHistory = useCallback((history: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, []);

  // Add item to search history
  const addToHistory = useCallback((searchQuery: string, filter?: SearchFilter) => {
    if (!searchQuery.trim()) return;

    setSearchHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((item) => item.query !== searchQuery);

      // Add new item at the beginning
      const newHistory = [
        { query: searchQuery, timestamp: Date.now(), filter },
        ...filtered,
      ].slice(0, MAX_HISTORY_ITEMS);

      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }, []);

  // Perform search with debouncing and request cancellation
  const performSearch = useCallback(async (searchQuery: string, filter?: SearchFilter) => {
    // Cancel previous request
    if (abortController) {
      abortController.abort();
    }

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // If query is empty, clear results
    if (!searchQuery.trim()) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    // Set loading state immediately
    setIsLoading(true);

    // Create new abort controller
    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    // Create new debounce timer
    const timer = setTimeout(async () => {
      try {
        const searchFilter = filter || activeFilter;
        const cacheKey = `${searchQuery}|${searchFilter}`;

        // Check cache first
        const { searchService } = await import('@/lib/searchService');
        const cachedResults = searchService.getCachedResults(cacheKey);
        
        if (cachedResults && !newAbortController.signal.aborted) {
          setResults(cachedResults);
          setIsLoading(false);
          return;
        }

        // Import search function dynamically to avoid circular dependencies
        const { search } = await import('@/lib/api');

        const searchResults = await search(searchQuery, searchFilter);
        
        // Only update if not aborted
        if (!newAbortController.signal.aborted) {
          setResults(searchResults);
          // Cache the results
          searchService.setCachedResults(cacheKey, searchResults);
          // Add to history after successful search
          addToHistory(searchQuery, searchFilter);
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Search failed:', error);
        if (!newAbortController.signal.aborted) {
          setResults(null);
        }
      } finally {
        if (!newAbortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_DELAY);

    setDebounceTimer(timer);
  }, [debounceTimer, abortController, activeFilter, addToHistory]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setSelectedIndex(-1);
  }, []);

  // Reset selected index when query or filter changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, activeFilter]);

  const value: SearchContextValue = {
    query,
    isOpen,
    activeFilter,
    results,
    isLoading,
    searchHistory,
    selectedIndex,
    setQuery,
    setIsOpen,
    setActiveFilter,
    performSearch,
    clearSearch,
    clearHistory,
    addToHistory,
    setSelectedIndex,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
}
