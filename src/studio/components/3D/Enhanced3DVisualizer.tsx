/**
 * Mixx Club Studio - Enhanced 3D Audio Visualization System
 * Real-time spectral data binding with professional visualization
 * Integrates RealTimeAudioAnalyzer output with Three.js 3D rendering
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Line, Text, OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { CompleteAnalysis } from '../../../utils/RealTimeAudioAnalyzer';

interface Enhanced3DProps {
  analysisData: CompleteAnalysis | null;
  isActive: boolean;
  mode: 'waveform' | 'spectrum' | 'harmonic' | 'meters' | 'combined';
  interactiveMode?: boolean;
}

// Spectrum Analyzer Visualization - Real-time frequency bands
function SpectrumAnalyzer3D({ analysisData, isActive }: { analysisData: CompleteAnalysis | null; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const barsRef = useRef<THREE.Mesh[]>([]);
  const [barCount] = useState(64); // 64 frequency bands

  useEffect(() => {
    if (!analysisData || !groupRef.current) return;

    // Distribute magnitude data across bars
    const magnitudesPerBar = analysisData.spectrum.magnitudes.length / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const startIdx = Math.floor(i * magnitudesPerBar);
      const endIdx = Math.floor((i + 1) * magnitudesPerBar);
      
      // Calculate average magnitude for this band
      let avgMagnitude = 0;
      for (let j = startIdx; j < endIdx && j < analysisData.spectrum.magnitudes.length; j++) {
        avgMagnitude += analysisData.spectrum.magnitudes[j];
      }
      avgMagnitude /= (endIdx - startIdx);
      
      // Map to dB scale
      const magnitude = Math.log10(avgMagnitude + 1e-10) + 2; // Offset for visibility
      
      if (barsRef.current[i]) {
        // Smooth interpolation
        barsRef.current[i].scale.y = THREE.MathUtils.lerp(
          barsRef.current[i].scale.y,
          Math.max(0.05, magnitude * 1.5),
          0.15
        );
      }
    }
  }, [analysisData, barCount]);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      // Subtle rotation for visual interest
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
      groupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: barCount }).map((_, i) => {
        const hue = (i / barCount) * 0.8; // Blue to red spectrum
        
        return (
          <Box
            key={i}
            ref={(el) => {
              if (el) barsRef.current[i] = el as THREE.Mesh;
            }}
            position={[
              (i - barCount / 2) * 0.15,
              0.5,
              0
            ]}
            scale={[0.12, 0.5, 0.08]}
          >
            <meshStandardMaterial
              color={new THREE.Color().setHSL(hue, 0.9, 0.6)}
              transparent
              opacity={0.85}
              emissive={new THREE.Color().setHSL(hue, 0.9, 0.3)}
              emissiveIntensity={isActive ? 0.4 : 0.1}
              wireframe={false}
            />
          </Box>
        );
      })}
      
      {/* Frequency reference labels */}
      <Text position={[-5, -0.5, 0]} fontSize={0.3} color="#888888">
        20Hz
      </Text>
      <Text position={[0, -0.5, 0]} fontSize={0.3} color="#888888">
        10kHz
      </Text>
      <Text position={[5, -0.5, 0]} fontSize={0.3} color="#888888">
        20kHz
      </Text>
    </group>
  );
}

// Waveform Energy Visualization - Dynamic 3D waveform
function Waveform3DEnhanced({ analysisData, isActive }: { analysisData: CompleteAnalysis | null; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const timeHistoryRef = useRef<Float32Array[]>([]);
  const maxHistoryRef = useRef(120); // Store 2 seconds at 60fps

  useEffect(() => {
    if (!analysisData) return;

    // Store time domain data
    if (!timeHistoryRef.current) {
      timeHistoryRef.current = [];
    }

    // Add current frame
    timeHistoryRef.current.push(new Float32Array(analysisData.spectrum.magnitudes));
    
    // Maintain history
    if (timeHistoryRef.current.length > maxHistoryRef.current) {
      timeHistoryRef.current.shift();
    }

    // Create 3D waveform from history
    const points: number[] = [];
    const colors: number[] = [];
    
    timeHistoryRef.current.forEach((frame, frameIdx) => {
      const z = (frameIdx / timeHistoryRef.current.length) * 8 - 4;
      const samples = Math.min(128, frame.length);
      
      for (let i = 0; i < samples; i++) {
        const x = (i / samples) * 8 - 4;
        const y = (frame[i] + 1e-10) * 2; // Convert to dB scale
        
        points.push(x, y, z);
        
        // Color gradient over time
        const intensity = Math.min(1, (frame[i] + 1e-10) * 10);
        const hue = 0.6 + intensity * 0.2; // Cyan to purple
        const rgb = new THREE.Color().setHSL(hue, 0.8, 0.5 + intensity * 0.3);
        colors.push(rgb.r, rgb.g, rgb.b);
      }
    });

    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    newGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    setGeometry(newGeometry);
  }, [analysisData]);

  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.3;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  if (!geometry) return null;

  return (
    <lineSegments ref={meshRef} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.6} />
    </lineSegments>
  );
}

