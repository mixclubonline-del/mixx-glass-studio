/**
 * Mixx Club Studio - 3D Waveform Visualization
 * Immersive waveform display with depth and color
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface Waveform3DProps {
  audioData: number[];
  isPlaying: boolean;
  color?: string;
  height?: number;
  width?: number;
}

function WaveformMesh({ 
  audioData, 
  isPlaying, 
  color = "#8B5CF6",
  height = 2,
  width = 8
}: Waveform3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [material, setMaterial] = useState<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    // Create waveform geometry
    const points: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    
    const segments = audioData.length;
    // const stepX = width / segments;
    
    for (let i = 0; i < segments; i++) {
      const x = (i / segments) * width - width / 2;
      const y = audioData[i] * height;
      
      // Create vertices for the waveform
      points.push(x, y, 0);
      points.push(x, -y, 0);
      
      // Create colors based on amplitude
      const intensity = Math.abs(audioData[i]);
      const hue = (intensity * 0.3 + 0.5) % 1; // Blue to purple
      const rgb = new THREE.Color().setHSL(hue, 0.8, 0.6);
      colors.push(rgb.r, rgb.g, rgb.b);
      colors.push(rgb.r, rgb.g, rgb.b);
      
      // Create triangles
      if (i < segments - 1) {
        const baseIndex = i * 2;
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
        indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
      }
    }
    
    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    newGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    newGeometry.setIndex(indices);
    newGeometry.computeVertexNormals();
    
    setGeometry(newGeometry);
    
    const newMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.2
    });
    
    setMaterial(newMaterial);
  }, [audioData, color, height, width]);

  useFrame((state) => {
    if (meshRef.current && isPlaying) {
      // Animate the waveform
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      // Update emissive intensity based on playback
      if (material) {
        material.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      }
    }
  });

  if (!geometry || !material) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}

function Playhead({ width = 8 }: { width: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      const progress = 0.5; // Static position for now
      meshRef.current.position.x = (progress - 0.5) * width;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0.1]}>
      <boxGeometry args={[0.05, 4, 0.1]} />
      <meshStandardMaterial
        color="#FFFFFF"
        transparent
        opacity={0.8}
        emissive="#FFFFFF"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

function FrequencyBands({ audioData }: { audioData: number[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const [bands, setBands] = useState<Array<{ position: [number, number, number]; scale: [number, number, number]; color: string }>>([]);

  useEffect(() => {
    // Create frequency bands from audio data
    const bandCount = 16;
    const newBands = Array.from({ length: bandCount }, (_, i) => {
      const start = Math.floor((i / bandCount) * audioData.length);
      const end = Math.floor(((i + 1) / bandCount) * audioData.length);
      const avgAmplitude = audioData.slice(start, end).reduce((sum, val) => sum + Math.abs(val), 0) / (end - start);
      
      return {
        position: [i * 0.5 - (bandCount * 0.25), 0, -2] as [number, number, number],
        scale: [0.3, avgAmplitude * 3, 0.1] as [number, number, number],
        color: new THREE.Color().setHSL(
          (avgAmplitude * 0.3 + 0.5) % 1,
          0.8,
          0.6 + avgAmplitude * 0.4
        ).getHexString()
      };
    });
    
    setBands(newBands);
  }, [audioData]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {bands.map((band, index) => (
        <mesh key={index} position={band.position} scale={band.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={`#${band.color}`}
            transparent
            opacity={0.7}
            emissive={`#${band.color}`}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

const Waveform3D: React.FC<Waveform3DProps> = ({
  audioData,
  isPlaying,
  color = "#8B5CF6",
  height = 2,
  width = 8
}) => {
  const [localAudioData, setLocalAudioData] = useState(audioData);

  useEffect(() => {
    setLocalAudioData(audioData);
  }, [audioData]);

  // Generate sample audio data if none provided
  useEffect(() => {
    if (localAudioData.length === 0) {
      const sampleData = Array.from({ length: 512 }, () => Math.random() * 2 - 1);
      setLocalAudioData(sampleData);
    }
  }, [localAudioData.length]);

  return (
    <div className="w-full h-96 relative">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#8B5CF6" />
        
        <Environment preset="studio" />
        
        {/* Main Waveform */}
        <WaveformMesh
          audioData={localAudioData}
          isPlaying={isPlaying}
          color={color}
          height={height}
          width={width}
        />
        
        {/* Playhead */}
        <Playhead width={width} />
        
        {/* Frequency Bands */}
        <FrequencyBands audioData={localAudioData} />
        
        {/* Labels */}
        <Text
          position={[0, height + 1, 0]}
          fontSize={0.3}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          WAVEFORM
        </Text>
        
        <Text
          position={[0, -height - 1, 0]}
          fontSize={0.2}
          color="#C084FC"
          anchorX="center"
          anchorY="middle"
        >
          {isPlaying ? 'PLAYING' : 'STOPPED'}
        </Text>
      </Canvas>
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div className="glass-panel p-3">
          <div className="text-white text-sm font-bold mb-1">3D WAVEFORM</div>
          <div className="text-xs text-purple-300">
            Status: <span className={isPlaying ? 'text-green-400' : 'text-red-400'}>
              {isPlaying ? 'PLAYING' : 'STOPPED'}
            </span>
          </div>
          <div className="text-xs text-purple-300">
            Time: <span className="text-white">0.0s / 180.0s</span>
          </div>
        </div>
        
        <div className="glass-panel p-3">
          <div className="text-xs text-purple-300 mb-1">ANALYSIS</div>
          <div className="text-xs text-white">
            Samples: {localAudioData.length}
          </div>
          <div className="text-xs text-white">
            Max: {Math.max(...localAudioData).toFixed(3)}
          </div>
          <div className="text-xs text-white">
            Min: {Math.min(...localAudioData).toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waveform3D;
