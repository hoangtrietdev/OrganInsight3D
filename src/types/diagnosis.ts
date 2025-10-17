// LLM Strict Output Schema (Groq Response)
export interface OrganDiagnosis {
  organ: string; // The specific organ analyzed (e.g., "lung")
  healthStatus: 'Healthy' | 'Minor Concerns' | 'Diseased'; // Overall status
  disease: string | 'N/A'; // Specific disease identified, or 'N/A'
  confidenceLevel: number; // LLM's confidence in its diagnosis (0.0 to 1.0)
  statusRating: number; // A simple status score from 1 (Very Poor) to 5 (Excellent)
  detailedFindings: string; // A concise summary of the visual findings
  treatmentSuggestion: string; // A very brief, high-level suggestion
}

export interface DiagnosisRequest {
  imageData: string; // Base64 encoded image
  organName: string; // The organ to analyze
}

export interface DiagnosisResponse {
  success: boolean;
  diagnosis?: OrganDiagnosis;
  error?: string;
}

// Supported organ types
export const SUPPORTED_ORGANS = [
  'Lung',
  'Brain',
  'Heart',
  'Kidney',
  'Liver',
  'Stomach',
  'Pancreas',
] as const;

export type OrganType = typeof SUPPORTED_ORGANS[number];
