/**
 * Mixx Club Studio - PRIME BRAIN Core
 * 3D visualization of the central AI processing unit
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, OrbitControls, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface PrimeBrainCoreProps {
  isActive: boolean;
  intensity: number;
  onStateChange?: (isActive: boolean) => void;
}

function BrainSphere({ isActive, intensity }: { isActive: boolean; intensity: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      
      // Pulsing scale based on intensity
      const scale = isActive ? 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1 * intensity : 1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Sphere
      ref={meshRef}
      args={[1, 64, 64]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <MeshDistortMaterial
        color={isActive ? "#8B5CF6" : "#4A5568"}
        transparent
        opacity={0.8}
        distort={isActive ? intensity * 0.3 : 0}
        speed={isActive ? 2 : 0.5}
        roughness={0.1}
        metalness={0.8}
        envMapIntensity={1}
      />
    </Sphere>
  );
}

function NeuralConnections({ isActive, intensity }: { isActive: boolean; intensity: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [connections, setConnections] = useState<Array<{ start: THREE.Vector3; end: THREE.Vector3 }>>([]);

  useEffect(() => {
    // Generate neural connection points
    const newConnections = Array.from({ length: 12 }, () => ({
      start: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      ),
      end: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      )
    }));
    setConnections(newConnections);
  }, []);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {connections.map((connection, index) => (
        <line key={index}>
          <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([
              connection.start.x, connection.start.y, connection.start.z,
              connection.end.x, connection.end.y, connection.end.z
            ])}
            itemSize={3}
            args={[new Float32Array([
              connection.start.x, connection.start.y, connection.start.z,
              connection.end.x, connection.end.y, connection.end.z
            ]), 3]}
          />
          </bufferGeometry>
          <lineBasicMaterial
            color={isActive ? "#C084FC" : "#6B7280"}
            transparent
            opacity={isActive ? 0.6 + intensity * 0.4 : 0.2}
            linewidth={2}
          />
        </line>
      ))}
    </group>
  );
}

function EnergyParticles({ isActive, intensity }: { isActive: boolean; intensity: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const [particles, setParticles] = useState<Float32Array>(new Float32Array());

  useEffect(() => {
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    
    setParticles(positions);
  }, []);

  useFrame((state) => {
    if (pointsRef.current && isActive) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={isActive ? "#F59E0B" : "#6B7280"}
        size={isActive ? 0.02 + intensity * 0.01 : 0.01}
        transparent
        opacity={isActive ? 0.8 : 0.3}
        sizeAttenuation
      />
    </points>
  );
}

const PrimeBrainCore: React.FC<PrimeBrainCoreProps> = ({ 
  isActive, 
  intensity, 
  onStateChange 
}) => {
  const [localIntensity, setLocalIntensity] = useState(intensity);

  useEffect(() => {
    setLocalIntensity(intensity);
  }, [intensity]);

  return (
    <div className="w-full h-96 relative">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={isActive ? 1 : 0.5} />
        <pointLight position={[-10, -10, -10]} intensity={isActive ? 0.8 : 0.3} color="#8B5CF6" />
        
        <Environment preset="studio" />
        
        <BrainSphere isActive={isActive} intensity={localIntensity} />
        <NeuralConnections isActive={isActive} intensity={localIntensity} />
        <EnergyParticles isActive={isActive} intensity={localIntensity} />
        
        <Text
          position={[0, -2.5, 0]}
          fontSize={0.3}
          color={isActive ? "#FFFFFF" : "#9CA3AF"}
          anchorX="center"
          anchorY="middle"
        >
          PRIME BRAIN
        </Text>
        
        <Text
          position={[0, -3, 0]}
          fontSize={0.15}
          color={isActive ? "#C084FC" : "#6B7280"}
          anchorX="center"
          anchorY="middle"
        >
          {isActive ? 'ACTIVE' : 'STANDBY'}
        </Text>
        
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          autoRotate={isActive}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div className="glass-panel p-3">
          <div className="text-white text-sm font-bold mb-1">PRIME BRAIN</div>
          <div className="text-xs text-purple-300">
            Status: <span className={isActive ? 'text-green-400' : 'text-red-400'}>
              {isActive ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
          <div className="text-xs text-purple-300">
            Intensity: <span className="text-white">{Math.round(localIntensity * 100)}%</span>
          </div>
        </div>
        
        <button
          onClick={() => onStateChange?.(!isActive)}
          className="glass-panel p-3 flow-interactive"
        >
          <div className="text-white text-sm font-bold">
            {isActive ? '⏸️ PAUSE' : '▶️ ACTIVATE'}
          </div>
        </button>
      </div>
    </div>
  );
};

export default PrimeBrainCore;
