
import React from 'react';
import { GeneratedImage } from '../types';

interface GeneratedImageCardProps {
  image: GeneratedImage;
}

const GeneratedImageCard: React.FC<GeneratedImageCardProps> = ({ image }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-700 rounded-lg shadow-md border border-gray-600">
      <h3 className="text-lg font-semibold text-purple-400 mb-4 text-center">
        {image.style} Style
      </h3>
      <div className="relative w-48 h-48 overflow-hidden rounded-lg border-2 border-gray-500 bg-gray-800 flex items-center justify-center">
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
    </div>
  );
};

export default GeneratedImageCard;
