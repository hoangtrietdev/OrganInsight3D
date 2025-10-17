'use client';

import React from 'react';
import { OrganDiagnosis } from '@/types/diagnosis';

interface DiagnosisResultsProps {
  diagnosis: OrganDiagnosis;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

export default function DiagnosisResults({ diagnosis, isAnalyzing, onAnalyze }: DiagnosisResultsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return 'text-green-400';
      case 'Minor Concerns':
        return 'text-yellow-400';
      case 'Diseased':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-600'}>
        ★
      </span>
    ));
  };

  if (!diagnosis) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-gray-700/50 shadow-xl h-full flex flex-col max-h-[450px]">
        <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-100">Diagnostic Results</h2>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            {isAnalyzing ? (
              <>
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs md:text-sm">Analyzing image...</p>
                <p className="text-xs mt-2 opacity-70">This may take a few moments</p>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-xs md:text-sm">No analysis yet</p>
                <p className="text-xs mt-2 opacity-70">Upload an image and click Analyze</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-5 pb-6 md:pb-8 border border-gray-700/50 shadow-xl h-full flex flex-col overflow-y-auto max-h-[450px]">
      <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-100">Diagnostic Results</h2>

      <div className="space-y-3 md:space-y-4 flex-1">
        {/* Status Card */}
        <div className="bg-gray-700/30 rounded-xl p-3 md:p-4 border border-gray-600/30">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Health Status
              </p>
              <p className={`text-lg md:text-2xl font-bold ${getStatusColor(diagnosis.healthStatus)}`}>
                {diagnosis.healthStatus}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Confidence
              </p>
              <p className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {(diagnosis.confidenceLevel * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Disease Info */}
        <div className="bg-gray-700/30 rounded-xl p-3 md:p-4 border border-gray-600/30">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Diagnosis
          </p>
          <p className={`text-base md:text-lg font-bold ${
            diagnosis.disease === 'N/A' ? 'text-green-400' : 'text-red-400'
          }`}>
            {diagnosis.disease}
          </p>
        </div>

        {/* Rating */}
        <div className="bg-gray-700/30 rounded-xl p-3 md:p-4 border border-gray-600/30">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Status Rating
          </p>
          <div className="flex items-center gap-2">
            <div className="text-xl md:text-2xl">
              {getRatingStars(diagnosis.statusRating)}
            </div>
            <span className="text-xs md:text-sm text-gray-400">
              {diagnosis.statusRating}/5
            </span>
          </div>
        </div>

        {/* Detailed Findings */}
        <div className="bg-gray-700/30 rounded-xl p-3 md:p-4 border border-gray-600/30">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Detailed Findings
          </p>
          <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
            {diagnosis.detailedFindings}
          </p>
        </div>

        {/* Treatment Suggestion */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 md:p-4">
          <div className="flex items-start gap-2 md:gap-3">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">
                Treatment Suggestion
              </p>
              <p className="text-xs md:text-sm text-blue-200">
                {diagnosis.treatmentSuggestion}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
