
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Trash2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

type SavedPoem = {
  id: string;
  poem: string;
  imageDataUri: string;
  createdAt: string;
};

const frames = [
  { id: 'none', name: 'None', className: '' },
  { id: 'simple-black', name: 'Simple Black', className: 'border-8 border-black' },
  { id: 'wood', name: 'Wooden Frame', className: 'border-12 border-yellow-800 bg-yellow-950 p-2 shadow-inner' },
  { id: 'gilt', name: 'Gilded Frame', className: 'border-16 border-yellow-600 bg-yellow-700 p-4' },
  { id: 'modern', name: 'Modern', className: 'border-2 border-gray-300 p-1 bg-white' },
];

export default function SavedPoemsPage() {
  const [savedPoems, setSavedPoems] = useState<SavedPoem[]>([]);
  const [selectedPoem, setSelectedPoem] = useState<SavedPoem | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(frames[0].id);
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const poemsFromStorage = JSON.parse(localStorage.getItem('savedPoems') || '[]');
      setSavedPoems(poemsFromStorage);
    } catch (error) {
      console.error('Failed to load saved poems:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load your saved poems.',
      });
    }
  }, [toast]);

  const handleDelete = (poemId: string) => {
    const updatedPoems = savedPoems.filter((p) => p.id !== poemId);
    setSavedPoems(updatedPoems);
    localStorage.setItem('savedPoems', JSON.stringify(updatedPoems));
    toast({
      title: 'Poem Deleted',
      description: 'The poem has been removed from your collection.',
    });
  };

  const openPrintDialog = (poem: SavedPoem) => {
    setSelectedPoem(poem);
    setIsPrintDialogOpen(true);
  };

  const handlePrint = async () => {
    if (!printableRef.current || !selectedPoem) return;

    setIsPrinting(true);
    try {
      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'px', [canvas.width, canvas.height]);
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`poem-${selectedPoem.id}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: 'An unexpected error occurred while creating the PDF.',
      });
    } finally {
      setIsPrinting(false);
      setIsPrintDialogOpen(false);
    }
  };

  const frameClassName = frames.find((f) => f.id === selectedFrame)?.className || '';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Your Saved Poems
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            A collection of your favorite generated poems.
          </p>
        </div>

        {savedPoems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedPoems.map((poem) => (
              <Card key={poem.id} className="shadow-lg flex flex-col">
                <CardContent className="p-6 flex-grow">
                  <div className="aspect-w-3 aspect-h-4 mb-4 relative overflow-hidden rounded-lg">
                    <Image
                      src={poem.imageDataUri}
                      alt="Poem inspiration"
                      layout="fill"
                      className="object-cover"
                    />
                  </div>
                  <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-muted-foreground max-h-40 overflow-auto">
                    {poem.poem}
                  </p>
                </CardContent>
                <Separator />
                <div className="p-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(poem.createdAt), { addSuffix: true })}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openPrintDialog(poem)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(poem.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="font-headline text-xl">No Saved Poems Yet</h3>
            <p className="text-muted-foreground mt-2">
              Go back to the main page to generate and save your first poem.
            </p>
          </div>
        )}
      </main>

      {selectedPoem && (
        <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create a Printable Poem</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="space-y-4">
                <h3 className="font-headline text-lg">Preview</h3>
                <div
                  className={'bg-background p-4 rounded-lg overflow-hidden'
                  }
                >
                  <div ref={printableRef} className={`p-4 ${frameClassName} bg-card text-card-foreground`}>
                      <div className="w-full aspect-[3/4] relative mb-4">
                        <Image
                          src={selectedPoem.imageDataUri}
                          alt="Poem inspiration"
                          layout="fill"
                          className="object-cover"
                        />
                      </div>
                      <p className="whitespace-pre-wrap font-body text-sm leading-relaxed">{selectedPoem.poem}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-headline text-lg">Customization</h3>
                <div>
                  <Label htmlFor="frame-select">Choose a Frame</Label>
                  <Select value={selectedFrame} onValueChange={setSelectedFrame}>
                    <SelectTrigger id="frame-select">
                      <SelectValue placeholder="Select a frame" />
                    </SelectTrigger>
                    <SelectContent>
                      {frames.map((frame) => (
                        <SelectItem key={frame.id} value={frame.id}>
                          {frame.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handlePrint} disabled={isPrinting}>
                {isPrinting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPrinting ? 'Generating PDF...' : 'Download PDF'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

