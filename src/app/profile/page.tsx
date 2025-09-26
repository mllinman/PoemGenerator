"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, BookOpen, Clock } from 'lucide-react';
import { getSavedPoemsFromFirestore, type Poem } from '@/lib/firestore';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [poemCount, setPoemCount] = useState<number>(0);
  const [poemsLoading, setPoemsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    if (user) {
      getSavedPoemsFromFirestore()
        .then(poems => {
          setPoemCount(poems.length);
          setPoemsLoading(false);
        })
        .catch(console.error);
    }
  }, [user, loading, router]);
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name[0];
  }

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-screen-md mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="shadow-lg">
            <CardHeader className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 border-4 border-primary">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback className="text-3xl">{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline text-3xl">{user.displayName || 'Anonymous Poet'}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
                <Separator className="my-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                    <div className="flex flex-col items-center">
                        <h3 className="font-headline text-lg">Poems Saved</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <BookOpen className="h-6 w-6 text-primary" />
                           {poemsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <p className="text-3xl font-bold">{poemCount}</p>}
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <h3 className="font-headline text-lg">Member Since</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-6 w-6 text-primary" />
                            <p className="text-xl font-semibold">
                                {user.metadata.creationTime ? format(new Date(user.metadata.creationTime), 'MMMM yyyy') : 'A little while'}
                            </p>
                        </div>
                    </div>
                </div>
                 <Separator className="my-6" />

                <div className="text-center">
                  <Button onClick={() => router.push('/saved-poems')}>View My Poems</Button>
                </div>

            </CardContent>
        </Card>
      </main>
    </div>
  );
}
