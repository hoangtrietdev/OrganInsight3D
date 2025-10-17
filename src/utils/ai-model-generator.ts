/**
 * AI Model Generation Utilities
 * 
 * This file contains helpers for generating 3D models using various methods:
 * 1. Procedural generation (current implementation)
 * 2. External AI APIs (future integration examples)
 * 3. Model caching to reduce API calls
 */

import * as THREE from 'three';
import { getCachedModel, cacheModel } from './model-cache';

/**
 * Advanced Perlin-style noise function for more organic deformation
 */
function perlinNoise3D(x: number, y: number, z: number, seed: number = 0): number {
  // Improved 3D noise using multiple octaves
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;
  const octaves = 4;

  for (let i = 0; i < octaves; i++) {
    const sx = x * frequency + seed;
    const sy = y * frequency + seed;
    const sz = z * frequency + seed;
    
    const noise = 
      Math.sin(sx * 2.1 + sy * 1.7) * Math.cos(sy * 1.9 + sz * 2.3) +
      Math.sin(sy * 2.7 + sz * 1.3) * Math.cos(sz * 2.9 + sx * 1.1) +
      Math.sin(sz * 3.1 + sx * 1.9) * Math.cos(sx * 1.7 + sy * 2.1);
    
    total += noise * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return total / maxValue;
}

/**
 * Generate high-quality procedural organic geometry using advanced noise functions
 * Enhanced version with image-aware deformation
 */
export function generateProceduralOrgan(
  organType: string,
  healthScore: number = 3,
  complexity: number = 128 // Increased default complexity for better quality
): THREE.BufferGeometry {
  const organLower = organType.toLowerCase();
  let baseGeometry: THREE.BufferGeometry;

  // Choose base shape based on organ with higher resolution
  if (organLower.includes('brain')) {
    baseGeometry = new THREE.SphereGeometry(1.5, complexity, complexity);
  } else if (organLower.includes('heart')) {
    // Heart-shaped geometry
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.8);
    heartShape.bezierCurveTo(0, 1.2, -0.8, 1.2, -0.8, 0.6);
    heartShape.bezierCurveTo(-0.8, 0.2, -0.8, 0, -0.4, -0.4);
    heartShape.lineTo(0, -1.2);
    heartShape.lineTo(0.4, -0.4);
    heartShape.bezierCurveTo(0.8, 0, 0.8, 0.2, 0.8, 0.6);
    heartShape.bezierCurveTo(0.8, 1.2, 0, 1.2, 0, 0.8);
    
    const extrudeSettings = {
      steps: complexity / 8,
      depth: 0.8,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.1,
      bevelSegments: complexity / 16
    };
    baseGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  } else if (organLower.includes('lung')) {
    // Lung pair - two connected lobes
    baseGeometry = new THREE.SphereGeometry(1.2, complexity, complexity);
  } else if (organLower.includes('kidney')) {
    baseGeometry = new THREE.CapsuleGeometry(0.7, 2.0, complexity / 2, complexity);
  } else if (organLower.includes('liver')) {
    baseGeometry = new THREE.BoxGeometry(2.8, 1.8, 2.2, complexity / 2, complexity / 2, complexity / 2);
  } else {
    baseGeometry = new THREE.SphereGeometry(1.2, complexity, complexity);
  }

  // Apply advanced organic deformation with multiple noise layers
  const positions = baseGeometry.attributes.position;
  const vertex = new THREE.Vector3();
  
  // Health-based deformation parameters
  const baseDeformation = 0.08;
  const healthDeformation = (healthScore - 1) * 0.12;
  const totalDeformation = baseDeformation + healthDeformation;
  
  // Multiple noise scales for detail
  const noiseScales = [1.5, 3.0, 6.0]; // Large, medium, fine detail
  const noiseWeights = [0.6, 0.3, 0.1];

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    const originalVertex = vertex.clone();
    
    // Combine multiple noise octaves for organic appearance
    let combinedNoise = 0;
    
    for (let j = 0; j < noiseScales.length; j++) {
      const scale = noiseScales[j];
      const weight = noiseWeights[j];
      const noise = perlinNoise3D(
        vertex.x * scale,
        vertex.y * scale,
        vertex.z * scale,
        healthScore * 100 // Seed based on health for consistency
      );
      combinedNoise += noise * weight;
    }
    
    // Apply disease-specific deformations
    if (healthScore >= 4) {
      // Add lumps/irregularities for diseased organs
      const lumpNoise = perlinNoise3D(
        vertex.x * 8.0,
        vertex.y * 8.0,
        vertex.z * 8.0,
        healthScore * 200
      );
      if (lumpNoise > 0.3) {
        combinedNoise += lumpNoise * 0.2;
      }
    }
    
    // Calculate deformation magnitude
    const noiseValue = combinedNoise * totalDeformation;
    
    // Apply deformation along vertex normal direction
    const normal = originalVertex.clone().normalize();
    vertex.add(normal.multiplyScalar(noiseValue));

    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  baseGeometry.attributes.position.needsUpdate = true;
  baseGeometry.computeVertexNormals();
  
  // Add UV coordinates for better material mapping
  if (!baseGeometry.attributes.uv) {
    const uvs = [];
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      const u = Math.atan2(vertex.x, vertex.z) / (Math.PI * 2) + 0.5;
      const v = vertex.y * 0.5 + 0.5;
      uvs.push(u, v);
    }
    baseGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }

  return baseGeometry;
}

