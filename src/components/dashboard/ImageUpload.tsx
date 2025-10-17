'use client';

import React, { useRef } from 'react';

interface ImageUploadProps {
  uploadedImage: string | null;
  onImageUpload: (imageData: string) => void;
  onError: (error: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export default function ImageUpload({ uploadedImage, onImageUpload, onError, onAnalyze, isAnalyzing }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress and resize image for mobile compatibility
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate new dimensions (max 1920x1920 for mobile)
          const MAX_SIZE = 1920;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }

          // Set canvas size
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality compression (0.8 = 80% quality)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please upload a valid image file');
      return;
    }

    try {
      // Compress image before uploading
      const compressedBase64 = await compressImage(file);
      onImageUpload(compressedBase64);
      
      // Reset input so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Image compression error:', err);
      onError('Failed to process image. Please try another file.');
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-gray-700/50 shadow-xl h-full flex flex-col">
      <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-100">Medical Image Upload</h2>
      
      {/* Upload Buttons */}
      <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm md:text-base font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload File
          </div>
        </button>

        <button
          onClick={onAnalyze}
          disabled={!uploadedImage || isAnalyzing}
          className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base font-semibold rounded-xl transition-all ${
            !uploadedImage || isAnalyzing
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30'
          }`}
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Analyze Image
            </div>
          )}
        </button>

        
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-600 overflow-hidden flex items-center justify-center relative min-h-[150px]">
        {uploadedImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedImage}
              alt="Uploaded medical scan"
              className="w-full h-full object-contain"
            />
            {/* Image uploaded badge */}
            <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full border border-green-400/50 shadow-lg">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-xs font-semibold">Ready to Analyze</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 p-4">
            <svg className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs md:text-sm">No image uploaded</p>
          </div>
        )}
      </div>
    </div>
  );
}
