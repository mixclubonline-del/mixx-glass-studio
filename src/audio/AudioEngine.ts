/**
 * Mixx Club Pro Studio - Audio Engine
 * Web Audio API-based engine for real-time mixing and DSP
 */

export interface AudioTrack {
  id: string;
  name: string;
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  volume: number;
  muted: boolean;
  solo: boolean;
}

export interface EffectParams {
  reverbMix: number;
  reverbTime: number;
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  limiterThreshold: number;
}

export class AudioEngine {
  private context: AudioContext;
  private masterGain: GainNode;
  private tracks: Map<string, AudioTrack>;
  private isPlaying: boolean;
  private startTime: number;
  private pauseTime: number;
  
  // Effects nodes
  private reverbNode: ConvolverNode;
  private reverbGain: GainNode;
  private delayNode: DelayNode;
  private delayFeedback: GainNode;
  private delayMix: GainNode;
  private limiter: DynamicsCompressorNode;
  
  constructor() {
    this.context = new AudioContext();
    this.tracks = new Map();
    this.isPlaying = false;
    this.startTime = 0;
    this.pauseTime = 0;
    
    // Initialize master chain
    this.masterGain = this.context.createGain();
    this.reverbNode = this.context.createConvolver();
    this.reverbGain = this.context.createGain();
    this.delayNode = this.context.createDelay(5.0);
    this.delayFeedback = this.context.createGain();
    this.delayMix = this.context.createGain();
    this.limiter = this.context.createDynamicsCompressor();
    
    // Configure effects
    this.setupEffects();
    this.connectMasterChain();
    this.generateReverbImpulse();
  }
  
  private setupEffects() {
    // Reverb settings
    this.reverbGain.gain.value = 0.3;
    
    // Delay settings
    this.delayNode.delayTime.value = 0.375; // Dotted eighth at 120 BPM
    this.delayFeedback.gain.value = 0.4;
    this.delayMix.gain.value = 0.2;
    
    // Limiter settings
    this.limiter.threshold.setValueAtTime(-1.0, this.context.currentTime);
    this.limiter.knee.setValueAtTime(0.0, this.context.currentTime);
    this.limiter.ratio.setValueAtTime(20.0, this.context.currentTime);
    this.limiter.attack.setValueAtTime(0.003, this.context.currentTime);
    this.limiter.release.setValueAtTime(0.05, this.context.currentTime);
  }
  
  private connectMasterChain() {
    // Master gain → Effects → Limiter → Output
    this.masterGain.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.limiter);
    
    // Delay routing
    this.masterGain.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayMix);
    this.delayMix.connect(this.limiter);
    
    // Direct path
    this.masterGain.connect(this.limiter);
    
    this.limiter.connect(this.context.destination);
  }
  
  private generateReverbImpulse() {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * 2.5; // 2.5 second reverb
    const impulse = this.context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.8));
      }
    }
    
    this.reverbNode.buffer = impulse;
  }
  
  async loadTrack(id: string, name: string, file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    
    const gainNode = this.context.createGain();
    gainNode.connect(this.masterGain);
    
    const track: AudioTrack = {
      id,
      name,
      buffer: audioBuffer,
      source: null,
      gainNode,
      volume: 1.0,
      muted: false,
      solo: false,
    };
    
    this.tracks.set(id, track);
  }
  
  play() {
    if (this.isPlaying) return;
    
    const offset = this.pauseTime;
    this.startTime = this.context.currentTime - offset;
    
    this.tracks.forEach((track) => {
      if (track.buffer && !track.muted) {
        const source = this.context.createBufferSource();
        source.buffer = track.buffer;
        source.connect(track.gainNode);
        source.start(0, offset);
        track.source = source;
      }
    });
    
    this.isPlaying = true;
  }
  
  pause() {
    if (!this.isPlaying) return;
    
    this.pauseTime = this.context.currentTime - this.startTime;
    
    this.tracks.forEach((track) => {
      if (track.source) {
        track.source.stop();
        track.source = null;
      }
    });
    
    this.isPlaying = false;
  }
  
  stop() {
    this.pause();
    this.pauseTime = 0;
    this.startTime = 0;
  }
  
  setTrackVolume(id: string, volume: number) {
    const track = this.tracks.get(id);
    if (track) {
      track.volume = volume;
      track.gainNode.gain.value = volume;
    }
  }
  
  setTrackMute(id: string, muted: boolean) {
    const track = this.tracks.get(id);
    if (track) {
      track.muted = muted;
      track.gainNode.gain.value = muted ? 0 : track.volume;
    }
  }
  
  updateEffect(param: keyof EffectParams, value: number) {
    switch (param) {
      case 'reverbMix':
        this.reverbGain.gain.value = value;
        break;
      case 'delayTime':
        this.delayNode.delayTime.value = value;
        break;
      case 'delayFeedback':
        this.delayFeedback.gain.value = value;
        break;
      case 'delayMix':
        this.delayMix.gain.value = value;
        break;
      case 'limiterThreshold':
        this.limiter.threshold.value = value;
        break;
    }
  }
  
  getCurrentTime(): number {
    if (!this.isPlaying) return this.pauseTime;
    return this.context.currentTime - this.startTime;
  }
  
  getDuration(): number {
    let maxDuration = 0;
    this.tracks.forEach((track) => {
      if (track.buffer) {
        maxDuration = Math.max(maxDuration, track.buffer.duration);
      }
    });
    return maxDuration;
  }
  
  async exportMix(): Promise<Blob> {
    const duration = this.getDuration();
    const offlineContext = new OfflineAudioContext(2, duration * 44100, 44100);
    
    // Recreate the mix chain in offline context
    const offlineMaster = offlineContext.createGain();
    const offlineLimiter = offlineContext.createDynamicsCompressor();
    
    offlineMaster.connect(offlineLimiter);
    offlineLimiter.connect(offlineContext.destination);
    
    this.tracks.forEach((track) => {
      if (track.buffer && !track.muted) {
        const source = offlineContext.createBufferSource();
        const gain = offlineContext.createGain();
        
        source.buffer = track.buffer;
        gain.gain.value = track.volume;
        
        source.connect(gain);
        gain.connect(offlineMaster);
        source.start(0);
      }
    });
    
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert to WAV
    const wav = this.bufferToWav(renderedBuffer);
    return new Blob([wav], { type: 'audio/wav' });
  }
  
  private bufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, length, true);
    
    // Interleave channels
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  }
  
  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  getTracks(): AudioTrack[] {
    return Array.from(this.tracks.values());
  }
  
  removeTrack(id: string) {
    const track = this.tracks.get(id);
    if (track) {
      if (track.source) {
        track.source.stop();
      }
      track.gainNode.disconnect();
      this.tracks.delete(id);
    }
  }
}