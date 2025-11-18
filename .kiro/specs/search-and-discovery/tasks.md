# Implementation Plan

- [x] 1. Set up backend search infrastructure

  - Create search routes and controller with authentication middleware
  - Implement search service with MongoDB queries for songs, artists, albums, and playlists
  - Add database indexes to Song and Playlist models for optimized search performance

  - _Requirements: 1, 2, 3, 4, 5, 6, 10_

- [x] 1.1 Create search routes and controller

  - Create `backend/src/routes/search.ts` with GET /search endpoint
  - Create `backend/src/controllers/searchController.ts` with search request handler
  - Add query parameter validation (q, filter, limit, offset)
  - Apply verifyToken middleware to protect search endpoints

  - _Requirements: 1, 10_

- [x] 1.2 Implement search service for songs

  - Create `backend/src/services/searchService.ts` with SearchService class
  - Implement searchSongs method using MongoDB regex queries
  - Search across title, artist, and album fields with case-insensitive matching

  - Add pagination support with skip and limit
  - Determine match type (title, artist, or album) for each result
  - _Requirements: 2, 3, 10_

- [x] 1.3 Implement search service for artists and albums

  - Implement searchArtists method using MongoDB aggregation pipeline
  - Group songs by artist name and count songs per artist
  - Implement searchAlbums method using MongoDB aggregation pipeline
  - Group songs by album and artist, include song count and year
  - _Requirements: 4, 5_

- [x] 1.4 Implement search service for playlists

  - Implement searchPlaylists method with user-specific filtering
  - Search playlist names with regex matching

  - Include song count in playlist results
  - Add pagination support for playlist results
  - _Requirements: 6_

- [x] 1.5 Add database indexes for search optimization

  - Add indexes to Song model: title, artist, album, and compound (artist, album)
  - Add compound index to Playlist model: name and userId

  - Update Song and Playlist model files with index definitions
  - _Requirements: 10_

- [x] 1.6 Integrate search routes into main application

  - Import search routes in `backend/src/index.ts`
  - Mount search routes at /search path
  - Test search endpoint with various queries using API client
  - _Requirements: 1, 2_

- [x] 2. Create frontend search context and state management

  - Implement SearchContext with React Context API for global search state
  - Create search service for client-side search logic and API integration
  - Implement debouncing mechanism for search input
  - Add search history management with localStorage persistence
  - _Requirements: 1, 2, 8, 10_

- [x] 2.1 Create SearchContext provider

  - Create `frontend/contexts/SearchContext.tsx` with SearchContext
  - Define SearchContextValue interface with state and actions
  - Implement state management for query, isOpen, activeFilter, results, isLoading
  - Add performSearch function with debouncing logic
  - Implement search history management (add, get, clear)
  - _Requirements: 1, 2, 8_

- [x] 2.2 Create client-side search service

  - Create `frontend/lib/searchService.ts` with SearchService class
  - Implement searchLocal method for client-side filtering
  - Add search algorithm: normalize query, filter by title/artist/album, rank results
  - Implement result grouping by category (songs, artists, albums, playlists)
  - Add result caching with 5-minute TTL
  - _Requirements: 2, 10_

- [x] 2.3 Extend API client with search endpoints

  - Add search function to `frontend/lib/api.ts`
  - Create SearchResults and related interfaces

  - Implement authenticated search API call with query parameters
  - Add error handling for search requests
  - _Requirements: 2, 10_

- [x] 2.4 Integrate SearchContext into application

  - Wrap application with SearchContextProvider in `frontend/app/layout.tsx`
  - Ensure SearchContext is available to all components
  - _Requirements: 1_

- [x] 3. Build search input component with keyboard shortcuts

  - Create SearchInput component with global keyboard shortcut (Ctrl/Cmd+K)
  - Add search icon and placeholder text
  - Implement focus management and overlay trigger
  - Make component responsive for mobile and desktop
  - _Requirements: 1, 11_

- [x] 3.1 Create SearchInput component

  - Create `frontend/components/SearchInput.tsx`
  - Add Mantine TextInput with search icon
  - Implement keyboard shortcut listener for Ctrl/Cmd+K
  - Add click handler to open search overlay
  - Style component to match navigation bar design
  - _Requirements: 1_

