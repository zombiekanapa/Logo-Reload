
import React, { useCallback, useState } from 'react';
import { GeneratedImage } from '../types';

interface GeneratedImageCardProps {
  image: GeneratedImage;
}

const GeneratedImageCard: React.FC<GeneratedImageCardProps> = ({ image }) => {
  // State to manage the selected download format
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg' | 'bmp'>('png');

  const handleFormatChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setDownloadFormat(event.target.value as 'png' | 'jpeg' | 'bmp');
  }, []);

  const handleDownload = useCallback(() => {
    if (!image.imageUrl || image.imageUrl === 'error' || !image.originalFileName) {
      console.error('Cannot download: Image URL or original file name is missing.');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous'; // To handle potential CORS issues if images are from external sources
    img.src = image.imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get 2D context from canvas.');
        return;
      }
      ctx.drawImage(img, 0, 0);

      let targetMimeType: string;
      let extension: string;
      let dataUrl: string;

      switch (downloadFormat) {
        case 'jpeg':
          targetMimeType = 'image/jpeg';
          extension = 'jpg';
          dataUrl = canvas.toDataURL(targetMimeType, 0.9); // 0.9 quality for JPEG
          break;
        case 'bmp':
          // Browsers typically don't support image/bmp for canvas.toDataURL
          // It will often fallback to PNG. We'll set PNG as the target mime
          // but label it as BMP for the user's intent, with an implicit fallback.
          console.warn('BMP format conversion is not natively supported by canvas.toDataURL. Defaulting to PNG.');
          targetMimeType = 'image/png';
          extension = 'bmp'; // Still use .bmp extension if requested, but content will be PNG
          dataUrl = canvas.toDataURL(targetMimeType);
          break;
        case 'png':
        default:
          targetMimeType = 'image/png';
          extension = 'png';
          dataUrl = canvas.toDataURL(targetMimeType);
          break;
      }

      const link = document.createElement('a');
      link.href = dataUrl;

      // Construct a meaningful filename
      const baseName = image.originalFileName.split('.').slice(0, -1).join('.'); // Remove original extension
      const filename = `${baseName}_${image.style}.${extension}`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    img.onerror = (e) => {
      console.error('Error loading image for conversion:', e);
    };
  }, [image.imageUrl, image.style, image.originalFileName, downloadFormat]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-700 rounded-lg shadow-md border border-gray-600">
      <h3 className="text-lg font-semibold text-purple-400 mb-4 text-center">
        {image.style} Style
      </h3>
      <div className="relative w-48 h-48 overflow-hidden rounded-lg border-2 border-gray-500 bg-gray-800 flex items-center justify-center mb-4">
        {image.imageUrl === 'error' ? (
          <div className="text-red-400 text-sm text-center p-2">
            Failed to load image for {image.style}
          </div>
        ) : image.imageUrl ? (
          <img
            src={image.imageUrl}
            alt={`${image.style} DJ Logo`}
            className="object-contain w-full h-full p-1"
          />
        ) : (
          <div className="text-gray-400 text-sm animate-pulse">Loading...</div>
        )}
      </div>
      {image.imageUrl && image.imageUrl !== 'error' && image.originalFileName && (
        <div className="flex flex-col items-center justify-center gap-2">
          <label htmlFor={`download-format-${image.style}`} className="sr-only">
            Select download format for {image.style} style
          </label>
          <select
            id={`download-format-${image.style}`}
            value={downloadFormat}
            onChange={handleFormatChange}
            className="p-2 bg-gray-600 border border-gray-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Select download format"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
            <option value="bmp">BMP (may fallback to PNG)</option>
          </select>
          <button
            onClick={handleDownload}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors duration-200 flex items-center justify-center"
            aria-label={`Download ${image.style} style as ${downloadFormat.toUpperCase()}`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Download
          </button>
        </div>
      )}
    </div>
  );
};

export default GeneratedImageCard;
