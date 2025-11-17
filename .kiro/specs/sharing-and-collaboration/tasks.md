# Implementation Plan

## Backend Implementation

- [ ] 1. Update Playlist model with sharing fields
  - Add `visibility` field (enum: 'private', 'shared', 'public', default: 'private')
  - Add `ownerId` field (String, required)
  - Add `collaborators` array field (array of user IDs)
  - Add `followers` array field (array of user IDs)
  - Add indexes on visibility and ownerId fields
  - Migrate existing playlists to set ownerId = userId
  - _Requirements: 1, 5_

- [ ] 2. Create playlist sharing controller
  - Create `backend/src/controllers/playlistSharingController.ts`
  - Implement `updateVisibility` function
  - Implement `addCollaborator` function
  - Implement `removeCollaborator` function
  - Implement `followPlaylist` function
  - Implement `unfollowPlaylist` function
  - Implement `getPublicPlaylists` function with pagination
  - Implement `getDiscoverPlaylists` function
  - Implement `generateShareLink` function
  - _Requirements: 1, 2, 3, 4, 5_

- [ ] 3. Create permission checking middleware
  - Create `backend/src/middleware/playlistPermissions.ts`
  - Implement `checkPlaylistOwner` middleware
  - Implement `checkPlaylistCollaborator` middleware
  - Implement `checkPlaylistAccess` middleware
  - Export permission checking functions
  - _Requirements: 5_

- [ ] 4. Create playlist sharing routes
  - Create `backend/src/routes/playlistSharing.ts`
  - Add `PUT /playlists/:id/visibility` route
  - Add `POST /playlists/:id/collaborators` route
  - Add `DELETE /playlists/:id/collaborators/:userId` route
  - Add `POST /playlists/:id/follow` route
  - Add `DELETE /playlists/:id/follow` route
  - Add `GET /playlists/public` route
  - Add `GET /playlists/discover` route
  - Add `GET /playlists/:id/share-link` route
  - Apply authentication and permission middlewares
  - _Requirements: 1, 2, 3, 4, 5_

- [ ] 5. Update existing playlist routes with permissions
  - Update `getPlaylist` to check visibility and permissions
  - Update `updatePlaylist` to check owner/collaborator permissions
  - Update `deletePlaylist` to check owner permission only
  - Return permission level in playlist responses
  - _Requirements: 5_

- [ ] 6. Integrate sharing routes into application
  - Import sharing routes in `backend/src/index.ts`
  - Mount routes at appropriate paths
  - Test all endpoints with API client
  - _Requirements: 1, 2, 3, 4, 5_

## Frontend Implementation

- [ ] 7. Create playlist sharing context
  - Create `frontend/contexts/PlaylistSharingContext.tsx`
  - Implement state for visibility, collaborators, followers
  - Create functions for updating visibility
  - Create functions for managing collaborators
  - Create functions for following/unfollowing
  - _Requirements: 1, 3, 4_

- [ ] 8. Extend API client with sharing endpoints
  - Add sharing functions to `frontend/lib/api.ts`
  - Implement `updatePlaylistVisibility(playlistId, visibility)`
  - Implement `addCollaborator(playlistId, userId)`
  - Implement `removeCollaborator(playlistId, userId)`
  - Implement `followPlaylist(playlistId)`
  - Implement `unfollowPlaylist(playlistId)`
  - Implement `getPublicPlaylists(limit, offset, search)`
  - Implement `getDiscoverPlaylists(limit)`
  - Implement `getShareLink(playlistId)`
  - _Requirements: 1, 2, 3, 4_

- [ ] 9. Create SharePlaylistModal component
  - Create `frontend/components/SharePlaylistModal.tsx`
  - Add visibility toggle (Private/Shared/Public)
  - Add collaborator management section
  - Add copy share link button
  - Add save/cancel buttons
  - Integrate with PlaylistSharingContext
  - _Requirements: 1, 4, 5_

- [ ] 10. Create VisibilityBadge component
  - Create `frontend/components/VisibilityBadge.tsx`
  - Display badge for Private/Shared/Public status
  - Use appropriate colors and icons
  - Make component reusable
  - _Requirements: 1, 5_

- [ ] 11. Create CollaboratorManager component
  - Create `frontend/components/CollaboratorManager.tsx`
  - Display list of current collaborators
  - Add input to add new collaborators by email/ID
  - Add remove button for each collaborator
  - Show owner information
  - _Requirements: 4_

- [ ] 12. Update playlist detail page with sharing
  - Update `frontend/app/playlists/[id]/page.tsx`
  - Add "Share" button in header
  - Add VisibilityBadge display
  - Show owner and collaborator information
  - Show follower count for public playlists
  - Disable edit actions for non-owners/collaborators
  - Open SharePlaylistModal on share button click
  - _Requirements: 1, 4, 5_

- [ ] 13. Create Discover page
  - Create `frontend/app/discover/page.tsx`
  - Add search bar for public playlists
  - Add filter options (Most Popular, Recent, Most Followed)
  - Display grid of public playlist cards
  - Implement pagination
  - _Requirements: 2_

- [ ] 14. Create PlaylistCard component
  - Create `frontend/components/PlaylistCard.tsx`
  - Display playlist name, owner, song count
  - Display follower count
  - Add preview button
  - Add follow/unfollow button
  - Use theme colors for styling
  - _Requirements: 2, 3_

- [ ] 15. Create PlaylistPreviewModal component
  - Create `frontend/components/PlaylistPreviewModal.tsx`
  - Display full playlist details
  - Show first 10 songs
  - Add follow button
  - Add "View Full Playlist" button
  - _Requirements: 2, 3_

- [ ] 16. Update playlists page with followed section
  - Update `frontend/app/playlists/page.tsx`
  - Add "My Playlists" and "Followed Playlists" tabs
  - Display followed playlists with "Followed" badge
  - Add unfollow option for followed playlists
  - _Requirements: 3_

- [ ] 17. Add Discover link to navigation
  - Update `frontend/components/Navigation.tsx`
  - Add "Discover" navigation item
  - Use appropriate icon (IconCompass or IconWorld)
  - Highlight active state
  - _Requirements: 2_

- [ ] 18. Implement notifications for sharing actions
  - Add success notifications for visibility changes
  - Add success notifications for collaborator actions
  - Add success notifications for follow/unfollow
  - Add error notifications for failed operations
  - _Requirements: 1, 3, 4_

- [ ] 19. Add loading and error states
  - Add loading skeletons for discover page
  - Add loading states for sharing operations
  - Add error alerts for permission issues
  - Add empty states for no public playlists
  - _Requirements: 2_

- [ ] 20. Implement responsive design
  - Ensure sharing modal works on mobile
  - Make discover page responsive
  - Ensure playlist cards work on small screens
  - Test touch interactions
  - _Requirements: 1, 2_

## Testing

- [ ] 21. Write backend tests
  - Test permission checking logic
  - Test visibility update endpoint
  - Test collaborator management endpoints
  - Test follow/unfollow endpoints
  - Test public playlist queries
  - _Requirements: All_

- [ ] 22. Write frontend tests
  - Test SharePlaylistModal component
  - Test PlaylistCard component
  - Test discover page functionality
  - Test permission-based UI rendering
  - _Requirements: All_

- [ ] 23. Perform integration testing
  - Test complete sharing workflow
  - Test follow/unfollow flow
  - Test collaborator workflow
  - Test permission enforcement
  - _Requirements: All_
