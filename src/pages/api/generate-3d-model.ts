import type { NextApiRequest, NextApiResponse } from 'next';
import { generateAIModel, checkModelStatus, generateMedicalModelPrompt } from '@/utils/ai-model-generator';

interface GenerateRequest {
  action: 'generate' | 'check_status';
  organName?: string;
  healthScore?: number;
  imageData?: string;
  findings?: string;
  taskId?: string;
  service?: string;
}

interface GenerateResponse {
  success: boolean;
  taskId?: string;
  service?: string;
  estimatedTime?: number;
  status?: string;
  modelUrl?: string;
  progress?: number;
  error?: string;
  prompt?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { action, organName, healthScore, imageData, findings, taskId, service }: GenerateRequest = req.body;

    // Get API keys from environment variables
    const apiKeys = {
      meshy: process.env.NEXT_PUBLIC_MESHY_API_KEY,
      huggingface: process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY,
    };

    if (action === 'generate') {
      // Generate new 3D model
      if (!organName || !healthScore) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters: organName and healthScore' 
        });
      }

      console.log('🎨 Starting AI 3D model generation:', { organName, healthScore });

      // Generate detailed medical prompt
      const prompt = generateMedicalModelPrompt(organName, healthScore, findings);

      const result = await generateAIModel(
        organName,
        healthScore,
        imageData,
        findings,
        apiKeys
      );

      console.log('✅ Model generation initiated:', result);

      return res.status(200).json({
        success: true,
        taskId: result.taskId,
        service: result.service,
        estimatedTime: result.estimatedTime,
        prompt: prompt.substring(0, 200) + '...', // Preview of prompt
      });

    } else if (action === 'check_status') {
      // Check status of existing generation task
      if (!taskId || !service) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters: taskId and service' 
        });
      }

      const apiKey = apiKeys[service as keyof typeof apiKeys];
      if (!apiKey) {
        return res.status(400).json({ 
          success: false, 
          error: `No API key configured for service: ${service}` 
        });
      }

      const status = await checkModelStatus(taskId, service, apiKey);

      return res.status(200).json({
        success: true,
        status: status.status,
        modelUrl: status.modelUrl,
        progress: status.progress,
      });

    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid action. Use "generate" or "check_status"' 
      });
    }

  } catch (error) {
    console.error('❌ 3D Model generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Provide helpful error messages
    if (errorMessage.includes('API key')) {
      return res.status(400).json({
        success: false,
        error: 'AI 3D generation services require API keys. Please add them to your .env.local file:\n\n' +
                'NEXT_PUBLIC_MESHY_API_KEY=your_key_here (Recommended - Professional quality)\n' +
                'NEXT_PUBLIC_HUGGINGFACE_API_KEY=your_key_here (Free tier available)\n\n' +
                'Get API keys from:\n' +
                '• Meshy.ai: https://www.meshy.ai/ (~$0.30 per model)\n' +
                '• Hugging Face: https://huggingface.co/settings/tokens (FREE)'
      });
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
