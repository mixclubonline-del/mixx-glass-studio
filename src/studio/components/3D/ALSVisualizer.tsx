/**
 * Mixx Club Studio - 3D ALS Visualizer
 * Advanced Leveling System with 3D visual feedback
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface ALSData {
  level: number;
  peak: number;
  rms: number;
  lufs: number;
  phase: number;
  stereo: number;
  dynamics: number;
  frequency: number[];
  harmonics: number[];
}

interface ALSVisualizerProps {
  data: ALSData;
  isActive: boolean;
  mode: 'master' | 'track' | 'bus';
}

function FrequencyBars({ data, isActive }: { data: ALSData; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [bars, setBars] = useState<Array<{ position: [number, number, number]; scale: [number, number, number] }>>([]);

  useEffect(() => {
    const newBars = data.frequency.map((freq, i) => ({
      position: [i * 0.2 - (data.frequency.length * 0.1), 0, 0] as [number, number, number],
      scale: [0.1, freq * 2, 0.1] as [number, number, number]
    }));
    setBars(newBars);
  }, [data.frequency]);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {bars.map((bar, index) => (
        <Box
          key={index}
          position={bar.position}
          scale={bar.scale}
        >
          <meshStandardMaterial
            color={new THREE.Color().setHSL(
              (data.frequency[index] * 0.5 + 0.5) * 0.3, // Blue to purple
              0.8,
              0.6 + data.frequency[index] * 0.4
            )}
            transparent
            opacity={0.8}
            emissive={new THREE.Color().setHSL(
              (data.frequency[index] * 0.5 + 0.5) * 0.3,
              0.8,
              data.frequency[index] * 0.2
            )}
            emissiveIntensity={isActive ? data.frequency[index] : 0}
          />
        </Box>
      ))}
    </group>
  );
}

function LevelMeter({ level, peak, isActive }: { level: number; peak: number; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const targetHeight = level * 3;
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetHeight, 0.1);
      
      if (isActive) {
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.05;
      }
    }
  });

  const getColor = (value: number) => {
    if (value > 0.9) return "#EF4444"; // Red
    if (value > 0.7) return "#F59E0B"; // Orange
    if (value > 0.5) return "#10B981"; // Green
    return "#3B82F6"; // Blue
  };

  return (
    <group>
      <Box
        ref={meshRef}
        position={[0, 0, 0]}
        scale={[0.2, 1, 0.2]}
      >
        <meshStandardMaterial
          color={getColor(level)}
          transparent
          opacity={0.8}
          emissive={getColor(level)}
          emissiveIntensity={isActive ? level * 0.5 : 0}
        />
      </Box>
      
      {/* Peak indicator */}
      <Box
        position={[0, peak * 3, 0]}
        scale={[0.3, 0.05, 0.3]}
      >
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={peak > 0.8 ? 1 : 0.5}
          emissive="#FFFFFF"
          emissiveIntensity={peak > 0.8 ? 1 : 0}
        />
      </Box>
    </group>
  );
}

function PhaseVisualizer({ phase, isActive }: { phase: number; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current && isActive) {
      groupRef.current.rotation.z = phase * Math.PI;
    }
  });

  return (
    <group ref={groupRef}>
      <Box position={[0, 0, 0]} scale={[0.1, 0.1, 0.1]}>
        <meshStandardMaterial
          color={Math.abs(phase) > 0.8 ? "#EF4444" : Math.abs(phase) > 0.5 ? "#F59E0B" : "#10B981"}
          transparent
          opacity={0.8}
          emissive={Math.abs(phase) > 0.8 ? "#EF4444" : "#000000"}
          emissiveIntensity={Math.abs(phase) > 0.8 ? 0.5 : 0}
        />
      </Box>
    </group>
  );
}

function StereoField({ stereo, isActive }: { stereo: number; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * stereo * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Left channel */}
      <Box position={[-stereo, 0, 0]} scale={[0.1, 0.5, 0.1]}>
        <meshStandardMaterial
          color="#3B82F6"
          transparent
          opacity={0.6}
          emissive="#3B82F6"
          emissiveIntensity={isActive ? stereo * 0.3 : 0}
        />
      </Box>
      
      {/* Right channel */}
      <Box position={[stereo, 0, 0]} scale={[0.1, 0.5, 0.1]}>
        <meshStandardMaterial
          color="#8B5CF6"
          transparent
          opacity={0.6}
          emissive="#8B5CF6"
          emissiveIntensity={isActive ? stereo * 0.3 : 0}
        />
      </Box>
    </group>
  );
}

const ALSVisualizer: React.FC<ALSVisualizerProps> = ({ data, isActive, mode }) => {
  return (
    <div className="w-full h-80 relative">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={isActive ? 1 : 0.5} />
        <pointLight position={[-5, -5, -5]} intensity={isActive ? 0.8 : 0.3} color="#8B5CF6" />
        
        <Environment preset="studio" />
        
        {/* Frequency Analysis */}
        <group position={[-3, 0, 0]}>
          <FrequencyBars data={data} isActive={isActive} />
          <Text
            position={[0, -2, 0]}
            fontSize={0.2}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
          >
            FREQUENCY
          </Text>
        </group>
        
        {/* Level Meters */}
        <group position={[0, 0, 0]}>
          <LevelMeter level={data.level} peak={data.peak} isActive={isActive} />
          <Text
            position={[0, -2, 0]}
            fontSize={0.2}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
          >
            LEVEL
          </Text>
        </group>
        
        {/* Phase Analysis */}
        <group position={[3, 0, 0]}>
          <PhaseVisualizer phase={data.phase} isActive={isActive} />
          <Text
            position={[0, -2, 0]}
            fontSize={0.2}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
          >
            PHASE
          </Text>
        </group>
        
        {/* Stereo Field */}
        <group position={[0, -3, 0]}>
          <StereoField stereo={data.stereo} isActive={isActive} />
          <Text
            position={[0, -1, 0]}
            fontSize={0.2}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
          >
            STEREO
          </Text>
        </group>
      </Canvas>
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div className="glass-panel p-3">
          <div className="text-white text-sm font-bold mb-1">ALS VISUALIZER</div>
          <div className="text-xs text-purple-300">
            Mode: <span className="text-white">{mode.toUpperCase()}</span>
          </div>
          <div className="text-xs text-purple-300">
            Status: <span className={isActive ? 'text-green-400' : 'text-red-400'}>
              {isActive ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>
        
        <div className="glass-panel p-3">
          <div className="text-xs text-purple-300 mb-1">LEVELS</div>
          <div className="text-xs text-white">
            Peak: {Math.round(data.peak * 100)}%
          </div>
          <div className="text-xs text-white">
            RMS: {Math.round(data.rms * 100)}%
          </div>
          <div className="text-xs text-white">
            LUFS: {data.lufs.toFixed(1)} dB
          </div>
        </div>
      </div>
    </div>
  );
};

export default ALSVisualizer;