// Harmonic Overtone Visualization
function HarmonicOvertones({ analysisData, isActive }: { analysisData: CompleteAnalysis | null; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [harmonics, setHarmonics] = useState<Array<{ freq: number; amp: number; harmonic: number }>>([]);

  useEffect(() => {
    if (!analysisData) return;

    // Detect harmonics from fundamental frequency
    const fundamental = analysisData.frequency.spectralCentroid; // Approximate fundamental
    const overtones = Array.from({ length: 12 }, (_, i) => {
      const harmonic = i + 1;
      const expectedFreq = fundamental * harmonic;
      
      // Find energy at this frequency
      const binIndex = Math.floor((expectedFreq / 20000) * analysisData.spectrum.magnitudes.length);
      const magnitude = binIndex < analysisData.spectrum.magnitudes.length 
        ? analysisData.spectrum.magnitudes[binIndex] 
        : 0;
      
      return {
        freq: expectedFreq,
        amp: magnitude,
        harmonic
      };
    }).filter(h => h.amp > 0.01);

    setHarmonics(overtones);
  }, [analysisData]);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {harmonics.map((harmonic, idx) => {
        const angle = (idx / Math.max(1, harmonics.length)) * Math.PI * 2;
        const radius = 2 + harmonic.amp * 3;
        
        return (
          <Box
            key={idx}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              0
            ]}
            scale={[0.2, 0.2, harmonic.amp * 1.5]}
          >
            <meshStandardMaterial
              color={new THREE.Color().setHSL(idx / 12, 0.8, 0.5 + harmonic.amp * 0.3)}
              transparent
              opacity={0.7}
              emissive={new THREE.Color().setHSL(idx / 12, 0.8, 0.3)}
              emissiveIntensity={isActive ? harmonic.amp : 0.1}
            />
          </Box>
        );
      })}
      
      {/* Circular reference */}
      {Array.from({ length: 4 }).map((_, i) => {
        const radius = 1 + i * 1.2;
        const points = Array.from({ length: 64 }, (_, j) => {
          const angle = (j / 64) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0
          );
        });
        
        return (
          <Line
            key={i}
            points={points}
            color="#666666"
            opacity={0.3}
            transparent
            linewidth={1}
          />
        );
      })}
    </group>
  );
}

