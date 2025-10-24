import { useEffect, useRef, useCallback, useState } from 'react';
import { usePrimeBrain } from '../contexts/PrimeBrainContext';

interface AudioEngineConfig {
  sampleRate: number;
  bufferSize: number;
  channels: number;
  lowLatency: boolean;
}

interface AudioMetrics {
  inputLevel: number;
  outputLevel: number;
  latency: number;
  cpuUsage: number;
  dropouts: number;
  timestamp: number;
}

interface NativeVelvetCurveBridgeProps {
  onStateChange?: (isActive: boolean) => void;
  onAudioData?: (data: Float32Array) => void;
  onMetrics?: (metrics: AudioMetrics) => void;
  config?: Partial<AudioEngineConfig>;
}

class VelvetCurveAudioEngine {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private isInitialized = false;
  private metrics: AudioMetrics = {
    inputLevel: 0,
    outputLevel: 0,
    latency: 0,
    cpuUsage: 0,
    dropouts: 0,
    timestamp: 0
  };

  async initialize(config: AudioEngineConfig): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create high-performance audio context
      this.audioContext = new AudioContext({
        sampleRate: config.sampleRate,
        latencyHint: config.lowLatency ? 'interactive' : 'balanced'
      });

      // Wait for user interaction to resume context
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create audio processing nodes
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.1;

      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      this.compressorNode = this.audioContext.createDynamicsCompressor();
      this.compressorNode.threshold.value = -12;
      this.compressorNode.knee.value = 30;
      this.compressorNode.ratio.value = 4;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;

      // Create script processor for real-time analysis
      this.scriptProcessor = this.audioContext.createScriptProcessor(config.bufferSize, config.channels, config.channels);

      this.isInitialized = true;
      console.log('🎵 Velvet Curve Audio Engine initialized with pro-grade settings');
    } catch (error) {
      console.error('❌ Audio engine initialization failed:', error);
      throw error;
    }
  }

  async connectMicrophone(): Promise<void> {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.audioContext.sampleRate,
          channelCount: 2
        }
      });

      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      
      // Connect audio chain: Input -> Compressor -> Gain -> Analyser -> Output
      this.mediaStreamSource
        .connect(this.compressorNode!)
        .connect(this.gainNode!)
        .connect(this.analyserNode!)
        .connect(this.audioContext.destination);

      // Connect to script processor for analysis
      this.analyserNode!.connect(this.scriptProcessor!);
      this.scriptProcessor!.connect(this.audioContext.destination);

      console.log('🎤 Microphone connected to Velvet Curve engine');
    } catch (error) {
      console.error('❌ Microphone connection failed:', error);
      throw error;
    }
  }

  getFrequencyData(): Float32Array {
    if (!this.analyserNode) return new Float32Array(0);
    
    const frequencyData = new Float32Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getFloatFrequencyData(frequencyData);
    return frequencyData;
  }

  getTimeDomainData(): Float32Array {
    if (!this.analyserNode) return new Float32Array(0);
    
    const timeDomainData = new Float32Array(this.analyserNode.fftSize);
    this.analyserNode.getFloatTimeDomainData(timeDomainData);
    return timeDomainData;
  }

  getMetrics(): AudioMetrics {
    if (!this.audioContext) return this.metrics;

    // Calculate real-time metrics
    const timeDomainData = this.getTimeDomainData();
    let rms = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      rms += timeDomainData[i] * timeDomainData[i];
    }
    rms = Math.sqrt(rms / timeDomainData.length);

    this.metrics = {
      inputLevel: rms,
      outputLevel: rms * (this.gainNode?.gain.value || 1),
      latency: this.audioContext.baseLatency + this.audioContext.outputLatency,
      cpuUsage: Math.random() * 0.3, // Simulated for now
      dropouts: 0,
      timestamp: Date.now()
    };

    return this.metrics;
  }

  setGain(gain: number): void {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(gain, this.audioContext!.currentTime);
    }
  }

  dispose(): void {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
    }
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isInitialized = false;
    console.log('🎵 Velvet Curve Audio Engine disposed');
  }
}

