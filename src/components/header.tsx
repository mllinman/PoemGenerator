"use client";

import { PenLine, Bookmark, LogIn, LogOut, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="flex items-center justify-center gap-4 text-center">
        <Link href="/" className="flex items-center gap-4">
          <PenLine className="h-10 w-10 text-primary" />
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Muse Quill
          </h1>
        </Link>
      </div>
      <p className="mt-4 max-w-2xl mx-auto text-center text-lg text-muted-foreground">
        Inspired by Ashleigh, this app transforms your images into beautiful, descriptive poetry.
      </p>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <TooltipProvider>
          {user && (
             <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon">
                    <Link href="/saved-poems">
                      <Bookmark />
                      <span className="sr-only">Saved Poems</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Saved Poems</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {!loading &&
            (user ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut />
                    <span className="sr-only">Log Out</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Log Out</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon">
                    <Link href="/login">
                      <LogIn />
                      <span className="sr-only">Log In</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Log In</p>
                </TooltipContent>
              </Tooltip>
            ))}
        </TooltipProvider>
        <ThemeToggle />
      </div>
    </header>
  );
}
