# Implementation Plan

- [x] 1. Set up backend favorites infrastructure

  - Create Favorite model with user-song relationships
  - Implement favorites controller with CRUD operations
  - Create favorites routes with authentication
  - Add database indexes for query optimization
  - _Requirements: 11, 12_

- [x] 1.1 Create Favorite model

  - Create `backend/src/models/Favorite.ts` with Mongoose schema
  - Define userId (String), songId (ObjectId reference), createdAt (Date) fields
  - Add compound unique index on userId and songId to prevent duplicates
  - Add index on userId and createdAt for efficient queries
  - Add index on songId for favorite count queries
  - _Requirements: 12_

- [x] 1.2 Create favorites controller
  - Create `backend/src/controllers/favoritesController.ts`
  - Implement addFavorite function to create favorite with duplicate handling
  - Implement removeFavorite function to delete favorite
  - Implement getFavorites function with song population and pagination
  - Implement checkFavoriteStatus function to check if song is favorited
  - Implement getFavoriteCount function to count favorites for a song
  - _Requirements: 11_

- [x] 1.3 Create favorites routes
  - Create `backend/src/routes/favorites.ts`
  - Add POST /favorites/:songId route for adding favorites
  - Add DELETE /favorites/:songId route for removing favorites
  - Add GET /favorites route for getting all user favorites
  - Add GET /favorites/:songId/status route for checking favorite status
  - Apply verifyToken middleware to all routes
  - _Requirements: 11_

- [x] 1.4 Integrate favorites routes into application
  - Import favorites routes in `backend/src/index.ts`
  - Mount favorites routes at /favorites path
  - Test all endpoints with API client
  - _Requirements: 11_

- [x] 2. Create frontend favorites context and state management

  - Implement FavoritesContext with React Context API
  - Create API client functions for favorites endpoints
  - Implement optimistic updates with error rollback
  - Add favorites caching for fast lookups
  - _Requirements: 1, 11_

- [x] 2.1 Create FavoritesContext provider

  - Create `frontend/contexts/FavoritesContext.tsx`
  - Define FavoritesContextValue interface with favorites Set, loading state, and actions
  - Implement state management for favorites using useState
  - Create toggleFavorite function with optimistic updates
  - Create isFavorite function for O(1) lookups
  - Implement refreshFavorites function to fetch latest favorites
  - _Requirements: 1_

- [x] 2.2 Extend API client with favorites endpoints

  - Add favorites functions to `frontend/lib/api.ts`
  - Implement addFavorite(songId) API call
  - Implement removeFavorite(songId) API call
  - Implement getFavorites() API call with pagination support
  - Implement checkFavoriteStatus(songId) API call
  - Add error handling for all favorites requests
  - _Requirements: 11_

- [x] 2.3 Integrate FavoritesContext into application

  - Wrap application with FavoritesProvider in `frontend/app/layout.tsx`
  - Fetch user favorites on context mount
  - Ensure FavoritesContext is available to all components
  - _Requirements: 1_

- [x] 3. Build FavoriteButton component

  - Create reusable FavoriteButton component with heart icon
  - Implement toggle functionality with loading states
  - Add animations for favorite state transitions
  - Make component accessible with ARIA labels
  - _Requirements: 1, 3_

- [x] 3.1 Create FavoriteButton component

  - Create `frontend/components/FavoriteButton.tsx`
  - Use Mantine ActionIcon with heart icon (IconHeart, IconHeartFilled)
  - Connect to FavoritesContext for state and toggle function
  - Implement click handler to toggle favorite status
  - Add loading state during API call
  - Show filled heart for favorited songs, outlined for non-favorited
  - _Requirements: 1_

- [x] 3.2 Add animations and visual feedback

  - Add scale animation on favorite toggle
  - Implement color transition between states
  - Add hover effects for better UX
  - Ensure animations work on mobile devices
  - _Requirements: 1_

- [x] 3.3 Make FavoriteButton accessible

  - Add ARIA labels: "Add to favorites" / "Remove from favorites"
  - Ensure keyboard accessibility with Tab and Enter
  - Add focus indicators
  - Test with screen readers
  - _Requirements: 1_

- [x] 4. Add FavoriteButton to existing pages

  - Integrate FavoriteButton into library page song list
  - Add FavoriteButton to playlist detail pages
  - Add FavoriteButton to search results
  - Add FavoriteButton to song details page
  - _Requirements: 1_

