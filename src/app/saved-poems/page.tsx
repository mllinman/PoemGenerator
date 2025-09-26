'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Trash2, Download, Edit, Check, ImageIcon, Image as ImageIconPng, AlignCenter, AlignLeft, AlignRight, Plus, Minus } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';

type SavedPoem = Poem & { id: string };
type LayoutType = 'image-above' | 'text-overlay';

const frames = [
  { id: 'none', name: 'None', className: '', textClassName: '' },
  { id: 'simple-black', name: 'Simple Black', className: 'p-2 bg-black', textClassName: 'text-white' },
  { id: 'wood', name: 'Wooden Frame', className: 'p-4 border-[16px] border-amber-800 bg-amber-950 shadow-inner', textClassName: 'text-white' },
  { id: 'gilt', name: 'Gilded Frame', className: 'p-4 border-[20px] border-yellow-500 bg-yellow-700 shadow-xl', textClassName: 'text-white' },
  { id: 'modern', name: 'Modern', className: 'p-1 border-2 border-gray-300 bg-white', textClassName: 'text-black' },
  { id: 'barnwood', name: 'Barnwood', className: 'p-4 border-[24px] border-amber-900/80 bg-amber-950 shadow-lg', textClassName: 'text-white' },
  { id: 'silver', name: 'Elegant Silver', className: 'p-4 border-[12px] border-gray-400 bg-gray-200 shadow-lg', textClassName: 'text-black' },
  { id: 'gallery', name: 'Gallery', className: 'p-8 bg-white', textClassName: 'text-black' }
];

const fonts = [
  { id: 'playfair', name: 'Playfair Display', className: 'font-headline' },
  { id: 'pt_sans', name: 'PT Sans', className: 'font-body' },
  { id: 'dancing_script', name: 'Dancing Script', className: '[&_p]:font-dancing-script' },
  { id: 'courier_prime', name: 'Courier Prime', className: '[&_p]:font-courier-prime' },
  { id: 'merriweather', name: 'Merriweather', className: '[&_p]:font-merriweather' },
  { id: 'lora', name: 'Lora', className: '[&_p]:font-lora' },
  { id: 'caveat', name: 'Caveat', className: '[&_p]:font-caveat' },
];

