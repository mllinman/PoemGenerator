'use server';
/**
 * @fileOverview Generates a poem based on the visual elements and mood detected in an image.
 *
 * - generatePoemFromImage - A function that handles the poem generation process.
 * - GeneratePoemFromImageInput - The input type for the generatePoemFromImage function.
 * - GeneratePoemFromImageOutput - The return type for the generatePoemFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePoemFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo to generate a poem from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
  style: z.string().optional().describe('The style of the poem (e.g., Shakespearean, free verse).'),
  length: z.string().optional().describe('The desired length of the poem (e.g., short, medium, long).'),
  tone: z.string().optional().describe('The tone of the poem (e.g., happy, sad, reflective).'),
});
export type GeneratePoemFromImageInput = z.infer<typeof GeneratePoemFromImageInputSchema>;

const GeneratePoemFromImageOutputSchema = z.object({
  poem: z.string().describe('The generated poem.'),
});
export type GeneratePoemFromImageOutput = z.infer<typeof GeneratePoemFromImageOutputSchema>;

export async function generatePoemFromImage(input: GeneratePoemFromImageInput): Promise<GeneratePoemFromImageOutput> {
  return generatePoemFromImageFlow(input);
}

const generatePoemPrompt = ai.definePrompt({
  name: 'generatePoemPrompt',
  input: {schema: GeneratePoemFromImageInputSchema},
  output: {schema: GeneratePoemFromImageOutputSchema},
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are a skilled poet with a rich and varied vocabulary, capable of creating unique and insightful poems from images.

  Analyze the image provided and write a poem that is a fresh and insightful interpretation. Use rich, evocative language and avoid clichés or generic descriptions.
  
  IMPORTANT: The poem must be broken into stanzas. Stanzas should be separated by a single blank line. Ensure proper punctuation, with a single space after commas and periods. The poem must be complete and finished.

  Image: {{media url=photoDataUri}}

  {{~#if style}}Style: {{{style}}}{{/if}}
  {{~#if length}}Length: {{{length}}}{{/if}}
  {{~#if tone}}Tone: {{{tone}}}{{/if}}

  Write a complete poem.`,
});

const generatePoemFromImageFlow = ai.defineFlow(
  {
    name: 'generatePoemFromImageFlow',
    inputSchema: GeneratePoemFromImageInputSchema,
    outputSchema: GeneratePoemFromImageOutputSchema,
  },
  async input => {
    const {output} = await generatePoemPrompt(input);
    return output!;
  }
);
