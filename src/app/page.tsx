import { Header } from '@/components/header';
import PoemGenerator from '@/components/poem-generator';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow">
        <PoemGenerator />
      </main>
      <footer className="text-center p-6 text-sm text-muted-foreground">
        Crafted with 🤍 by Muse.
      </footer>
    </div>
  );
}
