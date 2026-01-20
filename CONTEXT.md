# Project Context & Architecture

> **IMPORTANT:** This file serves as the primary source of truth for the project's architecture, design decisions, and current state.
> **MAINTENANCE RULE:** Any agent or developer making significant changes to the codebase **MUST** update this file to reflect those changes.

## 1. Project Overview

**Name:** Naada Music
**Description:** A personal music library application allowing users to upload, organize, and stream their music collection. It features a responsive UI, metadata enrichment via MusicBrainz, and local/cloud playback.

## 2. Tech Stack

### Frontend

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI Library:** Mantine v7 (Core, Hooks, Notifications)
- **State Management:** React Context (AudioPlayer, Search, Favorites)
- **Auth:** Firebase Authentication
- **Icons:** Tabler Icons React
- **Build Tool:** pnpm

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **External APIs:** MusicBrainz (Metadata), Cover Art Archive
- **Storage:** Local file system / S3 (configurable)

## 3. Architecture & Key Patterns

### Frontend Layout

- **RootLayout (`app/layout.tsx`):** Server component. Wraps the app in `ThemeProvider` and `ClientLayout`.
- **ClientLayout (`components/ClientLayout.tsx`):**
  - Acts as the main provider wrapper (`AudioPlayerProvider`, `SearchProvider`, etc.).
  - Renders `MainLayout` which contains the Mantine `AppShell`.
  - **Crucial:** The `AppShell` manages the main layout.
    - **Header:** Contains `Navigation` (Logo, Search, User Menu).
    - **Navbar:** Contains `Sidebar` (Navigation links). Collapsible on mobile.
    - **Footer:** Contains `AudioPlayer`. This ensures the player is always visible and doesn't overlap content or the sidebar.
    - **Main:** Content area with bottom padding to accommodate the footer.

### Audio Player Logic

- **State:** Managed by `GlobalAudioPlayerContext` (provides `currentSong`).
- **UI:** `AudioPlayer` component.
  - **Positioning:** Placed inside `AppShell.Footer`.
  - **Styling:** Fills the footer container (`width: 100%`, `height: 100%`). **Do NOT** use `position: fixed` on the player itself, as it breaks the AppShell layout flow.

### Backend Structure

- **Controllers:** Handle HTTP requests and response formatting. Delegate business logic to Services.
- **Services:** Contain business logic (e.g., `metadataEnrichmentService`, `songService`).
- **Models:** Mongoose schemas for data persistence.

## 4. Design System & Theme

The project uses a custom Mantine theme (`theme1`) with a "Warm Earthy" palette.

### Typography (Scaled Down)

The entire UI uses a compact scale. **Do not increase these sizes arbitrarily.**

- **Body:**
  - `xs`: 0.6rem (~9.6px)
  - `sm`: 0.7rem (~11.2px)
  - `md`: 0.8rem (~12.8px)
  - `lg`: 0.9rem (~14.4px)
  - `xl`: 1.0rem (~16px)
- **Headings:** Scaled down similarly (h1 ~1.8rem).

### Spacing & Radius

- Adjusted to match the compact typography (e.g., `xs` spacing is 0.2rem).

### Responsiveness

- **Mobile First:** Design for small screens first.
- **Header:** Uses responsive padding (`px={{ base: 'xs', sm: 'md' }}`) and gaps.
- **Sidebar:** Hidden on mobile (Burger menu toggle), fixed on desktop.

## 5. Metadata Cleaning & AI Enhancement

### Metadata Cleaner (`backend/src/utils/metadataCleaner.ts`)

The metadata cleaner provides comprehensive cleaning and normalization of song metadata from various sources (file tags, user input, downloaded files).

#### Key Features

1. **Generic Website Pattern Removal**
   - Removes ANY website/download source in brackets using pattern matching
   - Catches domains with TLDs: `[AnySite.com]`, `[NewSite.xyz]`
   - Catches music keywords: `[MP3]`, `[320kbps]`, `[Download]`
   - Future-proof: No hardcoded site list needed

2. **Comprehensive Text Cleaning**
   - Removes bitrate info: `(320Kbps)`, `128kbps`
   - Removes quality tags: `Video Song`, `Official Audio`, `HD`, `4K`
   - Converts underscores to spaces: `Song_Name` → `Song Name`
   - Converts plus signs to commas: `Artist1+Artist2` → `Artist1, Artist2`
   - Removes special characters, emojis, control characters
   - Removes trailing junk: `Song_2` → `Song`

3. **Smart Title-Artist Separation**
   - Function: `separateTitleAndArtists()`
   - Detects patterns: `Title - Artist`, `Title by Artist`, `Title feat Artist`
   - Automatically splits combined metadata

4. **Swapped Field Detection** ⭐ NEW
   - Function: `detectAndSwapTitleArtist()`
   - Uses 6 heuristic indicators to detect when title/artist are swapped:
     - Artist starts with track number (+3 points)
     - Artist contains music words (+2 points)
     - Title has multiple names (+2 points)
     - Title has commas (+1 point)
     - Artist is longer than typical (+1 point)
     - Artist has numbers, title doesn't (+1 point)
   - Automatically swaps if score ≥ 3
   - Example: `Title: "Anirudh Nadisha Thomas"` + `Artist: "01 Song Name"` → Swapped!

5. **AI-Enhanced Metadata** (Already Integrated)
   - Service: `aiMetadataService.ts`
   - Analyzes audio characteristics (tempo, mood, energy)
   - Classifies genres using audio analysis
   - Complements text-based cleaning

#### Processing Order

