"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserProfile['role'] | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserProfile['role'] | null>(null);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);
        if (user) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const userData = docSnap.data() as UserProfile;
              setUserRole(userData.role || 'tester');
            } else {
              setUserRole('tester');
            }
          } catch (e) {
            console.error("Auth User Fetch Error", e);
          }
        } else {
          setUserRole(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // If firebase is not initialized, stop loading.
      setLoading(false);
    }
  }, []);

  const value = { user, loading, userRole };

  // Note: We intentionally do NOT block rendering here with a Splash Screen.
  // The 'ZenitSplashAnimation' in the Root/App Layout handles the visual startup sequence.
  // This allows the App Shell to hydrate immediately behind the splash screen.

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
