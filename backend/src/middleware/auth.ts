import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { User } from '../models/User';

/**
 * Extended Request interface to include userId
 */
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Authentication middleware to verify Firebase ID tokens
 * Extracts token from Authorization header, verifies it using Firebase Admin SDK,
 * and attaches userId to request object on success
 */
export async function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header or query parameter
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract the token (remove 'Bearer ' prefix)
      token = authHeader.substring(7);
    } else if (queryToken) {
      // Use token from query parameter (for audio streaming)
      token = queryToken;
    }

    if (!token) {
      res.status(401).json({
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'No authentication token provided',
        },
      });
      return;
    }

    // Verify token using Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);

    // Attach userId to request object
    req.userId = decodedToken.uid;

    // Ensure user exists in database (create if not exists)
    try {
      let user = await User.findOne({ uid: decodedToken.uid });
      
      if (!user) {
        // Check if user with same email exists (for Google sign-in linking)
        const existingUserByEmail = await User.findOne({ email: decodedToken.email });
        
        if (existingUserByEmail && decodedToken.firebase?.sign_in_provider === 'google.com') {
          // Link Google account to existing email account
          existingUserByEmail.googleId = decodedToken.uid;
          if (!existingUserByEmail.authProviders.includes('google')) {
            existingUserByEmail.authProviders.push('google');
          }
          // Update profile info from Google if not set
          if (!existingUserByEmail.displayName && decodedToken.name) {
            existingUserByEmail.displayName = decodedToken.name;
          }
          if (!existingUserByEmail.avatarUrl && decodedToken.picture) {
            existingUserByEmail.avatarUrl = decodedToken.picture;
          }
          existingUserByEmail.updatedAt = new Date();
          await existingUserByEmail.save();
          
          // Use the existing user's UID for this request
          req.userId = existingUserByEmail.uid;
        } else {
          // Create new user record
          const authProvider = decodedToken.firebase?.sign_in_provider === 'google.com' ? 'google' : 'email';
          user = new User({
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            displayName: decodedToken.name || '',
            avatarUrl: decodedToken.picture || '',
            googleId: authProvider === 'google' ? decodedToken.uid : undefined,
            authProviders: [authProvider],
            preferences: {
              theme: 'system',
              language: 'en',
              notifications: true,
            },
          });
          await user.save();
        }
      } else {
        // Update user info from Google if signing in with Google
        if (decodedToken.firebase?.sign_in_provider === 'google.com') {
          let updated = false;
          
          // Add Google to auth providers if not already there
          if (!user.authProviders.includes('google')) {
            user.authProviders.push('google');
            updated = true;
          }
          
          // Update Google ID if not set
          if (!user.googleId) {
            user.googleId = decodedToken.uid;
            updated = true;
          }
          
          // Update profile info from Google if not set
          if (!user.displayName && decodedToken.name) {
            user.displayName = decodedToken.name;
            updated = true;
          }
          if (!user.avatarUrl && decodedToken.picture) {
            user.avatarUrl = decodedToken.picture;
            updated = true;
          }
          
          if (updated) {
            user.updatedAt = new Date();
            await user.save();
          }
        }
      }
    } catch (dbError) {
      // Log error but don't block the request
      console.error('Error ensuring user exists:', dbError);
    }

    // Proceed to next middleware/handler
    next();
  } catch (error) {
    // Handle token verification errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(401).json({
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid or expired authentication token',
        details: errorMessage,
      },
    });
  }
}
