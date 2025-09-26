"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isPro: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isPro: false });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // A more robust check would involve checking a database field
    // that is updated by a Stripe webhook.
    // For now, we'll check the email and a URL param for testing.
    const proStatus = (user?.email === 'admin@example.com') || searchParams.get('pro') === 'true';
    setIsPro(proStatus);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      const proStatus = (user?.email === 'admin@example.com') || searchParams.get('pro') === 'true';
      setIsPro(proStatus);
      setLoading(false);
      if (!user && pathname === '/saved-poems') {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, pathname, user, searchParams]);

  return <AuthContext.Provider value={{ user, loading, isPro }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
