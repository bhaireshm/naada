# Implementation Plan

- [ ] 1. Set up backend favorites infrastructure
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



- [ ] 1.2 Create favorites controller
  - Create `backend/src/controllers/favoritesController.ts`
  - Implement addFavorite function to create favorite with duplicate handling
  - Implement removeFavorite function to delete favorite
  - Implement getFavorites function with song population and pagination
  - Implement checkFavoriteStatus function to check if song is favorited


  - Implement getFavoriteCount function to count favorites for a song
  - _Requirements: 11_

- [ ] 1.3 Create favorites routes
  - Create `backend/src/routes/favorites.ts`
  - Add POST /favorites/:songId route for adding favorites
  - Add DELETE /favorites/:songId route for removing favorites


  - Add GET /favorites route for getting all user favorites
  - Add GET /favorites/:songId/status route for checking favorite status
  - Apply verifyToken middleware to all routes
  - _Requirements: 11_

- [ ] 1.4 Integrate favorites routes into application
  - Import favorites routes in `backend/src/index.ts`
  - Mount favorites routes at /favorites path
  - Test all endpoints with API client
  - _Requirements: 11_

- [ ] 2. Create frontend favorites context and state management
  - Implement FavoritesContext with React Context API
  - Create API client functions for favorites endpoints
  - Implement optimistic updates with error rollback
  - Add favorites caching for fast lookups
  - _Requirements: 1, 11_

- [ ] 2.1 Create FavoritesContext provider
  - Create `frontend/contexts/FavoritesContext.tsx`
  - Define FavoritesContextValue interface with favorites Set, loading state, and actions
  - Implement state management for favorites using useState
  - Create toggleFavorite function with optimistic updates
  - Create isFavorite function for O(1) lookups
  - Implement refreshFavorites function to fetch latest favorites
  - _Requirements: 1_

- [ ] 2.2 Extend API client with favorites endpoints
  - Add favorites functions to `frontend/lib/api.ts`
  - Implement addFavorite(songId) API call
  - Implement removeFavorite(songId) API call
  - Implement getFavorites() API call with pagination support
  - Implement checkFavoriteStatus(songId) API call
  - Add error handling for all favorites requests
  - _Requirements: 11_

- [ ] 2.3 Integrate FavoritesContext into application
  - Wrap application with FavoritesProvider in `frontend/app/layout.tsx`
  - Fetch user favorites on context mount
  - Ensure FavoritesContext is available to all components
  - _Requirements: 1_

- [ ] 3. Build FavoriteButton component
  - Create reusable FavoriteButton component with heart icon
  - Implement toggle functionality with loading states
  - Add animations for favorite state transitions
  - Make component accessible with ARIA labels
  - _Requirements: 1, 3_

- [ ] 3.1 Create FavoriteButton component
  - Create `frontend/components/FavoriteButton.tsx`
  - Use Mantine ActionIcon with heart icon (IconHeart, IconHeartFilled)
  - Connect to FavoritesContext for state and toggle function
  - Implement click handler to toggle favorite status
  - Add loading state during API call
  - Show filled heart for favorited songs, outlined for non-favorited
  - _Requirements: 1_

- [ ] 3.2 Add animations and visual feedback
  - Add scale animation on favorite toggle
  - Implement color transition between states
  - Add hover effects for better UX
  - Ensure animations work on mobile devices
  - _Requirements: 1_

- [ ] 3.3 Make FavoriteButton accessible
  - Add ARIA labels: "Add to favorites" / "Remove from favorites"
  - Ensure keyboard accessibility with Tab and Enter
  - Add focus indicators
  - Test with screen readers
  - _Requirements: 1_

- [ ] 4. Add FavoriteButton to existing pages
  - Integrate FavoriteButton into library page song list
  - Add FavoriteButton to playlist detail pages
  - Add FavoriteButton to search results
  - Add FavoriteButton to song details page
  - _Requirements: 1_

- [ ] 4.1 Add FavoriteButton to library page
  - Update `frontend/app/library/page.tsx`
  - Add FavoriteButton next to each song in the table and mobile list
  - Ensure proper spacing and alignment
  - Test favorite toggle functionality
  - _Requirements: 1_

- [ ] 4.2 Add FavoriteButton to Playing Bar
  - Update Playing Bar component to include FavoriteButton
  - Position heart icon near song title or in controls area
  - Sync favorite status with currently playing song
  - Ensure visibility on both mobile and desktop
  - _Requirements: 3_

- [ ] 5. Create Favorites page
  - Build dedicated Favorites page to display all favorited songs
  - Show total favorite count
  - Implement empty state for no favorites
  - Add playback and playlist operations
  - _Requirements: 2, 4_

- [ ] 5.1 Create Favorites page component
  - Create `frontend/app/favorites/page.tsx`
  - Fetch favorites from FavoritesContext or API
  - Display songs in responsive grid/table layout
  - Show total favorite count in page header
  - Add loading skeleton while fetching
  - _Requirements: 2_

- [ ] 5.2 Implement song actions on Favorites page
  - Add play button for each song
  - Add "Add to Playlist" menu
  - Add "View Details" option
  - Add remove from favorites button (using FavoriteButton)
  - Update display when song is removed from favorites
  - _Requirements: 2_

