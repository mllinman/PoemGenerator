"use client";

import { useState } from 'react';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
} from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { PenLine, UserCheck, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.push('/saved-poems');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign-in Failed',
        description: error.message,
      });
    }
    setIsLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSigningUp) {
        await signUpWithEmail(email, password);
        toast({
          title: 'Sign Up Successful',
          description: 'Please check your email for verification.',
        });
        router.push('/');
      } else {
        await signInWithEmail(email, password);
        router.push('/saved-poems');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: isSigningUp ? 'Sign-up Failed' : 'Sign-in Failed',
        description: error.message,
      });
    }
    setIsLoading(false);
  };
  
  const handleTestUserSignIn = async (userType: 'guest' | 'admin') => {
    setIsLoading(true);
    const isGuest = userType === 'guest';
    const testEmail = isGuest ? 'test@example.com' : 'admin@example.com';
    const testPassword = isGuest ? 'password' : 'adminpassword';
    const title = isGuest ? 'Guest' : 'Admin';

    try {
      await signInWithEmail(testEmail, testPassword);
      router.push('/saved-poems');
    } catch (error: any) {
      // If user not found or invalid credentials for a new test user, create the user, then sign in again.
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          // Attempt to sign up first.
          await signUpWithEmail(testEmail, testPassword);
          // Then sign in after successful sign up.
          await signInWithEmail(testEmail, testPassword);
          router.push('/saved-poems');
        } catch (signupError: any) {
          // Handle cases where sign-up fails (e.g., email already exists but with different credentials)
           if (signupError.code !== 'auth/email-already-in-use') {
             toast({
              variant: 'destructive',
              title: `${title} Sign-in Failed`,
              description: `Could not create a ${userType} account. ${signupError.message}`,
            });
           } else {
            // If email exists, it means we can just sign in.
            try {
                await signInWithEmail(testEmail, testPassword);
                router.push('/saved-poems');
            } catch (finalSignInError: any) {
                 toast({
                    variant: 'destructive',
                    title: `${title} Sign-in Failed`,
                    description: finalSignInError.message,
                });
            }
           }
        }
      } else {
        // Handle other sign-in errors
        toast({
          variant: 'destructive',
          title: `${title} Sign-in Failed`,
          description: error.message,
        });
      }
    }
    setIsLoading(false);
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <div className="flex items-center justify-center gap-4 text-center mb-4">
                <PenLine className="h-10 w-10 text-primary" />
                <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Muse
                </h1>
            </div>
            <p className="text-muted-foreground">
                {isSigningUp ? 'Create an account to save your poems' : 'Sign in to access your saved poems'}
            </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8">
            <div className="flex flex-col space-y-2 mb-6">
                <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleTestUserSignIn('guest')}
                    disabled={isLoading}
                >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Continue as Guest
                </Button>
                <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleTestUserSignIn('admin')}
                    disabled={isLoading}
                >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Sign in as Admin
                </Button>
            </div>


            <div className="relative mb-6">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">OR</span>
            </div>


            <form onSubmit={handleEmailAuth} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Loading...' : isSigningUp ? 'Sign Up' : 'Sign In'}
                </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                <button
                    onClick={() => setIsSigningUp(!isSigningUp)}
                    className="underline"
                >
                    {isSigningUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
            </div>
            
            <Separator className="my-6" />

            <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
            >
                <svg className="mr-2 h-4 w-4" role="img" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
            </Button>

        </div>

      </div>
    </div>
  );
}
