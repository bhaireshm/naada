import { DecodedIdToken } from 'firebase-admin/auth';
import { auth } from '../config/firebase';
import { IUser, User } from '../models/User';

/**
 * Service to handle authentication logic, user synchronization, and account linking.
 * Abstracting this logic from middleware and controllers improves testability and readability.
 */
class AuthService {
  /**
   * Verifies a Firebase ID token.
   * @param token The raw ID token string.
   * @returns The decoded token payload.
   */
  async verifyToken(token: string): Promise<DecodedIdToken> {
    return auth.verifyIdToken(token);
  }

  /**
   * Synchronizes a Firebase user with the MongoDB database.
   * Handles user creation, updates, and automatic account linking (Google <-> Email).
   * 
   * @param decodedToken The decoded Firebase token.
   * @returns The synchronized MongoDB User document.
   */
  async syncUserWithFirebase(decodedToken: DecodedIdToken): Promise<IUser> {
    const { uid, email, firebase } = decodedToken;
    const signInProvider = firebase.sign_in_provider;

    // 1. Try to find the user by their Firebase UID (standard case)
    let user = await User.findOne({ uid });

    if (user) {
      // User exists: Update profile if logging in with Google (keep info fresh)
      return this.updateExistingUser(user, decodedToken);
    }

    // 2. User not found by UID: Check for potential account linking scenarios
    if (signInProvider === 'google.com' && email) {
      // A. Check if this Google email is already linked to another user manually
      const linkedUser = await User.findOne({ googleEmail: email });
      if (linkedUser) {
        // Authenticate as the linked user
        return linkedUser;
      }

      // B. Check if a user exists with the same email (Automatic Linking)
      // This happens if a user signed up with Email/Pass and now tries Google Sign-In
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) {
        return this.linkGoogleToExistingUser(existingEmailUser, decodedToken);
      }

      // C. Check by googleId (legacy/edge case)
      const existingGoogleIdUser = await User.findOne({ googleId: uid });
      if (existingGoogleIdUser) {
        return existingGoogleIdUser;
      }
    }

    // 3. User definitely doesn't exist: Create new user
    return this.createNewUser(decodedToken);
  }

  /**
   * Updates an existing user's profile based on Google Sign-In data.
   */
  private async updateExistingUser(user: IUser, token: DecodedIdToken): Promise<IUser> {
    if (token.firebase.sign_in_provider !== 'google.com') {
      return user;
    }

    let updated = false;

    // Add Google provider if missing
    if (!user.authProviders.includes('google')) {
      user.authProviders.push('google');
      updated = true;
    }

    // Fill missing Google info
    if (!user.googleId) {
      user.googleId = token.uid;
      updated = true;
    }
    if (!user.googleEmail && token.email) {
      user.googleEmail = token.email;
      updated = true;
    }

    // Update profile if empty
    if (!user.displayName && token.name) {
      user.displayName = token.name;
      updated = true;
    }
    if (!user.avatarUrl && token.picture) {
      user.avatarUrl = token.picture;
      updated = true;
    }

    if (updated) {
      user.updatedAt = new Date();
      await user.save();
    }

    return user;
  }

  /**
   * Links a Google account to an existing Email/Password user.
   */
  private async linkGoogleToExistingUser(user: IUser, token: DecodedIdToken): Promise<IUser> {
    user.googleId = token.uid;
    user.googleEmail = token.email;

    if (!user.authProviders.includes('google')) {
      user.authProviders.push('google');
    }

    // Fill profile gaps
    if (!user.displayName && token.name) {
      user.displayName = token.name;
    }
    if (!user.avatarUrl && token.picture) {
      user.avatarUrl = token.picture;
    }

    user.updatedAt = new Date();
    await user.save();
    return user;
  }

  /**
   * Creates a new user record from Firebase token data.
   */
  private async createNewUser(token: DecodedIdToken): Promise<IUser> {
    const isGoogle = token.firebase.sign_in_provider === 'google.com';

    const newUser = new User({
      uid: token.uid,
      email: token.email || '',
      displayName: token.name || '',
      avatarUrl: token.picture || '',
      authProviders: [isGoogle ? 'google' : 'email'],
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: true,
      },
    });

    if (isGoogle) {
      newUser.googleId = token.uid;
      newUser.googleEmail = token.email;
    }

    await newUser.save();
    return newUser;
  }

  /**
   * Manual Google Account Linking logic.
   * Used when an authenticated user explicitly connects their Google account.
   */
  async linkGoogleAccount(userId: string, googleIdToken: string): Promise<IUser> {
    // Verify the Google token
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await this.verifyToken(googleIdToken);
    } catch {
      throw new Error('INVALID_TOKEN');
    }

    const googleEmail = decodedToken.email;
    const googleUid = decodedToken.uid;
    const googleProviderId = decodedToken.firebase.identities?.['google.com']?.[0] || googleUid;

    if (!googleEmail) {
      throw new Error('MISSING_EMAIL');
    }

    // Check conflict: Is this Google email used by another user?
    const conflictUser = await User.findOne({
      googleEmail,
      uid: { $ne: userId }
    });

    if (conflictUser) {
      throw new Error('GOOGLE_ACCOUNT_IN_USE');
    }

    // Get current user
    const user = await User.findOne({ uid: userId });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Check email match policy
    if (user.email.toLowerCase() !== googleEmail.toLowerCase()) {
      throw new Error('EMAIL_MISMATCH');
    }

    // Perform Link
    user.googleId = googleProviderId;
    user.googleEmail = googleEmail;

    // Ensure 'email' provider is recorded (sanity check)
    if (!user.authProviders.includes('email')) {
      user.authProviders.push('email');
    }
    // Add 'google' provider
    if (!user.authProviders.includes('google')) {
      user.authProviders.push('google');
    }

    // Update profile gaps
    const isGravatar = user.avatarUrl?.includes('gravatar.com');
    if (!user.displayName && decodedToken.name) user.displayName = decodedToken.name;
    if ((!user.avatarUrl || isGravatar) && decodedToken.picture) user.avatarUrl = decodedToken.picture;

    user.updatedAt = new Date();
    await user.save();

    return user;
  }
}

export const authService = new AuthService();