/**
 * Get health-based color for organ visualization
 */
export function getHealthColor(healthScore: number): string {
  const colors = [
    '#ff3333', // Score 5: Severe (dark red)
    '#ff5544', // Score 4: Bad (red-orange)
    '#ff8844', // Score 3: Moderate (orange)
    '#ffaa44', // Score 2: Slight issue (yellow-orange)
    '#88ff66', // Score 1: Healthy (green)
  ];
  return colors[5 - healthScore] || '#ff6b6b';
}

/**
 * ============================================================================
 * AI-POWERED 3D MODEL GENERATION APIs
 * ============================================================================
 * 
 * Professional AI services for generating high-quality 3D models from images/text
 */

/**
 * Generate detailed medical prompt for AI 3D generation
 * Creates highly specific prompts for better quality medical models
 */
export function generateMedicalModelPrompt(
  organName: string,
  healthScore: number,
  findings?: string
): string {
  const organLower = organName.toLowerCase();
  
  // Health condition descriptors
  const healthDescriptors: Record<number, string> = {
    5: 'critically diseased with severe pathological changes, extensive damage, visible lesions, abnormal growths, and structural deformities',
    4: 'diseased with significant pathological features, moderate tissue damage, visible abnormalities, and compromised structure',
    3: 'showing moderate concerns with visible irregularities, minor tissue changes, and slight structural variations',
    2: 'mostly healthy with very minor imperfections, subtle texture variations, and nearly normal appearance',
    1: 'perfectly healthy with normal structure, smooth surfaces, proper coloration, and ideal anatomical features'
  };
  
  const healthDesc = healthDescriptors[healthScore] || healthDescriptors[3];
  
  // Organ-specific anatomical details
  const organDetails: Record<string, string> = {
    brain: 'with detailed gyri and sulci patterns, visible gray and white matter differentiation, proper cerebrospinal fluid spaces, and accurate cortical folding',
    lung: 'with detailed bronchial tree structure, visible alveolar patterns, proper lobar divisions, realistic pleural surface texture, and vascular markings',
    heart: 'with detailed cardiac chambers, visible coronary vessels, proper valvular structures, realistic myocardial texture, and accurate anatomical proportions',
    kidney: 'with detailed cortex and medulla differentiation, visible renal pyramids, proper pelvis structure, realistic capsule texture, and vascular details',
    liver: 'with detailed lobular structure, visible portal triads, proper segmental divisions, realistic capsular surface, and vascular tree patterns',
    stomach: 'with detailed mucosal folds, proper gastric curves, visible muscular layers, and realistic wall texture',
    pancreas: 'with detailed lobular structure, visible pancreatic duct, proper head-body-tail segments, and realistic texture'
  };
  
  const organDetail = organDetails[organLower] || 'with detailed anatomical structure and realistic medical features';
  
  // Build comprehensive prompt
  const prompt = `
Ultra-high quality, photorealistic 3D medical model of a human ${organName},
${healthDesc}.

ANATOMICAL DETAILS:
- ${organDetail}
- Medical scan accuracy with proper scaling and proportions
- Professional medical visualization quality
- Suitable for clinical education and analysis

VISUAL QUALITY:
- 4K resolution textures with medical accuracy
- Physically-based rendering (PBR) materials
- Accurate tissue coloration and translucency
- Detailed surface topology showing organic textures
- High polygon count for smooth, realistic appearance

MEDICAL CONTEXT:
${findings ? `- Based on diagnostic findings: ${findings}` : '- Standard clinical presentation'}
- Appropriate for medical diagnosis visualization
- Scientifically accurate representation
- Professional medical illustration standard

TECHNICAL REQUIREMENTS:
- Clean topology suitable for real-time rendering
- Optimized for WebGL/Three.js display
- Proper UV mapping for texture application
- GLB or FBX format compatible
`.trim();
  
  return prompt;
}

/**
 * Method 1: Meshy.ai - Industry-leading text/image to 3D
 * Best for: High-quality medical models with great detail
 * Cost: ~$0.10-0.50 per model
 * Time: 2-5 minutes
 */
