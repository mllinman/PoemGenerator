'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Trash2, Download, Edit, Check, ImageIcon } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import {
  getSavedPoemsFromFirestore,
  deletePoemFromFirestore,
  updatePoemTitleInFirestore,
  type Poem,
} from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';

type SavedPoem = Poem & { id: string };

const frames = [
  { id: 'none', name: 'None', className: '', textClassName: '' },
  { id: 'simple-black', name: 'Simple Black', className: 'p-2 bg-black', textClassName: '' },
  { id: 'wood', name: 'Wooden Frame', className: 'border-[16px] border-yellow-800 bg-yellow-950 p-4 shadow-inner', textClassName: '' },
  { id: 'gilt', name: 'Gilded Frame', className: 'border-[20px] border-yellow-500 bg-yellow-700 p-4 shadow-xl', textClassName: '' },
  { id: 'modern', name: 'Modern', className: 'border-2 border-gray-300 p-1 bg-white', textClassName: 'text-black' },
  { id: 'barnwood', name: 'Barnwood', className: 'border-[24px] border-amber-900/80 bg-amber-950 p-4 shadow-lg', textClassName: '' },
  { id: 'silver', name: 'Elegant Silver', className: 'border-[12px] border-gray-400 bg-gray-200 p-4 shadow-lg', textClassName: 'text-black' },
  { id: 'gallery', name: 'Gallery', className: 'p-8 bg-white', textClassName: 'text-black' }
];

export default function SavedPoemsPage() {
  const [savedPoems, setSavedPoems] = useState<SavedPoem[]>([]);
  const [selectedPoem, setSelectedPoem] = useState<SavedPoem | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(frames[0].id);
  const [isPrinting, setIsPrinting] = useState(false);
  const [editingPoemId, setEditingPoemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [includeImageInPrint, setIncludeImageInPrint] = useState(true);
  const { toast } = useToast();
  const printableRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchPoems = async () => {
      try {
        const poemsFromFirestore = await getSavedPoemsFromFirestore();
        setSavedPoems(poemsFromFirestore as SavedPoem[]);
      } catch (error) {
        console.error('Failed to load saved poems:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load your saved poems.',
        });
      }
    };

    fetchPoems();
  }, [user, loading, router, toast]);

  const handleDelete = async (poemId: string) => {
    try {
      await deletePoemFromFirestore(poemId);
      setSavedPoems(savedPoems.filter((p) => p.id !== poemId));
      toast({
        title: 'Poem Deleted',
        description: 'The poem has been removed from your collection.',
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete the poem.',
      });
    }
  };

  const handleRename = (poemId: string, currentTitle: string) => {
    setEditingPoemId(poemId);
    setEditingTitle(currentTitle);
  };

  const handleTitleChange = async (poemId: string) => {
    try {
        await updatePoemTitleInFirestore(poemId, editingTitle);
        setSavedPoems(savedPoems.map((p) =>
            p.id === poemId ? { ...p, title: editingTitle } : p
        ));
        setEditingPoemId(null);
        setEditingTitle('');
        toast({
            title: 'Poem Renamed',
            description: 'The poem title has been updated.',
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not rename the poem.',
        });
    }
  };

  const openPrintDialog = (poem: SavedPoem) => {
    setSelectedPoem(poem);
    setIncludeImageInPrint(!!poem.imageDataUri);
    setIsPrintDialogOpen(true);
  };

  const handlePrint = async () => {
    if (!printableRef.current || !selectedPoem) return;

    setIsPrinting(true);
    try {
      const canvas = await html2canvas(printableRef.current, {
        scale: 3, // Increased scale for better resolution on PDF
        useCORS: true,
        backgroundColor: null,
      });
      const imgData = canvas.toDataURL('image/png');
      
      // Create a new jsPDF instance with 8x10 inch dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [8, 10]
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
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
  const frameTextClassName = frames.find((f) => f.id === selectedFrame)?.textClassName || '';
  
  const formattedPoem = useMemo(() => {
    if (!selectedPoem) return null;
    return selectedPoem.poem;
  }, [selectedPoem]);


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
                  <div className="aspect-w-4 aspect-h-3 mb-4 relative overflow-hidden rounded-lg bg-muted">
                    {poem.imageDataUri ? (
                        <Image
                            src={poem.imageDataUri}
                            alt="Poem inspiration"
                            layout="fill"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <ImageIcon className="h-12 w-12" />
                            <p className="mt-2 text-sm">No image saved</p>
                        </div>
                    )}
                  </div>
                  {editingPoemId === poem.id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTitleChange(poem.id)}
                        className="h-8"
                      />
                      <Button size="icon" className="h-8 w-8" onClick={() => handleTitleChange(poem.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                       <h3 className="font-headline text-xl flex-grow truncate">{poem.title}</h3>
                       <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleRename(poem.id, poem.title)}>
                          <Edit className="h-4 w-4" />
                       </Button>
                    </div>
                  )}
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
                  <div ref={printableRef} className={`p-4 ${frameClassName} bg-card text-card-foreground aspect-[4/5] w-[400px] flex flex-col`}>
                      {includeImageInPrint && selectedPoem.imageDataUri && (
                        <div className="w-full aspect-square relative mb-4">
                          <Image
                            src={selectedPoem.imageDataUri}
                            alt="Poem inspiration"
                            layout="fill"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className={`flex-grow flex flex-col justify-center ${frameTextClassName}`}>
                        <h3 className="font-headline text-xl mb-4 text-center">{selectedPoem.title}</h3>
                        <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-center">{formattedPoem}</p>
                      </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="font-headline text-lg mb-4">Customization</h3>
                  <div className="space-y-4">
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
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="include-image-print"
                            checked={includeImageInPrint}
                            onCheckedChange={(checked) => setIncludeImageInPrint(Boolean(checked))}
                            disabled={!selectedPoem.imageDataUri}
                        />
                        <Label htmlFor="include-image-print">Include Image</Label>
                    </div>
                  </div>
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
