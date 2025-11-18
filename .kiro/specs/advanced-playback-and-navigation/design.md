# Design Document

## Overview

This design document outlines the implementation of advanced playback controls (shuffle, repeat, playback speed), dedicated artist and album navigation pages, queue visualization, and mobile UI fixes for the music player application. The design builds upon the existing audio player architecture and extends it with new state management, UI components, and navigation routes.

The implementation will enhance the user experience by providing:
- More control over playback behavior through shuffle and repeat modes
- Ability to adjust playback speed for different listening scenarios
- Dedicated pages for browsing music by artist and album
- Visual queue management for better playback awareness
- Improved mobile responsiveness and bug fixes

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Artist Page  │  │ Album Page   │  │ Queue View   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Audio Player Context                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Enhanced State Management                           │   │
│  │  - Shuffle Mode (off, on)                           │   │
│  │  - Repeat Mode (off, all, one)                      │   │
│  │  - Playback Speed (0.25x - 2.0x)                    │   │
│  │  - Queue Management                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    UI Components Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Shuffle Btn  │  │ Repeat Btn   │  │ Speed Ctrl   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ Artist Link  │  │ Album Link   │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → UI Component (button click, link click)
2. **UI Component** → Audio Player Context (state update)
3. **Context** → Audio Element (playback modification)
4. **Context** → LocalStorage (persistence)
5. **Context** → UI Components (state propagation)

## Components and Interfaces

### 1. Enhanced Audio Player Hook

**Location**: `frontend/hooks/useAudioPlayer.ts`

**New State Properties**:
```typescript
interface AudioPlayerState {
  // ... existing properties
  shuffleMode: boolean;
  repeatMode: 'off' | 'all' | 'one';
  playbackSpeed: number;
  originalQueue: Song[]; // Unshuffled queue for restoration
  shuffledIndices: number[]; // Mapping for shuffle mode
}
```

**New Actions**:
```typescript
interface AudioPlayerActions {
  // ... existing actions
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  cycleRepeatMode: () => void;
  setPlaybackSpeed: (speed: number) => void;
  increaseSpeed: () => void;
  decreaseSpeed: () => void;
  removeFromQueue: (index: number) => void;
  jumpToQueueIndex: (index: number) => void;
}
```

### 2. Playback Control Components

#### ShuffleButton Component
**Location**: `frontend/components/ShuffleButton.tsx`

```typescript
interface ShuffleButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'filled' | 'light';
}
```

Displays shuffle state with visual indicator (icon color/style changes when active).

#### RepeatButton Component
**Location**: `frontend/components/RepeatButton.tsx`

```typescript
interface RepeatButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'filled' | 'light';
}
```

Cycles through repeat modes: off → all → one → off. Shows different icons for each mode.

#### PlaybackSpeedControl Component
**Location**: `frontend/components/PlaybackSpeedControl.tsx`

```typescript
interface PlaybackSpeedControlProps {
  compact?: boolean; // For mobile layouts
}
```

Provides slider or button controls for adjusting playback speed with visual feedback.

### 3. Navigation Pages

#### Artist Details Page
**Location**: `frontend/app/artists/[id]/page.tsx`

**Data Structure**:
```typescript
interface ArtistPageData {
  artist: string;
  totalSongs: number;
  albums: Array<{
    name: string;
    year?: number;
    artwork?: string;
    songs: Song[];
  }>;
  singles: Song[]; // Songs without album
}
```

**Features**:
- Display artist name and statistics
- Group songs by album
- Show album artwork in grid layout
- "Play All" button to queue all artist songs
- Sort options (by album, by date, by title)

#### Album Details Page
**Location**: `frontend/app/albums/[artist]/[album]/page.tsx`

**Data Structure**:
```typescript
interface AlbumPageData {
  albumName: string;
  artistName: string;
  year?: number;
  artwork?: string;
  songs: Song[];
  totalDuration: number;
}
```

**Features**:
- Display album artwork prominently
- List all songs in track order
- Show total duration and song count
- "Play Album" button to queue all songs
- Link back to artist page

### 4. Queue Visualization Component

**Location**: `frontend/components/QueueView.tsx`

```typescript
interface QueueViewProps {
  opened: boolean;
  onClose: () => void;
}
```

