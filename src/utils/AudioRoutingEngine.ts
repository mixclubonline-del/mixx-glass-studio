/**
 * Mixx Club Studio - Professional Audio Routing Engine
 * Advanced routing system with sends, busses, external hardware, and Prime Brain integration
 */

export interface AudioTrack {
  id: string;
  name: string;
  type: 'input' | 'output' | 'bus' | 'send' | 'return' | 'effect' | 'hardware';
  channels: number;
  gain: number;
  mute: boolean;
  solo: boolean;
  pan: number;
  phase: boolean;
  connections: string[]; // Array of connected node IDs
  effects: EffectChain[];
  position: { x: number; y: number };
}

export interface EffectChain {
  id: string;
  name: string;
  type: 'eq' | 'compressor' | 'reverb' | 'delay' | 'chorus' | 'distortion' | 'filter' | 'custom';
  enabled: boolean;
  wet: number;
  dry: number;
  parameters: Record<string, number>;
  bypass: boolean;
}

export interface AudioBus {
  id: string;
  name: string;
  type: 'mix' | 'aux' | 'group' | 'master';
  channels: number;
  gain: number;
  mute: boolean;
  solo: boolean;
  pan: number;
  sends: SendAssignment[];
  effects: EffectChain[];
  routing: {
    input: string[];
    output: string[];
  };
}

export interface SendAssignment {
  targetBusId: string;
  level: number;
  preFader: boolean;
  enabled: boolean;
}

export interface HardwareInterface {
  id: string;
  name: string;
  type: 'audio_interface' | 'midi_controller' | 'external_processor' | 'monitor_controller';
  inputs: number;
  outputs: number;
  sampleRate: number;
  bufferSize: number;
  latency: number;
  connected: boolean;
  driver: string;
}

export interface RoutingMatrix {
  nodes: AudioTrack[];
  busses: AudioBus[];
  hardware: HardwareInterface[];
  connections: Array<{
    sourceId: string;
    targetId: string;
    gain: number;
    enabled: boolean;
  }>;
}

class AudioRoutingEngine {
  private audioContext: AudioContext | null = null;
  private routingMatrix: RoutingMatrix;
  private webAudioNodes: Map<string, AudioNode> = new Map();
  private primeBrain: any = null;

  constructor(primeBrain?: any) {
    this.primeBrain = primeBrain;
    this.routingMatrix = {
      nodes: [],
      busses: [],
      hardware: [],
      connections: []
    };
    this.initializeDefaultRouting();
  }

  private initializeDefaultRouting(): void {
    // Create default master bus
    const masterBus: AudioBus = {
      id: 'master',
      name: 'Master',
      type: 'master',
      channels: 2,
      gain: 0.75,
      mute: false,
      solo: false,
      pan: 0,
      sends: [],
      effects: [],
      routing: {
        input: [],
        output: ['hardware_out_1', 'hardware_out_2']
      }
    };

    // Create default aux sends
    const auxSend1: AudioBus = {
      id: 'aux_1',
      name: 'Aux 1 (Reverb)',
      type: 'aux',
      channels: 2,
      gain: 0.5,
      mute: false,
      solo: false,
      pan: 0,
      sends: [{ targetBusId: 'master', level: 0.8, preFader: false, enabled: true }],
      effects: [
        {
          id: 'reverb_1',
          name: 'Hall Reverb',
          type: 'reverb',
          enabled: true,
          wet: 0.3,
          dry: 0.7,
          parameters: {
            roomSize: 0.7,
            damping: 0.5,
            preDelay: 20,
            diffusion: 0.8
          },
          bypass: false
        }
      ],
      routing: {
        input: [],
        output: ['master']
      }
    };

    const auxSend2: AudioBus = {
      id: 'aux_2',
      name: 'Aux 2 (Delay)',
      type: 'aux',
      channels: 2,
      gain: 0.4,
      mute: false,
      solo: false,
      pan: 0,
      sends: [{ targetBusId: 'master', level: 0.6, preFader: false, enabled: true }],
      effects: [
        {
          id: 'delay_1',
          name: 'Tape Delay',
          type: 'delay',
          enabled: true,
          wet: 0.25,
          dry: 0.75,
          parameters: {
            time: 375, // ms
            feedback: 0.4,
            filter: 0.3,
            modulation: 0.1
          },
          bypass: false
        }
      ],
      routing: {
        input: [],
        output: ['master']
      }
    };

    // Create default hardware interfaces
    const defaultInterface: HardwareInterface = {
      id: 'hardware_main',
      name: 'Main Audio Interface',
      type: 'audio_interface',
      inputs: 8,
      outputs: 8,
      sampleRate: 48000,
      bufferSize: 128,
      latency: 2.7,
      connected: true,
      driver: 'Core Audio'
    };

    this.routingMatrix.busses = [masterBus, auxSend1, auxSend2];
    this.routingMatrix.hardware = [defaultInterface];

    console.log('🎛️ Default audio routing initialized - Professional grade signal flow ready');
  }

