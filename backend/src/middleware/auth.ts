import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

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
