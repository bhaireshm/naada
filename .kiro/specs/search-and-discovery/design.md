# Design Document

## Overview

The Search and Discovery feature will provide users with a fast, intuitive way to find songs, artists, albums, and playlists within their music library. The implementation will use a hybrid approach: client-side search for small libraries (< 1000 songs) and server-side search for larger libraries. The feature will be accessible globally through a keyboard shortcut (Ctrl/Cmd+K) and will provide real-time results with debouncing to optimize performance.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Search     │  │   Search     │  │   Search     │      │
│  │   Input      │→ │   Context    │→ │   Results    │      │
│  │  Component   │  │   Provider   │  │  Component   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Search Service (Client-Side)              │      │
│  │  - Debouncing                                     │      │
│  │  - Local filtering (< 1000 songs)                │      │
│  │  - Result grouping & ranking                     │      │
│  │  - Search history management                     │      │
│  └──────────────────────────────────────────────────┘      │
│                          ↓                                   │
│                    API Client                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐      │
│  │         Search Controller                         │      │
│  │  - Request validation                             │      │
│  │  - Query parsing                                  │      │
│  │  - Response formatting                            │      │
│  └──────────────────────────────────────────────────┘      │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Search Service                            │      │
│  │  - MongoDB text search                            │      │
│  │  - Regex-based search                             │      │
│  │  - Result aggregation                             │      │
│  │  - Pagination                                     │      │
│  └──────────────────────────────────────────────────┘      │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────┐      │
│  │         MongoDB Database                          │      │
│  │  - Song collection (with text indexes)           │      │
│  │  - Playlist collection                            │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Frontend Components

1. **SearchInput Component** (`frontend/components/SearchInput.tsx`)
   - Global search input field in navigation
   - Keyboard shortcut handler (Ctrl/Cmd+K)
   - Focus management
   - Mobile-responsive design

2. **SearchOverlay Component** (`frontend/components/SearchOverlay.tsx`)
   - Full-screen overlay for search results
   - Filter tabs (All, Songs, Artists, Albums, Playlists)
   - Result grouping and display
   - Keyboard navigation support
   - Mobile swipe-to-close gesture

3. **SearchResultItem Component** (`frontend/components/SearchResultItem.tsx`)
   - Individual result display
   - Click handlers for different result types
   - Hover states and selection indicators

4. **SearchContext** (`frontend/contexts/SearchContext.tsx`)
   - Global search state management
   - Search query state
   - Active filter state
   - Search history management
   - Result caching

#### Frontend Services

1. **Search Service** (`frontend/lib/searchService.ts`)
   - Client-side search logic for small libraries
   - Debouncing implementation
   - Result ranking algorithm
   - Search history persistence (localStorage)
   - Cache management

2. **API Extensions** (`frontend/lib/api.ts`)
   - Server-side search API calls
   - Search endpoint integration

#### Backend Components

1. **Search Controller** (`backend/src/controllers/searchController.ts`)
   - Handle search requests
   - Validate query parameters
   - Format and return results

2. **Search Service** (`backend/src/services/searchService.ts`)
   - MongoDB text search implementation
   - Regex-based fallback search
   - Result aggregation and grouping
   - Pagination logic

3. **Search Routes** (`backend/src/routes/search.ts`)
   - Define search endpoints
   - Apply authentication middleware

## Data Models

### Search Query Interface

```typescript
interface SearchQuery {
  query: string;           // Search text
  filter?: SearchFilter;   // Optional filter (songs, artists, albums, playlists)
  limit?: number;          // Results per category (default: 5)
  offset?: number;         // Pagination offset
}

type SearchFilter = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';
```

### Search Results Interface

```typescript
interface SearchResults {
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

interface SongResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  matchType: 'title' | 'artist' | 'album';  // What matched the search
}

interface ArtistResult {
  name: string;
  songCount: number;
  albums: string[];  // Unique album names
}

interface AlbumResult {
  name: string;
  artist: string;
  songCount: number;
  year?: number;
}

interface PlaylistResult {
  id: string;
  name: string;
  songCount: number;
  createdAt: string;
}
```

### Search History Interface

```typescript
interface SearchHistoryItem {
  query: string;
  timestamp: number;
  filter?: SearchFilter;
}

interface SearchHistory {
  items: SearchHistoryItem[];
  maxItems: number;  // Default: 10
}
```

## Components and Interfaces

### Frontend Implementation

#### 1. SearchContext Provider

