import { PenLine } from 'lucide-react';

export function Header() {
  return (
    <header className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center gap-4 text-center">
        <PenLine className="h-10 w-10 text-primary" />
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Muse's Quill
        </h1>
      </div>
      <p className="mt-4 max-w-2xl mx-auto text-center text-lg text-muted-foreground">
        Inspired by Ashleigh, this app transforms your images into beautiful, descriptive poetry.
      </p>
    </header>
  );
}
