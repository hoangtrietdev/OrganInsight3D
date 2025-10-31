'use client';

/**
 * 3D Organ Viewer Component
 * 
 * Supports two rendering modes:
 * 1. GLB Models: Load pre-made 3D models from /public/models/glb/
 * 2. AI-Generated (Procedural): Dynamically generate organic 3D shapes using noise algorithms
 * 
 * GLB features:
 * - Binary GLTF format for better web performance
 * - Automatic centering and scaling in viewport
 * - Error handling for missing models
 * - Real-time rotation animation
 * 
 * AI-Generated features:
 * - Real-time procedural geometry generation
 * - Health-based color coding (green=healthy, red=diseased)
 * - Organic deformation based on noise functions
 * - Breathing animation for realism
 * - No external files needed
 * 
 * Usage:
 * <ThreeDViewer organName="Lung" score={3} useProceduralGeneration={true} />
 */

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useProgress, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeDViewerProps {
  organName: string;
  score?: number; // Score from 1-5 for loading specific models
  useProceduralGeneration?: boolean; // Use enhanced procedural generation
  useFBX?: boolean; // Use pre-loaded GLB models from public/models/glb/
  imageData?: string; // Optional: X-ray/scan image for texture mapping
  cachedModelUrl?: string; // URL to cached GLB/GLTF model from AI generation
  onModelLoaded?: () => void; // Callback when model finishes loading
  onReloadModel?: () => void; // Callback to reload the model when it fails
}

// Loading fallback component
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-white text-center">
        <div className="text-xl font-semibold mb-2">Loading 3D Model...</div>
        <div className="text-sm">{progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
}