```typescript
// frontend/contexts/SearchContext.tsx

interface SearchContextValue {
  // State
  query: string;
  isOpen: boolean;
  activeFilter: SearchFilter;
  results: SearchResults | null;
  isLoading: boolean;
  searchHistory: SearchHistoryItem[];
  
  // Actions
  setQuery: (query: string) => void;
  setIsOpen: (isOpen: boolean) => void;
  setActiveFilter: (filter: SearchFilter) => void;
  performSearch: (query: string, filter?: SearchFilter) => Promise<void>;
  clearSearch: () => void;
  clearHistory: () => void;
  addToHistory: (query: string, filter?: SearchFilter) => void;
}
```

**Key Features:**
- Manages global search state
- Handles debounced search execution
- Persists search history to localStorage
- Implements result caching (5-minute TTL)
- Determines client-side vs server-side search based on library size

#### 2. SearchInput Component

```typescript
// frontend/components/SearchInput.tsx

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}
```

**Key Features:**
- Keyboard shortcut listener (Ctrl/Cmd+K)
- Focus management
- Mobile-responsive sizing
- Integration with SearchContext

#### 3. SearchOverlay Component

```typescript
// frontend/components/SearchOverlay.tsx

interface SearchOverlayProps {
  // No props needed - uses SearchContext
}
```

**Key Features:**
- Full-screen overlay with backdrop
- Filter tabs with active state
- Grouped results display
- Keyboard navigation (Arrow keys, Enter, Escape)
- Mobile swipe-to-close gesture
- Empty states and loading indicators
- Search history display when query is empty

#### 4. Search Service

```typescript
// frontend/lib/searchService.ts

class SearchService {
  private cache: Map<string, CachedResult>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DEBOUNCE_DELAY = 300; // milliseconds
  
  // Client-side search for small libraries
  searchLocal(
    query: string,
    songs: Song[],
    playlists: Playlist[],
    filter: SearchFilter
  ): SearchResults;
  
  // Server-side search for large libraries
  async searchRemote(
    query: string,
    filter: SearchFilter,
    limit?: number
  ): Promise<SearchResults>;
  
  // Debounced search wrapper
  debouncedSearch(
    query: string,
    callback: (results: SearchResults) => void
  ): void;
  
  // Search history management
  getSearchHistory(): SearchHistoryItem[];
  addToSearchHistory(query: string, filter?: SearchFilter): void;
  clearSearchHistory(): void;
  
  // Cache management
  getCachedResults(key: string): SearchResults | null;
  setCachedResults(key: string, results: SearchResults): void;
  clearCache(): void;
}
```

**Client-Side Search Algorithm:**
1. Normalize query (lowercase, trim)
2. Filter songs by title, artist, album (case-insensitive includes)
3. Extract unique artists and albums from filtered songs
4. Filter playlists by name
5. Rank results by relevance:
   - Exact matches first
   - Starts-with matches second
   - Contains matches last
6. Limit results per category
7. Return grouped results

### Backend Implementation

#### 1. Search Routes

```typescript
// backend/src/routes/search.ts

// GET /search?q=query&filter=songs&limit=20
router.get('/', verifyToken, searchController.search);

// GET /search/suggestions?q=query
router.get('/suggestions', verifyToken, searchController.getSuggestions);
```

#### 2. Search Controller

```typescript
// backend/src/controllers/searchController.ts

export async function search(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { q: query, filter = 'all', limit = 5, offset = 0 } = req.query;
  
  // Validate query
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({
      error: {
        code: 'INVALID_QUERY',
        message: 'Search query is required',
      },
    });
    return;
  }
  
  // Perform search
  const results = await searchService.search(
    query.trim(),
    req.userId!,
    filter as SearchFilter,
    Number(limit),
    Number(offset)
  );
  
  res.status(200).json(results);
}

export async function getSuggestions(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  // Return quick suggestions for autocomplete
  // (Future enhancement)
}
```

#### 3. Search Service

