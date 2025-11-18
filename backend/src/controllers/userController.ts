import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';

/**
 * GET /users/me
 * Get current user profile
 */
export async function getUserProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;

    // Find user
    const user = await User.findOne({ uid: userId });

    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // Return user profile
    res.status(200).json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        googleId: user.googleId,
        googleEmail: user.googleEmail,
        authProviders: user.authProviders,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch user profile',
        details: errorMessage,
      },
    });
  }
}

/**
 * PUT /users/me
 * Update current user profile
 */
export async function updateUserProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { displayName, bio, avatarUrl } = req.body;

    // Validate bio length
    if (bio && bio.length > 500) {
      res.status(400).json({
        error: {
          code: 'INVALID_BIO',
          message: 'Bio must be 500 characters or less',
        },
      });
      return;
    }

    // Find and update user
    const user = await User.findOne({ uid: userId });

    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // Update fields
    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    user.updatedAt = new Date();

    await user.save();

    // Return updated profile
    res.status(200).json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        googleId: user.googleId,
        googleEmail: user.googleEmail,
        authProviders: user.authProviders,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update user profile',
        details: errorMessage,
      },
    });
  }
}

/**
 * GET /users/:id
 * Get public user info by ID
 */
export async function getUserById(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const targetUserId = req.params.id;

    // Find user
    const user = await User.findOne({ uid: targetUserId });

    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // Return public user info (no email or preferences)
    res.status(200).json({
      user: {
        uid: user.uid,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch user',
        details: errorMessage,
      },
    });
  }
}

/**
 * GET /users/search
 * Search users by email or display name
 */
export async function searchUsers(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.trim().length === 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_QUERY',
          message: 'Search query is required',
        },
      });
      return;
    }

    // Search by email or display name
    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
      ],
    })
      .limit(limit)
      .select('uid email displayName avatarUrl');

    // Return search results
    res.status(200).json({
      users: users.map((user) => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to search users',
        details: errorMessage,
      },
    });
  }
}

/**
 * POST /users/me/link-google
 * Link Google account to current user profile
 */
export async function linkGoogleAccount(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { googleIdToken } = req.body;

    if (!googleIdToken) {
      res.status(400).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Google ID token is required',
        },
      });
      return;
    }

    // Import Firebase Admin SDK for token verification
    const { auth } = await import('../config/firebase');

    // Verify Google ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(googleIdToken);
    } catch (error) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid Google ID token',
        },
      });
      return;
    }

    // Extract Google user info
    // When using linkWithPopup, the UID is the same as the current user's UID
    // We need to get the Google provider data from the token
    const googleEmail = decodedToken.email;
    const googleProviderId = decodedToken.firebase?.identities?.['google.com']?.[0];

    if (!googleEmail) {
      res.status(400).json({
        error: {
          code: 'MISSING_EMAIL',
          message: 'Google account email not found',
        },
      });
      return;
    }

    // Check if this Google email is already linked to another user
    const existingUser = await User.findOne({ 
      googleEmail: googleEmail,
      uid: { $ne: userId } // Exclude current user
    });
    
    if (existingUser) {
      console.log('Google account already in use:', {
        googleEmail,
        currentUserId: userId,
        existingUserId: existingUser.uid,
        existingUserEmail: existingUser.email
      });
      res.status(409).json({
        error: {
          code: 'GOOGLE_ACCOUNT_IN_USE',
          message: 'This Google account is already linked to another user',
        },
      });
      return;
    }

    // Find current user
    const user = await User.findOne({ uid: userId });

    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // Validate that Google email matches user's account email
    if (user.email.toLowerCase() !== googleEmail.toLowerCase()) {
      res.status(400).json({
        error: {
          code: 'EMAIL_MISMATCH',
          message: `The Google account email (${googleEmail}) does not match your account email (${user.email}). Please use a Google account with the same email address.`,
        },
      });
      return;
    }

    // Link Google account
    // Store the Google provider ID if available, otherwise use the user's UID
    user.googleId = googleProviderId || decodedToken.uid;
    user.googleEmail = googleEmail;
    
    // Ensure 'email' provider is in the array (should already be there for email/password accounts)
    if (!user.authProviders.includes('email')) {
      user.authProviders.push('email');
    }
    
    // Add 'google' to authProviders if not already present
    if (!user.authProviders.includes('google')) {
      user.authProviders.push('google');
    }

    // Update profile info from Google if not set
    if (!user.displayName && decodedToken.name) {
      user.displayName = decodedToken.name;
    }
    
    // Update avatar from Google if:
    // 1. No avatar is set, OR
    // 2. Current avatar is a Gravatar (user hasn't uploaded custom avatar)
    const isGravatar = user.avatarUrl?.includes('gravatar.com');
    if (decodedToken.picture && (!user.avatarUrl || isGravatar)) {
      user.avatarUrl = decodedToken.picture;
    }

    user.updatedAt = new Date();
    await user.save();

    // Return updated profile
    res.status(200).json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        googleId: user.googleId,
        googleEmail: user.googleEmail,
        authProviders: user.authProviders,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to link Google account',
        details: errorMessage,
      },
    });
  }
}

/**
 * DELETE /users/me/link-google
 * Unlink Google account from current user profile
 */
export async function unlinkGoogleAccount(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;

    // Find current user
    const user = await User.findOne({ uid: userId });

    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // Check if user has alternative authentication method
    // User must have email auth provider to disconnect Google
    if (!user.authProviders.includes('email') || user.authProviders.length === 1) {
      res.status(400).json({
        error: {
          code: 'CANNOT_DISCONNECT_ONLY_AUTH',
          message: 'Cannot disconnect Google account. You must have a password set before disconnecting.',
        },
      });
      return;
    }

    // Unlink Google account - use $unset to completely remove the fields
    user.googleId = undefined;
    user.googleEmail = undefined;
    user.markModified('googleId');
    user.markModified('googleEmail');
    
    // Remove 'google' from authProviders
    user.authProviders = user.authProviders.filter(provider => provider !== 'google');

    user.updatedAt = new Date();
    await user.save();

    // Return updated profile
    res.status(200).json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        googleId: user.googleId,
        googleEmail: user.googleEmail,
        authProviders: user.authProviders,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to unlink Google account',
        details: errorMessage,
      },
    });
  }
}
