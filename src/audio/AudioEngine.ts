/**
 * Mixx Club Pro Studio - Enhanced Audio Engine
 * Professional multi-track architecture with buses and channel strips
 */

import { Track } from './Track';
import { Bus } from './Bus';
import { Reverb } from './effects/Reverb';
import { Delay } from './effects/Delay';
import { EQParams, CompressorParams, PeakLevel } from '@/types/audio';
import { PluginFactory } from './plugins/PluginFactory';
import { getVelvetFloorEngine, VelvetFloorEngine } from './engines/VelvetFloorEngine';

export interface EffectParams {
  reverbMix: number;
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  limiterThreshold: number;
}

export class AudioEngine {
  private context: AudioContext;
  private tracks: Map<string, Track>;
  private buses: Map<string, Bus>;
  private masterBus: Bus;
  private soloedTracks: Set<string>;
  private preSoloMuteStates: Map<string, boolean>;
  private masterGainNode: GainNode;
  private velvetFloor: VelvetFloorEngine;
  
  // Playback state
  private isPlaying: boolean;
  private startTime: number;
  private pauseTime: number;
  private loopCheckInterval: number | null = null;
  
  // Error handling
  private errorHandlers: ((error: Error) => void)[] = [];
  
  // Master effects
  private limiter: DynamicsCompressorNode;
  
  // Project settings
  public bpm: number;
  public key: string; // Musical key (e.g., "C Major", "A Minor")
  public timeSignature: { numerator: number; denominator: number };
  public loopStart: number;
  public loopEnd: number;
  public loopEnabled: boolean;
  public projectStartOffset: number; // Offset before bar 1 (seconds)
  
  constructor() {
    this.context = new AudioContext();
    this.tracks = new Map();
    this.buses = new Map();
    this.soloedTracks = new Set();
    this.preSoloMuteStates = new Map();
    this.isPlaying = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.bpm = 120;
    this.key = 'C Major';
    this.timeSignature = { numerator: 4, denominator: 4 };
    this.loopStart = 0;
    this.loopEnd = 0;
    this.loopEnabled = false;
    
    // No offset - audio starts at bar 1
    this.projectStartOffset = 0;
    
    // Monitor context state changes
    this.context.addEventListener('statechange', () => {
      console.log(`🎵 AudioContext state: ${this.context.state}`);
      
      if (this.context.state === 'interrupted') {
        this.handleContextInterruption();
      }
    });
    
    // Create master bus
    this.masterBus = new Bus(this.context, 'master', 'Master', 'master');
    
    // Create master gain node
    this.masterGainNode = this.context.createGain();
    this.masterGainNode.gain.value = 0.75;
    
    // Create limiter
    this.limiter = this.context.createDynamicsCompressor();
    this.limiter.threshold.value = -1.0;
    this.limiter.knee.value = 0.0;
    this.limiter.ratio.value = 20.0;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.05;
    
    // Initialize VelvetFloor Engine (Five Pillars Doctrine)
    this.velvetFloor = getVelvetFloorEngine();
    this.velvetFloor.initialize(this.context).then(() => {
      console.log('🎵 VelvetFloor Engine initialized');
    }).catch(err => {
      this.handleError(err as Error, 'VelvetFloor initialization');
    });
    
    // Master chain: masterBus -> VelvetFloor -> masterGain -> limiter -> output
    this.masterBus.channelStrip.output.connect(this.velvetFloor.input);
    this.velvetFloor.output.connect(this.masterGainNode);
    this.masterGainNode.connect(this.limiter);
    this.limiter.connect(this.context.destination);
    
    console.log('🎵 Audio routing: Master Bus → VelvetFloor → Master Gain → Limiter → Output');
    
    // Create default reverb and delay buses
    this.createBus('reverb', 'Reverb', 'aux');
    this.createBus('delay', 'Delay', 'aux');
  }
  
  // Bus management
  createBus(id: string, name: string, type: 'aux' | 'group' = 'aux'): string {
    const bus = new Bus(this.context, id, name, type);
    bus.channelStrip.output.connect(this.masterBus.input);
    this.buses.set(id, bus);
    return id;
  }
  
  getBuses(): Bus[] {
    return Array.from(this.buses.values());
  }
  