// GLB Model Loader Component with error handling
// GLTF Model Loader Component
function GLTFModelFromPath({ gltfPath, onModelLoaded }: { gltfPath: string; onModelLoaded?: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const [hasNotifiedLoad, setHasNotifiedLoad] = React.useState(false);
  
  const gltf = useGLTF(gltfPath);
  const model = gltf.scene;

  // Rotate the model slowly
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  if (model) {
    // Clone the model to avoid mutations
    const clonedModel = model.clone();
    
    // Notify parent that model loaded successfully
    if (onModelLoaded && !hasNotifiedLoad) {
      setHasNotifiedLoad(true);
      setTimeout(() => onModelLoaded(), 100);
    }
    
    // Calculate bounding box to center and scale the model properly
    const box = new THREE.Box3().setFromObject(clonedModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Find the largest dimension to scale uniformly
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 4 / maxDim;
    
    // Apply transformations
    clonedModel.scale.set(scale, scale, scale);
    clonedModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    clonedModel.rotation.set(0, 0, 0);

    return (
      <group ref={meshRef}>
        <primitive object={clonedModel} />
      </group>
    );
  }

  return null;
}

// Unified Model Loader Component (supports GLB from Google Drive)
function ModelLoader({ organName, score, onModelLoaded, onReloadModel }: { organName: string; score: number; onModelLoaded?: () => void; onReloadModel?: () => void }) {
  const [modelError, setModelError] = React.useState(false);
  const [errorDetails, setErrorDetails] = React.useState<string>('');
  const [modelExists, setModelExists] = React.useState<boolean | null>(null);
  const [modelUrl, setModelUrl] = React.useState<string>('');
  
  // Check if GLB model exists (Google Drive with multiple fallbacks)
  React.useEffect(() => {
    const checkModel = async () => {
      const organLower = organName.toLowerCase();
      
      // Try to import Google Cloud Storage cache utility
      try {
        const { getModelUrls, getFileName } = await import('@/utils/google-cloud-cache');
        const fileName = getFileName(organName, score);
        
        if (fileName) {
          const urls = getModelUrls(organName, score);
          console.log(`Trying ${urls.length} URLs for ${organLower}${score}:`, urls);
          
          // Try each URL in order (proxy first, then direct downloads)
          for (const url of urls) {
            try {
              console.log(`Testing URL: ${url}`);
              
              // For API routes, just set the URL without HEAD check
              // because the proxy will handle the actual download
              if (url.startsWith('/api/')) {
                setModelUrl(url);
                setModelExists(true);
                setModelError(false);
                console.log(`Using proxy URL: ${url}`);
                return;
              }
              
              // For direct URLs, try to fetch and assume success
              // (we can't reliably check due to CORS)
              await fetch(url, { 
                method: 'HEAD',
                mode: 'no-cors' // Bypass CORS for HEAD requests
              });
              
              // If no error thrown, assume success
              setModelUrl(url);
              setModelExists(true);
              setModelError(false);
              console.log(`Model accessible at: ${url}`);
              return;
            } catch (error) {
              console.warn(`Failed to access ${url}:`, error);
              // Continue to next URL
            }
          }
        }
      } catch (error) {
        console.warn('Google Drive cache not available:', error);
      }
      
      // Fallback to local GLB file
      const localPath = `/models/glb/${organLower}${score}.glb`;
      try {
        const response = await fetch(localPath, { method: 'HEAD' });
        if (response.ok) {
          setModelUrl(localPath);
          setModelExists(true);
          setModelError(false);
          console.log(`Using local model: ${localPath}`);
          return;
        }
      } catch {
        console.warn('Local model not found');
      }
      
      setModelExists(false);
      setModelError(true);
      setErrorDetails(`Model "${organLower}${score}.glb" not found in Google Drive or local storage. Check file ID configuration.`);
      console.error(`All URLs failed for ${organLower}${score}`);
    };
    
    checkModel();
  }, [organName, score]);

  // Show error message if model not found
  if (modelError && modelExists === false) {
    return (
      <Html center>
        <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-6 md:p-8 max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Model Not Found</h3>
          <p className="text-gray-300 text-sm mb-4">
            Could not load 3D model for <strong>{organName}</strong>
          </p>
          
          {errorDetails && (
            <div className="text-left bg-gray-800/50 rounded p-3 mb-4">
              <p className="text-red-400 text-xs mb-2">Error:</p>
              <code className="block text-[10px] text-gray-500">{errorDetails}</code>
            </div>
          )}
          
          {/* Reload Button */}
          {onReloadModel && (
            <button
              onClick={onReloadModel}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 mb-3"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reload Model
              </div>
            </button>
          )}
          
          <p className="text-xs text-gray-500">
            Check Google Drive configuration or upload GLB files locally
          </p>
        </div>
      </Html>
    );
  }
  
  // Loading state
  if (modelExists === null) {
    return (
      <Html center>
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-2"></div>
          <div className="text-sm">Loading GLB model...</div>
        </div>
      </Html>
    );
  }

  // Render the GLB model
  if (modelExists && modelUrl) {
    return <GLTFModelFromPath gltfPath={modelUrl} onModelLoaded={onModelLoaded} />;
  }

  return null;
}


function GLBModel({ modelUrl }: { modelUrl: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const [modelError, setModelError] = React.useState(false);
  
  // Load GLB/GLTF model from URL
  let gltf = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    gltf = useGLTF(modelUrl);
  } catch (error) {
    console.error('Failed to load GLB model:', error);
    if (!modelError) {
      setModelError(true);
    }
  }
  
  // Rotate the model slowly
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });
  
  // Show error message if model fails to load
  if (modelError || !gltf) {
    return (
      <Html center>
        <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-6 max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Failed to Load Model</h3>
          <p className="text-gray-300 text-sm mb-4">
            Could not load cached 3D model from URL
          </p>
          
          <p className="text-xs text-gray-500">
            The model may have been deleted or the URL is no longer valid. Try generating a new model.
          </p>
        </div>
      </Html>
    );
  }
  
  // Clone and transform the GLTF scene
  const scene = gltf.scene.clone();
  
  // Calculate bounding box to center and scale
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  
  // Find the largest dimension to scale uniformly
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 4 / maxDim; // Scale to fit in viewport
  
  // Apply transformations
  scene.scale.set(scale, scale, scale);
  scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  
  return (
    <group ref={meshRef}>
      <primitive object={scene} />
    </group>
  );
}