- [ ] 5.3 Create empty state for Favorites page
  - Display empty state when user has no favorites
  - Show heart icon illustration
  - Add explanation text about how to add favorites
  - Provide link/button to navigate to library
  - Style empty state to match application design
  - _Requirements: 4_

- [ ] 5.4 Add Favorites link to navigation
  - Update navigation component to include "Favorites" or "Liked Songs" link
  - Add heart icon to navigation item
  - Highlight active state when on Favorites page
  - Ensure navigation works on mobile and desktop
  - _Requirements: 2_

- [ ] 6. Implement volume control in AudioPlayerContext
  - Extend AudioPlayerContext with volume state
  - Add volume control functions (set, increase, decrease, mute)
  - Implement volume persistence with localStorage
  - Sync volume with audio element
  - _Requirements: 5, 8_

- [ ] 6.1 Extend AudioPlayerContext with volume state
  - Update `frontend/contexts/AudioPlayerContext.tsx` or audio player hook
  - Add volume state (0-100), isMuted state, previousVolume state
  - Initialize volume from localStorage or default to 70%
  - Initialize mute state from localStorage
  - _Requirements: 5, 8_

- [ ] 6.2 Implement volume control functions
  - Create setVolume function to update volume and audio element
  - Create toggleMute function to mute/unmute with volume restoration
  - Create increaseVolume function (default +5%)
  - Create decreaseVolume function (default -5%)
  - Clamp volume values between 0 and 100
  - _Requirements: 5, 7_

- [ ] 6.3 Implement volume persistence
  - Save volume to localStorage on every change (with debouncing)
  - Save mute state to localStorage
  - Load volume and mute state on app initialization
  - Handle localStorage unavailable gracefully (use in-memory state)
  - _Requirements: 8_

- [ ] 6.4 Sync volume with audio element
  - Update audio element volume when state changes: audioRef.current.volume = volume / 100
  - Update audio element muted property: audioRef.current.muted = isMuted
  - Ensure audio element exists before updating
  - _Requirements: 5, 7_

- [ ] 7. Build VolumeControl component
  - Create VolumeControl component with slider and mute button
  - Implement dynamic volume icon based on level
  - Add volume percentage tooltip
  - Make component touch-friendly for mobile
  - _Requirements: 5, 6, 10_

- [ ] 7.1 Create VolumeControl component structure
  - Create `frontend/components/VolumeControl.tsx`
  - Use Mantine Group to layout volume icon and slider
  - Connect to AudioPlayerContext for volume state and actions
  - Position component in Playing Bar
  - _Requirements: 5_

- [ ] 7.2 Implement volume slider
  - Use Mantine Slider component with range 0-100
  - Connect slider value to volume state
  - Update volume on slider change
  - Show volume percentage tooltip on hover/drag
  - Make slider touch-friendly with larger thumb on mobile
  - _Requirements: 5, 10_

- [ ] 7.3 Implement dynamic volume icon
  - Display IconVolume3 (crossed) when muted (volume = 0)
  - Display IconVolume when volume is 1-33%
  - Display IconVolume2 when volume is 34-66%
  - Display IconVolume3 when volume is 67-100%
  - Add click handler to toggle mute
  - _Requirements: 6, 7_

- [ ] 7.4 Add volume percentage display
  - Show current volume percentage near slider
  - Display percentage during slider interaction
  - Hide percentage when not interacting (optional)
  - Style percentage text for readability
  - _Requirements: 5_

- [ ] 8. Add keyboard shortcuts for volume control
  - Implement global keyboard event listeners
  - Add Up Arrow to increase volume by 5%
  - Add Down Arrow to decrease volume by 5%
  - Add M key to toggle mute
  - Prevent shortcuts when input fields are focused
  - _Requirements: 9_

- [ ] 8.1 Implement keyboard event listeners
  - Add useEffect hook in AudioPlayerContext or Playing Bar
  - Listen for keydown events on document
  - Check if search overlay or input fields are focused
  - Call appropriate volume functions based on key pressed
  - Prevent default behavior for handled keys
  - _Requirements: 9_

- [ ] 8.2 Test keyboard shortcuts
  - Test Up Arrow increases volume by 5%
  - Test Down Arrow decreases volume by 5%
  - Test M key toggles mute
  - Verify volume doesn't exceed 100% or go below 0%
  - Verify shortcuts don't work when inputs are focused
  - _Requirements: 9_

- [ ] 9. Integrate VolumeControl into Playing Bar
  - Add VolumeControl component to Playing Bar
  - Position volume controls appropriately (right side)
  - Ensure responsive layout on mobile and desktop
  - Test volume control functionality in Playing Bar
  - _Requirements: 5, 10_

- [ ] 9.1 Update Playing Bar component
  - Import and add VolumeControl component
  - Position volume controls on the right side of Playing Bar
  - Adjust layout for mobile (show icon only, expand on click - optional)
  - Ensure volume controls don't overlap other controls
  - _Requirements: 5, 10_

- [ ] 9.2 Test Playing Bar integration
  - Test volume slider functionality
  - Test mute button
  - Test keyboard shortcuts
  - Test on mobile devices
  - Verify volume persists across page navigation
  - _Requirements: 5, 7, 8, 9, 10_

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
