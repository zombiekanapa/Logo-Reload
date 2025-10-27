
import React, { useState, useCallback } from 'react';
import { generateStyledImage } from './services/geminiService';
import ImageUpload from './components/ImageUpload';
import GeneratedImageCard from './components/GeneratedImageCard';
import { GeneratedImage } from './types';
import { STYLES, APP_TITLE, APP_DESCRIPTION } from './constants';

function App() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((base64: string, fileName: string) => {
    setUploadedImage(base64);
    setUploadedFileName(fileName);
    setGeneratedImages([]); // Clear previous generations
    setError(null); // Clear previous errors
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
      const placeholderImage: GeneratedImage = { style, imageUrl: '' };
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
  }, [uploadedImage]); // Dependency on uploadedImage

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
            isLoading={generating}
            uploadedImage={uploadedImage}
          />
          {uploadedFileName && (
            <p className="text-sm text-gray-400 mt-2">File: {uploadedFileName}</p>
          )}

          <button
            onClick={generateVariations}
            disabled={!uploadedImage || generating}
            className={`mt-8 w-full py-3 px-6 rounded-full text-lg font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50
              ${uploadedImage && !generating
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
          >
            {generating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Variations'
            )}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-800 bg-opacity-70 text-red-200 rounded-md border border-red-700 w-full text-sm">
              <p className="font-bold mb-2">Error:</p>
              <pre className="whitespace-pre-wrap">{error}</pre>
            </div>
          )}
        </section>

        {/* Generated Images Display */}
        <section className="lg:w-2/3 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-purple-300 mb-6 text-center">Generated Styles</h2>
          {generatedImages.length === 0 && !generating && uploadedImage && (
            <p className="text-gray-400 text-center">Click 'Generate Variations' to see your logo in different styles!</p>
          )}
          {generatedImages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {generatedImages.map((img) => (
                <GeneratedImageCard key={img.style} image={img} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer (optional, but good for branding) */}
      <footer className="w-full max-w-4xl text-center mt-12 py-4 border-t border-gray-700 text-gray-500 text-sm">
        Powered by Gemini API
      </footer>
    </div>
  );
}

export default App;
