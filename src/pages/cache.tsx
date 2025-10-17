'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/shared/Header';
import {
  getAllCachedModels,
  getCacheStats,
  clearAllCache,
  deleteCachedModel,
  clearExpiredModels,
  type CacheStats,
} from '@/utils/model-cache';
import {
  getAllCachedDiagnoses,
  getDiagnosisCacheStats,
  clearAllDiagnosisCache,
  deleteCachedDiagnosis,
  clearExpiredDiagnoses,
  type DiagnosisCacheStats,
} from '@/utils/diagnosis-cache';

export default function CacheManagement() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [diagnosisCacheStats, setDiagnosisCacheStats] = useState<DiagnosisCacheStats | null>(null);

  useEffect(() => {
    loadCacheStats();
    loadDiagnosisCacheStats();
  }, []);

  const loadCacheStats = () => {
    const stats = getCacheStats();
    setCacheStats(stats);
  };

  const loadDiagnosisCacheStats = () => {
    const stats = getDiagnosisCacheStats();
    setDiagnosisCacheStats(stats);
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cached models? This cannot be undone.')) {
      clearAllCache();
      loadCacheStats();
      alert('Cache cleared successfully!');
    }
  };

  const handleClearExpired = () => {
    const count = clearExpiredModels();
    loadCacheStats();
    alert(`Cleared ${count} expired models.`);
  };

  const handleDeleteModel = (cacheKey: string) => {
    if (confirm('Delete this cached model?')) {
      deleteCachedModel(cacheKey);
      loadCacheStats();
    }
  };

  const handleClearDiagnosisCache = () => {
    if (confirm('Are you sure you want to clear all cached diagnoses? This cannot be undone.')) {
      clearAllDiagnosisCache();
      loadDiagnosisCacheStats();
      alert('Diagnosis cache cleared successfully!');
    }
  };

  const handleClearExpiredDiagnoses = () => {
    const count = clearExpiredDiagnoses();
    loadDiagnosisCacheStats();
    alert(`Cleared ${count} expired diagnoses.`);
  };

  const handleDeleteDiagnosis = (cacheKey: string) => {
    if (confirm('Delete this cached diagnosis?')) {
      deleteCachedDiagnosis(cacheKey);
      loadDiagnosisCacheStats();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />

      <main className="pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Diagnosis Cache Section */}
          <section>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/50">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Diagnosis Cache</h2>
                  <p className="text-sm text-purple-300">AI analysis results saved for instant retrieval</p>
                </div>
              </div>

              {diagnosisCacheStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Total Diagnoses</p>
                    <p className="text-3xl font-bold text-purple-400">{diagnosisCacheStats.totalDiagnoses}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Oldest Entry</p>
                    <p className="text-lg font-bold text-gray-300">
                      {diagnosisCacheStats.oldestDiagnosisDate ? diagnosisCacheStats.oldestDiagnosisDate.toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Newest Entry</p>
                    <p className="text-lg font-bold text-gray-300">
                      {diagnosisCacheStats.newestDiagnosisDate ? diagnosisCacheStats.newestDiagnosisDate.toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Storage Bar */}
              {diagnosisCacheStats && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Storage Usage</span>
                    <span>{diagnosisCacheStats.totalSizeMB.toFixed(2)} MB / {diagnosisCacheStats.maxSizeMB} MB</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${diagnosisCacheStats.utilizationPercent}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClearExpiredDiagnoses}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
                >
                  Clear Expired
                </button>
                <button
                  onClick={handleClearDiagnosisCache}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all"
                >
                  Clear All Cache
                </button>
              </div>
            </div>

            {/* Diagnosis List */}
            <div className="space-y-3">
              {diagnosisCacheStats && getAllCachedDiagnoses().map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 flex items-center justify-between hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{item.cacheKey}</p>
                      <p className="text-sm text-gray-400">
                        Cached {formatDate(item.timestamp)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDiagnosis(item.cacheKey)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-semibold rounded-lg transition-all text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {diagnosisCacheStats?.totalDiagnoses === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <p>No cached diagnoses yet</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