export default function SavedPoemsPage() {
  const [savedPoems, setSavedPoems] = useState<SavedPoem[]>([]);
  const [selectedPoem, setSelectedPoem] = useState<SavedPoem | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(frames[0].id);
  const [isProcessing, setIsProcessing] = useState<'pdf' | 'png' | false>(false);
  const [editingPoemId, setEditingPoemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [includeImageInPrint, setIncludeImageInPrint] = useState(true);
  const [selectedFont, setSelectedFont] = useState(fonts[0].id);
  const [fontColor, setFontColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [layout, setLayout] = useState<LayoutType>('image-above');
  const [textAlign, setTextAlign] = useState('center');
  const [fontSize, setFontSize] = useState(14);
  const [imageOpacity, setImageOpacity] = useState(50);
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
    setEditingTitle(poem.title);
    const frame = frames.find(f => f.id === selectedFrame) || frames[0];
    const defaultFontColor = frame.textClassName.includes('text-black') ? '#000000' : '#FFFFFF';
    const defaultBgColor = frame.className.includes('bg-white') ? '#FFFFFF' : '#000000';
    setFontColor(defaultFontColor);
    setBackgroundColor(defaultBgColor);
    setIncludeImageInPrint(!!poem.imageDataUri);
    setIsPrintDialogOpen(true);
  };

  const handleDownload = async (format: 'pdf' | 'png') => {
    if (!printableRef.current || !selectedPoem) return;

    setIsProcessing(format);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(printableRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      const imgData = canvas.toDataURL('image/png');

      if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'in',
          format: [8, 10],
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.save(`poem-${selectedPoem.id}.pdf`);
      } else {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `poem-${selectedPoem.id}.png`;
        link.click();
      }
    } catch (error) {
      console.error(`Failed to generate ${format}:`, error);
      toast({
        variant: 'destructive',
        title: `${format.toUpperCase()} Generation Failed`,
        description: `An unexpected error occurred while creating the ${format}.`,
      });
    } finally {
      setIsProcessing(false);
      if (format === 'pdf') {
          setIsPrintDialogOpen(false);
      }
    }
  };

  const frameClassName = frames.find((f) => f.id === selectedFrame)?.className || '';
  const fontClassName = fonts.find((f) => f.id === selectedFont)?.className || '';
  
  const formattedPoem = useMemo(() => {
    if (!selectedPoem) return null;
    return selectedPoem.poem.replace(/\n\n/g, '\n\n');
  }, [selectedPoem]);


  if (loading || !user) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  return (
    <TooltipProvider>
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
                            className="object-contain"
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
                       <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleRename(poem.id, poem.title)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Rename Poem</p></TooltipContent>
                       </Tooltip>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-muted-foreground max-h-40 overflow-auto">
                    {poem.poem}
                  </p>
                </CardContent>
                <Separator />
                <div className="p-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(poem.createdAt), { addSuffix: true })}</span>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPrintDialog(poem)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Download or Print</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(poem.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Delete Poem</p></TooltipContent>
                    </Tooltip>
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
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create a Printable Poem</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
               {/* PREVIEW PANE */}
                <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-4">
                    <div
                        ref={printableRef}
                        className={`aspect-[8/10] w-[350px] overflow-hidden flex flex-col relative ${frameClassName} ${fontClassName}`}
                        style={{ backgroundColor: backgroundColor }}
                    >
                        {layout === 'text-overlay' && includeImageInPrint && selectedPoem.imageDataUri && (
                            <Image
                                src={selectedPoem.imageDataUri}
                                alt="Poem inspiration"
                                layout="fill"
                                className="object-cover"
                                style={{ opacity: imageOpacity / 100 }}
                            />
                        )}

                        {layout === 'image-above' && includeImageInPrint && selectedPoem.imageDataUri && (
                            <div className="w-full h-2/5 relative flex-shrink-0">
                                <Image
                                    src={selectedPoem.imageDataUri}
                                    alt="Poem inspiration"
                                    layout="fill"
                                    className="object-contain"
                                />
                            </div>
                        )}
                        
                        <div
                            className="flex-grow flex flex-col p-6"
                            style={{ 
                                color: fontColor, 
                                textAlign: textAlign as any,
                                justifyContent: layout === 'text-overlay' ? 'center' : 'flex-start'
                            }}
                        >
                            <h3 className="font-headline text-xl mb-4 flex-shrink-0">{editingTitle}</h3>
                            <div className="flex-grow overflow-auto">
                                <p className="whitespace-pre-wrap font-body leading-relaxed" style={{ fontSize: `${fontSize}px` }}>{formattedPoem}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTROLS PANE */}
                <div className="space-y-6 overflow-auto max-h-[60vh] pr-2">
                    <div className="space-y-4">
                        <h3 className="font-headline text-lg">Content</h3>
                        <div className="space-y-2">
                            <Label htmlFor="print-title">Poem Title</Label>
                            <Input
                                id="print-title"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                placeholder="Enter a title"
                            />
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
                    <Separator />
                    <div className="space-y-4">
                        <h3 className="font-headline text-lg">Layout & Style</h3>
                        <div>
                            <Label>Layout</Label>
                            <ToggleGroup type="single" value={layout} onValueChange={(value: LayoutType) => value && setLayout(value)} className="w-full" disabled={!includeImageInPrint}>
                                <ToggleGroupItem value="image-above" className="w-1/2">Image Above</ToggleGroupItem>
                                <ToggleGroupItem value="text-overlay" className="w-1/2">Text Overlay</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        <div>
                          <Label htmlFor="frame-select">Frame Style</Label>
                          <Select value={selectedFrame} onValueChange={setSelectedFrame}>
                              <SelectTrigger id="frame-select">
                                <SelectValue placeholder="Select a frame" />
                              </SelectTrigger>
                              <SelectContent>
                                {frames.map((frame) => (
                                    <SelectItem key={frame.id} value={frame.id}>{frame.name}</SelectItem>
                                ))}
                              </SelectContent>
                          </Select>
                        </div>
                         {layout === 'text-overlay' && includeImageInPrint && (
                            <div className="space-y-2">
                                <Label htmlFor="image-opacity">Image Opacity</Label>
                                <Slider id="image-opacity" value={[imageOpacity]} onValueChange={(val) => setImageOpacity(val[0])} max={100} step={1} />
                            </div>
                        )}
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <h3 className="font-headline text-lg">Typography</h3>
                         <div>
                          <Label htmlFor="font-select">Font Family</Label>
                          <Select value={selectedFont} onValueChange={setSelectedFont}>
                            <SelectTrigger id="font-select">
                              <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                            <SelectContent>
                              {fonts.map((font) => (
                                <SelectItem key={font.id} value={font.id}>{font.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Font Size: {fontSize}px</Label>
                             <div className="flex items-center gap-2">
                                <Button size="icon" variant="outline" onClick={() => setFontSize(s => Math.max(8, s - 1))}><Minus /></Button>
                                <Slider value={[fontSize]} onValueChange={(val) => setFontSize(val[0])} min={8} max={32} step={1} />
                                <Button size="icon" variant="outline" onClick={() => setFontSize(s => Math.min(32, s + 1))}><Plus /></Button>
                            </div>
                        </div>
                        <div>
                            <Label>Text Alignment</Label>
                             <ToggleGroup type="single" value={textAlign} onValueChange={(value) => value && setTextAlign(value)} className="w-full">
                                <ToggleGroupItem value="left" aria-label="Left align" className="w-1/3"><AlignLeft /></ToggleGroupItem>
                                <ToggleGroupItem value="center" aria-label="Center align" className="w-1/3"><AlignCenter /></ToggleGroupItem>
                                <ToggleGroupItem value="right" aria-label="Right align" className="w-1/3"><AlignRight /></ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="font-color">Font Color</Label>
                            <Input id="font-color" type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="p-1 h-10"/>
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="bg-color">Background</Label>
                            <Input id="bg-color" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="p-1 h-10"/>
                          </div>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
               <Button onClick={() => handleDownload('png')} disabled={!!isProcessing}>
                {isProcessing === 'png' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIconPng className="mr-2 h-4 w-4" />}
                {isProcessing === 'png' ? 'Saving PNG...' : 'Download PNG'}
              </Button>
              <Button onClick={() => handleDownload('pdf')} disabled={!!isProcessing}>
                {isProcessing === 'pdf' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing === 'pdf' ? 'Generating PDF...' : 'Download PDF'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </TooltipProvider>
  );
}