const NativeVelvetCurveBridge: React.FC<NativeVelvetCurveBridgeProps> = ({ 
  onStateChange, 
  onAudioData, 
  onMetrics,
  config 
}) => {
  const engineRef = useRef<VelvetCurveAudioEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  
  // 🧠 PRIME BRAIN INTEGRATION
  const primeBrain = usePrimeBrain();

  const defaultConfig: AudioEngineConfig = {
    sampleRate: 48000,
    bufferSize: 128, // Low latency
    channels: 2,
    lowLatency: true,
    ...config
  };

  const updateAudioData = useCallback(() => {
    if (engineRef.current && isActive) {
      // Send frequency data for visualization
      const frequencyData = engineRef.current.getFrequencyData();
      onAudioData?.(frequencyData);

      // Send metrics for monitoring
      const metrics = engineRef.current.getMetrics();
      onMetrics?.(metrics);
      
      // 🧠 UPDATE PRIME BRAIN with audio metrics
      primeBrain.updateAudioMetrics(metrics);
      
      // 🧠 UPDATE PRIME BRAIN with visualization data
      const timeDomainData = engineRef.current.getTimeDomainData();
      primeBrain.updateVisualizationData({
        waveformData: timeDomainData,
        spectrumData: frequencyData,
        alsData: {
          level: metrics.outputLevel,
          peak: Math.max(...Array.from(timeDomainData)),
          rms: Math.sqrt(timeDomainData.reduce((sum, val) => sum + val * val, 0) / timeDomainData.length),
          lufs: -23 + (metrics.outputLevel * 20), // Simulated LUFS
          dynamics: 1 - metrics.outputLevel
        },
        primeBrainIntensity: primeBrain.state.intensity,
        timestamp: Date.now()
      });

      animationFrameRef.current = requestAnimationFrame(updateAudioData);
    }
  }, [isActive, onAudioData, onMetrics, primeBrain]);

  useEffect(() => {
    // Initialize native audio engine
    const initializeNativeAudio = async () => {
      try {
        console.log('🎵 Initializing Native Velvet Curve Engine...');
        
        engineRef.current = new VelvetCurveAudioEngine();
        await engineRef.current.initialize(defaultConfig);
        
        // 🧠 NOTIFY PRIME BRAIN of audio engine initialization
        primeBrain.updateSystemStatus('audioEngine', {
          active: true,
          sampleRate: defaultConfig.sampleRate,
          bufferSize: defaultConfig.bufferSize,
          latency: 0
        });
        
        // Connect to microphone for live input
        await engineRef.current.connectMicrophone();
        
        setIsActive(true);
        onStateChange?.(true);
        
        // 🧠 ACTIVATE PRIME BRAIN when audio engine is ready
        if (!primeBrain.state.isActive) {
          primeBrain.activatePrimeBrain(0.8);
          primeBrain.addRecommendation({
            id: 'audio-engine-ready',
            type: 'audio',
            priority: 10,
            message: '🎵 Audio Engine Online - Prime Brain activated with professional-grade processing'
          });
        }
        
        // Start real-time data updates
        updateAudioData();
        
        console.log('✅ Velvet Curve Engine ready - Professional audio processing active');
        console.log('🧠 Prime Brain receiving real-time audio intelligence');
      } catch (error) {
        console.error('❌ Failed to initialize Native Velvet Curve Engine:', error);
        setIsActive(false);
        onStateChange?.(false);
        
        // 🧠 NOTIFY PRIME BRAIN of failure
        primeBrain.updateSystemStatus('audioEngine', { active: false });
        primeBrain.addRecommendation({
          id: 'audio-engine-error',
          type: 'audio',
          priority: 9,
          message: '❌ Audio Engine failed to initialize. Check microphone permissions.'
        });
      }
    };

    initializeNativeAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (engineRef.current) {
        engineRef.current.dispose();
      }
      setIsActive(false);
      onStateChange?.(false);
      
      // 🧠 NOTIFY PRIME BRAIN of shutdown
      primeBrain.updateSystemStatus('audioEngine', { active: false });
    };
  }, [onStateChange, updateAudioData, defaultConfig, primeBrain]);

  return null; // This is a bridge component, no UI
};

export default NativeVelvetCurveBridge;
