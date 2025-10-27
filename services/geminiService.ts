import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { ImagePart, TextPart } from '../types';

/**
 * Checks if the user has selected an API key for Veo models and prompts them if not.
 * @returns A new GoogleGenAI instance using the selected API key.
 * @throws An error if API key selection is required and user hasn't selected one.
 */
export async function checkAndSelectVeoApiKey(): Promise<GoogleGenAI> {
  // Check if window.aistudio exists before using it
  if (typeof window.aistudio === 'undefined' || !window.aistudio.hasSelectedApiKey || !window.aistudio.openSelectKey) {
    console.warn('`window.aistudio` or its methods are not available. Ensure you are running in a supported environment.');
    // In a development environment without `window.aistudio`, we'll proceed assuming API_KEY is set.
    // For production, this scenario should ideally not be hit if the environment is configured correctly.
    if (!process.env.API_KEY) {
      throw new Error("API_KEY is not defined in environment variables. `window.aistudio` not available to select key.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  const hasKey = await window.aistudio.hasSelectedApiKey();
  if (!hasKey) {
    throw new Error('VEO_API_KEY_REQUIRED'); // Custom error to signal UI to prompt user
  }

  // Create a new instance right before API call to ensure it uses the most up-to-date API key.
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined in environment variables after selection.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

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

/**
 * Generates a video from an uploaded image using the Veo API.
 * @param base64Image The base64 encoded string of the original image.
 * @param prompt The text prompt for video generation.
 * @param aspectRatio The desired aspect ratio for the video ('16:9' or '9:16').
 * @param originalFileName The original file name for download purposes.
 * @returns A Promise that resolves to a Blob URL of the generated video.
 */
export async function generateVideoFromImage(
  base64Image: string,
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  originalFileName: string,
): Promise<string> {
  const ai = await checkAndSelectVeoApiKey();

  const mimeTypeMatch = base64Image.match(/^data:(image\/(png|jpeg|jpg));base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
  const data = base64Image.split(',')[1]; // Remove "data:image/mimeType;base64," prefix

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: data,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p', // Using 720p as requested, 1080p is also an option
        aspectRatio: aspectRatio,
      },
    });

    // Poll for operation completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error('No video download link found in the response.');
    }

    // Fetch the video bytes using the API key
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch video from download link: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob); // Return a Blob URL for the video
  } catch (err: any) {
    console.error('Video generation error:', err);
    // Check for specific error message as per guidelines for API key issues
    if (err instanceof Error && err.message.includes("Requested entity was not found.")) {
      throw new Error('VEO_API_KEY_RESET_REQUIRED'); // Custom error to signal UI to reset key state
    } else if (err instanceof Error) {
        throw new Error(`Failed to generate video: ${err.message}`);
    } else {
        throw new Error('An unknown error occurred during video generation.');
    }
  }
}