- [x] 4.1 Add FavoriteButton to library page

  - Update `frontend/app/library/page.tsx`
  - Add FavoriteButton next to each song in the table and mobile list
  - Ensure proper spacing and alignment
  - Test favorite toggle functionality
  - _Requirements: 1_

- [x] 4.2 Add FavoriteButton to Playing Bar

  - Update Playing Bar component to include FavoriteButton
  - Position heart icon near song title or in controls area
  - Sync favorite status with currently playing song
  - Ensure visibility on both mobile and desktop
  - _Requirements: 3_

- [x] 5. Create Favorites page
  - Build dedicated Favorites page to display all favorited songs
  - Show total favorite count
  - Implement empty state for no favorites
  - Add playback and playlist operations
  - _Requirements: 2, 4_

- [x] 5.1 Create Favorites page component

  - Create `frontend/app/favorites/page.tsx`
  - Fetch favorites from FavoritesContext or API
  - Display songs in responsive grid/table layout
  - Show total favorite count in page header
  - Add loading skeleton while fetching
  - _Requirements: 2_

- [x] 5.2 Implement song actions on Favorites page

  - Add play button for each song
  - Add "Add to Playlist" menu
  - Add "View Details" option
  - Add remove from favorites button (using FavoriteButton)
  - Update display when song is removed from favorites
  - _Requirements: 2_

- [x] 5.3 Create empty state for Favorites page
  - Display empty state when user has no favorites
  - Show heart icon illustration
  - Add explanation text about how to add favorites
  - Provide link/button to navigate to library
  - Style empty state to match application design
  - _Requirements: 4_

- [x] 5.4 Add Favorites link to navigation

  - Update navigation component to include "Favorites" or "Liked Songs" link
  - Add heart icon to navigation item
  - Highlight active state when on Favorites page
  - Ensure navigation works on mobile and desktop
  - _Requirements: 2_

- [x] 6. Implement volume control enhancements in useAudioPlayer



  - Add volume persistence with localStorage
  - Add mute state management with volume restoration
  - Add increaseVolume and decreaseVolume functions
  - _Requirements: 5, 7, 8_

- [x] 6.1 Implement volume persistence in useAudioPlayer

  - Save volume to localStorage key 'musicPlayerVolume' on every change
  - Save mute state to localStorage key 'musicPlayerMuted'
  - Load volume and mute state on app initialization (in existing persisted state logic)
  - Default to 70% volume (0.7) for first-time users
  - Handle localStorage unavailable gracefully (use in-memory state)
  - _Requirements: 8_

- [x] 6.2 Implement mute state management

  - Add isMuted state to useAudioPlayer hook
  - Add previousVolume state to store volume before muting
  - Create toggleMute function to mute/unmute with volume restoration
  - When muting: save current volume to previousVolume, set volume to 0, set isMuted to true
  - When unmuting: restore previousVolume, set isMuted to false
  - Update audio element muted property: audioRef.current.muted = isMuted
  - _Requirements: 7_

- [x] 6.3 Add increaseVolume and decreaseVolume functions

  - Create increaseVolume function that increases volume by 0.05 (5%)
  - Create decreaseVolume function that decreases volume by 0.05 (5%)
  - Clamp volume values between 0 and 1
  - Ensure functions work with existing setVolume logic
  - _Requirements: 5, 9_

- [ ] 7. Enhance AudioPlayer component with improved volume controls
  - Update volume icon logic to use mute state
  - Ensure volume slider works with 0-1 range (already implemented)
  - Add volume percentage display (optional enhancement)
  - Ensure mobile-friendly touch targets
  - _Requirements: 5, 6, 7, 10_

- [x] 7.1 Update volume icon to use mute state


  - Modify renderVolumeIcon function in AudioPlayer.tsx to check isMuted state
  - Display IconVolumeOff when isMuted is true (regardless of volume value)
  - Display IconVolume3 when volume is 0 and not muted
  - Display IconVolume when volume is 0.01-0.33
  - Display IconVolume2 when volume is 0.34-0.66
  - Display IconVolume when volume is 0.67-1.0
  - _Requirements: 6, 7_