// Professional Metering Visualization
function ProfessionalMeters({ analysisData, isActive }: { analysisData: CompleteAnalysis | null; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const lufsBarRef = useRef<THREE.Mesh>(null);
  const peakBarRef = useRef<THREE.Mesh>(null);
  const rmsBarRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!analysisData || !isActive) return;

    // LUFS meter (scale: -30 to 0 dB)
    if (lufsBarRef.current) {
      const lufsNorm = Math.max(0, Math.min(1, (analysisData.metering.lufs + 30) / 30));
      lufsBarRef.current.scale.y = THREE.MathUtils.lerp(
        lufsBarRef.current.scale.y,
        lufsNorm * 2,
        0.2
      );
    }

    // True Peak (scale: -24 to 0 dB)
    if (peakBarRef.current) {
      const peakNorm = Math.max(0, Math.min(1, (analysisData.metering.truePeak + 24) / 24));
      peakBarRef.current.scale.y = THREE.MathUtils.lerp(
        peakBarRef.current.scale.y,
        peakNorm * 2,
        0.2
      );
    }

    // RMS meter
    if (rmsBarRef.current) {
      const rmsDb = 20 * Math.log10(analysisData.metering.rms + 1e-10);
      const rmsNorm = Math.max(0, Math.min(1, (rmsDb + 60) / 60));
      rmsBarRef.current.scale.y = THREE.MathUtils.lerp(
        rmsBarRef.current.scale.y,
        rmsNorm * 2,
        0.2
      );
    }
  });

  const getMeterColor = (value: number, max: number): number => {
    const norm = Math.min(1, value / max);
    if (norm > 0.9) return 0; // Red
    if (norm > 0.7) return 0.08; // Orange
    if (norm > 0.5) return 0.3; // Yellow
    return 0.6; // Green
  };

  if (!analysisData) return null;

  const lufsHue = getMeterColor(analysisData.metering.lufs, 0);
  const peakHue = getMeterColor(analysisData.metering.truePeak, 0);
  const rmsHue = getMeterColor(analysisData.metering.rms, 1);

  return (
    <group ref={groupRef} position={[-3, 0, 0]}>
      {/* LUFS Meter */}
      <group position={[0, 0, 0]}>
        <Box ref={lufsBarRef} position={[0, 1, 0]} scale={[0.4, 2, 0.2]}>
          <meshStandardMaterial
            color={new THREE.Color().setHSL(lufsHue, 0.9, 0.6)}
            emissive={new THREE.Color().setHSL(lufsHue, 0.9, 0.3)}
            emissiveIntensity={0.5}
          />
        </Box>
        <Text position={[0, -0.8, 0]} fontSize={0.25} color="#AAAAAA">
          LUFS
        </Text>
      </group>

      {/* True Peak Meter */}
      <group position={[1.2, 0, 0]}>
        <Box ref={peakBarRef} position={[0, 1, 0]} scale={[0.4, 2, 0.2]}>
          <meshStandardMaterial
            color={new THREE.Color().setHSL(peakHue, 0.9, 0.6)}
            emissive={new THREE.Color().setHSL(peakHue, 0.9, 0.3)}
            emissiveIntensity={0.5}
          />
        </Box>
        <Text position={[0, -0.8, 0]} fontSize={0.25} color="#AAAAAA">
          PEAK
        </Text>
      </group>

      {/* RMS Meter */}
      <group position={[2.4, 0, 0]}>
        <Box ref={rmsBarRef} position={[0, 1, 0]} scale={[0.4, 2, 0.2]}>
          <meshStandardMaterial
            color={new THREE.Color().setHSL(rmsHue, 0.9, 0.6)}
            emissive={new THREE.Color().setHSL(rmsHue, 0.9, 0.3)}
            emissiveIntensity={0.5}
          />
        </Box>
        <Text position={[0, -0.8, 0]} fontSize={0.25} color="#AAAAAA">
          RMS
        </Text>
      </group>

      {/* Quality Indicator */}
      <Box position={[3.6, 1.2, 0]} scale={[0.8, 0.8, 0.2]}>
        <meshStandardMaterial
          color={new THREE.Color().setHSL(
            analysisData.quality === 'excellent' ? 0.3 :
            analysisData.quality === 'good' ? 0.35 :
            analysisData.quality === 'fair' ? 0.08 : 0,
            0.8,
            0.6
          )}
          emissive={new THREE.Color().setHSL(
            analysisData.quality === 'excellent' ? 0.3 :
            analysisData.quality === 'good' ? 0.35 :
            analysisData.quality === 'fair' ? 0.08 : 0,
            0.8,
            0.3
          )}
          emissiveIntensity={0.6}
        />
      </Box>
      <Text position={[3.6, 1.2, 0.15]} fontSize={0.3} color="#FFFFFF">
        {analysisData.quality.charAt(0).toUpperCase()}
      </Text>
    </group>
  );
}

// Combined 3D Scene
function Enhanced3DScene({ analysisData, isActive, mode, interactiveMode = false }: Enhanced3DProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={60} />
      <OrbitControls 
        enabled={interactiveMode}
        enableRotate={interactiveMode}
        enableZoom={interactiveMode}
        enablePan={interactiveMode}
        autoRotate={!interactiveMode && isActive}
        autoRotateSpeed={interactiveMode ? 0 : 2}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, 5]} intensity={0.4} color="#4F46E5" />
      
      {/* Environment */}
      <Environment preset="city" />
      
      {/* Visualization Components */}
      {(mode === 'spectrum' || mode === 'combined') && (
        <SpectrumAnalyzer3D analysisData={analysisData} isActive={isActive} />
      )}
      
      {(mode === 'waveform' || mode === 'combined') && (
        <Waveform3DEnhanced analysisData={analysisData} isActive={isActive} />
      )}
      
      {(mode === 'harmonic' || mode === 'combined') && (
        <HarmonicOvertones analysisData={analysisData} isActive={isActive} />
      )}
      
      {(mode === 'meters' || mode === 'combined') && (
        <ProfessionalMeters analysisData={analysisData} isActive={isActive} />
      )}
      
      {/* Background Grid */}
      <gridHelper args={[20, 20]} position={[0, -2, 0]} />
    </>
  );
}

// Main Component with Canvas
interface Props extends Enhanced3DProps {}

const Enhanced3DVisualizer: React.FC<Props> = ({ 
  analysisData, 
  isActive, 
  mode = 'combined',
  interactiveMode = false
}) => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden">
      <Canvas>
        <Enhanced3DScene 
          analysisData={analysisData}
          isActive={isActive}
          mode={mode}
          interactiveMode={interactiveMode}
        />
      </Canvas>
    </div>
  );
};

export default Enhanced3DVisualizer;