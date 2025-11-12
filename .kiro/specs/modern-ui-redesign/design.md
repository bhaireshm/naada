# Design Document

## Overview

This design document outlines the technical approach for modernizing the music player application's UI using Mantine component library. The redesign focuses on creating a minimal, elegant, and responsive interface that works seamlessly across mobile and desktop devices. The design maintains the existing Next.js architecture and Firebase authentication while replacing all Tailwind CSS styling with Mantine components.

## Architecture

### Technology Stack

- **Frontend Framework**: Next.js 16 with React 19
- **UI Component Library**: @mantine/core v7.x
- **Styling**: Mantine's built-in styling system (CSS-in-JS)
- **State Management**: React hooks (existing useAuth, useAudioPlayer)
- **Authentication**: Firebase Auth (unchanged)
- **API Communication**: Existing API layer (unchanged)

### Mantine Setup

The application will use Mantine's MantineProvider to wrap the entire app, providing:
- Theme configuration (colors, spacing, typography)
- Dark mode support
- Responsive breakpoints (xs: 0, sm: 576px, md: 768px, lg: 992px, xl: 1200px)
- Global styles and CSS reset

### Responsive Strategy

- **Mobile-first approach**: Design for mobile (< 768px) first, then enhance for desktop
- **Breakpoints**: Use Mantine's responsive props and media queries
- **Touch targets**: Minimum 44x44px for all interactive elements on mobile
- **Navigation**: Hamburger menu on mobile, horizontal nav on desktop

## Components and Interfaces

### 1. Layout Components

#### MantineProvider Wrapper
```typescript
interface AppShellConfig {
  header: { height: 60 };
  footer: { height: 100 }; // Playing bar
  padding: 'md';
}
```

#### Navigation Component
- **Desktop**: Horizontal navigation bar with logo, links, and user menu
- **Mobile**: Burger menu with drawer for navigation links
- **Components**: AppShell.Header, Burger, Drawer, NavLink, Menu

#### Playing Bar Component
- **Layout**: Fixed bottom bar using AppShell.Footer
- **Desktop**: Horizontal layout with album art (left), controls (center), volume (right)
- **Mobile**: Compact layout with essential controls, collapsible volume
- **Components**: Group, Stack, ActionIcon, Slider, Text, Image

### 2. Page Components

#### Landing Page (/)
- **Hero Section**: Title, description, feature cards
- **Components**: Container, Title, Text, Card, Grid, Button, SimpleGrid
- **Features Grid**: 3 columns on desktop, 1 column on mobile
- **CTA Buttons**: Primary (Get Started) and Secondary (Sign In)

#### Authentication Pages (/login, /register)
- **Layout**: Centered card with form
- **Components**: Paper, TextInput, PasswordInput, Button, Anchor, Alert
- **Form Validation**: Built-in Mantine form validation
- **Responsive**: Max-width container, full-width on mobile

#### Library Page (/library)
- **Header**: Title, upload button, search/filter (future)
- **Song List**: Table on desktop, Stack on mobile
- **Components**: Table, ActionIcon, Menu, Modal, Badge
- **Song Actions**: Menu with "Play", "Add to Playlist", "Song Details"
- **Upload Form**: Modal with file input and metadata fields

#### Playlists Page (/playlists)
- **Layout**: Grid of playlist cards
- **Components**: SimpleGrid, Card, Text, Button, Modal
- **Grid**: 3 columns on desktop, 1 column on mobile
- **Create Playlist**: Modal with TextInput

#### Playlist Detail Page (/playlists/[id])
- **Header**: Playlist name, song count, play all button
- **Song List**: Similar to library page with reorder capability
- **Components**: Table, ActionIcon, Menu, DragDropContext (future)

#### Song Details Page (/songs/[id])
- **Layout**: Centered card with large album art
- **Components**: Paper, Image, Title, Text, Group, Button, Badge
- **Sections**: Album art, metadata, actions (play, add to playlist)
- **Responsive**: Stack layout on mobile, horizontal on desktop

### 3. Enhanced Components

#### AudioPlayer Hook Enhancement
```typescript
interface AudioPlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  currentIndex: number;
}

interface AudioPlayerActions {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  loadSong: (song: Song) => void;
  setQueue: (songs: Song[], startIndex: number) => void;
}
```