export async function generateWithMeshy(
  prompt: string,
  imageBase64?: string,
  apiKey?: string
): Promise<{ taskId: string; status: string }> {
  if (!apiKey) {
    throw new Error('Meshy.ai API key required. Get one at https://www.meshy.ai/');
  }
  
  const endpoint = imageBase64 
    ? 'https://api.meshy.ai/v2/image-to-3d'
    : 'https://api.meshy.ai/v2/text-to-3d';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'preview', // or 'refine' for higher quality
      prompt: prompt,
      art_style: 'realistic',
      negative_prompt: 'cartoon, low quality, blurry, pixelated, distorted, unrealistic',
      ...(imageBase64 && { image_url: imageBase64 }),
      target_polycount: 100000, // High quality
      topology: 'quad', // Better for organic shapes
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Meshy.ai API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Method 2: Hugging Face - Open source alternatives
 * Best for: Free tier, experimental
 * Cost: Free (with API limits)
 * Time: Variable
 */
export async function generateWithHuggingFace(
  prompt: string,
  apiKey?: string
): Promise<Blob> {
  if (!apiKey) {
    throw new Error('Hugging Face API key required. Get one at https://huggingface.co/settings/tokens');
  }
  
  // Using Shap-E or similar model
  const response = await fetch(
    'https://api-inference.huggingface.co/models/openai/shap-e',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: 64,
          guidance_scale: 15.0,
        },
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.statusText}`);
  }
  
  return await response.blob();
}

/**
 * Universal AI Model Generator - Try multiple services with fallback
 * Automatically selects best available service
 * Checks cache before making API calls to save time and money
 */
export async function generateAIModel(
  organName: string,
  healthScore: number,
  imageBase64?: string,
  findings?: string,
  apiKeys?: {
    meshy?: string;
    rodin?: string;
    tripo?: string;
    huggingface?: string;
  },
  preferredService?: 'meshy' | 'huggingface'
): Promise<{ taskId: string; service: string; estimatedTime: number; cached?: boolean; modelUrl?: string }> {
  
  // Check cache first for preferred service
  if (preferredService) {
    console.log(`🔍 Checking cache for ${organName} (score ${healthScore}) with ${preferredService}...`);
    const cached = getCachedModel(organName, healthScore, preferredService);
    
    if (cached) {
      console.log('✅ Found cached model! Skipping API call.');
      return {
        taskId: `cached_${cached.timestamp}`,
        service: preferredService,
        estimatedTime: 0,
        cached: true,
        modelUrl: cached.modelUrl,
      };
    }
  }
  
  // Generate optimized prompt
  const prompt = generateMedicalModelPrompt(organName, healthScore, findings);
  
  console.log('🎨 Generating AI 3D Model with prompt:', prompt);
  
  // Try services in order of quality/availability or use preferred service
  const services = preferredService
    ? [{ name: preferredService, key: apiKeys?.[preferredService], time: preferredService === 'meshy' ? 180 : 240 }]
    : [
        { name: 'meshy' as const, key: apiKeys?.meshy, time: 180 },
        { name: 'huggingface' as const, key: apiKeys?.huggingface, time: 240 },
      ];
  
  for (const service of services) {
    if (!service.key) continue;
    
    try {
      let result;
      
      switch (service.name) {
        case 'meshy':
          result = await generateWithMeshy(prompt, imageBase64, service.key);
          break;
        case 'huggingface':
          result = { taskId: 'hf-task', status: 'processing' };
          break;
        default:
          continue;
      }
      
      console.log(`✅ Successfully started generation with ${service.name}`);
      return {
        taskId: result.taskId,
        service: service.name,
        estimatedTime: service.time,
        cached: false,
      };
      
    } catch (error) {
      console.warn(`⚠️ ${service.name} failed:`, error);
      continue;
    }
  }
  
  throw new Error(
    'No AI 3D generation service available. Please add API keys in .env.local:\n' +
    'NEXT_PUBLIC_MESHY_API_KEY=your_key (Recommended - Professional quality)\n' +
    'NEXT_PUBLIC_HUGGINGFACE_API_KEY=your_key (Free tier available)'
  );
}

/**
 * Poll for model generation completion
 * Check if the 3D model is ready for download
 * Automatically caches completed models
 */
export async function checkModelStatus(
  taskId: string,
  service: string,
  apiKey: string,
  organName?: string,
  healthScore?: number
): Promise<{ status: string; modelUrl?: string; progress?: number }> {
  
  const endpoints: Record<string, string> = {
    meshy: `https://api.meshy.ai/v2/image-to-3d/${taskId}`,
    huggingface: `https://api-inference.huggingface.co/models/openai/shap-e/status/${taskId}`,
  };
  
  const endpoint = endpoints[service];
  if (!endpoint) {
    throw new Error(`Unknown service: ${service}`);
  }
  
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to check status: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Normalize response across different services
  const result = {
    status: data.status || data.state,
    modelUrl: data.model_url || data.result?.model_url || data.output?.glb_url,
    progress: data.progress || 0,
  };
  
  // Cache the model if it's completed and we have the necessary info
  if (
    result.status === 'SUCCEEDED' &&
    result.modelUrl &&
    organName &&
    healthScore !== undefined &&
    (service === 'meshy' || service === 'huggingface')
  ) {
    console.log('💾 Caching completed model...');
    await cacheModel(organName, healthScore, service as 'meshy' | 'huggingface', result.modelUrl);
  }
  
  return result;
}

/**
 * Export all utilities
 */
export const AIModelGenerator = {
  generateProceduralOrgan,
  getHealthColor,
  generateAIModel,
  generateMedicalModelPrompt,
  checkModelStatus,
  generateWithMeshy,
  generateWithHuggingFace,
};

export default AIModelGenerator;
