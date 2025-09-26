"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, BookOpen, Clock, Edit, Save, Shield } from 'lucide-react';
import { getSavedPoemsFromFirestore } from '@/lib/firestore';
import { format } from 'date-fns';
import { updateUserProfile } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [poemCount, setPoemCount] = useState<number>(0);
  const [poemsLoading, setPoemsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    if (user) {
      setDisplayName(user.displayName || '');
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

  const handleNameSave = async () => {
    try {
      await updateUserProfile(displayName);
      toast({ title: 'Success', description: 'Your name has been updated.' });
      setIsEditingName(false);
      // Force a reload of the user object to see changes
      await user?.reload(); 
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await updateUserProfile(displayName, file);
      toast({ title: 'Success', description: 'Profile picture updated!' });
      await user?.reload();
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

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
                <div className="relative">
                  <Avatar className="h-24 w-24 mb-4 border-4 border-primary">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback className="text-3xl">{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full mb-4">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePictureUpload}
                  className="hidden"
                  accept="image/png, image/jpeg"
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  Change Photo
                </Button>

                <div className="flex items-center gap-2 mt-4">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                       <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="text-3xl font-headline text-center h-auto p-0 border-0 shadow-none focus-visible:ring-0" />
                       <Button size="icon" variant="ghost" onClick={handleNameSave}><Save className="h-5 w-5" /></Button>
                    </div>
                  ) : (
                     <div className="flex items-center gap-2">
                        <CardTitle className="font-headline text-3xl">{displayName || 'Anonymous Poet'}</CardTitle>
                        <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)}><Edit className="h-5 w-5"/></Button>
                     </div>
                  )}
                </div>

                <CardDescription>{user.email}</CardDescription>
                <Badge variant="secondary" className="mt-4">
                  <Shield className="mr-2 h-4 w-4" />
                  Free User
                </Badge>

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
