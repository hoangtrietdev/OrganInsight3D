'use client';

import React from 'react';

interface ServiceSelectorProps {
  aiService: 'meshy' | 'huggingface' | 'procedural';
  onServiceChange: (service: 'meshy' | 'huggingface' | 'procedural') => void;
  disabled?: boolean;
}

export default function ServiceSelector({ aiService, onServiceChange, disabled }: ServiceSelectorProps) {
  return (
    <div className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
      <label className="block text-sm font-semibold text-gray-300 mb-3">
        🎨 3D Model Generation Method
      </label>
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => onServiceChange('procedural')}
          disabled={disabled}
          className={`
            relative overflow-hidden rounded-xl px-4 py-3 text-left text-sm font-medium
            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
            ${aiService === 'procedural'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600/50'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">⚡ Procedural (FBX)</div>
              <div className="text-xs opacity-90 mt-1">Instant loading • Pre-made models</div>
            </div>
            {aiService === 'procedural' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>

        <button
          onClick={() => onServiceChange('meshy')}
          disabled={disabled}
          className={`
            relative overflow-hidden rounded-xl px-4 py-3 text-left text-sm font-medium
            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
            ${aiService === 'meshy'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600/50'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">✨ Meshy.ai</div>
              <div className="text-xs opacity-90 mt-1">Professional quality • 3-5 min</div>
            </div>
            {aiService === 'meshy' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>

        <button
          onClick={() => onServiceChange('huggingface')}
          disabled={disabled}
          className={`
            relative overflow-hidden rounded-xl px-4 py-3 text-left text-sm font-medium
            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
            ${aiService === 'huggingface'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600/50'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">🤗 Hugging Face</div>
              <div className="text-xs opacity-90 mt-1">Free tier • 3-7 min</div>
            </div>
            {aiService === 'huggingface' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
