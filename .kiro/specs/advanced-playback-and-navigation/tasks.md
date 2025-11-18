# Implementation Plan

- [x] 1. Enhance Audio Player Hook with Playback Controls

  - Extend `useAudioPlayer` hook with shuffle, repeat, and speed state
  - Implement shuffle algorithm (Fisher-Yates) for queue randomization
  - Add repeat mode cycling logic (off → all → one)
  - Implement playback speed control with clamping (0.25x - 2.0x)
  - Add localStorage persistence for new settings
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.4, 3.5_

- [ ]* 1.1 Write property test for shuffle preserves current song
  - **Property 1: Shuffle preserves current song**
  - **Validates: Requirements 1.1**

- [ ]* 1.2 Write property test for shuffle/unshuffle round trip
  - **Property 2: Shuffle/unshuffle round trip**
  - **Validates: Requirements 1.3**

- [ ]* 1.3 Write property test for shuffle selects unplayed songs
  - **Property 3: Shuffle selects unplayed songs**
  - **Validates: Requirements 1.4**

- [ ]* 1.4 Write property test for playback settings persistence
  - **Property 5: Playback settings persistence**
  - **Validates: Requirements 1.5, 2.5, 3.5**

- [ ]* 1.5 Write property test for playback speed bounds
  - **Property 6: Playback speed bounds**
  - **Validates: Requirements 3.2**

- [ ]* 1.6 Write property test for speed persists across songs
  - **Property 7: Speed persists across songs**
  - **Validates: Requirements 3.4**

- [x] 2. Create Playback Control UI Components
  - Create `ShuffleButton` component with active state indicator
  - Create `RepeatButton` component with mode cycling and icons
  - Create `PlaybackSpeedControl` component with slider/buttons
  - Integrate new controls into `AudioPlayer` component
  - Add keyboard shortcuts for shuffle, repeat, and speed
  - _Requirements: 1.2, 2.4, 3.3, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 2.5 Fix Navigation Header Alignment and Clickability
  - Fix header logo and text vertical alignment
  - Ensure burger menu is clickable on mobile
  - Fix mobile drawer z-index and pointer events
  - Add proper cursor and clickability styles to all NavLinks
  - Improve header spacing and layout consistency
  - _Requirements: 9.6, 9.7_

- [x] 2.6 Implement Consistent Color Scheme for Buttons

  - Define 3 primary color states: normal, active, hover
  - Apply consistent colors to all action buttons (play, shuffle, repeat, speed)
  - Ensure proper contrast for accessibility
  - Update button styles across AudioPlayer, Navigation, and control components
  - Use theme colors consistently for better visual hierarchy

- [ ]* 2.1 Write property test for UI reflects playback control states
  - **Property 4: UI reflects playback control states**
  - **Validates: Requirements 1.2, 2.4, 3.3**

- [ ]* 2.2 Write property test for shuffle keyboard shortcut
  - **Property 19: Shuffle keyboard shortcut toggles mode**
  - **Validates: Requirements 8.1**

- [ ]* 2.3 Write property test for repeat keyboard shortcut
  - **Property 20: Repeat keyboard shortcut cycles modes**
  - **Validates: Requirements 8.2**

- [ ]* 2.4 Write property test for speed keyboard shortcuts
  - **Property 21: Speed keyboard shortcuts adjust by 0.25x**
  - **Validates: Requirements 8.3, 8.4**

- [-] 3. Implement Backend API for Artists and Albums

  - Create `GET /api/artists` endpoint to list all artists
  - Create `GET /api/artists/:artistName` endpoint for artist details
  - Create `GET /api/albums/:artistName/:albumName` endpoint for album details
  - Add aggregation queries to group songs by artist and album
  - Implement URL encoding/decoding for artist and album names
  - _Requirements: 4.1, 4.2, 5.1, 5.2_

