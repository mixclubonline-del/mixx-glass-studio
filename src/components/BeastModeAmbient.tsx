/**
 * Beast Mode Ambient Overlay - Enhanced visual feedback
 */

import React, { useEffect, useState } from 'react';
import { useBeastModeStore } from '@/store/beastModeStore';
import { ambientEngine, type AmbientState } from '@/ai/ambientEngine';
import { cn } from '@/lib/utils';

export const BeastModeAmbient: React.FC = () => {
  const { isActive, visualEnhancement, ambientIntensity } = useBeastModeStore();
  const [ambientState, setAmbientState] = useState<AmbientState>(ambientEngine.getState());
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  
  // Subscribe to ambient engine
  useEffect(() => {
    const unsubscribe = ambientEngine.subscribe((state) => {
      setAmbientState(state);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Generate particles based on energy
  useEffect(() => {
    if (!isActive || !visualEnhancement) return;
    
    const interval = setInterval(() => {
      if (ambientState.energy > 0.5) {
        const particleCount = Math.floor(ambientState.energy * 5);
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
        }));
        
        setParticles(prev => [...prev, ...newParticles].slice(-20)); // Keep last 20
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [isActive, visualEnhancement, ambientState.energy]);
  
  // Remove old particles
  useEffect(() => {
    const timeout = setTimeout(() => {
      setParticles([]);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [particles]);
  
  if (!isActive || !visualEnhancement) {
    return null;
  }
  
  const intensity = ambientIntensity * ambientState.intensity;
  const getAnimationClass = () => {
    switch (ambientState.lightingMode) {
      case 'burst': return 'animate-pulse-fast';
      case 'pulse': return 'animate-pulse';
      case 'ripple': return 'animate-ripple';
      case 'breathe': return 'animate-breathe';
      default: return '';
    }
  };
  
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Base gradient layer */}
      <div
        className={cn(
          "absolute inset-0 opacity-20 transition-all duration-1000",
          getAnimationClass()
        )}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${ambientState.primaryColor}, ${ambientState.secondaryColor}, transparent)`,
          opacity: intensity * 0.3,
        }}
      />
      
      {/* Energy ring */}
      {ambientState.energy > 0.6 && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 animate-ping"
          style={{
            width: `${ambientState.energy * 100}%`,
            height: `${ambientState.energy * 100}%`,
            borderColor: ambientState.primaryColor,
            opacity: intensity * 0.2,
            animationDuration: `${2 / ambientState.energy}s`,
          }}
        />
      )}
      
      {/* Corner blooms */}
      <div
        className="absolute top-0 right-0 w-1/3 h-1/3 blur-3xl transition-all duration-1000"
        style={{
          background: ambientState.primaryColor,
          opacity: intensity * ambientState.energy * 0.15,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-1/3 h-1/3 blur-3xl transition-all duration-1000"
        style={{
          background: ambientState.secondaryColor,
          opacity: intensity * ambientState.energy * 0.15,
        }}
      />
      
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-float-up"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: ambientState.primaryColor,
            opacity: intensity * 0.6,
          }}
        />
      ))}
      
      {/* Intense mode effects */}
      {ambientState.mood === 'intense' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent animate-pulse-fast" />
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent animate-pulse-fast" 
               style={{ animationDelay: '0.5s' }} />
        </>
      )}
      
      {/* Beast mode lightning */}
      {ambientState.mood === 'intense' && ambientState.energy > 0.9 && (
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-yellow-400 to-transparent animate-lightning opacity-50" />
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-yellow-400 to-transparent animate-lightning opacity-50" 
               style={{ animationDelay: '0.3s' }} />
        </div>
      )}
    </div>
  );
};
