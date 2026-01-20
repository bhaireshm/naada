import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/authService';

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

    if (authHeader?.startsWith('Bearer ')) {
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

    // Verify token and sync user with backend
    const decodedToken = await authService.verifyToken(token);

    // Ensure user exists in database (create/update/link)
    // and get the effective user ID (might differ from token ID if accounts are linked)
    const user = await authService.syncUserWithFirebase(decodedToken);

    // Attach the *effective* database User UID to the request
    // This handles cases where a Google login maps to an existing Email user
    req.userId = user.uid;

    // Proceed to next middleware/handler
    next();
  } catch (error) {
    // Handle token verification errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log internal sync errors but don't expose stack to client
    console.error('Auth Middleware Error:', error);

    res.status(401).json({
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid or expired authentication token',
        details: errorMessage,
      },
    });
  }
}
