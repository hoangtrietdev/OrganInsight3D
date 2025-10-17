'use client';

/**
 * 3D Organ Viewer Component
 * 
 * Supports two rendering modes:
 * 1. FBX Models: Load pre-made 3D models from /public/models/
 * 2. AI-Generated (Procedural): Dynamically generate organic 3D shapes using noise algorithms
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
import { OrbitControls, PerspectiveCamera, Environment, useProgress, Html, useFBX, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeDViewerProps {
  organName: string;
  score?: number; // Score from 1-5 for loading specific models
  useProceduralGeneration?: boolean; // Use enhanced procedural generation
  useFBX?: boolean; // Use pre-loaded FBX models from public/models
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

// FBX Model Loader Component with error handling
function FBXModel({ organName, score, onModelLoaded, onReloadModel }: { organName: string; score: number; onModelLoaded?: () => void; onReloadModel?: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const [modelError, setModelError] = React.useState(false);
  const [hasNotifiedLoad, setHasNotifiedLoad] = React.useState(false);
  
  // Determine model path based on organ and score
  const organLower = organName.toLowerCase();
  const modelPath = `/models/${organLower}${score}/${organLower}${score}.fbx`;

  // Load FBX model with error handling
  let fbx = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    fbx = useFBX(modelPath);
  } catch (error) {
    console.log(`FBX model not found at ${modelPath}`, error);
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

  // Show error message if model not found
  if (modelError || !fbx) {
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
          
          <p className="text-gray-400 text-xs mb-6">
            Path: <code className="bg-gray-800 px-2 py-1 rounded">{modelPath}</code>
          </p>
          
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
            Make sure the FBX file exists in the public/models folder
          </p>
        </div>
      </Html>
    );
  }

  if (fbx) {
    // Clone the FBX model to avoid mutations
    const clonedFBX = fbx.clone();
    
    // Notify parent that model loaded successfully
    if (onModelLoaded && !hasNotifiedLoad) {
      setHasNotifiedLoad(true);
      setTimeout(() => onModelLoaded(), 100); // Small delay to ensure render
    }
    
    // Calculate bounding box to center and scale the model properly
    const box = new THREE.Box3().setFromObject(clonedFBX);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Find the largest dimension to scale uniformly
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 4 / maxDim; // Scale to fit in viewport (target size: 4 units)
    
    // Apply transformations
    clonedFBX.scale.set(scale, scale, scale);
    clonedFBX.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    
    // Rotate to face front (adjust based on your model's initial orientation)
    clonedFBX.rotation.set(0, 0, 0);

    return (
      <group ref={meshRef}>
        <primitive object={clonedFBX} />
      </group>
    );
  }

  return null;
}

// GLB/GLTF Model Loader for AI-generated cached models
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
          // Only show FBX when explicitly in procedural mode
          <FBXModel organName={organName} score={score} onModelLoaded={onModelLoaded} onReloadModel={onReloadModel} />
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
      />
      
      {/* Camera - positioned to view from front */}
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
    </>
  );
}

// Main exported component
export default function ThreeDViewer({ organName, score, useProceduralGeneration = false, useFBX = false, imageData, cachedModelUrl, onModelLoaded, onReloadModel }: ThreeDViewerProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 relative shadow-xl">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 2]}
        className="touch-none"
      >
        <Scene organName={organName} score={score} useProceduralGeneration={useProceduralGeneration} useFBX={useFBX} imageData={imageData} cachedModelUrl={cachedModelUrl} onModelLoaded={onModelLoaded} onReloadModel={onReloadModel} />
      </Canvas>
      
      {/* Model info overlay */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-gray-700/30">
        <p className="text-white text-sm font-semibold">
          {organName} {score ? `• Score ${score}/5` : ''}
        </p>
        <p className="text-gray-300 text-xs hidden sm:block mt-1">
          Drag to rotate • Scroll to zoom
        </p>
        <p className="text-gray-300 text-xs sm:hidden mt-1">
          Touch to rotate • Pinch to zoom
        </p>
      </div>
    </div>
  );
}
