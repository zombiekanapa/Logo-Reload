import React, { useState, useCallback, useEffect } from 'react';
import { generateStyledImage, generateVideoFromImage, checkAndSelectVeoApiKey } from './services/geminiService';
import ImageUpload from './components/ImageUpload';
import GeneratedImageCard from './components/GeneratedImageCard';
import { GeneratedImage, GeneratedVideo } from './types';
import { STYLES, APP_TITLE, APP_DESCRIPTION } from './constants';

// The global type for window.aistudio is now defined in global.d.ts
// declare global {
//   interface Window {
//     aistudio: {
//       hasSelectedApiKey: () => Promise<boolean>;
//       openSelectKey: () => Promise<void>;
//     };
//   }
// }

function App() {
  // Image Stylizer States
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Video Generation States
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [hasSelectedVeoApiKey, setHasSelectedVeoApiKey] = useState<boolean>(false);

  // Check for Veo API key on mount
  useEffect(() => {
    const checkKey = async () => {
      if (typeof window.aistudio !== 'undefined' && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasSelectedVeoApiKey(hasKey);
      } else {
        // If window.aistudio is not available (e.g., local dev), assume key is available via env var
        setHasSelectedVeoApiKey(!!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleImageUpload = useCallback((base64: string, fileName: string) => {
    setUploadedImage(base64);
    setUploadedFileName(fileName);
    setGeneratedImages([]); // Clear previous image generations
    setGeneratedVideo(null); // Clear previous video generation
    setError(null); // Clear previous errors
    setVideoError(null);
  }, []);

  const generateVariations = useCallback(async () => {
    if (!uploadedImage) {
      setError('Please upload an image first.');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedImages([]); // Clear previous results

    for (const style of STYLES) {
      // Initialize a placeholder for the current style to show loading state for each card
      const placeholderImage: GeneratedImage = {
        style,
        imageUrl: '',
        originalFileName: uploadedFileName || 'logo.png' // Provide a fallback filename
      };
      setGeneratedImages(prev => [...prev, placeholderImage]);

      try {
        const generatedImageUrl = await generateStyledImage(uploadedImage, style);

        // Update the specific placeholder with the actual image
        setGeneratedImages(prev => prev.map(img =>
          img.style === style ? { ...img, imageUrl: generatedImageUrl } : img
        ));
      } catch (err) {
        console.error(`Error generating ${style} style:`, err);
        // Update the specific placeholder with an error state
        setGeneratedImages(prev => prev.map(img =>
          img.style === style ? { ...img, imageUrl: 'error' } : img
        ));
        setError((prev) => `${prev ? prev + '\n' : ''}Failed to generate ${style} style: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    setGenerating(false);
  }, [uploadedImage, uploadedFileName]); // Dependency on uploadedImage and uploadedFileName

  const handleSelectVeoApiKey = useCallback(async () => {
    if (typeof window.aistudio !== 'undefined' && window.aistudio.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        setHasSelectedVeoApiKey(true); // Assume success after opening dialog
        setVideoError(null); // Clear any previous API key related error
      } catch (err) {
        console.error('Error opening API key selection dialog:', err);
        setVideoError('Failed to open API key selection. Please try again.');
        setHasSelectedVeoApiKey(false);
      }
    } else {
      setVideoError("API key selection is not available in this environment. Ensure API_KEY is set manually.");
      setHasSelectedVeoApiKey(!!process.env.API_KEY);
    }
  }, []);

  const handleGenerateVideo = useCallback(async () => {
    if (!uploadedImage) {
      setVideoError('Please upload an image first to generate a video.');
      return;
    }
    if (!hasSelectedVeoApiKey) {
      setVideoError('Please select your Veo API key before generating video.');
      return;
    }

    setGeneratingVideo(true);
    setVideoError(null);
    setGeneratedVideo(null); // Clear previous video

    try {
      const videoBlobUrl = await generateVideoFromImage(
        uploadedImage,
        videoPrompt,
        videoAspectRatio,
        uploadedFileName || 'video_from_logo.png'
      );
      setGeneratedVideo({
        prompt: videoPrompt,
        videoUrl: videoBlobUrl,
        aspectRatio: videoAspectRatio,
        originalFileName: uploadedFileName || 'video_from_logo.mp4',
      });
    } catch (err: any) {
      console.error('Video generation error:', err);
      if (err.message === 'VEO_API_KEY_REQUIRED') {
        setVideoError(
          <>
            A Veo API key is required. Please{' '}
            <button
              onClick={handleSelectVeoApiKey}
              className="text-purple-400 hover:underline focus:outline-none"
            >
              select your API key
            </button>
            .
            <p className="mt-2 text-xs text-gray-400">
              For more details on billing, visit{' '}
              <a
                href="https://ai.google.dev/gemini-api/docs/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                ai.google.dev/gemini-api/docs/billing
              </a>
              .
            </p>
          </>
        );
        setHasSelectedVeoApiKey(false); // Reset key status
      } else if (err.message === 'VEO_API_KEY_RESET_REQUIRED') {
        setVideoError(
          <>
            There was an issue with the selected API key. Please{' '}
            <button
              onClick={handleSelectVeoApiKey}
              className="text-purple-400 hover:underline focus:outline-none"
            >
              select your API key again
            </button>
            .
            <p className="mt-2 text-xs text-gray-400">
              For more details on billing, visit{' '}
              <a
                href="https://ai.google.dev/gemini-api/docs/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                ai.google.dev/gemini-api/docs/billing
              </a>
              .
            </p>
          </>
        );
        setHasSelectedVeoApiKey(false); // Reset key status
      } else {
        setVideoError(`Failed to generate video: ${err.message || String(err)}`);
      }
    } finally {
      setGeneratingVideo(false);
    }
  }, [uploadedImage, videoPrompt, videoAspectRatio, uploadedFileName, hasSelectedVeoApiKey, handleSelectVeoApiKey]);

  const handleVideoDownload = useCallback(() => {
    if (generatedVideo?.videoUrl) {
      const link = document.createElement('a');
      link.href = generatedVideo.videoUrl;
      const filename = `${generatedVideo.originalFileName?.split('.').slice(0, -1).join('.') || 'generated_video'}_${generatedVideo.aspectRatio.replace(':', 'x')}.mp4`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(generatedVideo.videoUrl); // Clean up the object URL
    }
  }, [generatedVideo]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="w-full max-w-4xl text-center mb-10 mt-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
          {APP_TITLE}
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          {APP_DESCRIPTION}
        </p>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-8">
        {/* Upload and Control Panel */}
        <section className="lg:w-1/3 flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 lg:sticky lg:top-8 lg:self-start h-fit">
          <h2 className="text-2xl font-bold text-purple-300 mb-6">Your Logo</h2>
          <ImageUpload
            onImageUpload={handleImageUpload}
            isLoading={generating || generatingVideo}
            uploadedImage={uploadedImage}
          />
          {uploadedFileName && (
            <p className="text-sm text-gray-400 mt-2">File: {uploadedFileName}</p>
          )}

          {/* Image Stylizer Controls */}
          <h3 className="text-xl font-bold text-purple-300 mt-8 mb-4">Image Stylizer</h3>
          <button
            onClick={generateVariations}
            disabled={!uploadedImage || generating}
            className={`w-full py-3 px-6 rounded-full text-lg font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50
              ${uploadedImage && !generating
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            aria-label="Generate Image Variations"
          >
            {generating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Images...
              </span>
            ) : (
              'Generate Image Variations'
            )}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-800 bg-opacity-70 text-red-200 rounded-md border border-red-700 w-full text-sm">
              <p className="font-bold mb-2">Image Stylizer Error:</p>
              <pre className="whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {/* Video Generation Controls */}
          <h3 className="text-xl font-bold text-purple-300 mt-12 mb-4">Video Generation (Experimental)</h3>
          <p className="text-sm text-gray-400 mb-4 text-center">
            Describe the video you want to generate. This can take a few minutes.
          </p>
          <textarea
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 mb-4"
            placeholder="e.g., A futuristic DJ performing with the logo animating in the background."
            rows={4}
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            disabled={generatingVideo}
            aria-label="Video Generation Prompt"
          />

          <div className="w-full mb-4">
            <label className="block text-gray-300 text-sm font-semibold mb-2">Aspect Ratio:</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="aspectRatio"
                  value="16:9"
                  checked={videoAspectRatio === '16:9'}
                  onChange={() => setVideoAspectRatio('16:9')}
                  className="form-radio text-purple-600"
                  disabled={generatingVideo}
                />
                <span className="ml-2 text-white">16:9 (Landscape)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="aspectRatio"
                  value="9:16"
                  checked={videoAspectRatio === '9:16'}
                  onChange={() => setVideoAspectRatio('9:16')}
                  className="form-radio text-purple-600"
                  disabled={generatingVideo}
                />
                <span className="ml-2 text-white">9:16 (Portrait)</span>
              </label>
            </div>
          </div>

          {!hasSelectedVeoApiKey ? (
            <div className="w-full text-center">
              <p className="text-yellow-400 text-sm mb-3">
                Veo models require a selected API key for billing.
              </p>
              <button
                onClick={handleSelectVeoApiKey}
                className="w-full py-3 px-6 rounded-full text-lg font-bold transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                aria-label="Select API Key for Video"
              >
                Select API Key for Video
              </button>
              <p className="mt-2 text-xs text-gray-400">
                For more details on billing, visit{' '}
                <a
                  href="https://ai.google.dev/gemini-api/docs/billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-400 hover:text-blue-300"
                >
                  ai.google.dev/gemini-api/docs/billing
                </a>
                .
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerateVideo}
              disabled={!uploadedImage || !videoPrompt || generatingVideo}
              className={`mt-4 w-full py-3 px-6 rounded-full text-lg font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50
                ${uploadedImage && videoPrompt && !generatingVideo
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              aria-label="Generate Video"
            >
              {generatingVideo ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Video... (approx. 1-2 min)
                </span>
              ) : (
                'Generate Video'
              )}
            </button>
          )}

          {videoError && (
            <div className="mt-6 p-4 bg-red-800 bg-opacity-70 text-red-200 rounded-md border border-red-700 w-full text-sm">
              <p className="font-bold mb-2">Video Generation Error:</p>
              <div className="whitespace-pre-wrap">{videoError}</div>
            </div>
          )}
        </section>

        {/* Generated Content Display */}
        <section className="lg:w-2/3 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-purple-300 mb-6 text-center">Generated Content</h2>

          {/* Image Styles */}
          <h3 className="text-xl font-bold text-purple-300 mb-4">Styled Logos</h3>
          {generatedImages.length === 0 && !generating && uploadedImage && (
            <p className="text-gray-400 text-center mb-8">Click 'Generate Image Variations' to see your logo in different styles!</p>
          )}
          {generatedImages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
              {generatedImages.map((img) => (
                <GeneratedImageCard key={img.style} image={img} />
              ))}
            </div>
          )}

          {/* Generated Video */}
          <h3 className="text-xl font-bold text-purple-300 mb-4 mt-8">Generated Video</h3>
          {generatingVideo && !generatedVideo && (
            <div className="text-gray-400 text-center p-4">
              <svg className="animate-spin h-8 w-8 text-purple-400 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Video is generating... This can take a few minutes.
            </div>
          )}
          {generatedVideo && (
            <div className="flex flex-col items-center p-4 bg-gray-700 rounded-lg shadow-md border border-gray-600 w-full max-w-md mx-auto">
              <h4 className="text-lg font-semibold text-purple-400 mb-4 text-center">Your Video</h4>
              <p className="text-sm text-gray-300 mb-2">Prompt: "{generatedVideo.prompt}"</p>
              <video
                src={generatedVideo.videoUrl}
                controls
                className="w-full h-auto rounded-lg border-2 border-gray-500 bg-black mb-4"
                style={{ aspectRatio: generatedVideo.aspectRatio }}
                aria-label="Generated Video"
              >
                Your browser does not support the video tag.
              </video>
              <button
                onClick={handleVideoDownload}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors duration-200 flex items-center justify-center"
                aria-label={`Download video for prompt: ${generatedVideo.prompt}`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download Video
              </button>
            </div>
          )}
          {!generatedVideo && !generatingVideo && uploadedImage && !videoError && (
            <p className="text-gray-400 text-center">Enter a prompt and click 'Generate Video'!</p>
          )}

        </section>
      </main>

      {/* Footer (optional, but good for branding) */}
      <footer className="w-full max-w-4xl text-center mt-12 py-4 border-t border-gray-700 text-gray-500 text-sm">
        Powered by Gemini API and Veo
      </footer>
    </div>
  );
}

export default App;