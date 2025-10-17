'use client';

import React, { useState } from 'react';
import Header from '@/components/shared/Header';
import ImageUpload from '@/components/dashboard/ImageUpload';
import DiagnosisResults from '@/components/dashboard/DiagnosisResults';
import ModelViewer from '@/components/dashboard/ModelViewer';
import { OrganDiagnosis, OrganType, DiagnosisResponse } from '@/types/diagnosis';
import { getCachedDiagnosis, cacheDiagnosis } from '@/utils/diagnosis-cache';

export default function Dashboard() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<OrganDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelKey, setModelKey] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Handle image upload
  const handleImageUpload = (imageData: string) => {
    setUploadedImage(imageData);
    setError(null);
    setDiagnosis(null);
  };

  // Handle model reload when it fails to load
  const handleReloadModel = () => {
    setModelKey(prev => prev + 1); // Increment key to force remount
    setIsModelLoading(true); // Show loading spinner again
  };

  // Handle diagnosis
  const handleAnalyze = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setDiagnosis(null);

    try {
      // Check cache using only image data (organ will be in cached result)
      const cachedResult = getCachedDiagnosis(uploadedImage);
      
      if (cachedResult) {
        console.log(`✅ Found cached diagnosis for ${cachedResult.organ}!`);
        setDiagnosis(cachedResult);
        setIsAnalyzing(false);
        return;
      }
      
      // Make API call without specifying organ (AI will detect it)
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: uploadedImage,
          // organName is now optional - AI will auto-detect
        }),
      });

      const data: DiagnosisResponse = await response.json();

      if (data.success && data.diagnosis) {
        setDiagnosis(data.diagnosis);
        setIsModelLoading(true); // Start loading model
        // Cache using the detected organ name from the diagnosis
        cacheDiagnosis(data.diagnosis.organ, uploadedImage, data.diagnosis);
      } else {
        setError(data.error || 'Analysis failed. Please try again.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze image. Please check your connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />

      {/* Main Content - Responsive Layout */}
      <main className="pt-20 min-h-screen lg:h-screen lg:overflow-hidden">
        <div className="min-h-screen lg:h-full p-4 md:p-6 max-w-[2000px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:h-full">
            
            {/* Left Column: Upload + Diagnosis */}
            <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6 lg:h-full lg:overflow-hidden">
              {/* Top: Image Upload (40% height on desktop, auto on mobile) */}
              <div className="lg:h-[40%] min-h-[300px] lg:min-h-0">
                <ImageUpload
                  uploadedImage={uploadedImage}
                  onImageUpload={handleImageUpload}
                  onError={setError}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                />
              </div>

              {/* Bottom: Diagnosis Results (60% height on desktop, auto on mobile) */}
              <div className="lg:h-[60%] min-h-[400px] lg:min-h-0">
                <DiagnosisResults
                  diagnosis={diagnosis!}
                  isAnalyzing={isAnalyzing}
                  onAnalyze={handleAnalyze}
                />
              </div>
            </div>

            {/* Right Column: 3D Model Viewer */}
            <div className="lg:col-span-8 lg:h-full min-h-[500px] lg:min-h-0 max-h-[820px]">
              {diagnosis ? (
                <ModelViewer
                  organName={diagnosis.organ as OrganType}
                  score={diagnosis.statusRating}
                  aiService="procedural"
                  imageData={uploadedImage || undefined}
                  isReloading={false}
                  isGenerating={false}
                  onGenerateModel={() => {}}
                  modelKey={modelKey}
                  isModelLoading={isModelLoading}
                  onModelLoaded={() => setIsModelLoading(false)}
                  onReloadModel={handleReloadModel}
                />
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl h-full flex items-center justify-center max-h-[820px]">
                  <div className="text-center text-gray-400">
                    <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-lg font-semibold mb-2">No 3D Model Yet</p>
                    <p className="text-sm">Upload an image and run analysis to view 3D organ model</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slideUp">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 max-w-md shadow-2xl backdrop-blur-xl">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">Error</p>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 ml-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