#### Add to Playlist Menu
```typescript
interface AddToPlaylistMenuProps {
  songId: string;
  onSuccess: () => void;
}
```
- **Components**: Menu, Menu.Target, Menu.Dropdown, Menu.Item, Menu.Divider
- **Features**: List existing playlists, create new playlist option, multi-select capability

## Data Models

### Extended Song Interface
```typescript
interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  mimeType: string;
  createdAt: string;
  albumArt?: string; // URL or placeholder
}
```

### Playlist Interface (unchanged)
```typescript
interface Playlist {
  id: string;
  name: string;
  userId: string;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Queue Context
```typescript
interface QueueContext {
  songs: Song[];
  currentIndex: number;
  source: 'library' | 'playlist' | 'album';
  sourceId?: string;
}
```

## Theme Configuration

### Color Scheme
```typescript
const theme = {
  primaryColor: 'blue',
  colors: {
    // Use Mantine's default color palette
    // Primary: blue shades for actions
    // Gray: for text and backgrounds
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
};
```

### Dark Mode
- Automatic detection via `prefers-color-scheme`
- Manual toggle option in navigation menu
- Consistent dark theme across all components

## User Interactions

### Song Actions Flow
1. User hovers/clicks on song row → Menu button appears
2. User clicks menu button → Dropdown opens with options
3. User selects "Add to Playlist" → Submenu opens with playlist list
4. User selects playlist(s) → Song added, success notification shown
5. User selects "Create Playlist" → Modal opens with form
6. User submits form → Playlist created, song added, modal closes

### Playback Flow
1. User clicks play on song → Song loads into player, queue set to context
2. Player displays song info and controls
3. User clicks next → Advances to next song in queue
4. User clicks previous → Goes to previous song or restarts current
5. Song ends → Automatically plays next song in queue

### Responsive Navigation Flow
- **Desktop**: Always visible horizontal nav
- **Mobile**: Burger menu → Drawer opens → User selects link → Drawer closes

## Error Handling

### Loading States
- **Skeleton loaders**: Use Mantine Skeleton for loading content
- **Spinners**: Use Loader component for async operations
- **Disabled states**: Disable buttons during operations

### Error Messages
- **Notifications**: Use Mantine Notifications for success/error messages
- **Inline errors**: Use Alert component for form validation errors
- **Empty states**: Custom empty state components with illustrations

### Network Errors
- **Retry mechanism**: Show retry button on failed requests
- **Offline detection**: Display offline banner when network unavailable
- **Graceful degradation**: Show cached data when possible

## Testing Strategy

### Component Testing
- Test Mantine component integration
- Test responsive behavior at different breakpoints
- Test dark mode rendering
- Test accessibility (keyboard navigation, screen readers)

### Integration Testing
- Test navigation flows between pages
- Test playback controls and queue management
- Test playlist creation and song addition
- Test authentication flows

### Visual Testing
- Test responsive layouts on mobile and desktop
- Test dark mode appearance
- Test loading and error states
- Test empty states

### Performance Testing
- Test initial page load time
- Test component render performance
- Test large playlist rendering
- Test audio playback performance

## Migration Strategy

### Phase 1: Setup and Core Components
1. Install Mantine dependencies
2. Configure MantineProvider in layout
3. Create theme configuration
4. Migrate Navigation component
5. Migrate Playing Bar component

### Phase 2: Page Migration
1. Migrate landing page
2. Migrate authentication pages
3. Migrate library page
4. Migrate playlists pages

### Phase 3: New Features
1. Implement next/previous controls
2. Implement add to playlist menu
3. Create song details page
4. Enhance playing bar design

### Phase 4: Cleanup
1. Remove Tailwind CSS dependencies
2. Remove unused CSS files
3. Update documentation
4. Final testing and bug fixes

## Accessibility Considerations

- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **ARIA Labels**: Proper labels for screen readers
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliance for text and backgrounds
- **Touch Targets**: Minimum 44x44px on mobile devices
- **Semantic HTML**: Proper heading hierarchy and landmarks

## Performance Optimizations

- **Code Splitting**: Lazy load pages and heavy components
- **Image Optimization**: Use Next.js Image component for album art
- **Memoization**: Use React.memo for expensive components
- **Virtual Scrolling**: For large song lists (future enhancement)
- **Bundle Size**: Tree-shake unused Mantine components
