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

## 5. Recent Changes Log
- **UI Refactor (Dec 2025):**
  - **Font Size:** Significantly reduced global font sizes, line heights, and spacing for a compact, high-density look.
  - **Sidebar Overlap Fix:** Moved `AudioPlayer` into `AppShell.Footer` to prevent the sidebar from covering it.
  - **Mobile Header:** Improved layout and spacing for small screens.
  - **User Avatar:** Fixed issue where avatar wasn't showing in header (now passes `photoURL` correctly).
  - **Documentation:** Removed scattered/redundant `.md` files in favor of this `CONTEXT.md`.

## 6. Development Rules
1.  **Package Manager:** Always use `pnpm`.
2.  **Linting:** Fix lint errors immediately.
3.  **Build:** Always verify `pnpm build` (frontend & backend) before finishing a task.
4.  **Files:** Do not create random documentation files in root. Update this file instead.
