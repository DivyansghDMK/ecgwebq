import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';

function CardioXImage3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture('/cardiox-3d.png');
  const [dimensions, setDimensions] = useState({ width: 4, height: 3 });

  // Calculate aspect ratio when texture loads
  useEffect(() => {
    if (texture.image) {
      const img = texture.image as any;
      if (img && typeof img.width === 'number' && typeof img.height === 'number') {
        const aspectRatio = img.width / img.height;
        const width = 4;
        const height = width / aspectRatio;
        setDimensions({ width, height });
      }
    }
  }, [texture]);

  // Gentle auto-rotate animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
    }
  });

  return (
    <group>
      {/* Main image plane */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[dimensions.width, dimensions.height]} />
        <meshStandardMaterial 
          map={texture} 
          metalness={0.1}
          roughness={0.3}
          side={THREE.DoubleSide}
          toneMapped={true}
        />
      </mesh>
    </group>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-white/60">Loading 3D Model...</div>
    </div>
  );
}

export function CardioX3DModel({ className }: { className?: string }) {
  return (
    <div className={`relative h-full w-full ${className || ''}`}>
      <Canvas
        className="h-full w-full"
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        {/* Enhanced lighting setup - even lighting to prevent black areas */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, 5, 5]} intensity={0.8} />
        <directionalLight position={[5, -5, 5]} intensity={0.6} />
        <directionalLight position={[-5, -5, 5]} intensity={0.6} />
        <pointLight position={[0, 0, 5]} intensity={0.5} color="#ff8a3d" />
        <pointLight position={[0, 0, -5]} intensity={0.4} color="#00d4ff" />
        <Suspense fallback={null}>
          <CardioXImage3D />
        </Suspense>
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          minDistance={4}
          maxDistance={10}
          autoRotate={false}
          autoRotateSpeed={0.5}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 text-xs text-white/70 backdrop-blur-sm">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}

