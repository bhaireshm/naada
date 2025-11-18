# Implementation Plan

- [x] 1. Update backend User model and API types

  - Add googleEmail field to User schema for storing the Google account email
  - Update UserProfile interface to include googleId, googleEmail, and authProviders fields
  - Ensure googleId field has sparse index for uniqueness
  - _Requirements: 5.1, 2.1_

- [x] 2. Implement backend account linking endpoint

  - [x] 2.1 Create POST /users/me/link-google endpoint

    - Validate Firebase ID token from request
    - Extract Google user ID and email from token
    - Check if Google account is already linked to another user
    - Update user document with googleId and googleEmail
    - Add 'google' to authProviders array if not present
    - Return updated user profile
    - _Requirements: 1.3, 4.1, 5.1_
  
  - [ ]* 2.2 Write property test for linking stores Google ID
    - **Property 1: Successful linking stores Google ID**
    - **Validates: Requirements 1.3, 5.1**
  
  - [ ]* 2.3 Write property test for duplicate rejection
    - **Property 4: Duplicate Google accounts are rejected**
    - **Validates: Requirements 4.1**
  
  - [ ]* 2.4 Write property test for failed linking preserves state
    - **Property 5: Failed linking preserves state**
    - **Validates: Requirements 4.3**

- [x] 3. Implement backend account unlinking endpoint

  - [x] 3.1 Create DELETE /users/me/link-google endpoint

    - Validate user has alternative authentication method (password)
    - Prevent unlinking if user only has Google auth
    - Remove googleId and googleEmail from user document
    - Remove 'google' from authProviders array
    - Return updated user profile
    - _Requirements: 3.3, 3.5_
  
  - [ ]* 3.2 Write property test for disconnection removes Google ID
    - **Property 3: Disconnection removes Google ID**
    - **Validates: Requirements 3.3**
  
  - [ ]* 3.3 Write unit test for preventing disconnect without alternative auth
    - Test edge case where user created via Google cannot disconnect
    - _Requirements: 3.5_

- [x] 4. Update frontend API client

  - Add linkGoogleAccount() function to call POST /users/me/link-google
  - Add unlinkGoogleAccount() function to call DELETE /users/me/link-google
  - Update UserProfile interface to match backend changes
  - Add proper error handling for duplicate account and auth errors
  - _Requirements: 1.2, 3.2_

- [ ] 5. Create GoogleAccountSection component
  - [x] 5.1 Implement component with conditional rendering

    - Show "Connect Google Account" button when googleId is not present
    - Show linked Google email and disconnect button when googleId is present
    - Display Google icon/badge for visual indicator
    - Handle loading states during link/unlink operations
    - _Requirements: 1.1, 1.5, 2.1, 2.2, 3.1_
  
  - [x] 5.2 Implement connect functionality

    - Call Firebase signInWithGoogle() on button click
    - Extract ID token from result
    - Call backend linkGoogleAccount() API
    - Update local profile state on success
    - Display error messages on failure
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [x] 5.3 Implement disconnect functionality

    - Show confirmation modal when disconnect button clicked
    - Call backend unlinkGoogleAccount() API on confirmation
    - Update local profile state on success
    - Handle "cannot disconnect" error for Google-only accounts
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 5.4 Write unit tests for GoogleAccountSection component
    - Test rendering with and without googleId
    - Test button click handlers
    - Test error display
    - _Requirements: 1.1, 1.5, 2.1, 3.1_

- [x] 6. Integrate GoogleAccountSection into profile page

  - Add GoogleAccountSection component to profile page
  - Pass user profile data as props
  - Handle profile refresh after link/unlink operations
  - Position component in appropriate section of profile layout
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 7. Update authentication middleware to support linked accounts
  - [x] 7.1 Modify auth middleware to check for existing users by googleId

    - When processing Google sign-in, check if googleId exists in database
    - If found, authenticate to that existing user account
    - If not found, proceed with new user creation
    - _Requirements: 5.2, 5.4_
  
  - [ ]* 7.2 Write property test for Google sign-in with linked account
    - **Property 6: Google sign-in authenticates to linked account**
    - **Validates: Requirements 5.2**
  
  - [ ]* 7.3 Write property test for email/password auth after linking
    - **Property 7: Email/password auth still works after linking**
    - **Validates: Requirements 5.3**

- [x] 8. Add error handling and user feedback

  - Implement error messages for duplicate Google account
  - Implement error messages for cannot disconnect
  - Add success notifications for link/unlink operations
  - Handle OAuth popup blocked/cancelled scenarios

  - _Requirements: 4.2, 4.4, 3.5_

- [x] 9. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
