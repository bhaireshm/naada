// Extracted user profile logic following SRP
import { useState, useEffect } from 'react';
import { getUserProfile, UserProfile } from '@/lib/api';
import { User } from 'firebase/auth';

export function useUserProfile(user: User | null) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      getUserProfile()
        .then(setUserProfile)
        .catch((err) => console.error('Failed to fetch user profile:', err));
    } else if (userProfile) {
      // Clear profile when user logs out
      const timeoutId = setTimeout(() => setUserProfile(null), 0);
      return () => clearTimeout(timeoutId);
    }
  }, [user, userProfile]);

  return { userProfile, setUserProfile };
}