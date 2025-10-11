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
  
  // Playback state
  private isPlaying: boolean;
  private startTime: number;
  private pauseTime: number;
  
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
    
    // Connect master → masterGain → limiter → output
    this.masterBus.channelStrip.output.connect(this.masterGainNode);
    this.masterGainNode.connect(this.limiter);
    this.limiter.connect(this.context.destination);
    
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
  play(fromTime: number = 0) {
    if (this.isPlaying) return;
    
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
  }
  
  private playTrackSource(track: Track, offset: number) {
    const source = this.context.createBufferSource();
    source.buffer = track.buffer;
    source.connect(track.channelStrip.input);
    
    // Start from the correct offset position
    const startOffset = Math.max(0, offset + track.offset);
    if (startOffset < track.buffer!.duration) {
      source.start(0, startOffset);
      track.source = source;
      
      // Auto-stop at end
      source.onended = () => {
        track.source = null;
      };
    }
  }
  
  private scheduleLoopCheck() {
    if (!this.isPlaying || !this.loopEnabled) return;
    
    const checkInterval = setInterval(() => {
      if (!this.isPlaying) {
        clearInterval(checkInterval);
        return;
      }
      
      const currentTime = this.getCurrentTime();
      
      // Check if we've reached loop end
      if (currentTime >= this.loopEnd) {
        // Jump back to loop start
        this.seek(this.loopStart);
      }
    }, 50); // Check every 50ms
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
    this.tracks.forEach((track) => {
      if (track.source) {
        try {
          track.source.stop();
        } catch (e) {
          // Source may already be stopped
        }
        track.source = null;
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
  
  // Metering
  getTrackPeakLevel(id: string): PeakLevel {
    const track = this.tracks.get(id);
    return track ? track.channelStrip.getPeakLevel() : { left: -60, right: -60 };
  }
  
  getMasterPeakLevel(): PeakLevel {
    return this.masterBus.channelStrip.getPeakLevel();
  }
  
  getMasterAnalyser(): AnalyserNode | undefined {
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
  
  // Get plugin effect instance for parameter updates
  getPluginInstance(trackId: string, slotNumber: number) {
    const track = this.tracks.get(trackId);
    if (!track) return null;
    
    return track.channelStrip.getInsert(slotNumber);
  }
}