- [x] 3.2 Add SearchInput to navigation

  - Update navigation component to include SearchInput
  - Position search input prominently in navigation bar
  - Ensure responsive layout on mobile (show search icon only)
  - _Requirements: 1, 11_

- [x] 4. Build search overlay with results display

  - Create SearchOverlay component with full-screen modal
  - Implement filter tabs (All, Songs, Artists, Albums, Playlists)
  - Display grouped search results with proper formatting
  - Add empty states and loading indicators
  - _Requirements: 2, 7, 12_

- [x] 4.1 Create SearchOverlay component structure

  - Create `frontend/components/SearchOverlay.tsx`
  - Use Mantine Modal component for overlay
  - Add search input field at the top
  - Implement close button and backdrop click handler
  - Style overlay for full-screen experience on mobile
  - _Requirements: 1, 11_

- [x] 4.2 Implement filter tabs

  - Add Mantine Tabs component with All, Songs, Artists, Albums, Playlists tabs
  - Connect tabs to SearchContext activeFilter state
  - Highlight active tab with visual indicator
  - Make tabs scrollable on mobile
  - _Requirements: 7_

- [x] 4.3 Create search result display components

  - Create `frontend/components/SearchResultItem.tsx` for individual results
  - Display song results with title, artist, album, and play button
  - Display artist results with name and song count
  - Display album results with name, artist, and song count
  - Display playlist results with name and song count
  - _Requirements: 2, 3, 4, 5, 6_

- [x] 4.4 Implement result grouping and display

  - Group results by category in SearchOverlay
  - Display category headers (Songs, Artists, Albums, Playlists)
  - Limit results to 5 per category for "All" filter
  - Show up to 20 results for specific category filters
  - Add "Show more" indicators when results are truncated
  - _Requirements: 2, 7_

- [x] 4.5 Add empty states and loading indicators

  - Display loading skeleton while search is in progress
  - Show "No results found" message when search returns empty
  - Display search history when query is empty
  - Add helpful suggestions in empty state

  - _Requirements: 8, 12_

- [x] 5. Implement keyboard navigation for search

  - Add arrow key navigation through search results
  - Implement Enter key to select highlighted result
  - Add Escape key to close search overlay
  - Implement Tab key navigation between filter tabs

  - _Requirements: 9_

- [x] 5.1 Add keyboard event listeners
  - Implement useEffect hook in SearchOverlay for keyboard events

  - Add arrow up/down handlers to navigate results
  - Add Enter key handler to activate selected result

  - Add Escape key handler to close overlay
  - Add Tab key handler for filter tab navigation
  - _Requirements: 9_

- [x] 5.2 Implement result selection state

  - Add selectedIndex state to SearchContext
  - Highlight selected result with visual indicator
  - Update selectedIndex on arrow key press
  - Reset selectedIndex when query or filter changes
  - _Requirements: 9_

- [x] 5.3 Implement result activation handlers

  - Add click handlers for song results (play song)
  - Add click handlers for artist results (navigate to filtered library)
  - Add click handlers for album results (navigate to filtered library)
  - Add click handlers for playlist results (navigate to playlist page)
  - Close search overlay after result activation

  - _Requirements: 3, 4, 5, 6_

- [x] 6. Add search history functionality

  - Display recent searches when search input is empty
  - Store search history in localStorage
  - Implement click handlers to repeat previous searches

  - Add clear history button
  - _Requirements: 8_

- [x] 6.1 Implement search history storage

  - Add localStorage functions in searchService.ts
  - Store search queries with timestamp and filter
  - Limit history to 10 most recent items
  - Implement getSearchHistory, addToSearchHistory, clearSearchHistory methods
  - _Requirements: 8_

- [x] 6.2 Display search history in overlay

  - Show search history when query is empty in SearchOverlay
  - Display recent search items with clock icon
  - Add click handlers to populate search field and execute search
  - Add clear all history button
  - _Requirements: 8_

- [x] 7. Implement artist and album filtering in library

  - Add filter state to library page for artist and album filtering
  - Display filtered library view when artist or album is selected from search
  - Add clear filter button to return to full library
  - Show filter indicator with active artist or album name
  - _Requirements: 4, 5_

- [x] 7.1 Add filter state to library page

  - Update `frontend/app/library/page.tsx` with filter state
  - Add URL query parameters for artist and album filters
  - Filter songs based on active filter
  - _Requirements: 4, 5_

