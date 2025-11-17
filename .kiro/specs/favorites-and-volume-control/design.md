# Design Document

## Overview

This document outlines the technical design for implementing Favorites/Liked Songs and Volume Control features. The Favorites feature allows users to mark songs they love and access them through a dedicated collection page. The Volume Control feature provides an intuitive interface for adjusting audio playback volume with visual feedback, keyboard shortcuts, and persistent settings. Both features integrate seamlessly with the existing music player architecture.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Favorites  │  │    Volume    │  │   Playing    │      │
│  │     Page     │  │   Control    │  │     Bar      │      │
│  │  Component   │  │  Component   │  │  (Updated)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Favorites Context                         │      │
│  │  - Favorite songs state                           │      │
│  │  - Toggle favorite function                       │      │
│  │  - Sync across components                         │      │
│  └──────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────┐      │
│  │      AudioPlayer Context (Extended)               │      │
│  │  - Volume state                                   │      │
│  │  - Mute state                                     │      │
│  │  - Volume persistence                             │      │
│  └──────────────────────────────────────────────────┘      │
│                          ↓                                   │
│                    API Client                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐      │
│  │         Favorites Controller                      │      │
│  │  - Add favorite                                   │      │
│  │  - Remove favorite                                │      │
│  │  - Get favorites                                  │      │
│  │  - Check favorite status                          │      │
│  └──────────────────────────────────────────────────┘      │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────┐      │
│  │         MongoDB Database                          │      │
│  │  - Favorite collection                            │      │
│  │  - User-Song relationships                        │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Favorite Model (Backend)

```typescript
// backend/src/models/Favorite.ts

interface IFavorite {
  userId: string;        // Firebase UID
  songId: ObjectId;      // Reference to Song
  createdAt: Date;       // When favorited
}

// Mongoose Schema
const FavoriteSchema = new Schema<IFavorite>({
  userId: { type: String, required: true, index: true },
  songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound unique index to prevent duplicates
FavoriteSchema.index({ userId: 1, songId: 1 }, { unique: true });

// Index for efficient queries
FavoriteSchema.index({ userId: 1, createdAt: -1 });
```

### Frontend Interfaces

```typescript
// Favorites Context
interface FavoritesContextValue {
  favorites: Set<string>;           // Set of favorited song IDs
  isLoading: boolean;
  toggleFavorite: (songId: string) => Promise<void>;
  isFavorite: (songId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

// Volume State (in AudioPlayerContext)
interface VolumeState {
  volume: number;                   // 0-100
  isMuted: boolean;
  previousVolume: number;           // For unmute restoration
}

// API Response Types
interface FavoriteResponse {
  favorite: {
    id: string;
    userId: string;
    songId: string;
    createdAt: string;
  };
}

interface FavoritesListResponse {
  favorites: Array<{
    id: string;
    song: Song;
    createdAt: string;
  }>;
  total: number;
}
```

## Components and Interfaces

### Frontend Components

#### 1. FavoritesContext Provider

```typescript
// frontend/contexts/FavoritesContext.tsx
```

**Key Features:**

- Manages global favorites state using React Context
- Fetches user's favorites on mount
- Provides toggleFavorite function for adding/removing favorites
- Syncs favorite status across all components
- Handles optimistic updates with rollback on error
- Caches favorites in memory for fast lookups

**Implementation Details:**

- Use Set for O(1) favorite lookups
- Implement optimistic UI updates
- Handle API errors gracefully with rollback
- Refresh favorites after song upload or deletion

#### 2. FavoriteButton Component

```typescript
// frontend/components/FavoriteButton.tsx

interface FavoriteButtonProps {
  songId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}
```

**Key Features:**

- Displays heart icon (filled or outlined)
- Toggles favorite status on click
- Shows loading state during API call
- Animated transition between states
- Accessible with ARIA labels
- Responsive sizing for different contexts

#### 3. Favorites Page

```typescript
// frontend/app/favorites/page.tsx
```

**Key Features:**

- Displays all favorited songs in a list/grid
- Shows total favorite count
- Allows playing, adding to playlist, removing from favorites
- Empty state with helpful guidance
- Loading skeleton while fetching
- Responsive layout for mobile and desktop

#### 4. VolumeControl Component

```typescript
// frontend/components/VolumeControl.tsx

interface VolumeControlProps {
  className?: string;
}
```

**Key Features:**

- Volume slider (0-100%)
- Mute/unmute button with icon states
- Real-time volume adjustment
- Keyboard shortcuts (Up/Down arrows, M for mute)
- Volume percentage tooltip
- Persistent volume settings via localStorage
- Touch-friendly for mobile