// High-Quality AI-Generated Procedural Organ with advanced materials
function ProceduralOrgan({ organName, score, imageData }: { organName: string; score?: number; imageData?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const organLower = organName.toLowerCase();

  // Generate high-quality organic geometry with advanced noise
  const geometry = React.useMemo(() => {
    const complexity = 128; // High resolution for better quality
    let baseGeometry: THREE.BufferGeometry;
    
    // Choose base shape based on organ
    if (organLower.includes('brain')) {
      baseGeometry = new THREE.SphereGeometry(1.5, complexity, complexity);
    } else if (organLower.includes('heart')) {
      baseGeometry = new THREE.SphereGeometry(1.2, complexity, complexity);
    } else if (organLower.includes('lung')) {
      baseGeometry = new THREE.SphereGeometry(1, complexity, complexity);
    } else if (organLower.includes('kidney')) {
      baseGeometry = new THREE.CapsuleGeometry(0.7, 2.0, complexity / 2, complexity);
    } else if (organLower.includes('liver')) {
      baseGeometry = new THREE.BoxGeometry(2.8, 1.8, 2.2, complexity / 2, complexity / 2, complexity / 2);
    } else {
      baseGeometry = new THREE.SphereGeometry(1.2, complexity, complexity);
    }

    // Advanced multi-octave noise for organic deformation
    const positions = baseGeometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    const baseDeformation = 0.08;
    const healthDeformation = score ? (score - 1) * 0.12 : 0.1;
    const totalDeformation = baseDeformation + healthDeformation;
    
    // Multiple noise layers for realistic detail
    const noiseScales = [1.5, 3.0, 6.0, 12.0];
    const noiseWeights = [0.5, 0.25, 0.15, 0.1];
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      const originalVertex = vertex.clone();
      
      let combinedNoise = 0;
      
      // Multi-octave noise for organic detail
      for (let j = 0; j < noiseScales.length; j++) {
        const scale = noiseScales[j];
        const weight = noiseWeights[j];
        
        const noise = 
          Math.sin(vertex.x * scale * 2.1 + vertex.y * scale * 1.7) *
          Math.cos(vertex.y * scale * 1.9 + vertex.z * scale * 2.3) *
          Math.sin(vertex.z * scale * 3.1 + vertex.x * scale * 1.9) +
          Math.cos(vertex.x * scale * 1.3 + vertex.z * scale * 2.7) *
          Math.sin(vertex.y * scale * 2.9 + vertex.x * scale * 1.1);
        
        combinedNoise += noise * weight;
      }
      
      // Add disease-specific irregularities
      if (score && score >= 4) {
        const lumpScale = 10.0;
        const lumpNoise = 
          Math.sin(vertex.x * lumpScale) *
          Math.cos(vertex.y * lumpScale) *
          Math.sin(vertex.z * lumpScale);
        
        if (lumpNoise > 0.4) {
          combinedNoise += lumpNoise * 0.3;
        }
      }
      
      const noiseValue = combinedNoise * totalDeformation;
      const normal = originalVertex.clone().normalize();
      vertex.add(normal.multiplyScalar(noiseValue));

      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    baseGeometry.attributes.position.needsUpdate = true;
    baseGeometry.computeVertexNormals();
    
    return baseGeometry;
  }, [organLower, score]);

  // Create texture from X-ray image if provided
  const texture = React.useMemo(() => {
    if (!imageData) return null;
    
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageData);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, [imageData]);

  // Animate the model with realistic breathing
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
      
      // Realistic breathing animation
      const time = state.clock.elapsedTime;
      const breathe = Math.sin(time * 0.8) * 0.015;
      const pulse = Math.sin(time * 1.2) * 0.008;
      meshRef.current.scale.setScalar(1 + breathe + pulse);
    }
  });

  // Enhanced color palette based on health score
  const getOrganColor = () => {
    if (!score) return new THREE.Color('#ff6b6b');
    
    const colors = [
      new THREE.Color('#cc1111'), // Score 5: Critical (dark red)
      new THREE.Color('#ff3344'), // Score 4: Severe (red)
      new THREE.Color('#ff7744'), // Score 3: Moderate (orange-red)
      new THREE.Color('#ffaa33'), // Score 2: Minor (orange)
      new THREE.Color('#66ff44'), // Score 1: Healthy (green)
    ];
    return colors[5 - score] || new THREE.Color('#ff6b6b');
  };

  const organColor = getOrganColor();

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={organColor}
        roughness={0.4}
        metalness={0.1}
        clearcoat={0.3}
        clearcoatRoughness={0.4}
        transparent
        opacity={0.95}
        emissive={organColor}
        emissiveIntensity={0.2}
        map={texture}
        // Subsurface scattering effect for organic look
        transmission={0.1}
        thickness={0.5}
        ior={1.4}
        // Normal map for surface detail
        normalScale={new THREE.Vector2(0.5, 0.5)}
      />
    </mesh>
  );
}