  // Track management
  async loadTrack(id: string, name: string, file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    
    const track = new Track(this.context, id, name, audioBuffer);
    track.channelStrip.output.connect(this.masterBus.input);
    
    // Create sends to all buses
    this.buses.forEach((bus) => {
      const sendNode = track.channelStrip.createSend(bus.id, false);
      sendNode.connect(bus.input);
    });
    
    this.tracks.set(id, track);
    
    // Analyze sub-harmonic content for VelvetFloor
    this.analyzeSubHarmonics(id, audioBuffer);
  }
  
  getTracks(): Track[] {
    return Array.from(this.tracks.values());
  }
  
  removeTrack(id: string) {
    const track = this.tracks.get(id);
    if (track) {
      track.dispose();
      this.tracks.delete(id);
    }
  }
  
  // Channel strip controls
  setTrackEQ(id: string, params: Partial<EQParams>) {
    const track = this.tracks.get(id);
    if (track) track.channelStrip.setEQ(params);
  }
  
  setTrackCompressor(id: string, params: Partial<CompressorParams>) {
    const track = this.tracks.get(id);
    if (track) track.channelStrip.setCompressor(params);
  }
  
  setTrackPan(id: string, pan: number) {
    const track = this.tracks.get(id);
    if (track) track.channelStrip.setPan(pan);
  }
  
  setTrackVolume(id: string, volume: number) {
    const track = this.tracks.get(id);
    if (track) track.channelStrip.setVolume(volume);
  }
  
  setTrackMute(id: string, muted: boolean) {
    const track = this.tracks.get(id);
    if (track) track.channelStrip.setMute(muted);
  }
  
  setTrackSolo(id: string, solo: boolean) {
    const track = this.tracks.get(id);
    if (!track) return;
    
    track.channelStrip.setSolo(solo);
    
    if (solo) {
      this.soloedTracks.add(id);
    } else {
      this.soloedTracks.delete(id);
    }
    
    this.updateSoloState();
  }
  
  private updateSoloState() {
    const hasSolo = this.soloedTracks.size > 0;
    
    if (hasSolo) {
      // Save pre-solo mute states and mute non-soloed tracks
      this.tracks.forEach((track, id) => {
        if (!this.preSoloMuteStates.has(id)) {
          this.preSoloMuteStates.set(id, track.channelStrip.isMuted());
        }
        
        if (!this.soloedTracks.has(id)) {
          track.channelStrip.setMute(true);
        } else {
          track.channelStrip.setMute(false);
        }
      });
    } else {
      // Restore pre-solo mute states
      this.tracks.forEach((track, id) => {
        const preSoloMuted = this.preSoloMuteStates.get(id) || false;
        track.channelStrip.setMute(preSoloMuted);
      });
      this.preSoloMuteStates.clear();
    }
  }
  
  // Master volume control
  setMasterGain(gain: number) {
    this.masterGainNode.gain.value = Math.max(0, Math.min(1, gain));
  }

  getMasterGain(): number {
    return this.masterGainNode.gain.value;
  }
  
  // Bus management
  createAuxBus(id: string, name: string) {
    return this.createBus(id, name, 'aux');
  }
  
  createGroupBus(id: string, name: string) {
    return this.createBus(id, name, 'group');
  }
  
  // Playback with loop support
  async play(fromTime: number = 0) {
    if (this.isPlaying) return;
    
    // Ensure AudioContext is running
    const ready = await this.ensureContextRunning();
    if (!ready) {
      this.handleError(new Error('Cannot play: AudioContext not running'), 'playback');
      return;
    }
    
    try {
      // If resuming from pause, use pauseTime, otherwise use fromTime
      const offset = this.pauseTime > 0 ? this.pauseTime : fromTime;
      this.startTime = this.context.currentTime - offset;
      
      this.tracks.forEach((track) => {
        if (track.buffer && !track.channelStrip.isMuted()) {
          this.playTrackSource(track, offset);
        }
      });
      
      this.isPlaying = true;
      
      // Setup loop monitoring if enabled
      if (this.loopEnabled && this.loopEnd > this.loopStart) {
        this.scheduleLoopCheck();
      }
    } catch (err) {
      this.handleError(err as Error, 'playback start');
    }
  }
  