```typescript
// backend/src/services/searchService.ts

class SearchService {
  async search(
    query: string,
    userId: string,
    filter: SearchFilter,
    limit: number,
    offset: number
  ): Promise<SearchResults> {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Build search results
    const results: SearchResults = {
      query,
      filter,
      results: {
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
      },
      totalCounts: {
        songs: 0,
        artists: 0,
        albums: 0,
        playlists: 0,
      },
      hasMore: false,
    };
    
    // Search based on filter
    if (filter === 'all' || filter === 'songs') {
      const songResults = await this.searchSongs(normalizedQuery, limit, offset);
      results.results.songs = songResults.items;
      results.totalCounts.songs = songResults.total;
    }
    
    if (filter === 'all' || filter === 'artists') {
      const artistResults = await this.searchArtists(normalizedQuery, limit);
      results.results.artists = artistResults.items;
      results.totalCounts.artists = artistResults.total;
    }
    
    if (filter === 'all' || filter === 'albums') {
      const albumResults = await this.searchAlbums(normalizedQuery, limit);
      results.results.albums = albumResults.items;
      results.totalCounts.albums = albumResults.total;
    }
    
    if (filter === 'all' || filter === 'playlists') {
      const playlistResults = await this.searchPlaylists(
        normalizedQuery,
        userId,
        limit,
        offset
      );
      results.results.playlists = playlistResults.items;
      results.totalCounts.playlists = playlistResults.total;
    }
    
    // Determine if there are more results
    results.hasMore = this.hasMoreResults(results, limit, offset);
    
    return results;
  }
  
  private async searchSongs(
    query: string,
    limit: number,
    offset: number
  ): Promise<{ items: SongResult[]; total: number }> {
    // Use MongoDB regex search for flexibility
    const regex = new RegExp(query, 'i');
    
    const songs = await Song.find({
      $or: [
        { title: regex },
        { artist: regex },
        { album: regex },
      ],
    })
      .skip(offset)
      .limit(limit)
      .lean();
    
    const total = await Song.countDocuments({
      $or: [
        { title: regex },
        { artist: regex },
        { album: regex },
      ],
    });
    
    // Determine match type for each song
    const items: SongResult[] = songs.map((song) => {
      let matchType: 'title' | 'artist' | 'album' = 'title';
      
      if (regex.test(song.title)) {
        matchType = 'title';
      } else if (regex.test(song.artist)) {
        matchType = 'artist';
      } else if (song.album && regex.test(song.album)) {
        matchType = 'album';
      }
      
      return {
        id: song._id.toString(),
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        matchType,
      };
    });
    
    return { items, total };
  }
  
  private async searchArtists(
    query: string,
    limit: number
  ): Promise<{ items: ArtistResult[]; total: number }> {
    const regex = new RegExp(query, 'i');
    
    // Aggregate unique artists with song counts
    const artists = await Song.aggregate([
      {
        $match: { artist: regex },
      },
      {
        $group: {
          _id: '$artist',
          songCount: { $sum: 1 },
          albums: { $addToSet: '$album' },
        },
      },
      {
        $limit: limit,
      },
    ]);
    
    const total = artists.length;
    
    const items: ArtistResult[] = artists.map((artist) => ({
      name: artist._id,
      songCount: artist.songCount,
      albums: artist.albums.filter((album: string | null) => album != null),
    }));
    
    return { items, total };
  }
  
  private async searchAlbums(
    query: string,
    limit: number
  ): Promise<{ items: AlbumResult[]; total: number }> {
    const regex = new RegExp(query, 'i');
    
    // Aggregate unique albums with song counts
    const albums = await Song.aggregate([
      {
        $match: { album: { $regex: regex, $ne: null } },
      },
      {
        $group: {
          _id: { album: '$album', artist: '$artist' },
          songCount: { $sum: 1 },
          year: { $first: '$year' },
        },
      },
      {
        $limit: limit,
      },
    ]);
    
    const total = albums.length;
    
    const items: AlbumResult[] = albums.map((album) => ({
      name: album._id.album,
      artist: album._id.artist,
      songCount: album.songCount,
      year: album.year,
    }));
    
    return { items, total };
  }
  
  private async searchPlaylists(
    query: string,
    userId: string,
    limit: number,
    offset: number
  ): Promise<{ items: PlaylistResult[]; total: number }> {
    const regex = new RegExp(query, 'i');
    
    const playlists = await Playlist.find({
      userId,
      name: regex,
    })
      .skip(offset)
      .limit(limit)
      .lean();
    
    const total = await Playlist.countDocuments({
      userId,
      name: regex,
    });
    
    const items: PlaylistResult[] = playlists.map((playlist) => ({
      id: playlist._id.toString(),
      name: playlist.name,
      songCount: playlist.songIds.length,
      createdAt: playlist.createdAt.toISOString(),
    }));
    
    return { items, total };
  }
  
  private hasMoreResults(
    results: SearchResults,
    limit: number,
    offset: number
  ): boolean {
    const { totalCounts, filter } = results;
    
    if (filter === 'all') {
      // For 'all' filter, check if any category has more results
      return (
        totalCounts.songs > limit ||
        totalCounts.artists > limit ||
        totalCounts.albums > limit ||
        totalCounts.playlists > limit
      );
    }
    
    // For specific filters, check if there are more results beyond current page
    const totalForFilter = totalCounts[filter];
    return totalForFilter > offset + limit;
  }
}

export const searchService = new SearchService();
```

