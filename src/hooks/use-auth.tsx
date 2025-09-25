"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsPro(user?.email === 'admin@example.com');
      setLoading(false);
      if (!user && pathname === '/saved-poems') {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  return <AuthContext.Provider value={{ user, loading, isPro }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