- [x] 7.2 Create filter indicator component

  - Display active filter chip at top of library
  - Show artist name or album name in filter chip
  - Add close button to clear filter
  - Style filter chip to match design system
  - _Requirements: 4, 5_

- [x] 7.3 Add "Play All" button for album view

  - Display "Play All" button when album filter is active
  - Implement click handler to play all songs in album sequentially
  - Use AudioPlayerContext setQueue function
  - _Requirements: 5_

- [x] 8. Optimize search performance

  - Implement request cancellation for pending searches
  - Add result caching with TTL
  - Optimize client-side search algorithm
  - Add loading states and error handling
  - _Requirements: 10, 12_

- [x] 8.1 Implement request cancellation

  - Use AbortController to cancel pending search requests
  - Cancel previous request when new search is initiated
  - Handle cancellation errors gracefully
  - _Requirements: 10_

- [x] 8.2 Add result caching

  - Implement cache Map in SearchService
  - Store results with query+filter as key
  - Set 5-minute TTL for cached results
  - Clear cache when library is updated (song upload, playlist changes)
  - _Requirements: 10_

- [x] 8.3 Optimize client-side search

  - Implement efficient string matching algorithm
  - Use memoization for expensive operations
  - Limit result processing to visible items
  - _Requirements: 10_

- [x] 9. Add mobile-specific search features

  - Implement full-screen search overlay on mobile
  - Add swipe-down gesture to close overlay
  - Ensure touch-friendly tap targets (44x44 pixels minimum)
  - Auto-focus search input and show keyboard on mobile
  - _Requirements: 11_

- [x] 9.1 Implement mobile-specific overlay styles

  - Make search overlay full-screen on mobile devices
  - Adjust padding and spacing for mobile
  - Ensure close button is easily accessible
  - _Requirements: 11_

- [x] 9.2 Add swipe gesture support

  - Implement swipe-down gesture handler using touch events
  - Close overlay when swipe threshold is reached
  - Add visual feedback during swipe
  - _Requirements: 11_

- [x] 9.3 Optimize mobile keyboard handling

  - Auto-focus search input when overlay opens on mobile
  - Prevent body scroll when keyboard is visible
  - Handle keyboard show/hide events
  - _Requirements: 11_

- [x] 10. Add error handling and edge cases


  - Handle network errors with retry functionality
  - Add timeout for search requests (10 seconds)
  - Validate query length and format
  - Handle empty library gracefully
  - _Requirements: 12_

- [x] 10.1 Implement error boundaries


  - Add error boundary component for search overlay
  - Display user-friendly error messages
  - Add retry button for failed searches
  - Log errors to console for debugging
  - _Requirements: 12_

- [x] 10.2 Add input validation


  - Validate query length (minimum 1 character, maximum 100 characters)
  - Sanitize query input to prevent injection
  - Show validation errors to user
  - _Requirements: 12_

- [x] 10.3 Handle edge cases

  - Display helpful message when library is empty
  - Handle special characters in search queries
  - Test with various query formats (numbers, symbols, unicode)
  - _Requirements: 12_

- [ ]* 11. Write tests for search functionality
  - Write unit tests for SearchService
  - Write component tests for SearchInput and SearchOverlay
  - Write integration tests for end-to-end search flow
  - Write backend tests for search endpoints
  - _Requirements: All_

- [ ]* 11.1 Write frontend unit tests
  - Test client-side search algorithm in SearchService
  - Test debouncing logic
  - Test search history management
  - Test result caching
  - _Requirements: 2, 8, 10_

- [ ]* 11.2 Write frontend component tests
  - Test SearchInput keyboard shortcuts
  - Test SearchOverlay filter tabs
  - Test keyboard navigation
  - Test result click handlers
  - _Requirements: 1, 7, 9_

- [ ]* 11.3 Write backend unit tests
  - Test searchSongs method with various queries
  - Test searchArtists aggregation
  - Test searchAlbums aggregation
  - Test searchPlaylists with user filtering
  - _Requirements: 3, 4, 5, 6_

- [ ]* 11.4 Write integration tests
  - Test end-to-end search flow from input to results
  - Test search with different filters
  - Test pagination
  - Test error scenarios
  - _Requirements: All_
