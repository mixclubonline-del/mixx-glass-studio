import { useState, useEffect, useRef } from 'react';
import { AudioSignal } from '../types';

/**
 * Custom hook to simulate a dynamic audio signal for visualizers.
 * Generates a continuous stream of level, peak, transients, and waveform data.
 */
export const useSimulatedAudio = (): AudioSignal => {
  const [audioSignal, setAudioSignal] = useState<AudioSignal>({
    level: 0,
    peak: 0,
    transients: false,
    waveform: new Float32Array(512).fill(0),
    time: 0,
  });
  const animationFrameId = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioTimeRef = useRef(0);

  useEffect(() => {
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 1024;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const waveformArray = new Float32Array(analyserRef.current.fftSize);

        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(512, 1, 1);
        scriptProcessorRef.current.onaudioprocess = (event) => {
          // This simulates an input buffer. In a real scenario, this would come from a microphone or file.
          // For now, we'll just advance the time.
          audioTimeRef.current += event.inputBuffer.duration;
        };
        scriptProcessorRef.current.connect(audioContextRef.current.destination); // Keep it connected to prevent garbage collection

        oscillatorRef.current = audioContextRef.current.createOscillator();
        oscillatorRef.current.type = 'sine'; // or 'sawtooth', 'square', 'triangle'
        oscillatorRef.current.frequency.setValueAtTime(440, audioContextRef.current.currentTime);

        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.setValueAtTime(0.5, audioContextRef.current.currentTime); // Start with some volume

        oscillatorRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(analyserRef.current);
        analyserRef.current.connect(scriptProcessorRef.current); // Connect analyser to the scriptProcessor indirectly
        
        oscillatorRef.current.start();

        const animate = () => {
          if (!analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);
          analyserRef.current.getFloatTimeDomainData(waveformArray);

          const maxLevel = Math.max(...dataArray);
          const currentLevel = (maxLevel / 255) * 100; // Normalized 0-100

          const currentPeak = maxLevel;
          const currentTransients = (Math.random() > 0.95); // Simulate occasional transients

          // Simulate some frequency and gain changes for dynamics
          const timeFactor = audioTimeRef.current * 0.5;
          const dynamicFrequency = 300 + Math.sin(timeFactor * 0.5) * 100 + Math.sin(timeFactor * 1.2) * 50;
          const dynamicGain = 0.3 + (Math.sin(timeFactor * 0.3) * 0.2 + 0.3) * 0.5; // Overall gain fluctuations

          if (oscillatorRef.current && gainNodeRef.current && audioContextRef.current) {
            oscillatorRef.current.frequency.setValueAtTime(dynamicFrequency, audioContextRef.current.currentTime);
            gainNodeRef.current.gain.setValueAtTime(dynamicGain, audioContextRef.current.currentTime);
          }

          setAudioSignal({
            level: currentLevel,
            peak: currentPeak,
            transients: currentTransients,
            waveform: waveformArray,
            time: audioTimeRef.current,
          });

          animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error("Failed to initialize Web Audio API:", error);
        // Fallback to simple simulated data if Web Audio fails
        let fallbackTime = 0;
        animationFrameId.current = requestAnimationFrame(function fallbackAnimate() {
          fallbackTime += 0.05;
          const waveform = new Float32Array(512).map((_, i) => Math.sin((i / 512) * Math.PI * 4 + fallbackTime * 10) * (0.5 + Math.sin(fallbackTime) * 0.2));
          const level = (Math.sin(fallbackTime * 0.5) * 0.5 + 0.5) * 100;
          const peak = level + (Math.sin(fallbackTime * 1.1) * 0.5 + 0.5) * 50;
          setAudioSignal({
            level,
            peak,
            transients: Math.random() > 0.9,
            waveform,
            time: fallbackTime,
          });
          animationFrameId.current = requestAnimationFrame(fallbackAnimate);
        });
      }
    };

    initAudio();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.error("Error closing audio context", e));
      }
    };
  }, []);

  return audioSignal;
};