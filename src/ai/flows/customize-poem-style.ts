'use server';

/**
 * @fileOverview Poem customization flow.
 *
 * This file defines a Genkit flow for customizing the style, length, and tone of a generated poem.
 * It includes functions and types for handling poem customization requests.
 *
 * @exports customizePoemStyle - The main function to customize the poem style.
 * @exports CustomizePoemStyleInput - The input type for the customizePoemStyle function.
 * @exports CustomizePoemStyleOutput - The output type for the customizePoemStyle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the customization options.
const CustomizePoemStyleInputSchema = z.object({
  originalPoem: z.string().describe('The original poem to be customized.'),
  style: z.string().optional().describe('The desired style of the poem (e.g., Shakespearean, modern, free verse).'),
  length: z.string().optional().describe('The desired length of the poem (e.g., short, medium, long).'),
  tone: z.string().optional().describe('The desired tone of the poem (e.g., happy, sad, reflective).'),
  formatting: z.string().optional().describe('The desired formatting of the poem (e.g., compact, standard, spaced out).'),
});

export type CustomizePoemStyleInput = z.infer<typeof CustomizePoemStyleInputSchema>;

// Define the output schema for the customized poem.
const CustomizePoemStyleOutputSchema = z.object({
  customizedPoem: z.string().describe('The customized poem based on the user preferences.'),
});

export type CustomizePoemStyleOutput = z.infer<typeof CustomizePoemStyleOutputSchema>;

// Define the main function to customize the poem style.
export async function customizePoemStyle(input: CustomizePoemStyleInput): Promise<CustomizePoemStyleOutput> {
  return customizePoemStyleFlow(input);
}

// Define the prompt for customizing the poem.
const customizePoemStylePrompt = ai.definePrompt({
  name: 'customizePoemStylePrompt',
  input: { schema: CustomizePoemStyleInputSchema },
  output: { schema: CustomizePoemStyleOutputSchema },
  prompt: `You are an expert poet and editor. You will be given a poem and instructions on how to customize it.

Please generate a new poem that incorporates the user's customization requests. IMPORTANT: The poem must be broken into stanzas, with a single blank line separating each stanza. Ensure proper punctuation, with a single space after commas and periods.

Original Poem:
{{{originalPoem}}}

Customization Instructions:
{{~#if style}}
- Style: {{{style}}}
{{~/if}}
{{~#if length}}
- Length: {{{length}}}
{{~/if}}
{{~#if tone}}
- Tone: {{{tone}}}
{{~/if}}
{{~#if formatting}}
- Formatting: If 'compact', reduce line breaks between stanzas. If 'spaced out', add extra line breaks. For 'standard', use a single blank line between stanzas. The user wants '{{{formatting}}}' formatting.
{{~/if}}`, 
});

// Define the Genkit flow for customizing the poem style.
const customizePoemStyleFlow = ai.defineFlow(
  {
    name: 'customizePoemStyleFlow',
    inputSchema: CustomizePoemStyleInputSchema,
    outputSchema: CustomizePoemStyleOutputSchema,
  },
  async input => {
    const { output } = await customizePoemStylePrompt(input);
    return output!;
  }
);
