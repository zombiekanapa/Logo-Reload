
import React, { useCallback, useRef } from 'react';

interface ImageUploadProps {
  onImageUpload: (base64: string, fileName: string) => void;
  isLoading: boolean;
  uploadedImage: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, isLoading, uploadedImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation for file size (e.g., 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please upload a smaller image.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onImageUpload(reader.result, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleRemoveImage = useCallback(() => {
    onImageUpload('', ''); // Clear image
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
  }, [onImageUpload]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-700 rounded-lg shadow-xl border border-gray-600 w-full max-w-lg mx-auto">
      {uploadedImage ? (
        <div className="mb-6 text-center w-full">
          <p className="text-gray-300 text-sm mb-2">Original Logo Preview:</p>
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto border-2 border-purple-500 rounded-lg overflow-hidden flex items-center justify-center bg-gray-800">
            <img src={uploadedImage} alt="Uploaded DJ Logo" className="object-contain w-full h-full p-2" />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-colors duration-200"
              aria-label="Remove image"
              disabled={isLoading}
            >
              &times;
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-800 ${
              isLoading ? 'border-gray-500 text-gray-500 cursor-not-allowed' : 'border-purple-500 text-purple-300 hover:bg-gray-700 hover:border-purple-400'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-10 h-10 mb-3 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="mb-2 text-sm">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, JPEG (Max 5MB)</p>
            </div>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