**Features**:
- Modal or drawer displaying current queue
- Highlight currently playing song
- Drag-to-reorder functionality (optional)
- Remove song from queue button
- Click to jump to song
- Shows shuffle state visually

### 5. Clickable Artist/Album Links

**Location**: `frontend/components/ArtistLink.tsx` and `frontend/components/AlbumLink.tsx`

```typescript
interface ArtistLinkProps {
  artist: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  underline?: boolean;
}

interface AlbumLinkProps {
  artist: string;
  album: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  underline?: boolean;
}
```

These components will be used throughout the app to make artist and album names clickable.

### 6. Playlist Edit Page

**Location**: `frontend/app/playlists/[id]/edit/page.tsx`

```typescript
interface PlaylistEditPageProps {
  params: { id: string };
}

interface PlaylistEditForm {
  name: string;
  description: string;
  thumbnail: File | null;
  thumbnailPreview: string | null;
}
```

**Features**:
- Form with name, description, and thumbnail upload
- Image preview before saving
- Drag-and-drop thumbnail upload
- Delete thumbnail option
- Save and cancel buttons
- Validation for required fields

### 7. Album Edit Page

**Location**: `frontend/app/albums/[artist]/[album]/edit/page.tsx`

```typescript
interface AlbumEditPageProps {
  params: { artist: string; album: string };
}

interface AlbumEditForm {
  name: string;
  description: string;
  year: number | null;
  thumbnail: File | null;
  thumbnailPreview: string | null;
  existingArtworks: string[]; // From songs in album
}
```

**Features**:
- Form with album name, description, year, and thumbnail
- Option to select from existing song artworks
- Upload custom album artwork
- Image preview and cropping
- Apply changes to all songs in album
- Validation and error handling

### 8. Mobile UI Fixes

#### Navigation Component Updates
**Location**: `frontend/components/Navigation.tsx`

**Fixes**:
- Ensure drawer z-index is properly set
- Add pointer-events to clickable elements in drawer
- Fix light mode header contrast with proper color values
- Ensure burger menu is always visible and clickable

## Data Models

### Extended Song Interface

The existing `Song` interface already contains artist and album fields. No changes needed to the backend model.

### Extended Playlist Model

**Location**: `backend/src/models/Playlist.ts`

Add new fields to the existing Playlist schema:

```typescript
interface IPlaylist extends Document {
  // ... existing fields
  description?: string;
  thumbnailKey?: string; // S3 key for custom thumbnail
  customThumbnail?: boolean; // Flag to indicate custom vs generated
}
```

### Album Metadata Model

**Location**: `backend/src/models/AlbumMetadata.ts` (new file)

```typescript
interface IAlbumMetadata extends Document {
  artist: string;
  album: string;
  description?: string;
  thumbnailKey?: string;
  year?: number;
  userId: string; // Owner who can edit
  createdAt: Date;
  updatedAt: Date;
}
```

### Backend API Endpoints

**New Endpoints**:

1. `GET /api/artists` - List all artists with song counts
2. `GET /api/artists/:artistName` - Get all songs by artist
3. `GET /api/albums/:artistName/:albumName` - Get all songs in album
4. `GET /api/songs/recent` - Get recently played songs (for listening history)
5. `PUT /api/playlists/:id/metadata` - Update playlist name, description, thumbnail
6. `POST /api/playlists/:id/thumbnail` - Upload playlist thumbnail
7. `DELETE /api/playlists/:id/thumbnail` - Delete playlist thumbnail
8. `PUT /api/albums/:artist/:album/metadata` - Update album metadata
9. `POST /api/albums/:artist/:album/thumbnail` - Upload album thumbnail
10. `GET /api/albums/:artist/:album/metadata` - Get album metadata

**Response Formats**:

