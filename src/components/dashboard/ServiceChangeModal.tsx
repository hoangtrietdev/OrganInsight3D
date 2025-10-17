'use client';

import React from 'react';

interface ServiceChangeModalProps {
  show: boolean;
  currentService: 'meshy' | 'huggingface' | 'procedural';
  pendingService: 'meshy' | 'huggingface' | 'procedural' | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ServiceChangeModal({
  show,
  currentService,
  pendingService,
  onConfirm,
  onCancel,
}: ServiceChangeModalProps) {
  if (!show || !pendingService) return null;

  const getServiceName = (service: string) => {
    switch (service) {
      case 'meshy': return '✨ Meshy.ai';
      case 'huggingface': return '🤗 Hugging Face';
      case 'procedural': return '⚡ Procedural (FBX)';
      default: return service;
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700 shadow-2xl max-w-md w-full p-6 animate-scaleIn">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            pendingService === 'meshy' ? 'bg-blue-500/20 border-2 border-blue-500' :
            pendingService === 'huggingface' ? 'bg-green-500/20 border-2 border-green-500' :
            'bg-orange-500/20 border-2 border-orange-500'
          }`}>
            <svg className={`w-6 h-6 ${
              pendingService === 'meshy' ? 'text-blue-400' :
              pendingService === 'huggingface' ? 'text-green-400' :
              'text-orange-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Switch 3D Model Service?</h3>
            <p className="text-sm text-gray-400">Reload model with new generation method</p>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-gray-700/30 rounded-xl p-4 mb-6 border border-gray-600/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Current:</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
              currentService === 'meshy' ? 'bg-blue-500/20 text-blue-300' :
              currentService === 'huggingface' ? 'bg-green-500/20 text-green-300' :
              'bg-orange-500/20 text-orange-300'
            }`}>
              {getServiceName(currentService)}
            </span>
          </div>
          <div className="flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Switch to:</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
              pendingService === 'meshy' ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' :
              pendingService === 'huggingface' ? 'bg-green-500/20 text-green-300 border-green-500/50' :
              'bg-orange-500/20 text-orange-300 border-orange-500/50'
            }`}>
              {getServiceName(pendingService)}
            </span>
          </div>
        </div>

        {/* Warning/Info */}
        <div className={`rounded-lg p-4 mb-6 border ${
          pendingService === 'procedural' 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <div className="flex gap-3">
            <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              pendingService === 'procedural' ? 'text-green-400' : 'text-yellow-400'
            }`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              {pendingService === 'procedural' ? (
                <>
                  <p className="text-green-300 font-semibold mb-1">✓ Instant Loading</p>
                  <p className="text-green-200/80">Pre-loaded FBX models load immediately without API calls.</p>
                </>
              ) : (
                <>
                  <p className="text-yellow-300 font-semibold mb-1">⏱️ Generation Time</p>
                  <p className="text-yellow-200/80">
                    {pendingService === 'meshy' 
                      ? 'Meshy.ai takes 3-5 minutes to generate high-quality models (~$0.30).' 
                      : 'Hugging Face takes 3-7 minutes to generate models (FREE tier).'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 text-white font-semibold rounded-xl transition-all shadow-lg ${
              pendingService === 'meshy' ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-blue-500/30' :
              pendingService === 'huggingface' ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/30' :
              'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-500/30'
            }`}
          >
            Yes, Reload Model
          </button>
        </div>
      </div>
    </div>
  );
}