  private playTrackSource(track: Track, offset: number) {
    try {
      // Stop existing source gracefully
      if (track.source && track.sourceState === 'playing') {
        track.sourceState = 'stopping';
        try {
          track.source.stop();
        } catch (e) {
          // Source may already be stopped
        }
        track.source = null;
      }
      
      // Create new source
      const source = this.context.createBufferSource();
      source.buffer = track.buffer;
      track.sourceState = 'scheduled';
      
      // Reliable cleanup on end
      source.onended = () => {
        if (track.source === source) {
          track.source = null;
          track.sourceState = 'idle';
        }
      };
      
      source.connect(track.channelStrip.input);
      track.source = source;
      
      // Sample-accurate start with 1ms lookahead
      const startOffset = Math.max(0, offset + track.offset);
      const scheduledTime = this.context.currentTime + 0.001;
      
      if (startOffset < track.buffer!.duration) {
        track.sourceState = 'playing';
        source.start(scheduledTime, startOffset);
        
        // Update timing reference for precision
        this.startTime = scheduledTime - offset;
      }
    } catch (err) {
      this.handleError(err as Error, `playback track ${track.id}`);
    }
  }
  
  private scheduleLoopCheck() {
    if (!this.isPlaying || !this.loopEnabled) return;
    
    // Clear existing interval
    this.clearLoopCheck();
    
    this.loopCheckInterval = window.setInterval(() => {
      if (!this.isPlaying) {
        this.clearLoopCheck();
        return;
      }
      
      const currentTime = this.getCurrentTime();
      const lookahead = 0.1; // 100ms lookahead for smoother loops
      
      // Check if we've reached loop end
      if (currentTime >= this.loopEnd - lookahead) {
        // Pre-schedule loop jump for tighter timing
        this.seek(this.loopStart);
      }
    }, 20); // Check every 20ms for tighter timing
  }
  
  private clearLoopCheck() {
    if (this.loopCheckInterval !== null) {
      clearInterval(this.loopCheckInterval);
      this.loopCheckInterval = null;
    }
  }
  
  pause() {
    if (!this.isPlaying) return;
    
    this.clearLoopCheck();
    this.pauseTime = this.context.currentTime - this.startTime;
    
    this.tracks.forEach((track) => {
      if (track.source && track.sourceState === 'playing') {
        try {
          track.sourceState = 'stopping';
          track.source.stop();
        } catch (e) {
          // Source may already be stopped
        }
        track.source = null;
        track.sourceState = 'idle';
      }
    });
    
    this.isPlaying = false;
  }
  
  stop() {
    this.clearLoopCheck();
    
    this.tracks.forEach((track) => {
      if (track.source) {
        try {
          if (track.sourceState === 'playing') {
            track.sourceState = 'stopping';
            track.source.stop();
          }
        } catch (e) {
          // Source may already be stopped
        }
        track.source = null;
        track.sourceState = 'idle';
      }
    });
    
    this.isPlaying = false;
    this.pauseTime = 0;
    this.startTime = 0;
  }
  
