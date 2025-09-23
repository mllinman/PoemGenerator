import { PenLine, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="flex items-center justify-center gap-4 text-center">
        <PenLine className="h-10 w-10 text-primary" />
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Muse's Quill
        </h1>
      </div>
      <p className="mt-4 max-w-2xl mx-auto text-center text-lg text-muted-foreground">
        Inspired by Ashleigh, this app transforms your images into beautiful, descriptive poetry.
      </p>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <TooltipProvider>
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
        </TooltipProvider>
        <ThemeToggle />
      </div>
    </header>
  );
}

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