```typescript
// GET /api/artists
interface ArtistsResponse {
  artists: Array<{
    name: string;
    songCount: number;
    albumCount: number;
  }>;
}

// GET /api/artists/:artistName
interface ArtistDetailResponse {
  artist: string;
  songs: Song[];
}

// GET /api/albums/:artistName/:albumName
interface AlbumDetailResponse {
  artist: string;
  album: string;
  songs: Song[];
  metadata?: {
    description: string;
    thumbnailUrl: string;
    year: number;
  };
}

// PUT /api/playlists/:id/metadata
interface PlaylistMetadataRequest {
  name?: string;
  description?: string;
}

// PUT /api/albums/:artist/:album/metadata
interface AlbumMetadataRequest {
  name?: string;
  description?: string;
  year?: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

Before defining the final correctness properties, let's identify and eliminate redundancy:

**Redundancies Identified**:
1. Properties 1.2, 2.4, 3.3 all test UI rendering of state - can be combined into one comprehensive "state display" property
2. Properties 1.5, 2.5, 3.5 all test persistence - can be combined into one "playback settings persistence" property
3. Properties 4.1, 4.5, 5.1, 5.5 all test metadata display - can be combined into comprehensive page rendering properties
4. Properties 6.1, 6.2, 6.4 all test link rendering - can be combined into one "artist/album links" property
5. Properties 6.5 and 9.5 both test playback state preservation during navigation - redundant
6. Properties 9.1, 9.2, 9.3 all test mobile responsiveness - can be combined into one comprehensive mobile layout property

**Consolidated Properties**:
- Combine 1.2, 2.4, 3.3 → Property: UI reflects playback control states
- Combine 1.5, 2.5, 3.5 → Property: Playback settings persistence
- Combine 4.1, 4.5 → Property: Artist page displays complete information
- Combine 5.1, 5.5 → Property: Album page displays complete information
- Combine 6.1, 6.2, 6.4 → Property: Song components render clickable artist/album links
- Remove 9.5 (duplicate of 6.5)
- Combine 9.1, 9.2, 9.3 → Property: Mobile responsive layout

### Correctness Properties

Property 1: Shuffle preserves current song
*For any* queue with a currently playing song, activating shuffle mode should randomize the order of remaining songs while keeping the currently playing song at its current position
**Validates: Requirements 1.1**

Property 2: Shuffle/unshuffle round trip
*For any* queue, activating shuffle mode then deactivating it should restore the original queue order for all unplayed songs
**Validates: Requirements 1.3**

Property 3: Shuffle selects unplayed songs
*For any* shuffled queue, calling next() should select a song that hasn't been played yet until all songs have been played once
**Validates: Requirements 1.4**

Property 4: UI reflects playback control states
*For any* playback control state (shuffle on/off, repeat mode, playback speed), the UI should display the correct visual indicator matching that state
**Validates: Requirements 1.2, 2.4, 3.3**

Property 5: Playback settings persistence
*For any* combination of shuffle mode, repeat mode, and playback speed, setting these values then reloading the page should restore all three settings to their previous values
**Validates: Requirements 1.5, 2.5, 3.5**

Property 6: Playback speed bounds
*For any* speed value, setting the playback speed should clamp the value to the range [0.25, 2.0] and update the audio element's playbackRate accordingly
**Validates: Requirements 3.2**

Property 7: Speed persists across songs
*For any* playback speed setting, loading and playing a new song should maintain the same playback speed
**Validates: Requirements 3.4**

Property 8: Artist page displays complete information
*For any* artist with songs, the artist details page should display the artist name, total song count, total album count, and all songs grouped by album with album artwork, name, year, and song count
**Validates: Requirements 4.1, 4.2, 4.5**

Property 9: Artist page queues all songs
*For any* artist, playing from the artist details page should add all of that artist's songs to the queue in album order
**Validates: Requirements 4.4**

Property 10: Album page displays complete information
*For any* album, the album details page should display the album name, artist name, year, total song count, album artwork, and all songs in track order
**Validates: Requirements 5.1, 5.2, 5.5**

Property 11: Album page queues all songs in order
*For any* album, playing from the album details page should add all album songs to the queue in track order
**Validates: Requirements 5.4**

Property 12: Song components render clickable links
*For any* song displayed in any component, the artist name should render as a clickable link to the artist page, and the album name (if present) should render as a clickable link to the album page
**Validates: Requirements 6.1, 6.2, 6.4**

Property 13: Artist links navigate correctly
*For any* artist name, clicking an artist link should navigate to the URL `/artists/[encodedArtistName]`
**Validates: Requirements 4.3**

Property 14: Album links navigate correctly
*For any* album and artist combination, clicking an album link should navigate to the URL `/albums/[encodedArtist]/[encodedAlbum]`
**Validates: Requirements 5.3**

Property 15: Navigation preserves playback state
*For any* playback state (song, position, playing status), navigating to a different page should maintain all playback state values unchanged
**Validates: Requirements 6.5**

Property 16: Queue view displays all songs
*For any* queue, opening the queue view should display all songs in the queue in the correct order with the currently playing song highlighted
**Validates: Requirements 7.1, 7.2**

Property 17: Queue interaction jumps to song
*For any* song in the queue, clicking that song should set it as the current song and begin playback
**Validates: Requirements 7.3**

Property 18: Queue removal updates order
*For any* queue and any song index, removing that song should result in a queue with length decreased by one and all other songs maintaining their relative order
**Validates: Requirements 7.4**

Property 19: Shuffle keyboard shortcut toggles mode
*For any* shuffle state, pressing the shuffle keyboard shortcut should flip the shuffle mode to the opposite state
**Validates: Requirements 8.1**

Property 20: Repeat keyboard shortcut cycles modes
*For any* repeat mode, pressing the repeat keyboard shortcut should cycle to the next mode in the sequence: off → all → one → off
**Validates: Requirements 8.2**

Property 21: Speed keyboard shortcuts adjust by 0.25x
*For any* playback speed, pressing the speed increase shortcut should increase speed by 0.25x (clamped to 2.0x), and pressing decrease should decrease by 0.25x (clamped to 0.25x)
**Validates: Requirements 8.3, 8.4**

Property 22: Mobile responsive layout
*For any* mobile viewport size, all playback controls, artist pages, album pages, and navigation elements should render with touch-friendly sizes (minimum 44x44px tap targets) and appropriate spacing
**Validates: Requirements 9.1, 9.2, 9.3**

Property 23: Mobile queue uses appropriate pattern
*For any* mobile viewport, opening the queue should display it as a full-screen overlay or bottom sheet
**Validates: Requirements 9.4**

Property 24: Mobile navigation drawer is functional
*For any* mobile viewport, tapping the burger menu should open a drawer with all navigation links clickable and functional
**Validates: Requirements 9.6**

Property 25: Light mode header has sufficient contrast
*For any* mobile viewport in light mode, the header should have color contrast ratios meeting WCAG AA standards (minimum 4.5:1 for normal text)
**Validates: Requirements 9.7**

Property 26: Listening history displays with timestamps
*For any* listening history, the display should show all recently played songs with their corresponding play timestamps
**Validates: Requirements 10.1**

Property 27: Playlist creation from album adds all songs
*For any* album, creating a playlist from that album should add all songs from the album to the playlist
**Validates: Requirements 10.2**

Property 28: Playlist creation from artist adds all songs
*For any* artist, creating a playlist from that artist should add all songs by that artist to the playlist
**Validates: Requirements 10.3**

Property 29: Song details display complete metadata
*For any* song, the song details view should display all available metadata including title, artist, album, year, genre, file format, bitrate, and duration
**Validates: Requirements 10.4**

Property 30: Playlist edit form displays all fields
*For any* playlist, accessing the edit page should display form fields for name, description, and thumbnail upload
**Validates: Requirements 10.1**

Property 31: Playlist thumbnail upload accepts valid images
*For any* valid image file (JPEG, PNG, WebP), uploading it as a playlist thumbnail should accept the file and display a preview
**Validates: Requirements 10.2**

Property 32: Playlist changes persist to database
*For any* playlist with edited name, description, or thumbnail, saving the changes should update the database and subsequent views should reflect the changes
**Validates: Requirements 10.3, 10.4**

Property 33: Playlist thumbnail deletion restores default
*For any* playlist with a custom thumbnail, deleting the thumbnail should remove it from storage and revert the playlist to display default artwork
**Validates: Requirements 10.5**

Property 34: Album edit form displays all fields
*For any* album, accessing the edit page should display form fields for name, description, year, and thumbnail upload
**Validates: Requirements 11.1**

Property 35: Album thumbnail upload accepts valid images
*For any* valid image file (JPEG, PNG, WebP), uploading it as an album thumbnail should accept the file and display a preview
**Validates: Requirements 11.2**

Property 36: Album changes cascade to all songs
*For any* album with edited metadata, saving the changes should update all songs in that album with the new album name, year, and artwork reference
**Validates: Requirements 11.3, 11.4**

Property 37: Album artwork selection from existing
*For any* album with multiple songs having different artwork, the edit page should display all unique artworks and allow selection of one as the album thumbnail
**Validates: Requirements 11.5**

Property 38: Listening history displays with timestamps
*For any* listening history, the display should show all recently played songs with their corresponding play timestamps
**Validates: Requirements 12.1**

Property 39: Playlist creation from album adds all songs
*For any* album, creating a playlist from that album should add all songs from the album to the playlist
**Validates: Requirements 12.2**

Property 40: Playlist creation from artist adds all songs
*For any* artist, creating a playlist from that artist should add all songs by that artist to the playlist
**Validates: Requirements 12.3**

Property 41: Song details display complete metadata
*For any* song, the song details view should display all available metadata including title, artist, album, year, genre, file format, bitrate, and duration
**Validates: Requirements 12.4**

Property 42: Sorting reorders songs correctly
*For any* list of songs and any sort criterion (title, date added, duration, play count), applying that sort should reorder the songs according to the criterion in ascending or descending order
**Validates: Requirements 12.5**

## Error Handling

### Playback Control Errors

1. **Invalid Speed Values**: Clamp to valid range [0.25, 2.0] rather than throwing errors
2. **Empty Queue Shuffle**: Gracefully handle shuffle activation on empty queue (no-op)
3. **Queue Index Out of Bounds**: Validate indices before queue operations

### Navigation Errors

1. **Artist Not Found**: Display 404 page with link back to library
2. **Album Not Found**: Display 404 page with link back to artist or library
3. **Invalid URL Parameters**: Decode and sanitize artist/album names from URLs

### API Errors

1. **Failed to Load Artist Data**: Show error message with retry button
2. **Failed to Load Album Data**: Show error message with retry button
3. **Network Timeout**: Display offline indicator and cached data if available
4. **Thumbnail Upload Failed**: Show error message and allow retry
5. **Invalid Image Format**: Display validation error before upload
6. **Metadata Update Failed**: Show error and preserve form state for retry

### Mobile-Specific Errors

1. **Touch Event Failures**: Fall back to click events
2. **Viewport Detection Issues**: Use safe defaults for responsive breakpoints

## Testing Strategy

### Unit Testing

**Framework**: Jest with React Testing Library

**Unit Test Coverage**:

1. **Shuffle Logic Tests**:
   - Test shuffle randomization algorithm
   - Test unshuffle restoration
   - Test current song preservation

2. **Repeat Mode Tests**:
   - Test mode cycling logic
   - Test end-of-queue behavior for each mode

3. **Speed Control Tests**:
   - Test speed clamping
   - Test speed persistence
   - Test audio element playbackRate updates

4. **Queue Management Tests**:
   - Test queue manipulation functions
   - Test index tracking
   - Test song removal

5. **URL Encoding Tests**:
   - Test artist/album name encoding/decoding
   - Test special character handling

6. **Component Rendering Tests**:
   - Test button state rendering
   - Test link generation
   - Test responsive layout switches

7. **Form Validation Tests**:
   - Test playlist edit form validation
   - Test album edit form validation
   - Test image file type validation
   - Test required field validation

8. **File Upload Tests**:
   - Test image preview generation
   - Test file size validation
   - Test upload progress tracking

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations

**Property Test Coverage**:

Each correctness property listed above will be implemented as a property-based test. Tests will generate random:
- Queue configurations (various lengths, song data)
- Playback states (shuffle on/off, repeat modes, speeds)
- User interactions (clicks, keyboard events)
- Viewport sizes (for responsive tests)

**Test Tagging**: Each property-based test will include a comment tag in this format:
```typescript
// **Feature: advanced-playback-and-navigation, Property X: [property description]**
```

### Integration Testing

1. **End-to-End Navigation Flow**:
   - Navigate from library → artist page → album page → back to library
   - Verify playback continues throughout

2. **Playback Control Integration**:
   - Test shuffle + repeat combinations
   - Test speed changes during playback
   - Test queue modifications during playback

3. **Mobile Interaction Testing**:
   - Test touch interactions on mobile viewports
   - Test drawer navigation
   - Test responsive layout switches

4. **Edit Page Integration**:
   - Test playlist edit flow from view to save
   - Test album edit flow with cascading updates
   - Test thumbnail upload and preview
   - Test form validation and error states

### Manual Testing Checklist

1. Test on actual mobile devices (iOS and Android)
2. Verify keyboard shortcuts work across browsers
3. Test with screen readers for accessibility
4. Verify smooth animations and transitions
5. Test with large libraries (1000+ songs)
6. Verify localStorage persistence across sessions

## Implementation Notes

### Shuffle Algorithm

Use Fisher-Yates shuffle algorithm for unbiased randomization:

```typescript
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