**Volume Icon States:**

- Muted: IconVolume3 (crossed out)
- Low (1-33%): IconVolume
- Medium (34-66%): IconVolume2
- High (67-100%): IconVolume3

#### 5. Updated AudioPlayerContext

**Extended State:**

```typescript
interface AudioPlayerState {
  // Existing state...
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  
  // New volume state
  volume: number;
  isMuted: boolean;
  previousVolume: number;
}
```

**New Actions:**

```typescript
setVolume: (volume: number) => void;
toggleMute: () => void;
increaseVolume: (amount?: number) => void;
decreaseVolume: (amount?: number) => void;
```

### Backend Components

#### 1. Favorite Model

```typescript
// backend/src/models/Favorite.ts
```

**Key Features:**

- Stores user-song favorite relationships
- Compound unique index on userId + songId
- Timestamps for sorting by recency
- Reference to Song model for population

#### 2. Favorites Controller

```typescript
// backend/src/controllers/favoritesController.ts

export async function addFavorite(req, res): Promise<void>;
export async function removeFavorite(req, res): Promise<void>;
export async function getFavorites(req, res): Promise<void>;
export async function checkFavoriteStatus(req, res): Promise<void>;
export async function getFavoriteCount(req, res): Promise<void>;
```

**Key Features:**

- Add song to favorites (with duplicate prevention)
- Remove song from favorites
- Get all user favorites (with populated song data)
- Check if specific song is favorited
- Get favorite count for a song

#### 3. Favorites Routes

```typescript
// backend/src/routes/favorites.ts

POST   /favorites/:songId          // Add to favorites
DELETE /favorites/:songId          // Remove from favorites
GET    /favorites                  // Get all favorites
GET    /favorites/:songId/status   // Check favorite status
GET    /favorites/:songId/count    // Get favorite count
```

## Implementation Details

### Favorites Feature

#### Frontend Flow

1. **Initial Load:**
   - FavoritesContext fetches user's favorites on mount
   - Stores favorite song IDs in a Set for fast lookups
   - Provides isFavorite(songId) function to all components

2. **Toggle Favorite:**
   - User clicks heart icon
   - Optimistic update: immediately update UI
   - Call API to add/remove favorite
   - On success: keep optimistic update
   - On error: rollback UI and show error notification

3. **Favorites Page:**
   - Fetch favorites with populated song data
   - Display in responsive grid/list
   - Allow playback and playlist operations
   - Show empty state if no favorites

#### Backend Flow

1. **Add Favorite:**
   - Validate songId exists
   - Create Favorite document with userId and songId
   - Handle duplicate error (already favorited)
   - Return success response

2. **Remove Favorite:**
   - Find and delete Favorite document
   - Return success response
   - Handle not found gracefully

3. **Get Favorites:**
   - Query Favorites by userId
   - Populate song data
   - Sort by createdAt (most recent first)
   - Return array of favorites with song details

### Volume Control Feature

#### Frontend Implementation

1. **Volume State Management:**
   - Store volume (0-100) in AudioPlayerContext
   - Store isMuted boolean
   - Store previousVolume for unmute restoration
   - Persist to localStorage on every change

2. **Volume Slider:**
   - Use Mantine Slider component
   - Range: 0-100
   - Update audio element volume in real-time
   - Show percentage tooltip on hover/drag

3. **Mute Toggle:**
   - Click volume icon to toggle mute
   - When muting: save current volume, set to 0
   - When unmuting: restore previous volume
   - Update icon based on mute state

4. **Keyboard Shortcuts:**
   - Listen for keydown events globally
   - Up Arrow: increase volume by 5%
   - Down Arrow: decrease volume by 5%
   - M key: toggle mute
   - Prevent shortcuts when input focused

5. **Persistence:**
   - Save volume to localStorage: 'musicPlayerVolume'
   - Save mute state to localStorage: 'musicPlayerMuted'
   - Load on app initialization
   - Default: 70% volume, not muted

#### Audio Element Integration

```typescript
// Update audio element volume
audioRef.current.volume = volume / 100;

// Mute/unmute
audioRef.current.muted = isMuted;
```

## Database Schema

### Favorites Collection

```javascript
{
  _id: ObjectId,
  userId: String,           // Firebase UID
  songId: ObjectId,         // Reference to songs collection
  createdAt: Date
}

// Indexes
{ userId: 1, songId: 1 }    // Unique compound index
{ userId: 1, createdAt: -1 } // Query optimization
{ songId: 1 }                // For favorite counts
```