- [ ] 4. Create Artist Details Page
  - Create `frontend/app/artists/[id]/page.tsx` route
  - Fetch and display artist data with song count and album count
  - Group songs by album with album artwork
  - Implement "Play All" button to queue all artist songs
  - Add sorting options (by album, date, title)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 4.1 Write property test for artist page displays complete information
  - **Property 8: Artist page displays complete information**
  - **Validates: Requirements 4.1, 4.2, 4.5**

- [ ]* 4.2 Write property test for artist page queues all songs
  - **Property 9: Artist page queues all songs**
  - **Validates: Requirements 4.4**

- [ ]* 4.3 Write property test for artist links navigate correctly
  - **Property 13: Artist links navigate correctly**
  - **Validates: Requirements 4.3**

- [ ] 5. Create Album Details Page
  - Create `frontend/app/albums/[artist]/[album]/page.tsx` route
  - Fetch and display album data with metadata
  - Display songs in track order
  - Show album artwork prominently
  - Implement "Play Album" button to queue all songs
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 5.1 Write property test for album page displays complete information
  - **Property 10: Album page displays complete information**
  - **Validates: Requirements 5.1, 5.2, 5.5**

- [ ]* 5.2 Write property test for album page queues all songs
  - **Property 11: Album page queues all songs in order**
  - **Validates: Requirements 5.4**

- [ ]* 5.3 Write property test for album links navigate correctly
  - **Property 14: Album links navigate correctly**
  - **Validates: Requirements 5.3**

- [ ] 6. Create Clickable Artist and Album Link Components
  - Create `ArtistLink` component with hover effects
  - Create `AlbumLink` component with hover effects
  - Update all song display components to use new link components
  - Update `AudioPlayer` to show clickable artist/album info
  - Ensure navigation preserves playback state
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 6.1 Write property test for song components render clickable links
  - **Property 12: Song components render clickable links**
  - **Validates: Requirements 6.1, 6.2, 6.4**

- [ ]* 6.2 Write property test for navigation preserves playback state
  - **Property 15: Navigation preserves playback state**
  - **Validates: Requirements 6.5**

- [ ] 7. Implement Queue Visualization Component
  - Create `QueueView` component as modal/drawer
  - Display all songs in queue with current song highlighted
  - Implement click-to-jump functionality
  - Add remove-from-queue button for each song
  - Show shuffle state visually in queue
  - Add keyboard shortcut to open queue
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 7.1 Write property test for queue view displays all songs
  - **Property 16: Queue view displays all songs**
  - **Validates: Requirements 7.1, 7.2**

- [ ]* 7.2 Write property test for queue interaction jumps to song
  - **Property 17: Queue interaction jumps to song**
  - **Validates: Requirements 7.3**

- [ ]* 7.3 Write property test for queue removal updates order
  - **Property 18: Queue removal updates order**
  - **Validates: Requirements 7.4**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Backend for Playlist Editing
  - Extend Playlist model with description and thumbnailKey fields
  - Create `PUT /api/playlists/:id/metadata` endpoint
  - Create `POST /api/playlists/:id/thumbnail` endpoint for image upload
  - Create `DELETE /api/playlists/:id/thumbnail` endpoint
  - Implement image upload to S3/storage service
  - Add validation for image file types and sizes
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 10. Create Playlist Edit Page
  - Create `frontend/app/playlists/[id]/edit/page.tsx` route
  - Build form with name, description, and thumbnail fields
  - Implement image upload with preview
  - Add drag-and-drop thumbnail upload
  - Implement save and cancel functionality
  - Add form validation
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 10.1 Write property test for playlist edit form displays all fields
  - **Property 30: Playlist edit form displays all fields**
  - **Validates: Requirements 10.1**

- [ ]* 10.2 Write property test for playlist thumbnail upload
  - **Property 31: Playlist thumbnail upload accepts valid images**
  - **Validates: Requirements 10.2**