### LocalStorage Keys

```typescript
const STORAGE_KEYS = {
  SHUFFLE_MODE: 'musicPlayer_shuffleMode',
  REPEAT_MODE: 'musicPlayer_repeatMode',
  PLAYBACK_SPEED: 'musicPlayer_playbackSpeed',
  QUEUE_STATE: 'musicPlayer_queueState',
};
```

### URL Encoding

Use `encodeURIComponent` for artist/album names in URLs to handle special characters:

```typescript
const artistUrl = `/artists/${encodeURIComponent(artistName)}`;
const albumUrl = `/albums/${encodeURIComponent(artistName)}/${encodeURIComponent(albumName)}`;
```

### Mobile Breakpoints

```typescript
const BREAKPOINTS = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1280px',
};
```

### Keyboard Shortcuts

New shortcuts to add to `KEYBOARD_SHORTCUTS` configuration:

```typescript
shuffle: {
  key: 's',
  description: 'Toggle shuffle',
  category: 'playback',
},
repeat: {
  key: 'r',
  description: 'Cycle repeat mode',
  category: 'playback',
},
speedUp: {
  key: ']',
  description: 'Increase speed',
  category: 'playback',
},
speedDown: {
  key: '[',
  description: 'Decrease speed',
  category: 'playback',
},
showQueue: {
  key: 'q',
  description: 'Show queue',
  category: 'playback',
},
```

