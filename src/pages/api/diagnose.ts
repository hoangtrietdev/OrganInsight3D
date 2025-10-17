import type { NextApiRequest, NextApiResponse } from 'next';
import Groq from 'groq-sdk';
import { OrganDiagnosis, DiagnosisResponse } from '@/types/diagnosis';

// Configure API route to handle larger payloads (for mobile high-res images)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increased from default 1mb to handle mobile images
    },
  },
};

// Initialize Groq client with API key from environment variables
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// System prompt for the Groq LLM
const SYSTEM_PROMPT = `You are an expert medical diagnostic AI specializing in analyzing two-dimensional medical scans (X-rays, CT slices, MRI sections) of human organs. Your task is to:
1. First, IDENTIFY which organ is shown in the image (e.g., lung, brain, kidney, heart, liver, etc.)
2. Then provide a structured, professional, and concise diagnostic assessment of that organ.

You must return your analysis *ONLY* as a single JSON object that conforms precisely to the provided TypeScript interface. Do not include any other text, pre-amble, or explanation outside of the JSON. If the image quality is poor or a clear diagnosis cannot be made, state "Inconclusive" in the healthStatus and set confidenceLevel to 0.0.

The JSON must follow this exact structure:
{
  "organ": "string (REQUIRED: detected organ name - lung, brain, kidney, heart, liver, etc.)",
  "healthStatus": "Healthy" | "Minor Concerns" | "Diseased",
  "disease": "string or N/A",
  "confidenceLevel": number (0.0 to 1.0),
  "statusRating": number (1 to 5),
  "detailedFindings": "string",
  "treatmentSuggestion": "string"
}`;

// User prompt template function
const createUserPrompt = (organName?: string): string => {
  if (organName) {
    return `Analyze this medical image, which appears to be a scan of a **${organName}**. First, confirm if this is indeed a ${organName} scan. Then based on the visual evidence, generate a diagnosis that strictly follows the required JSON schema. Return ONLY the JSON object, no other text.`;
  }
  return `Analyze this medical image. First, identify which organ is shown in the scan (e.g., lung, brain, kidney, heart, liver, etc.). Then based on the visual evidence, generate a diagnosis that strictly follows the required JSON schema. Return ONLY the JSON object, no other text.`;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiagnosisResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { imageData, organName } = req.body;

    // Validate input - organName is now optional
    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: imageData',
      });
    }

    // Validate API key
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GROQ_API_KEY not configured on server',
      });
    }

    // Extract base64 data (remove data:image/... prefix if present)
    const base64Data = imageData.includes(',')
      ? imageData.split(',')[1]
      : imageData;

    // Call Groq API with multimodal input (image + text)
    type MultimodalContent = Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Using Groq's vision model
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: createUserPrompt(organName),
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
              },
            },
          ] as MultimodalContent as never, // Type assertion for Groq SDK multimodal support
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual output
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    // Extract the response content
    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return res.status(500).json({
        success: false,
        error: 'No response from Groq API',
      });
    }

    // Parse the JSON response from the LLM
    let diagnosis: OrganDiagnosis;
    
    try {
      // Try to extract JSON if the response contains additional text
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseContent;
      diagnosis = JSON.parse(jsonString);
    } catch {
      console.error('Failed to parse LLM response:', responseContent);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse diagnosis from LLM response',
      });
    }

    // Validate the diagnosis structure
    if (
      !diagnosis.organ ||
      !diagnosis.healthStatus ||
      typeof diagnosis.confidenceLevel !== 'number' ||
      typeof diagnosis.statusRating !== 'number'
    ) {
      return res.status(500).json({
        success: false,
        error: 'Invalid diagnosis structure from LLM',
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      diagnosis,
    });

  } catch (error: unknown) {
    console.error('Error in diagnose API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