## API Endpoints

### Favorites Endpoints

```
POST   /favorites/:songId
  - Add song to favorites
  - Auth: Required
  - Response: { favorite: { id, userId, songId, createdAt } }

DELETE /favorites/:songId
  - Remove song from favorites
  - Auth: Required
  - Response: { success: true }

GET    /favorites
  - Get all user favorites
  - Auth: Required
  - Query params: limit, offset (pagination)
  - Response: { favorites: [...], total: number }

GET    /favorites/:songId/status
  - Check if song is favorited
  - Auth: Required
  - Response: { isFavorite: boolean }

GET    /songs/:songId/favorites/count
  - Get favorite count for a song
  - Auth: Required
  - Response: { count: number }
```

## Error Handling

### Favorites Errors

1. **Song Not Found:** Return 404 when songId doesn't exist
2. **Already Favorited:** Return 409 when adding duplicate favorite
3. **Not Favorited:** Return 404 when removing non-existent favorite
4. **Database Errors:** Return 500 with generic error message

### Volume Control Errors

1. **Audio Load Failure:** Disable volume controls, show error state
2. **localStorage Unavailable:** Use in-memory state only
3. **Invalid Volume Value:** Clamp to 0-100 range
4. **Browser Autoplay Policy:** Handle gracefully with user notification

## Testing Strategy

### Favorites Tests

**Frontend:**

- FavoritesContext: toggle favorite, optimistic updates, error rollback
- FavoriteButton: click handler, loading state, icon states
- Favorites page: empty state, song list, remove favorite

**Backend:**

- Add favorite: success, duplicate prevention, invalid song
- Remove favorite: success, not found handling
- Get favorites: pagination, populated songs, empty list
- Favorite count: accurate counting

### Volume Control Tests

**Frontend:**

- Volume slider: drag, click, value updates
- Mute toggle: mute/unmute, volume restoration
- Keyboard shortcuts: arrow keys, M key
- Persistence: save/load from localStorage
- Audio element: volume sync, mute sync

## Performance Considerations

### Favorites

1. **Caching:** Store favorites in memory (Set) for O(1) lookups
2. **Optimistic Updates:** Immediate UI feedback
3. **Batch Operations:** Future enhancement for bulk favorite operations
4. **Pagination:** Limit favorites query results

### Volume Control

1. **Debouncing:** Debounce localStorage writes (100ms)
2. **Throttling:** Throttle volume change events
3. **Efficient Updates:** Only update audio element when necessary

## Accessibility

### Favorites

1. **ARIA Labels:** "Add to favorites" / "Remove from favorites"
2. **Keyboard Access:** Tab navigation, Enter to toggle
3. **Screen Reader:** Announce favorite status changes
4. **Visual Feedback:** Clear filled/outlined heart states

### Volume Control

1. **ARIA Labels:** "Volume slider", "Mute/Unmute"
2. **Keyboard Access:** Arrow keys for slider, Tab navigation
3. **Screen Reader:** Announce volume level changes
4. **Focus Indicators:** Clear focus states for all controls
5. **Color Contrast:** Sufficient contrast for visibility

## Mobile Considerations

### Favorites

1. **Touch Targets:** Minimum 44x44 pixels for heart button
2. **Responsive Layout:** Stack favorites in single column on mobile
3. **Swipe Actions:** Future enhancement for swipe-to-remove

### Volume Control

1. **Touch-Friendly Slider:** Larger thumb for easier dragging
2. **Tap to Mute:** Single tap on icon to mute/unmute
3. **Volume Percentage:** Show during touch interaction
4. **Compact Layout:** Optimize space in mobile Playing Bar

## Security Considerations

1. **Authentication:** All favorites endpoints require valid JWT
2. **User Isolation:** Users can only access their own favorites
3. **Input Validation:** Validate songId format and existence
4. **Rate Limiting:** Prevent abuse of favorite toggle (future)

## Future Enhancements

### Favorites

1. **Favorite Playlists:** Extend to playlists and albums
2. **Favorite Analytics:** Track most favorited songs
3. **Social Features:** See friends' favorites
4. **Smart Playlists:** Auto-generate playlists from favorites
5. **Favorite Sync:** Sync across devices in real-time

### Volume Control

1. **Volume Presets:** Save multiple volume presets
2. **Auto Volume:** Normalize volume across songs
3. **Fade In/Out:** Smooth volume transitions
4. **Per-Song Volume:** Remember volume per song
5. **System Volume Integration:** Sync with OS volume
