# Implementation Plan

- [x] 1. Setup Mantine and configure theme

  - Install @mantine/core, @mantine/hooks, and @mantine/notifications packages
  - Configure MantineProvider in root layout with theme settings
  - Set up dark mode support with ColorSchemeScript
  - Remove Tailwind CSS dependencies from package.json and configuration files
  - _Requirements: 1.1, 1.4_

- [x] 2. Enhance audio player hook with queue management

  - Extend useAudioPlayer hook to support queue state (songs array, currentIndex)
  - Implement next() function to advance to next song in queue
  - Implement previous() function to go to previous song in queue
  - Implement setQueue() function to load songs into playback queue
  - Add logic to auto-play next song when current song ends
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
-

- [x] 3. Redesign Navigation component with Mantine

  - Replace Tailwind classes with Mantine AppShell.Header component
  - Implement responsive navigation with Burger menu for mobile
  - Use Drawer component for mobile navigation menu
  - Add Menu component for user account dropdown
  - Implement dark mode toggle button
  - _Requirements: 1.1, 1.2, 1.3, 2.3, 9.7_

- [x] 4. Redesign Playing Bar component with Mantine

  - Replace Tailwind classes with Mantine components (Group, Stack, ActionIcon, Slider)
  - Add album artwork display with Image component or placeholder
  - Implement next and previous buttons with proper queue navigation
  - Reorganize layout: album art (left), controls (center), volume (right) on desktop
  - Create compact mobile layout with collapsible volume control
  - Use AppShell.Footer for fixed bottom positioning
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Redesign landing page with Mantine

  - Replace Tailwind classes with Mantine Container, Title, Text components
  - Use Card component for feature showcase sections
  - Implement SimpleGrid for responsive feature layout (3 columns desktop, 1 mobile)
  - Style CTA buttons with Mantine Button component
  - Ensure responsive design for mobile and desktop
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 9.1_

- [x] 6. Redesign authentication pages with Mantine

- [x] 6.1 Redesign login page

  - Replace Tailwind classes with Mantine Paper, TextInput, PasswordInput, Button
  - Center form in viewport with proper spacing
  - Add form validation using Mantine form utilities
  - Implement responsive layout (max-width on desktop, full-width on mobile)
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 9.2_

- [x] 6.2 Redesign registration page

  - Replace Tailwind classes with Mantine components matching login page
  - Implement consistent styling with login page
  - Add form validation for email and password fields
  - Ensure responsive layout matches login page
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 9.3_
-

- [x] 7. Create AddToPlaylistMenu component

  - Create new component using Mantine Menu component
  - Fetch and display list of user's playlists in Menu.Dropdown
  - Implement "Create Playlist" option that opens a modal
  - Add API call to add song to selected playlist(s)
  - Show success notification using Mantine Notifications
  - Enforce 25 playlist limit per user
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Redesign Library page with Mantine

  - Replace Tailwind classes with Mantine components (Container, Title, Button, Table)
  - Use Table component for song list on desktop, Stack for mobile
  - Add ActionIcon with Menu for song actions (Play, Add to Playlist, Song Details)
  - Integrate AddToPlaylistMenu component for each song
  - Convert upload form to Modal component
  - Implement responsive layout with proper breakpoints
  - Update queue when playing song from library
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 6.1, 8.1, 8.2, 8.3, 8.4, 9.4_

- [x] 9. Redesign Playlists page with Mantine

  - Replace Tailwind classes with Mantine SimpleGrid, Card, Text, Button
  - Implement responsive grid (3 columns desktop, 1 column mobile)
  - Convert create playlist form to Modal component
  - Style playlist cards with hover effects and proper spacing
  - Add loading states with Skeleton component
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 3.2, 9.5_

- [x] 10. Redesign Playlist detail page with Mantine

  - Replace Tailwind classes with Mantine components
  - Add playlist header with name, song count, and "Play All" button
  - Use Table component for song list with action menus
  - Integrate AddToPlaylistMenu for songs in playlist
  - Implement "Remove from Playlist" action
  - Update queue when playing from playlist
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 9.6_
-

- [x] 11. Create Song Details page

  - Create new page at /songs/[id]/page.tsx
  - Use Paper component for centered card layout
  - Display large album artwork with Image component or placeholder
  - Show song metadata: title, artist, album, duration, creation date
  - Add play button that loads song into player
  - Integrate AddToPlaylistMenu component
  - Implement responsive layout (stack on mobile, horizontal on desktop)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Add navigation to Song Details page

  - Add "Song Details" option to song action menus in Library page
  - Add "Song Details" option to song action menus in Playlist detail page
  - Implement navigation using Next.js router

  - _Requirements: 8.3_

- [x] 13. Implement global notifications system

  - Configure Notifications provider in root layout
  - Add success notifications for playlist operations
  - Add error notifications for failed operations
  - Add info notifications for user feedback
  - _Requirements: 1.1_

- [x] 14. Add loading and error states

  - Implement Skeleton loaders for all data-fetching pages
  - Use Loader component for async operations
  - Create Alert components for error messages
  - Add empty state components with illustrations
  - _Requirements: 1.1, 1.2_
-

- [x] 15. Implement responsive touch targets for mobile

  - Ensure all buttons and interactive elements are at least 44x44px on mobile
  - Test touch interactions on mobile devices
  - Adjust spacing and sizing as needed for mobile usability
  - _Requirements: 2.2_

- [x] 16. Final cleanup and optimization

  - Remove all Tailwind CSS imports and configuration files
  - Remove unused CSS files (globals.css Tailwind imports)
  - Update package.json to remove Tailwind dependencies
  - Test all pages on mobile and desktop
  - Verify dark mode works across all pages
  - Check accessibility with keyboard navigation
  - Optimize bundle size by ensuring proper tree-shaking
  - _Requirements: 1.4, 2.1, 2.3, 2.4, 3.1, 3.2, 3.3_
