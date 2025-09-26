"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Copy,
  ImageUp,
  Loader2,
  Share2,
  SlidersHorizontal,
  Save,
  Download,
  Image as ImageIconPng,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Minus,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generatePoemAction, customizePoemAction } from '@/lib/actions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { savePoemToFirestore } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type CustomizationOptions = {
  style: string;
  length: string;
  tone: string;
  formatting: string;
  rhymeScheme: string;
  imagery: string;
};

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

type LayoutType = 'image-above' | 'text-overlay';

export default function PoemGenerator() {
  const { toast } = useToast();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [poem, setPoem] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customization, setCustomization] = useState<CustomizationOptions>({
    style: 'free_verse',
    length: 'medium',
    tone: 'reflective',
    formatting: 'standard',
    rhymeScheme: 'none',
    imagery: 'vivid',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Save Dialog state
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [poemTitle, setPoemTitle] = useState('');
  const [saveWithImage, setSaveWithImage] = useState(true);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Print Dialog state
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(frames[0].id);
  const [isProcessing, setIsProcessing] = useState<'pdf' | 'png' | false>(false);
  const [includeImageInPrint, setIncludeImageInPrint] = useState(true);
  const printableRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState(fonts[0].id);
  const [fontColor, setFontColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');

  // New layout and text controls
  const [layout, setLayout] = useState<LayoutType>('image-above');
  const [textAlign, setTextAlign] = useState('center');
  const [fontSize, setFontSize] = useState(14);
  const [imageOpacity, setImageOpacity] = useState(50);
  
  // Persistence logic
  useEffect(() => {
    // Only run on client after auth has loaded
    if (typeof window === 'undefined' || authLoading) return;

    try {
      const savedState = localStorage.getItem('lastGeneratedPoem');
      if (savedState) {
        const { imageDataUri: savedImage, poem: savedPoem, title: savedTitle } = JSON.parse(savedState);
        if (savedImage) {
          setImageDataUri(savedImage);
          setImagePreviewUrl(savedImage); // Data URI can be used directly as preview
        }
        if (savedPoem) {
          setPoem(savedPoem);
        }
        if (savedTitle) {
          setPoemTitle(savedTitle);
        }
      } else {
        // Load default image if no saved state
        const defaultImage = PlaceHolderImages.find((img) => img.id === 'ashleigh');
        if (defaultImage && !imageDataUri) {
          setImagePreviewUrl(defaultImage.imageUrl);
          const convertUrlToDataUri = async (url: string) => {
            try {
              const response = await fetch(url);
              if (!response.ok) throw new Error('Network response was not ok.');
              const blob = await response.blob();
              const reader = new FileReader();
              reader.onloadend = () => {
                setImageDataUri(reader.result as string);
              };
              reader.readAsDataURL(blob);
            } catch (error) {
              console.error('Failed to load initial image:', error);
            }
          };
          convertUrlToDataUri(defaultImage.imageUrl);
        }
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, [authLoading]);

  // Effect to save state to localStorage whenever poem or image changes
  useEffect(() => {
    if (typeof window === 'undefined' || authLoading) return;
    try {
       if (imageDataUri || poem || poemTitle) {
        const stateToSave = { imageDataUri, poem, title: poemTitle };
        localStorage.setItem('lastGeneratedPoem', JSON.stringify(stateToSave));
      }
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [imageDataUri, poem, poemTitle, authLoading]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImageDataUri(dataUri);
        setPoem(null); // Clear poem when new image is uploaded
        setPoemTitle(''); // Clear title as well
        // Also update localStorage
        try {
          const stateToSave = { imageDataUri: dataUri, poem: null, title: '' };
          localStorage.setItem('lastGeneratedPoem', JSON.stringify(stateToSave));
        } catch (error) {
           console.error("Failed to save state to localStorage", error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageDataUri) {
      toast({
        variant: 'destructive',
        title: 'No Image',
        description: 'Please upload an image first.',
      });
      return;
    }
    setIsGenerating(true);
    setPoem(null);
    const result = await generatePoemAction({ photoDataUri: imageDataUri });
    if (result.success) {
      setPoem(result.poem);
      setPoemTitle('Untitled Poem');
    } else {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: result.error,
      });
    }
    setIsGenerating(false);
  };

  const handleCustomize = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!poem) {
      toast({
        variant: 'destructive',
        title: 'No Poem',
        description: 'Please generate a poem before customizing.',
      });
      return;
    }
    setIsCustomizing(true);
    const result = await customizePoemAction({
      originalPoem: poem,
      ...customization,
    });
    if (result.success) {
      setPoem(result.poem);
    } else {
      toast({
        variant: 'destructive',
        title: 'Customization Failed',
        description: result.error,
      });
    }
    setIsCustomizing(false);
  };

  const handleCustomizationChange =
    (field: keyof CustomizationOptions) => (value: string) => {
      setCustomization((prev) => ({ ...prev, [field]: value }));
    };

  const handleCopy = () => {
    if (!poem) return;
    navigator.clipboard.writeText(poem);
    toast({ title: 'Copied!', description: 'The poem has been copied to your clipboard.' });
  };
  
  const handleShare = async () => {
    if (!poem) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "A Poem from Muse's Quill",
          text: poem,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({
            variant: 'destructive',
            title: 'Share Failed',
            description: 'Could not share the poem. It has been copied to your clipboard instead.',
        });
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleSave = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!poem || !imageDataUri) {
      toast({
        variant: 'destructive',
        title: 'Cannot Save',
        description: 'You must have an image and a poem to save.',
      });
      return;
    }
    setSaveWithImage(true);
    setIsSaveDialogOpen(true);
  };

  const confirmSave = async () => {
    if (!poem || !imageDataUri || !poemTitle) {
      toast({
        variant: 'destructive',
        title: 'Cannot Save',
        description: 'A title is required to save the poem.',
      });
      return;
    }

    try {
      await savePoemToFirestore({
        title: poemTitle,
        poem,
        imageDataUri: saveWithImage ? imageDataUri : '',
        createdAt: new Date().toISOString(),
      });
      toast({
        title: 'Poem Saved',
        description: 'Your poem has been saved to your collection.',
      });
      setIsSaveDialogOpen(false);
      
    } catch (error) {
      console.error('Failed to save poem:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your poem.',
      });
    }
  };

  const handleDownload = async (format: 'pdf' | 'png') => {
    if (!printableRef.current) return;

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
        pdf.save('poem-for-ashleigh.pdf');
      } else {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'poem-for-ashleigh.png';
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

  const openPrintDialog = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!poem || !imageDataUri) {
      toast({
        variant: 'destructive',
        title: 'Cannot Print',
        description: 'You must have an image and a poem to print.',
      });
      return;
    }
    const frame = frames.find(f => f.id === selectedFrame) || frames[0];
    const defaultFontColor = frame.textClassName.includes('text-black') ? '#000000' : '#FFFFFF';
    const defaultBgColor = frame.className.includes('bg-white') ? '#FFFFFF' : '#000000';
    setFontColor(defaultFontColor);
    setBackgroundColor(defaultBgColor);
    setIncludeImageInPrint(true);
    setIsPrintDialogOpen(true);
  };
  
  const frameClassName = frames.find((f) => f.id === selectedFrame)?.className || '';
  const fontClassName = fonts.find((f) => f.id === selectedFont)?.className || '';

  const displayPoem = useMemo(() => {
    if (!poem) return null;
    let formattedPoem = poem;
    switch (customization.formatting) {
      case 'compact':
        formattedPoem = poem.replace(/\n{2,}/g, '\n');
        break;
      case 'spaced_out':
        formattedPoem = poem.replace(/\n{2,}/g, '\n\n\n');
        break;
      case 'standard':
      default:
        // No change needed from original
        break;
    }
    return formattedPoem;
  }, [poem, customization.formatting]);


  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
        <aside className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <ImageUp className="h-6 w-6 text-primary" />
                Inspire the Muse
              </CardTitle>
              <CardDescription>
                Upload an image and let our AI craft a unique poem for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[3/4] w-full relative overflow-hidden rounded-lg border bg-muted">
                {imagePreviewUrl ? (
                  <Image
                    src={imagePreviewUrl}
                    alt="Poem inspiration"
                    fill
                    className="object-contain"
                    data-ai-hint="woman portrait"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageUp className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={!imageDataUri || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isGenerating ? 'Generating...' : 'Generate Poem'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-lg">
            <form onSubmit={handleCustomize}>
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <SlidersHorizontal className="h-6 w-6 text-primary" />
                  Customize
                </CardTitle>
                <CardDescription>
                  Refine the style, length, and tone of your poem.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Select value={customization.style} onValueChange={handleCustomizationChange('style')} name="style">
                    <SelectTrigger id="style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free_verse">Free Verse</SelectItem>
                      <SelectItem value="shakespearean_sonnet">Shakespearean Sonnet</SelectItem>
                      <SelectItem value="haiku">Haiku</SelectItem>
                      <SelectItem value="limerick">Limerick</SelectItem>
                      <SelectItem value="modernist">Modernist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Select value={customization.length} onValueChange={handleCustomizationChange('length')} name="length">
                    <SelectTrigger id="length">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={customization.tone} onValueChange={handleCustomizationChange('tone')} name="tone">
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reflective">Reflective</SelectItem>
                      <SelectItem value="joyful">Joyful</SelectItem>
                      <SelectItem value="melancholic">Melancholic</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="romantic">Romantic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="rhyme-scheme">Rhyme Scheme</Label>
                  <Select value={customization.rhymeScheme} onValueChange={handleCustomizationChange('rhymeScheme')} name="rhymeScheme">
                    <SelectTrigger id="rhyme-scheme">
                      <SelectValue placeholder="Select rhyme scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Free Verse)</SelectItem>
                      <SelectItem value="aabb">AABB</SelectItem>
                      <SelectItem value="abab">ABAB</SelectItem>
                      <SelectItem value="abcb">ABCB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imagery">Imagery</Label>
                  <Select value={customization.imagery} onValueChange={handleCustomizationChange('imagery')} name="imagery">
                    <SelectTrigger id="imagery">
                      <SelectValue placeholder="Select imagery style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivid">Vivid & Concrete</SelectItem>
                      <SelectItem value="abstract">Abstract & Metaphorical</SelectItem>
                      <SelectItem value="nature">Nature-focused</SelectItem>
                      <SelectItem value="emotional">Emotional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Formatting</Label>
                  <RadioGroup
                    value={customization.formatting}
                    onValueChange={handleCustomizationChange('formatting')}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="compact" id="compact" />
                      <Label htmlFor="compact">Compact</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard">Standard</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="spaced_out" id="spaced_out" />
                      <Label htmlFor="spaced_out">Spaced Out</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!poem || isCustomizing || isGenerating}
                  variant="secondary"
                >
                  {isCustomizing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isCustomizing ? 'Refining...' : 'Refine Poem'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </aside>

        <main className="lg:col-span-3">
          <Card className="shadow-lg sticky top-8 min-h-[80vh]">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="font-headline text-3xl">Your Poem</CardTitle>
                <CardDescription>
                  A unique creation, just for you.
                </CardDescription>
              </div>
               <div className="flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleSave} disabled={!poem}>
                            <Save className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Save Poem</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={openPrintDialog} disabled={!poem}>
                           <Download className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Download or Print</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleShare} disabled={!poem}>
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Share Poem</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!poem}>
                            <Copy className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Copy Poem</p></TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="prose prose-lg text-foreground max-w-none min-h-[60vh]">
                {isGenerating ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-1/2" />
                    <div className="pt-4" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-4/6" />
                  </div>
                ) : displayPoem ? (
                  <p className="whitespace-pre-wrap font-body text-base leading-relaxed">{displayPoem}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <p className="font-headline text-xl">Your poem will appear here.</p>
                    <p>Click "Generate Poem" to begin the magic.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Your Poem</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="poem-title" className="text-right">Title</Label>
                <Input
                id="poem-title"
                value={poemTitle}
                onChange={(e) => setPoemTitle(e.target.value)}
                placeholder="My beautiful poem"
                className="col-span-3"
                />
            </div>
            <div className="flex items-center space-x-2 justify-center">
                <Checkbox
                    id="save-with-image"
                    checked={saveWithImage}
                    onCheckedChange={(checked) => setSaveWithImage(Boolean(checked))}
                />
                <Label htmlFor="save-with-image" className="cursor-pointer">Include inspiration image</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={confirmSave}>Save to Collection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {poem && imageDataUri && (
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
                        {layout === 'text-overlay' && includeImageInPrint && (
                            <Image
                                src={imageDataUri}
                                alt="Poem inspiration"
                                layout="fill"
                                className="object-cover"
                                style={{ opacity: imageOpacity / 100 }}
                            />
                        )}

                        {layout === 'image-above' && includeImageInPrint && (
                            <div className="w-full h-2/5 relative flex-shrink-0">
                                <Image
                                    src={imageDataUri}
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
                            <h3 className="font-headline text-xl mb-4 flex-shrink-0">{poemTitle}</h3>
                            <div className="flex-grow overflow-auto">
                                <p className="whitespace-pre-wrap font-body leading-relaxed" style={{ fontSize: `${fontSize}px` }}>{displayPoem}</p>
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
                                value={poemTitle}
                                onChange={(e) => setPoemTitle(e.target.value)}
                                placeholder="Enter a title"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="include-image-main"
                                checked={includeImageInPrint}
                                onCheckedChange={(checked) => setIncludeImageInPrint(Boolean(checked))}
                                disabled={!imageDataUri}
                            />
                            <Label htmlFor="include-image-main">Include Image</Label>
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
                            </Trigger>
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
    </TooltipProvider>
  );
}
