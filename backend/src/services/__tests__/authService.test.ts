import { auth } from '../../config/firebase';
import { User } from '../../models/User';
import { authService } from '../authService';

// Mock dependencies
jest.mock('../../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

jest.mock('../../models/User');

describe('AuthService', () => {
  const mockToken = 'mock-id-token';
  const mockDecodedToken: any = {
    uid: 'firebase-uid-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    firebase: {
      sign_in_provider: 'password',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('should verify the token using firebase admin', async () => {
      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);

      const result = await authService.verifyToken(mockToken);

      expect(auth.verifyIdToken).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockDecodedToken);
    });

    it('should throw an error if verification fails', async () => {
      const error = new Error('Invalid token');
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);

      await expect(authService.verifyToken(mockToken)).rejects.toThrow(error);
    });
  });

  describe('syncUserWithFirebase', () => {
    it('should return existing user if found by uid', async () => {
      const mockUser = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        authProviders: ['email'],
        save: jest.fn(),
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.syncUserWithFirebase(mockDecodedToken);

      expect(User.findOne).toHaveBeenCalledWith({ uid: mockDecodedToken.uid });
      expect(result).toEqual(mockUser);
    });

    it('should create a new user if not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      const saveMock = jest.fn();
      (User as any).mockImplementation(() => ({
        save: saveMock,
        ...mockDecodedToken,
        authProviders: ['email'],
        preferences: { theme: 'system' }
      }));

      await authService.syncUserWithFirebase(mockDecodedToken);

      expect(User.findOne).toHaveBeenCalledWith({ uid: mockDecodedToken.uid });
      expect(User).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();
    });

    it('should link Google account if email matches existing user', async () => {
      const googleToken = {
        ...mockDecodedToken,
        firebase: { sign_in_provider: 'google.com' },
      };
      const existingUser = {
        uid: 'original-uid',
        email: 'test@example.com',
        authProviders: ['email'],
        save: jest.fn(),
        updatedAt: new Date(),
      };

      // First call (by UID) returns null
      // Second call (by email) returns existing user
      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null) // Check linked manually
        .mockResolvedValueOnce(existingUser); // Check by email

      const result = await authService.syncUserWithFirebase(googleToken);

      expect(result).toBeDefined();
      // Should handle saving
      expect(existingUser.save).toHaveBeenCalled();
    });
  });

  describe('linkGoogleAccount', () => {
    it('should successfully link a google account', async () => {
      const userId = 'user-123';
      const googleIdToken = 'google-token';
      const decodedGoogle = {
        uid: 'google-uid-123',
        email: 'test@example.com',
        name: 'Google User',
        picture: 'google-pic.jpg',
        firebase: {
          identities: { 'google.com': ['google-uid-123'] }
        }
      };

      (auth.verifyIdToken as jest.Mock).mockResolvedValue(decodedGoogle);

      const mockUser = {
        uid: userId,
        email: 'test@example.com',
        authProviders: ['email'],
        save: jest.fn(),
      };

      // 1. Check conflict -> null
      // 2. Find current user -> mockUser
      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      const result = await authService.linkGoogleAccount(userId, googleIdToken);

      expect(auth.verifyIdToken).toHaveBeenCalledWith(googleIdToken);
      expect(result.authProviders).toContain('google');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw if google email is already in use by another provider', async () => {
      const userId = 'user-123';
      const googleIdToken = 'google-token';

      (auth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'google-uid-123',
        email: 'other@example.com'
      });

      // Check conflict -> returns a user
      (User.findOne as jest.Mock).mockResolvedValue({ uid: 'other-user' });

      await expect(authService.linkGoogleAccount(userId, googleIdToken))
        .rejects.toThrow('GOOGLE_ACCOUNT_IN_USE');
    });
  });
});
