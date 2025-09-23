"use server";

import {
  generatePoemFromImage,
  type GeneratePoemFromImageInput,
} from "@/ai/flows/generate-poem-from-image";
import {
  customizePoemStyle,
  type CustomizePoemStyleInput,
} from "@/ai/flows/customize-poem-style";

export async function generatePoemAction(input: GeneratePoemFromImageInput) {
  try {
    const result = await generatePoemFromImage(input);
    return { success: true, poem: result.poem };
  } catch (error) {
    console.error("Poem generation error:", error);
    return {
      success: false,
      error: "An unexpected error occurred while generating the poem.",
    };
  }
}

export async function customizePoemAction(input: CustomizePoemStyleInput) {
  try {
    const result = await customizePoemStyle(input);
    return { success: true, poem: result.customizedPoem };
  } catch (error) {
    console.error("Poem customization error:", error);
    return {
      success: false,
      error: "An unexpected error occurred while customizing the poem.",
    };
  }
}
