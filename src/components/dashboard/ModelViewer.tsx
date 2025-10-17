'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { OrganType } from '@/types/diagnosis';

const ThreeDViewer = dynamic(() => import('@/components/ThreeDViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm font-medium">Loading 3D Viewer...</p>
      </div>
    </div>
  ),
});

interface ModelViewerProps {
  organName: OrganType;
  score: number;
  aiService: 'meshy' | 'huggingface' | 'procedural';
  imageData?: string;
  isReloading: boolean;
  isGenerating: boolean;
  onGenerateModel: () => void;
  modelKey: number;
  isModelLoading?: boolean;
  onModelLoaded?: () => void;
  onReloadModel?: () => void;
}

export default function ModelViewer({
  organName,
  score,
  imageData,
  modelKey,
  isModelLoading = false,
  onModelLoaded,
  onReloadModel,
}: ModelViewerProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700/50 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-base md:text-xl font-semibold text-gray-100">
          3D Organ Model - {organName}
        </h2>
        <span className="text-xs px-2 md:px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
          ⚡ FBX Model
        </span>
      </div>

      {/* 3D Viewer */}
      <div className="flex-1 relative rounded-xl overflow-hidden bg-gray-900/50 border border-gray-700/30">
        {isModelLoading && (
          <div className="absolute inset-0 z-10 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-gray-300 text-xs md:text-sm font-medium">Loading 3D Model...</p>
            </div>
          </div>
        )}
        <ThreeDViewer
          key={modelKey}
          organName={organName}
          score={score}
          useProceduralGeneration={false}
          useFBX={true}
          imageData={imageData}
          onModelLoaded={onModelLoaded}
          onReloadModel={onReloadModel}
        />
      </div>
    </div>
  );
}