  async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
    
    try {
      // Initialize Web Audio routing nodes
      await this.createWebAudioNodes();
      
      // Connect default routing
      this.connectDefaultChain();
      
      // Notify Prime Brain
      if (this.primeBrain) {
        this.primeBrain.addRecommendation({
          id: 'routing-engine-ready',
          type: 'audio',
          priority: 9,
          message: '🎛️ Professional audio routing system online - Full studio signal flow active'
        });
      }
      
      console.log('✅ Audio Routing Engine initialized - Professional signal flow active');
    } catch (error) {
      console.error('❌ Audio Routing Engine initialization failed:', error);
      throw error;
    }
  }

  private async createWebAudioNodes(): Promise<void> {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    // Create Web Audio nodes for each bus
    for (const bus of this.routingMatrix.busses) {
      const gainNode = this.audioContext.createGain();
      const panNode = this.audioContext.createStereoPanner();
      const analyserNode = this.audioContext.createAnalyser();
      
      gainNode.gain.value = bus.gain;
      panNode.pan.value = bus.pan;
      analyserNode.fftSize = 2048;
      
      // Chain the nodes
      gainNode.connect(panNode);
      panNode.connect(analyserNode);
      
      // Store references
      this.webAudioNodes.set(`${bus.id}_gain`, gainNode as any);
      this.webAudioNodes.set(`${bus.id}_pan`, panNode as any);
      this.webAudioNodes.set(`${bus.id}_analyser`, analyserNode as any);
    }
  }

  private connectDefaultChain(): void {
    // Connect aux sends to master
    const masterGain = this.webAudioNodes.get('master_gain');
    const aux1Analyser = this.webAudioNodes.get('aux_1_analyser');
    const aux2Analyser = this.webAudioNodes.get('aux_2_analyser');

    if (masterGain && aux1Analyser && aux2Analyser) {
      aux1Analyser.connect(masterGain);
      aux2Analyser.connect(masterGain);
    }

    // Connect master to destination
    if (masterGain && this.audioContext) {
      masterGain.connect(this.audioContext.destination);
    }
  }

  // === ROUTING OPERATIONS ===

  createAudioTrack(name: string, channels: number = 2): AudioTrack {
    const trackId = `track_${Date.now()}`;
    const track: AudioTrack = {
      id: trackId,
      name,
      type: 'input',
      channels,
      gain: 0.75,
      mute: false,
      solo: false,
      pan: 0,
      phase: false,
      connections: ['master'],
      effects: [],
      position: { x: 100, y: 100 }
    };

    this.routingMatrix.nodes.push(track);
    this.createWebAudioNodeForTrack(track);
    
    // Notify Prime Brain
    if (this.primeBrain) {
      this.primeBrain.addRecommendation({
        id: `track-created-${trackId}`,
        type: 'workflow',
        priority: 4,
        message: `🎵 Audio track "${name}" created - Route to sends for spatial processing`
      });
    }

    return track;
  }

  private createWebAudioNodeForTrack(track: AudioTrack): void {
    if (!this.audioContext) return;

    const gainNode = this.audioContext.createGain();
    const panNode = this.audioContext.createStereoPanner();
    const analyserNode = this.audioContext.createAnalyser();

    gainNode.gain.value = track.gain;
    panNode.pan.value = track.pan;
    analyserNode.fftSize = 2048;

    gainNode.connect(panNode);
    panNode.connect(analyserNode);

    this.webAudioNodes.set(`${track.id}_gain`, gainNode as any);
    this.webAudioNodes.set(`${track.id}_pan`, panNode as any);
    this.webAudioNodes.set(`${track.id}_analyser`, analyserNode as any);

    // Connect to routing destinations
    this.updateTrackRouting(track.id);
  }

  addSendToTrack(trackId: string, busId: string, level: number = 0.2): void {
    const track = this.routingMatrix.nodes.find(n => n.id === trackId);
    if (!track) return;

    // Create send routing in Web Audio
    const trackAnalyser = this.webAudioNodes.get(`${trackId}_analyser`);
    const busGain = this.webAudioNodes.get(`${busId}_gain`);

    if (trackAnalyser && busGain && this.audioContext) {
      const sendGain = this.audioContext.createGain();
      sendGain.gain.value = level;
      
      trackAnalyser.connect(sendGain);
      sendGain.connect(busGain);
      
      this.webAudioNodes.set(`${trackId}_send_${busId}`, sendGain as any);
    }

    // Update routing matrix
    if (!track.connections.includes(busId)) {
      track.connections.push(busId);
    }

    // Notify Prime Brain of routing intelligence
    if (this.primeBrain) {
      const bus = this.routingMatrix.busses.find(b => b.id === busId);
      this.primeBrain.addRecommendation({
        id: `send-created-${trackId}-${busId}`,
        type: 'mixing',
        priority: 6,
        message: `🎛️ Send created: ${track.name} → ${bus?.name} - Adjust level for spatial blend`
      });
    }
  }

  private updateTrackRouting(trackId: string): void {
    const track = this.routingMatrix.nodes.find(n => n.id === trackId);
    if (!track) return;

    const trackAnalyser = this.webAudioNodes.get(`${trackId}_analyser`);
    if (!trackAnalyser) return;

    // Connect to all specified destinations
    track.connections.forEach(connectionId => {
      const targetGain = this.webAudioNodes.get(`${connectionId}_gain`);
      if (targetGain) {
        trackAnalyser.connect(targetGain);
      }
    });
  }

  // === MIXING OPERATIONS ===

  setTrackGain(trackId: string, gain: number): void {
    const gainNode = this.webAudioNodes.get(`${trackId}_gain`) as GainNode;
    if (gainNode && this.audioContext) {
      gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime);
      
      // Update routing matrix
      const track = this.routingMatrix.nodes.find(n => n.id === trackId);
      if (track) track.gain = gain;
    }
  }

  setTrackPan(trackId: string, pan: number): void {
    const panNode = this.webAudioNodes.get(`${trackId}_pan`) as StereoPannerNode;
    if (panNode && this.audioContext) {
      panNode.pan.setValueAtTime(pan, this.audioContext.currentTime);
      
      // Update routing matrix
      const track = this.routingMatrix.nodes.find(n => n.id === trackId);
      if (track) track.pan = pan;
    }
  }

  setSendLevel(trackId: string, busId: string, level: number): void {
    const sendGain = this.webAudioNodes.get(`${trackId}_send_${busId}`) as GainNode;
    if (sendGain && this.audioContext) {
      sendGain.gain.setValueAtTime(level, this.audioContext.currentTime);
    }
  }

  muteTrack(trackId: string, mute: boolean): void {
    const track = this.routingMatrix.nodes.find(n => n.id === trackId);
    if (track) {
      track.mute = mute;
      this.setTrackGain(trackId, mute ? 0 : track.gain);
    }
  }

  soloTrack(trackId: string, solo: boolean): void {
    const track = this.routingMatrix.nodes.find(n => n.id === trackId);
    if (track) {
      track.solo = solo;
      
      // Solo logic - mute all other tracks when solo is enabled
      if (solo) {
        this.routingMatrix.nodes.forEach(otherTrack => {
          if (otherTrack.id !== trackId && !otherTrack.solo) {
            this.muteTrack(otherTrack.id, true);
          }
        });
      } else {
        // Unmute tracks when solo is disabled (if no other solos active)
        const hasSolo = this.routingMatrix.nodes.some(t => t.solo && t.id !== trackId);
        if (!hasSolo) {
          this.routingMatrix.nodes.forEach(otherTrack => {
            if (!otherTrack.mute) {
              this.muteTrack(otherTrack.id, false);
            }
          });
        }
      }
    }
  }

  // === EFFECT PROCESSING ===

  addEffectToTrack(trackId: string, effect: EffectChain): void {
    const track = this.routingMatrix.nodes.find(n => n.id === trackId);
    if (track) {
      track.effects.push(effect);
      this.createEffectNode(trackId, effect);
    }
  }

  private createEffectNode(trackId: string, effect: EffectChain): void {
    if (!this.audioContext) return;

    let effectNode: AudioNode | null = null;

    switch (effect.type) {
      case 'eq':
        effectNode = this.createEQNode(effect) as AudioNode;
        break;
      case 'compressor':
        effectNode = this.createCompressorNode(effect) as AudioNode;
        break;
      case 'reverb':
        effectNode = this.createReverbNode(effect) as AudioNode;
        break;
      case 'delay':
        effectNode = this.createDelayNode(effect) as AudioNode;
        break;
    }

    if (effectNode) {
      this.webAudioNodes.set(`${trackId}_effect_${effect.id}`, effectNode);
      this.insertEffectInChain(trackId, effect.id);
    }
  }

  private createEQNode(effect: EffectChain): BiquadFilterNode {
    if (!this.audioContext) throw new Error('Audio context required');
    
    const eqNode = this.audioContext.createBiquadFilter();
    eqNode.type = 'peaking';
    eqNode.frequency.value = effect.parameters.frequency || 1000;
    eqNode.Q.value = effect.parameters.q || 1;
    eqNode.gain.value = effect.parameters.gain || 0;
    
    return eqNode;
  }

  private createCompressorNode(effect: EffectChain): DynamicsCompressorNode {
    if (!this.audioContext) throw new Error('Audio context required');
    
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = effect.parameters.threshold || -12;
    compressor.knee.value = effect.parameters.knee || 30;
    compressor.ratio.value = effect.parameters.ratio || 4;
    compressor.attack.value = effect.parameters.attack || 0.003;
    compressor.release.value = effect.parameters.release || 0.25;
    
    return compressor;
  }

  private createReverbNode(effect: EffectChain): ConvolverNode {
    if (!this.audioContext) throw new Error('Audio context required');
    
    const convolver = this.audioContext.createConvolver();
    // Create simple impulse response for reverb
    const length = this.audioContext.sampleRate * (effect.parameters.roomSize || 2);
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    convolver.buffer = impulse;
    return convolver;
  }

  private createDelayNode(effect: EffectChain): DelayNode {
    if (!this.audioContext) throw new Error('Audio context required');
    
    const delay = this.audioContext.createDelay(2);
    delay.delayTime.value = (effect.parameters.time || 250) / 1000;
    
    return delay;
  }

  private insertEffectInChain(trackId: string, effectId: string): void {
    // Insert effect in the signal chain between track gain and analyser
    const trackGain = this.webAudioNodes.get(`${trackId}_gain`);
    const trackAnalyser = this.webAudioNodes.get(`${trackId}_analyser`);
    const effectNode = this.webAudioNodes.get(`${trackId}_effect_${effectId}`);

    if (trackGain && trackAnalyser && effectNode) {
      // Disconnect existing chain
      trackGain.disconnect();
      
      // Reconnect with effect in chain
      trackGain.connect(effectNode);
      effectNode.connect(trackAnalyser);
    }
  }

  // === STATUS AND MONITORING ===

  getRoutingMatrix(): RoutingMatrix {
    return this.routingMatrix;
  }

  getTrackMetrics(trackId: string): { level: number; peak: number } {
    const analyser = this.webAudioNodes.get(`${trackId}_analyser`) as AnalyserNode;
    if (!analyser) return { level: 0, peak: 0 };

    const dataArray = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatTimeDomainData(dataArray);

    let peak = 0;
    let rms = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      const sample = Math.abs(dataArray[i]);
      peak = Math.max(peak, sample);
      rms += sample * sample;
    }
    
    rms = Math.sqrt(rms / dataArray.length);

    return { level: rms, peak };
  }

  dispose(): void {
    this.webAudioNodes.clear();
    this.routingMatrix = { nodes: [], busses: [], hardware: [], connections: [] };
    console.log('🎛️ Audio Routing Engine disposed');
  }
}

export default AudioRoutingEngine;