// Placeholder organ mesh (fallback) - simplified version
function PlaceholderOrgan({ organName }: { organName: string }) {
  return <ProceduralOrgan organName={organName} score={3} imageData={undefined} />;
}

// Main scene component
function Scene({ organName, score, useProceduralGeneration, useFBX, imageData, cachedModelUrl, onModelLoaded, onReloadModel }: { 
  organName: string; 
  score?: number; 
  useProceduralGeneration?: boolean;
  useFBX?: boolean;
  imageData?: string;
  cachedModelUrl?: string;
  onModelLoaded?: () => void;
  onReloadModel?: () => void;
}) {
  return (
    <>
      {/* Enhanced lighting for medical visualization */}
      <ambientLight intensity={0.4} />
      
      {/* Key light - main illumination */}
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.5} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Fill lights - reduce harsh shadows */}
      <directionalLight position={[-5, 3, 5]} intensity={0.6} />
      <directionalLight position={[0, -5, 3]} intensity={0.4} />
      
      {/* Rim light for depth */}
      <pointLight position={[0, 0, -5]} intensity={0.5} color="#4488ff" />
      
      {/* Top light for definition */}
      <spotLight 
        position={[0, 10, 0]} 
        angle={0.4} 
        intensity={0.6} 
        penumbra={0.5}
        castShadow 
      />
      
      {/* Environment for realistic reflections */}
      <Environment preset="studio" />
      
      {/* Subtle fog for depth */}
      <fog attach="fog" args={['#1a1a1a', 10, 25]} />
      
      {/* The 3D organ model */}
      <Suspense fallback={<Loader />}>
        {cachedModelUrl ? (
          // Load from cached AI-generated model URL
          <GLBModel modelUrl={cachedModelUrl} />
        ) : useFBX && score ? (
          // Load GLB model from public/models/glb/
          <ModelLoader organName={organName} score={score} onModelLoaded={onModelLoaded} onReloadModel={onReloadModel} />
        ) : useProceduralGeneration && score ? (
          // Show procedural generation
          <ProceduralOrgan organName={organName} score={score} imageData={imageData} />
        ) : (
          // Default placeholder when no model is ready (for AI services waiting for generation)
          <PlaceholderOrgan organName={organName} />
        )}
      </Suspense>
      
      {/* Camera controls - centered on origin */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={4}
        maxDistance={12}
        autoRotate={false}
        autoRotateSpeed={2}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        target={[0, 0, 0]}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
        panSpeed={0.8}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
      
      {/* Camera - positioned to view from front */}
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
    </>
  );
}

// Main exported component
export default function ThreeDViewer({ organName, score, useProceduralGeneration = false, useFBX = false, imageData, cachedModelUrl, onModelLoaded, onReloadModel }: ThreeDViewerProps) {
  // Detect if mobile device for optimized settings
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 relative shadow-xl">
      <Canvas
        shadows={!isMobile} // Disable shadows on mobile for better performance
        gl={{
          antialias: !isMobile, // Disable antialiasing on mobile for performance
          alpha: false,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]} // Lower DPR on mobile
        className="touch-auto" // Changed from touch-none to allow touch events
        style={{ touchAction: 'none' }} // Prevent default touch behaviors
      >
        <Scene organName={organName} score={score} useProceduralGeneration={useProceduralGeneration} useFBX={useFBX} imageData={imageData} cachedModelUrl={cachedModelUrl} onModelLoaded={onModelLoaded} onReloadModel={onReloadModel} />
      </Canvas>
      
      {/* Model info overlay */}
      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-gray-700/30">
        <p className="text-white text-xs md:text-sm font-semibold">
          {organName} {score ? `• Score ${score}/5` : ''}
        </p>
        <p className="text-gray-300 text-[10px] md:text-xs mt-0.5 md:mt-1">
          {isMobile ? 'Touch to rotate • Pinch to zoom' : 'Drag to rotate • Scroll to zoom'}
        </p>
        <p className="text-gray-300 text-xs sm:hidden mt-1">
          Touch to rotate • Pinch to zoom
        </p>
      </div>
    </div>
  );
}
