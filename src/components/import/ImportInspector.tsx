/**
 * Flow Import Inspector
 * 
 * The missing jewel in the crown - the moment Flow "breathes in" audio.
 * This is where Flow feels *alive* - animated, glowing, pulsing, talking gently.
 * 
 * 100% Flow (Focus • Listen • Operate • Work)
 * Feels like a 2030 DAW OS.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getThermalColor } from '../../core/als/colors';
import type { FlowPulseResult } from '../../core/pulse/flowPulseEngine';
import './ImportInspector.css';

export interface ImportStep {
  label: string;
  hint: string;
  done: boolean;
  progress?: number; // 0-100 for progress indication
}

interface ImportInspectorProps {
  visible: boolean;
  steps: ImportStep[];
  currentPhase?: number; // 0-4, current phase index
  alsFlow?: number; // 0-100, ALS flow level
  alsTemperature?: 'cooling' | 'warming' | 'hot' | 'balanced';
  primeBrainGuidance?: string;
  flowPulse?: FlowPulseResult | null; // Flow Pulse data for animation
}

export function ImportInspector({
  visible,
  steps,
  currentPhase = 0,
  alsFlow = 55,
  alsTemperature = 'warming',
  primeBrainGuidance,
  flowPulse,
}: ImportInspectorProps) {
  const [breathingScale, setBreathingScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Breathing animation for active step
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setBreathingScale(prev => {
        const next = prev === 1 ? 1.05 : 1;
        return next;
      });
    }, 900);
    
    return () => clearInterval(interval);
  }, [visible]);
  
  // Apply ALS Thermal Glow (Part C)
  useEffect(() => {
    if (!visible) return;
    
    const updateThermalGlow = () => {
      if (typeof window !== 'undefined' && window.__als) {
        const temp = window.__als.temperature || 'cold';
        const color = getThermalColor(temp);
        document.documentElement.style.setProperty('--als-thermal-glow', color);
      }
    };
    
    // Initial update
    updateThermalGlow();
    
    // Update every 100ms for smooth thermal transitions
    const interval = setInterval(updateThermalGlow, 100);
    
    return () => clearInterval(interval);
  }, [visible]);
  
  // Flow Fingerprint Animation (Spectral Halo)
  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let w = 0;
    let h = 0;
    let t = 0;
    
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    
    resize();
    
    const handleResize = () => {
      resize();
    };
    window.addEventListener('resize', handleResize);
    
    function animate() {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, w, h);
      
      // Soft halo glow (pulsing radial gradient)
      const centerX = w / 2;
      const centerY = h / 2;
      const maxRadius = Math.min(w, h) / 1.2;
      const pulseRadius = 20 + Math.sin(t * 0.5) * 5; // Subtle breathing
      
      const grd = ctx.createRadialGradient(
        centerX,
        centerY,
        pulseRadius,
        centerX,
        centerY,
        maxRadius
      );
      grd.addColorStop(0, 'rgba(167, 139, 250, 0.35)');
      grd.addColorStop(0.5, 'rgba(192, 132, 252, 0.15)');
      grd.addColorStop(1, 'rgba(56, 38, 95, 0)');
      
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
      
      // Spectral fingerprint lines (geometric pattern that "listens")
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.65)';
      ctx.lineCap = 'round';
      
      const lines = 32;
      const parallaxOffset = Math.sin(t * 0.1) * 2; // Slow parallax drift
      
      for (let i = 0; i < lines; i++) {
        ctx.beginPath();
        let firstPoint = true;
        
        for (let x = 0; x < w; x += 8) {
          // Spectral pattern: sine waves with varying frequencies
          const y =
            h / 2 +
            Math.sin((x * 0.01) + t + i * 0.25) * (40 + i * 1.5) +
            Math.cos((x * 0.003) - t * 0.4) * 15 +
            parallaxOffset +
            Math.sin(t * 0.3 + i * 0.1) * 3; // Subtle vertical drift
          
          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }
      
      // Increment time for animation
      t += 0.02;
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visible]);
  
  if (!visible) return null;
  
  const activeStep = steps.find(s => !s.done);
  const guidanceText = primeBrainGuidance || activeStep?.hint || 'Preparing arrangement...';
  
  // Get temperature color
  const getTemperatureColor = () => {
    switch (alsTemperature) {
      case 'warming':
        return '#c084fc'; // Purple glow
      case 'hot':
        return '#f472b6'; // Pink glow
      case 'balanced':
        return '#34d399'; // Green glow
      case 'cooling':
      default:
        return '#60a5fa'; // Blue glow
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        className="flow-import-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Flow Fingerprint Canvas (Spectral Halo Animation) */}
        <canvas
          ref={canvasRef}
          id="flow-fingerprint"
          className="flow-fingerprint-canvas"
        />
        
        {/* Background ambient glow */}
        <div 
          className="flow-import-ambient"
          style={{
            background: `radial-gradient(circle at center, ${getTemperatureColor()}15 0%, transparent 70%)`,
          }}
        />
        
        {/* Main glass panel */}
        <motion.div
          className="flow-import-glass"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* ALS bar at top */}
          <div className="flow-import-als-bar">
            <div className="flow-import-als-label">FLOW</div>
            <div className="flow-import-als-meter">
              <div 
                className="flow-import-als-fill"
                style={{
                  width: `${alsFlow}%`,
                  background: `linear-gradient(90deg, ${getTemperatureColor()} 0%, ${getTemperatureColor()}cc 100%)`,
                  boxShadow: `0 0 20px ${getTemperatureColor()}40`,
                }}
              />
            </div>
            <div className="flow-import-als-temp">{alsTemperature.toUpperCase()}</div>
          </div>
          
          {/* Title */}
          <div className="flow-import-title">
            <span className="flow-watermark">FLOW</span>
            <span className="flow-title-text">· Importing</span>
          </div>
          
          {/* Steps */}
          <div className="flow-import-steps">
            {steps.map((step, index) => {
              const isActive = !step.done && index === currentPhase;
              const isDone = step.done;
              
              return (
                <motion.div
                  key={index}
                  className={`flow-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                  initial={{ opacity: 0.6, x: -20 }}
                  animate={{ 
                    opacity: isDone ? 1 : isActive ? 0.9 : 0.6,
                    x: 0,
                  }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flow-step-indicator">
                    {isDone ? (
                      <motion.div
                        className="flow-step-check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        ✓
                      </motion.div>
                    ) : (
                      <motion.div
                        className={`flow-step-dot ${isActive ? 'breathing' : ''}`}
                        animate={isActive ? {
                          scale: breathingScale,
                          opacity: [0.7, 1, 0.7],
                        } : {}}
                        transition={isActive ? {
                          duration: 1.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        } : {}}
                        style={{
                          boxShadow: isActive 
                            ? `0 0 12px ${getTemperatureColor()}65`
                            : '0 0 8px rgba(203, 170, 255, 0.3)',
                        }}
                      />
                    )}
                  </div>
                  <span className="flow-step-label">{step.label}</span>
                  {step.progress !== undefined && step.progress > 0 && step.progress < 100 && (
                    <div className="flow-step-progress">
                      <div 
                        className="flow-step-progress-bar"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          {/* Prime Brain Guidance */}
          <motion.div
            className="flow-import-guidance"
            key={guidanceText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {guidanceText}
          </motion.div>
          
          {/* Orbital glow rings */}
          <div className="flow-import-orbits">
            <motion.div
              className="flow-orbit-ring ring-1"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="flow-orbit-ring ring-2"
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