1. **Extract** metadata from file (includes AI analysis)
2. **Detect & swap** title/artist if needed (NEW)
3. **Clean** fields (remove URLs, junk, special chars)
4. **Separate** combined title-artist strings
5. **Normalize** all fields
6. **Save** to database

#### Testing & Verification

To verify the metadata cleanup functionality, use `curl` to execute the API directly. This allows for testing both single songs and batch processing without frontend interaction.

**Example Batch Cleanup Test:**

```bash
curl -X POST http://localhost:3001/songs/batch-cleanup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"processAll": true}'
```

### Delete Functionality

#### Song Deletion Features

1. **Location 1: Song List** (`frontend/components/SongListItem.tsx`)
   - Three-dot menu → Delete option
   - Permission-based (only owner can delete)
   - Confirmation modal before deletion

2. **Location 2: Edit Modal** (`frontend/components/EditSongModal.tsx`) ⭐ NEW
   - Delete button on left side of modal footer
   - Red styling for destructive action
   - Uses `useSongActions` hook for permissions
   - Auto-closes modal after successful deletion

3. **Backend** (`backend/src/controllers/songController.ts`)
   - Verifies user permissions (403 if not owner)
   - Deletes file from R2 storage
   - Deletes from database
   - Handles errors gracefully (continues with DB deletion if R2 fails)

#### Reusable Hook

- **`useSongActions`** (`frontend/hooks/useSongActions.ts`)
  - Provides consistent edit/delete handlers
  - Permission checking
  - Queue management
  - Used across: SongListItem, EditSongModal, AudioPlayer

## 6. Recent Changes Log

### December 2024 - Metadata Cleaning & Delete Enhancements

1. **Enhanced Metadata Cleaner:**
   - Added generic website pattern matching (no hardcoded list)
   - Added swapped title/artist detection using heuristics
   - Enhanced cleaning for downloaded songs (bitrate, quality tags, underscores)
   - Added smart title-artist separation
   - Comprehensive special character cleaning
   - **NEW:** Integrated AI validation for swap detection (`aiEnhancedSwapDetection`)

2. **New API Endpoints:**
   - `POST /songs/batch-cleanup`: Batch process all songs for metadata cleanup
   - `POST /songs/:id/cleanup`: Clean metadata for specific song
   - Validated with comprehensive tests and live execution

3. **Delete Functionality:**
   - Added delete button to EditSongModal
   - Integrated with existing R2 storage deletion
   - Consistent permission-based access control
   - Reused useSongActions hook across components

4. **AI Integration:**
   - Verified AI metadata extraction is active (mood, genre, energy)
   - Complementary to text-based metadata cleaning
   - **Status:** Successfully cleaned 231 songs (65 updated) in live environment

5. **Mobile UI Enhancements:**
   - **Expanded Audio Player:** Clickable footer opens full-screen Drawer
   - **Rich Controls:** Large album art, progress slider, playback controls
   - **Actions:** Integrated Delete, Lyrics, and Queue buttons in expanded view
   - **Menu:** Added top-right menu with Details, Add to Playlist, and Download options
   - **Menu:** Added top-right menu with Details, Add to Playlist, and Download options
   - **Fixes:** Resolved z-index issues for Queue and Lyrics overlays
   - **Design:** Premium look with gradients and proper spacing

6. **Song Details Page Redesign:**
   - **Immersive Header:** Full-width blurred album art background
   - **Hero Section:** Large album art, bold typography, prominent actions
   - **Metadata:** Clean badges for album, duration, and date
   - **Lyrics:** Dedicated section for lyrics display
   - **Integration:** Added Favorite button and improved mobile responsiveness

7. **Queue & Mobile UI Improvements:**
   - **Queue Reordering:** Implemented drag-and-drop support for the song queue using `@hello-pangea/dnd`.
   - **Overlay Fixes:** Wrapped Queue and Lyrics overlays in `Portal` with high z-index (10000) to ensure they appear above the mobile player drawer.
   - **Visuals:** Added drag handles and visual feedback during reordering.

8. **UI Refinements:**
   - **Song Details:** Reduced top spacing and header height for a more compact look.
   - **Mobile Player:** Moved "Delete Song" action to the top-right context menu for better organization.

9. **Bug Fixes & Logic Updates:**
   - **Queue Logic:** Implemented automatic removal of songs from the queue after playback (unless repeat mode is 'one').
   - **Queue Reordering:** Fixed hydration issues with drag-and-drop by implementing a `StrictModeDroppable` component.
   - **Song Details:** Further optimized header height and layout to reduce empty space.
   - **Mobile Visuals:** Reduced album art size on mobile view for better layout balance.
   - **Access Control:** Restricted upload functionality to user ID 'bhairesh'.

### Previous Changes (Dec 2025)

- **UI Refactor:**
  - Font Size: Significantly reduced global font sizes, line heights, and spacing for compact UI
  - Sidebar Overlap Fix: Moved AudioPlayer into AppShell.Footer
  - Mobile Header: Improved layout and spacing
  - User Avatar: Fixed display issue in header
  - Documentation: Consolidated into CONTEXT.md

## 7. Development Rules

1. **Principles:** Adhere to **DRY** (Don't Repeat Yourself), **KISS** (Keep It Simple, Stupid), and **SOLID** principles for all new code.
2. **Reuse:** **ALWAYS** check for existing implementations, components, or utilities before creating new files. Reuse existing code whenever possible to avoid duplication.
3. **Package Manager:** Always use `pnpm`.
4. **Linting:** Fix lint errors immediately.
5. **Build:** Always verify `pnpm build` (frontend & backend) before finishing a task.
6. **Documentation:** Update this CONTEXT.md file when making significant changes. Do not create random `.md` files in root or `.kiro` folder unless specifically needed for implementation notes.