- [ ] 7.2 Update mute button to use toggleMute function
  - Change onClick handler from `setVolume(volume === 0 ? 1 : 0)` to `toggleMute()`
  - Update aria-label to reflect mute/unmute state dynamically
  - Ensure button works correctly with new mute state management
  - _Requirements: 7_

- [ ] 7.3 Add volume percentage display (optional)
  - Add Text component showing volume percentage (volume * 100)
  - Position near volume slider on desktop
  - Hide on mobile to save space

  - Style for readability
  - _Requirements: 5_

- [ ] 8. Add keyboard shortcuts for volume control
  - Implement global keyboard event listeners in AudioPlayer component
  - Add Up Arrow to increase volume by 5%
  - Add Down Arrow to decrease volume by 5%
  - Add M key to toggle mute


  - Prevent shortcuts when input fields or search overlay are focused
  - _Requirements: 9_

- [ ] 8.1 Implement keyboard event listeners in AudioPlayer
  - Add useEffect hook in AudioPlayer.tsx component
  - Listen for keydown events on window/document
  - Check if search overlay is open or input fields are focused (document.activeElement)
  - On ArrowUp: call increaseVolume() and prevent default
  - On ArrowDown: call decreaseVolume() and prevent default
  - On 'm' or 'M': call toggleMute() and prevent default
  - Clean up event listener on unmount
  - _Requirements: 9_

- [ ]* 10. Add accessibility features
  - Add ARIA labels to all volume controls
  - Ensure keyboard navigation works properly
  - Test with screen readers
  - Verify color contrast for visibility
  - Add focus indicators
  - _Requirements: 14_

- [ ]* 10.1 Add ARIA labels and roles
  - Add ARIA label to volume slider: "Volume slider"
  - Add ARIA label to mute button: "Mute" / "Unmute"
  - Add ARIA live region for volume announcements
  - Add role="slider" to volume control
  - _Requirements: 14_

- [ ]* 10.2 Test accessibility
  - Test keyboard navigation with Tab and arrow keys
  - Test with NVDA or JAWS screen reader
  - Verify volume changes are announced
  - Check color contrast ratios
  - Verify focus indicators are visible
  - _Requirements: 14_

- [ ]* 11. Add error handling
  - Handle audio element load failures
  - Handle localStorage unavailable
  - Handle API errors for favorites
  - Add user-friendly error messages
  - _Requirements: 15_

- [ ]* 11.1 Implement error handling for volume control
  - Disable volume controls if audio element fails to load
  - Revert to previous volume if adjustment fails
  - Handle browser autoplay policies gracefully
  - Use in-memory state if localStorage unavailable
  - Log errors to console for debugging
  - _Requirements: 15_

- [ ]* 11.2 Implement error handling for favorites
  - Show error notification if favorite toggle fails
  - Rollback optimistic update on error
  - Handle network errors gracefully
  - Display user-friendly error messages
  - _Requirements: 1_

- [ ]* 12. Write tests for favorites and volume control
  - Write unit tests for FavoritesContext
  - Write component tests for FavoriteButton and VolumeControl
  - Write backend tests for favorites endpoints
  - Write integration tests for end-to-end flows
  - _Requirements: All_

- [ ]* 12.1 Write frontend unit tests
  - Test FavoritesContext: toggle favorite, optimistic updates, error rollback
  - Test volume functions: setVolume, toggleMute, increase/decrease
  - Test localStorage persistence
  - Test keyboard shortcuts
  - _Requirements: 1, 5, 7, 8, 9_

- [ ]* 12.2 Write component tests
  - Test FavoriteButton: click handler, loading state, icon states
  - Test VolumeControl: slider interaction, mute toggle, icon states
  - Test Favorites page: empty state, song list, remove favorite
  - _Requirements: 1, 2, 4, 5, 6, 7_

- [ ]* 12.3 Write backend tests
  - Test addFavorite: success, duplicate prevention, invalid song
  - Test removeFavorite: success, not found handling
  - Test getFavorites: pagination, populated songs, empty list
  - Test checkFavoriteStatus: favorited and not favorited cases
  - Test getFavoriteCount: accurate counting
  - _Requirements: 11, 12_

- [ ]* 12.4 Write integration tests
  - Test end-to-end favorite flow: add, view in favorites page, remove
  - Test volume persistence across page reloads
  - Test keyboard shortcuts in real browser environment
  - Test mobile touch interactions
  - _Requirements: All_