  seek(time: number) {
    const wasPlaying = this.isPlaying;
    
    if (this.isPlaying) {
      this.stop();
    }
    
    this.pauseTime = time;
    
    if (wasPlaying) {
      this.play(time);
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
        maxDuration = Math.max(maxDuration, track.buffer.duration + track.offset);
      }
    });
    return maxDuration;
  }
  
  // Metering - Direct analyser access for real-time rendering
  getTrackAnalysers(id: string): { left: AnalyserNode; right: AnalyserNode } | null {
    const track = this.tracks.get(id);
    return track ? track.channelStrip.getAnalysers() : null;
  }
  
  getMasterAnalysers(): { left: AnalyserNode; right: AnalyserNode } {
    return this.masterBus.channelStrip.getAnalysers();
  }
  
  // Legacy compatibility - return left analyser
  getMasterAnalyser(): AnalyserNode {
    return this.masterBus.channelStrip.getAnalyser();
  }
  
  // Legacy compatibility
  updateEffect(param: keyof EffectParams, value: number) {
    // Keep for backward compatibility with existing controls
  }
  
  async exportMix(): Promise<Blob> {
    const duration = this.getDuration();
    const offlineContext = new OfflineAudioContext(2, duration * 44100, 44100);
    
    const offlineMaster = offlineContext.createGain();
    const offlineLimiter = offlineContext.createDynamicsCompressor();
    
    offlineMaster.connect(offlineLimiter);
    offlineLimiter.connect(offlineContext.destination);
    
    this.tracks.forEach((track) => {
      if (track.buffer && !track.channelStrip.isMuted()) {
        const source = offlineContext.createBufferSource();
        const gain = offlineContext.createGain();
        
        source.buffer = track.buffer;
        gain.gain.value = track.channelStrip.getVolume();
        
        source.connect(gain);
        gain.connect(offlineMaster);
        source.start(track.offset);
      }
    });
    
    const renderedBuffer = await offlineContext.startRendering();
    const wav = this.bufferToWav(renderedBuffer);
    return new Blob([wav], { type: 'audio/wav' });
  }
  
  private bufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    
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
  
  // Get current bar position in real-time
  getBarPosition(): { bar: number; beat: number; tick: number } {
    const currentTime = this.getCurrentTime();
    return this.timeToBarsBeatsTicks(currentTime);
  }
  
  // Bar/Beat Time Conversion
  timeToBarsBeatsTicks(seconds: number): { bar: number; beat: number; tick: number } {
    const secondsPerBeat = 60 / this.bpm;
    const beatsPerBar = this.timeSignature.numerator;
    
    // Account for project start offset
    const adjustedSeconds = seconds - this.projectStartOffset;
    
    const totalBeats = adjustedSeconds / secondsPerBeat;
    const bar = Math.floor(totalBeats / beatsPerBar) + 1; // Start at bar 1
    const beat = Math.floor(totalBeats % beatsPerBar) + 1; // Start at beat 1
    const tick = Math.floor((totalBeats % 1) * 960); // 960 ticks per beat (MIDI standard)
    
    return { bar, beat, tick };
  }
  
  barsBeatTicksToTime(bar: number, beat: number, tick: number): number {
    const secondsPerBeat = 60 / this.bpm;
    const beatsPerBar = this.timeSignature.numerator;
    
    const totalBeats = (bar - 1) * beatsPerBar + (beat - 1) + (tick / 960);
    const seconds = totalBeats * secondsPerBeat;
    
    return seconds + this.projectStartOffset;
  }
  
  // Plugin management on tracks
  loadPluginToTrack(trackId: string, pluginId: string, slotNumber: number): string | null {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.error(`Track ${trackId} not found`);
      return null;
    }
    
    if (!pluginId || pluginId.trim() === '') {
      console.error('Empty plugin ID provided');
      return null;
    }
    
    // Check if plugin is supported
    if (!PluginFactory.isSupported(pluginId)) {
      console.error(`Plugin ${pluginId} is not supported`);
      return null;
    }
    
    // Create audio effect instance
    const audioEffect = PluginFactory.createInstance(pluginId, this.context);
    if (!audioEffect) {
      console.error(`Failed to create plugin instance: ${pluginId}`);
      return null;
    }
    
    // Load into channel strip (this connects it to the audio graph)
    track.channelStrip.loadInsert(slotNumber, audioEffect);
    
    // Update track metadata
    const instanceId = `${trackId}_${pluginId}_${slotNumber}`;
    track.loadPlugin(slotNumber, pluginId, instanceId);
    
    console.log(`✅ Loaded ${pluginId} to track ${trackId} slot ${slotNumber}`);
    
    return instanceId;
  }
  
  unloadPluginFromTrack(trackId: string, slotNumber: number) {
    const track = this.tracks.get(trackId);
    if (track) {
      // Unload from channel strip (disconnects from audio graph)
      track.channelStrip.unloadInsert(slotNumber);
      
      // Update track metadata
      track.unloadPlugin(slotNumber);
      
      console.log(`✅ Unloaded plugin from track ${trackId} slot ${slotNumber}`);
    }
  }
  
  bypassPluginOnTrack(trackId: string, slotNumber: number, bypass: boolean) {
    const track = this.tracks.get(trackId);
    if (track) {
      // Bypass in channel strip (affects audio processing)
      track.channelStrip.bypassInsert(slotNumber, bypass);
      
      // Update track metadata
      track.bypassPlugin(slotNumber, bypass);
      
      console.log(`✅ ${bypass ? 'Bypassed' : 'Enabled'} plugin on track ${trackId} slot ${slotNumber}`);
    }
  }
  
  getPluginInstance(trackId: string, slotNumber: number): any | null {
    const track = this.tracks.get(trackId);
    if (track) {
      return track.channelStrip.getInsert(slotNumber);
    }
    return null;
  }

  /**
   * Analyze sub-harmonic content and register with VelvetFloor
   */
  private analyzeSubHarmonics(trackId: string, buffer: AudioBuffer): void {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    
    // Simple frequency detection for sub-bass (20-120Hz)
    const fftSize = 2048;
    const frequencies = [30, 45, 60, 80, 100]; // Key sub frequencies
    
    frequencies.forEach((freq, index) => {
      // Calculate approximate energy at this frequency
      const energy = this.estimateFrequencyEnergy(channelData, freq, sampleRate, fftSize);
      
      if (energy > 0.1) {
        this.velvetFloor.addSubSource({
          id: `${trackId}-sub-${freq}Hz`,
          frequency: freq,
          amplitude: energy,
          phase: 0,
          harmonicContent: [1, 0.5, 0.3, 0.2, 0.1],
          sourceType: freq < 40 ? 'sub' : freq < 70 ? '808' : 'bass'
        });
        console.log(`🎵 VelvetFloor: Added ${freq}Hz sub source from ${trackId}, energy: ${energy.toFixed(2)}`);
      }
    });
  }

  /**
   * Estimate energy at a specific frequency
   */
  private estimateFrequencyEnergy(
    channelData: Float32Array, 
    targetFreq: number, 
    sampleRate: number, 
    fftSize: number
  ): number {
    let maxEnergy = 0;
    const step = Math.floor(sampleRate * 0.1); // Sample every 0.1 seconds
    
    for (let i = 0; i < channelData.length - fftSize; i += step) {
      let real = 0;
      let imag = 0;
      
      // Simple DFT at target frequency
      const omega = (2 * Math.PI * targetFreq) / sampleRate;
      for (let n = 0; n < fftSize; n++) {
        const sample = channelData[i + n] || 0;
        real += sample * Math.cos(omega * n);
        imag += sample * Math.sin(omega * n);
      }
      
      const energy = Math.sqrt(real * real + imag * imag) / fftSize;
      maxEnergy = Math.max(maxEnergy, energy);
    }
    
    return Math.min(1, maxEnergy * 2);
  }

  /**
   * Get VelvetFloor Engine instance
   */
  getVelvetFloorEngine(): VelvetFloorEngine {
    return this.velvetFloor;
  }

  /**
   * Set beat-locked clock for VelvetFloor
   */
  setBeatClock(getBeatPhase: () => number): void {
    this.velvetFloor.setClock(getBeatPhase);
  }
  
  dispose() {
    // Clear loop monitoring
    this.clearLoopCheck();
    
    // Stop playback
    this.stop();
    
    // Dispose all tracks and clear references
    this.tracks.forEach(track => {
      try {
        track.dispose();
      } catch (err) {
        this.handleError(err as Error, 'track disposal');
      }
    });
    this.tracks.clear();
    
    // Dispose all buses
    this.buses.forEach(bus => {
      try {
        bus.dispose();
      } catch (err) {
        this.handleError(err as Error, 'bus disposal');
      }
    });
    this.buses.clear();
    
    // Dispose master chain
    try {
      this.masterBus.dispose();
    } catch (err) {
      this.handleError(err as Error, 'master bus disposal');
    }
    
    // Dispose VelvetFloor
    if (this.velvetFloor) {
      try {
        this.velvetFloor.dispose();
      } catch (err) {
        this.handleError(err as Error, 'VelvetFloor disposal');
      }
    }
    
    // Disconnect master nodes
    try {
      this.masterGainNode.disconnect();
      this.limiter.disconnect();
    } catch (e) {
      // Already disconnected
    }
    
    // Close AudioContext
    if (this.context.state !== 'closed') {
      this.context.close().catch(err => {
        console.error('Error closing AudioContext:', err);
      });
    }
    
    console.log('🎵 AudioEngine fully disposed');
  }
  
  // Error handling
  onError(handler: (error: Error) => void) {
    this.errorHandlers.push(handler);
  }
  
  private handleError(error: Error, context: string) {
    console.error(`🎵 AudioEngine error [${context}]:`, error);
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (e) {
        console.error('Error in error handler:', e);
      }
    });
  }
  
  private handleContextInterruption() {
    console.warn('🎵 AudioContext interrupted, attempting recovery...');
    if (this.isPlaying) {
      this.pause();
    }
  }
  
  private async ensureContextRunning(): Promise<boolean> {
    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
        console.log('🎵 AudioContext resumed');
        return true;
      } catch (err) {
        console.error('Failed to resume AudioContext:', err);
        return false;
      }
    }
    return this.context.state === 'running';
  }
}
