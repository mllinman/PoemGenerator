"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Copy,
  ImageUp,
  Loader2,
  Share2,
  SlidersHorizontal,
  Save,
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

type CustomizationOptions = {
  style: string;
  length: string;
  tone: string;
};

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
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const defaultImage = PlaceHolderImages.find((img) => img.id === 'ashleigh');
    if (defaultImage) {
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
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load the default image.',
          });
        }
      };
      convertUrlToDataUri(defaultImage.imageUrl);
    }
  }, [toast]);

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
        setImageDataUri(reader.result as string);
        setPoem(null);
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
          title: 'A Poem from Muse\'s Quill',
          text: poem,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };

  const handleSave = () => {
    if (!poem || !imageDataUri) {
      toast({
        variant: 'destructive',
        title: 'Cannot Save',
        description: 'You must have an image and a poem to save.',
      });
      return;
    }

    try {
      const savedPoems = JSON.parse(localStorage.getItem('savedPoems') || '[]');
      const newPoem = {
        id: Date.now().toString(),
        poem,
        imageDataUri,
        createdAt: new Date().toISOString(),
      };
      savedPoems.unshift(newPoem);
      localStorage.setItem('savedPoems', JSON.stringify(savedPoems));
      toast({
        title: 'Poem Saved',
        description: 'Your poem has been saved successfully.',
      });
    } catch (error) {
      console.error('Failed to save poem:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your poem.',
      });
    }
  };


  return (
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
                  className="object-cover"
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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleSave} disabled={!poem} aria-label="Save poem">
                <Save className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} disabled={!poem} aria-label="Share poem">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!poem} aria-label="Copy poem">
                <Copy className="h-5 w-5" />
              </Button>
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
              ) : poem ? (
                <p className="whitespace-pre-wrap font-body text-base leading-relaxed">{poem}</p>
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
  );