## Database Indexes

To optimize search performance, we'll add indexes to the Song and Playlist collections:

```typescript
// backend/src/models/Song.ts

// Add text indexes for full-text search (optional, for future enhancement)
SongSchema.index({ title: 'text', artist: 'text', album: 'text' });

// Add regular indexes for regex searches
SongSchema.index({ title: 1 });
SongSchema.index({ artist: 1 });
SongSchema.index({ album: 1 });

// Compound index for common queries
SongSchema.index({ artist: 1, album: 1 });
```

```typescript
// backend/src/models/Playlist.ts

// Add index for playlist name search
PlaylistSchema.index({ name: 1, userId: 1 });
```

## Error Handling

### Frontend Error Handling

1. **Network Errors**: Display error message in search overlay with retry button
2. **Empty Results**: Show helpful empty state with suggestions
3. **Invalid Query**: Validate query length (minimum 1 character)
4. **Timeout**: Implement 10-second timeout for search requests

### Backend Error Handling

1. **Invalid Query**: Return 400 with clear error message
2. **Database Errors**: Return 500 with generic error message (log details)
3. **Authentication Errors**: Return 401 for missing/invalid tokens
4. **Rate Limiting**: Implement rate limiting to prevent abuse (future enhancement)

## Testing Strategy

### Frontend Tests

1. **Unit Tests**:
   - SearchService: Test client-side search algorithm
   - SearchContext: Test state management and debouncing
   - Search history: Test localStorage persistence

2. **Component Tests**:
   - SearchInput: Test keyboard shortcuts and focus management
   - SearchOverlay: Test filter tabs and result display
   - SearchResultItem: Test click handlers

3. **Integration Tests**:
   - End-to-end search flow
   - Keyboard navigation
   - Mobile gestures

### Backend Tests

1. **Unit Tests**:
   - SearchService: Test search algorithms for each category
   - Result ranking and pagination
   - Query normalization

2. **Integration Tests**:
   - Search endpoint with various queries
   - Filter combinations
   - Pagination

3. **Performance Tests**:
   - Search with large datasets (10,000+ songs)
   - Concurrent search requests
   - Database query optimization

## Performance Considerations

### Frontend Optimizations

1. **Debouncing**: 300ms delay to reduce API calls
2. **Result Caching**: 5-minute TTL for search results
3. **Lazy Loading**: Load search overlay components on demand
4. **Virtual Scrolling**: For large result sets (future enhancement)
5. **Request Cancellation**: Cancel pending requests when query changes

### Backend Optimizations

1. **Database Indexes**: Optimize query performance
2. **Result Limiting**: Cap results per category to prevent large payloads
3. **Query Optimization**: Use lean() for faster queries
4. **Connection Pooling**: Reuse database connections
5. **Caching**: Implement Redis caching for popular queries (future enhancement)

## Security Considerations

1. **Authentication**: All search endpoints require valid JWT token
2. **User Isolation**: Users can only search their own playlists
3. **Input Sanitization**: Sanitize search queries to prevent injection attacks
4. **Rate Limiting**: Prevent abuse through excessive search requests (future enhancement)
5. **Query Length Limits**: Limit query length to 100 characters

## Accessibility

1. **Keyboard Navigation**: Full keyboard support (Arrow keys, Enter, Escape, Tab)
2. **Screen Reader Support**: Proper ARIA labels and roles
3. **Focus Management**: Trap focus within search overlay when open
4. **High Contrast**: Ensure sufficient color contrast for all text
5. **Touch Targets**: Minimum 44x44 pixels for mobile

## Mobile Considerations

1. **Full-Screen Overlay**: Better mobile experience
2. **Touch Gestures**: Swipe down to close
3. **Virtual Keyboard**: Auto-focus input and show keyboard
4. **Responsive Layout**: Stack results vertically on mobile
5. **Touch-Friendly Targets**: Larger tap targets for mobile

## Future Enhancements

1. **Autocomplete Suggestions**: Show suggestions as user types
2. **Search Filters**: Filter by genre, year, duration
3. **Advanced Search**: Boolean operators (AND, OR, NOT)
4. **Search Analytics**: Track popular searches
5. **Voice Search**: Speech-to-text search input
6. **Fuzzy Matching**: Handle typos and misspellings
7. **Search Highlighting**: Highlight matching text in results
8. **Recent Searches Sync**: Sync search history across devices
9. **Smart Suggestions**: ML-based search suggestions
10. **Full-Text Search**: MongoDB Atlas Search for advanced queries