### Performance Considerations

1. **Lazy Loading**: Artist and album pages should lazy load song lists for large catalogs
2. **Virtualization**: Queue view should use virtual scrolling for queues with 100+ songs
3. **Debouncing**: Speed slider should debounce updates to avoid excessive re-renders
4. **Memoization**: Use React.memo for song list items to prevent unnecessary re-renders

### Accessibility

1. **ARIA Labels**: All playback controls must have descriptive aria-labels
2. **Keyboard Navigation**: All interactive elements must be keyboard accessible
3. **Screen Reader Announcements**: State changes should announce to screen readers
4. **Focus Management**: Modal/drawer opening should trap and manage focus
5. **Color Contrast**: All text must meet WCAG AA standards (4.5:1 for normal text)

## Dependencies

### New Dependencies

```json
{
  "fast-check": "^3.15.0"
}
```

### Existing Dependencies

- React 18+
- Next.js 14+
- Mantine UI v7
- Tabler Icons
- TypeScript 5+

## Migration Strategy

This is a feature addition, not a migration. However, existing users will need:

1. **LocalStorage Updates**: New keys will be added for shuffle, repeat, and speed settings
2. **Backward Compatibility**: Existing queue state will be preserved and enhanced with new fields
3. **Gradual Rollout**: Features can be enabled incrementally:
   - Phase 1: Playback controls (shuffle, repeat, speed)
   - Phase 2: Artist and album pages
   - Phase 3: Queue visualization
   - Phase 4: Mobile fixes and polish

## Security Considerations

1. **URL Parameter Sanitization**: Artist and album names from URLs must be sanitized to prevent XSS
2. **API Authorization**: Artist and album endpoints must verify user authentication
3. **Rate Limiting**: API endpoints should have rate limiting to prevent abuse
4. **Input Validation**: All user inputs (speed values, queue indices) must be validated

## Future Enhancements

Potential future additions not in current scope:

1. **Smart Shuffle**: Avoid playing songs from same artist/album consecutively
2. **Crossfade**: Smooth transitions between songs
3. **Equalizer**: Audio frequency controls
4. **Lyrics Display**: Show synchronized lyrics
5. **Collaborative Queue**: Multiple users can add to shared queue
6. **Queue History**: View previously played songs in current session
7. **Custom Repeat Ranges**: Repeat specific sections of songs
