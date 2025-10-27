
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { ImagePart, TextPart } from '../types';

/**
 * Generates a styled image using the Gemini API.
 * @param base64Image The base64 encoded string of the original image.
 * @param stylePrompt The text prompt describing the desired style.
 * @returns A Promise that resolves to the base64 encoded string of the generated image.
 */
export async function generateStyledImage(base64Image: string, stylePrompt: string): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Assuming PNG for simplicity, could be derived from input base64 string
  const mimeTypeMatch = base64Image.match(/^data:(image\/(png|jpeg|jpg));base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
  const data = base64Image.split(',')[1]; // Remove "data:image/mimeType;base64," prefix

  const imagePart: ImagePart = {
    inlineData: {
      mimeType: mimeType,
      data: data,
    },
  };

  const textPart: TextPart = {
    text: `Reimagine this DJ logo in a ${stylePrompt} style. Keep the core elements of the logo recognizable but adapt its aesthetic to fit the chosen style. Output only the image.`,
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const generatedImagePart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (generatedImagePart && generatedImagePart.mimeType && generatedImagePart.data) {
      return `data:${generatedImagePart.mimeType};base64,${generatedImagePart.data}`;
    } else {
      throw new Error('No image data found in the response.');
    }
  } catch (error) {
    console.error('Error generating styled image:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    } else {
        throw new Error('An unknown error occurred during image generation.');
    }
  }
}
