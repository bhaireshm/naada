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
        // For Google sign-in, check if this Google account is already linked to an existing user
        if (decodedToken.firebase?.sign_in_provider === 'google.com') {
          // First check by Google email (for linked accounts)
          const existingUserByGoogleEmail = await User.findOne({ 
            googleEmail: decodedToken.email 
          });
          
          if (existingUserByGoogleEmail) {
            // User has manually linked this Google account - authenticate to that account
            req.userId = existingUserByGoogleEmail.uid;
            user = existingUserByGoogleEmail;
          } else {
            // Check by googleId (for accounts created with Google)
            const existingUserByGoogleId = await User.findOne({ googleId: decodedToken.uid });
            
            if (existingUserByGoogleId) {
              // User created account with Google
              req.userId = existingUserByGoogleId.uid;
              user = existingUserByGoogleId;
            } else {
              // Check if user with same email exists (for automatic linking on first Google sign-in)
              const existingUserByEmail = await User.findOne({ email: decodedToken.email });
              
              if (existingUserByEmail) {
                // This is a user who created account with email/password and is now signing in with Google
                // Automatically link the Google account
                existingUserByEmail.googleId = decodedToken.uid;
                existingUserByEmail.googleEmail = decodedToken.email;
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
                user = existingUserByEmail;
              } else {
                // Create new user record (first time Google sign-in with new email)
                user = new User({
                  uid: decodedToken.uid,
                  email: decodedToken.email || '',
                  displayName: decodedToken.name || '',
                  avatarUrl: decodedToken.picture || '',
                  googleId: decodedToken.uid,
                  googleEmail: decodedToken.email,
                  authProviders: ['google'],
                  preferences: {
                    theme: 'system',
                    language: 'en',
                    notifications: true,
                  },
                });
                await user.save();
              }
            }
          }
        } else {
          // Create new user record for email/password auth
          user = new User({
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            displayName: decodedToken.name || '',
            avatarUrl: decodedToken.picture || '',
            authProviders: ['email'],
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
          
          // Update Google ID and email if not set
          if (!user.googleId) {
            user.googleId = decodedToken.uid;
            updated = true;
          }
          if (!user.googleEmail && decodedToken.email) {
            user.googleEmail = decodedToken.email;
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