- [ ]* 10.3 Write property test for playlist changes persist
  - **Property 32: Playlist changes persist to database**
  - **Validates: Requirements 10.3, 10.4**

- [ ]* 10.4 Write property test for playlist thumbnail deletion
  - **Property 33: Playlist thumbnail deletion restores default**
  - **Validates: Requirements 10.5**

- [ ] 11. Implement Backend for Album Editing
  - Create AlbumMetadata model
  - Create `PUT /api/albums/:artist/:album/metadata` endpoint
  - Create `POST /api/albums/:artist/:album/thumbnail` endpoint
  - Create `GET /api/albums/:artist/:album/metadata` endpoint
  - Implement cascading updates to all songs in album
  - Add logic to extract existing artworks from songs
  - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [ ] 12. Create Album Edit Page
  - Create `frontend/app/albums/[artist]/[album]/edit/page.tsx` route
  - Build form with name, description, year, and thumbnail fields
  - Display existing song artworks for selection
  - Implement custom thumbnail upload with preview
  - Add save functionality with cascading updates
  - Add form validation
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 12.1 Write property test for album edit form displays all fields
  - **Property 34: Album edit form displays all fields**
  - **Validates: Requirements 11.1**

- [ ]* 12.2 Write property test for album thumbnail upload
  - **Property 35: Album thumbnail upload accepts valid images**
  - **Validates: Requirements 11.2**

- [ ]* 12.3 Write property test for album changes cascade
  - **Property 36: Album changes cascade to all songs**
  - **Validates: Requirements 11.3, 11.4**

- [ ]* 12.4 Write property test for album artwork selection
  - **Property 37: Album artwork selection from existing**
  - **Validates: Requirements 11.5**

- [ ] 13. Implement Additional Features
  - Create listening history tracking and display
  - Add "Create Playlist from Album" functionality
  - Add "Create Playlist from Artist" functionality
  - Enhance song details page with complete metadata
  - Implement sorting on artist and album pages
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 13.1 Write property test for listening history display
  - **Property 38: Listening history displays with timestamps**
  - **Validates: Requirements 12.1**

- [ ]* 13.2 Write property test for playlist from album
  - **Property 39: Playlist creation from album adds all songs**
  - **Validates: Requirements 12.2**

- [ ]* 13.3 Write property test for playlist from artist
  - **Property 40: Playlist creation from artist adds all songs**
  - **Validates: Requirements 12.3**

- [ ]* 13.4 Write property test for song details metadata
  - **Property 41: Song details display complete metadata**
  - **Validates: Requirements 12.4**

- [ ]* 13.5 Write property test for sorting functionality
  - **Property 42: Sorting reorders songs correctly**
  - **Validates: Requirements 12.5**

- [ ] 14. Fix Mobile UI Issues
  - Fix Navigation drawer z-index and clickability
  - Fix light mode header contrast on mobile
  - Ensure burger menu is always visible and clickable
  - Test all touch interactions on mobile viewports
  - _Requirements: 9.6, 9.7_

- [ ] 15. Implement Mobile Responsive Design
  - Make all playback controls touch-friendly (44x44px minimum)
  - Adapt artist and album pages for mobile layouts
  - Implement mobile queue view as full-screen overlay
  - Ensure smooth transitions on mobile
  - Test on actual mobile devices
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 15.1 Write property test for mobile responsive layout
  - **Property 22: Mobile responsive layout**
  - **Validates: Requirements 9.1, 9.2, 9.3**

- [ ]* 15.2 Write property test for mobile queue pattern
  - **Property 23: Mobile queue uses appropriate pattern**
  - **Validates: Requirements 9.4**

- [ ]* 15.3 Write property test for mobile navigation drawer
  - **Property 24: Mobile navigation drawer is functional**
  - **Validates: Requirements 9.6**

- [ ]* 15.4 Write property test for light mode contrast
  - **Property 25: Light mode header has sufficient contrast**
  - **Validates: Requirements 9.7**

- [ ] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
