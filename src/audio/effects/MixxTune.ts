/**
 * MixxTune: AI-Powered Context-Aware Pitch Correction
 * Main effect class
 */

import { MixxTuneSettings, DEFAULT_MIXXTUNE_SETTINGS, PitchData, MusicalContext, STYLE_PRESETS } from '@/types/mixxtune';
import { PitchDetector } from '../pitch/PitchDetector';
import { PSolaShifter } from '../pitch/PSolaShifter';
import { IntelligentCorrector } from '../pitch/IntelligentCorrector';
import { MusicalContextEngine } from '@/ai/MusicalContextEngine';
import { EffectBase } from './EffectBase';

export class MixxTune extends EffectBase {
  public inputNode: GainNode;
  public outputNode: GainNode;
  
  private settings: MixxTuneSettings;
  private pitchDetector: PitchDetector;
  private pitchShifter: PSolaShifter;
  private corrector: IntelligentCorrector;
  private contextEngine: MusicalContextEngine;
  
  private scriptProcessor: ScriptProcessorNode;
  private analyserNode: AnalyserNode;
  private mixInputNode: GainNode; // For receiving mix bus
  
  private currentPitch: PitchData | null = null;
  private isProcessing: boolean = true;
  
  // Callbacks for UI updates
  public onPitchDetected?: (pitch: PitchData) => void;
  public onContextUpdated?: (context: MusicalContext) => void;
  
  constructor(context: AudioContext) {
    super(context);
    this.inputNode = context.createGain();
    this.outputNode = context.createGain();
    this.mixInputNode = context.createGain();
    
    this.settings = { ...DEFAULT_MIXXTUNE_SETTINGS };
    
    // Initialize components
    this.pitchDetector = new PitchDetector(context.sampleRate);
    this.pitchShifter = new PSolaShifter(context.sampleRate);
    this.corrector = new IntelligentCorrector(this.settings);
    this.contextEngine = new MusicalContextEngine(context);
    
    // Create script processor for audio processing
    const bufferSize = 4096;
    this.scriptProcessor = context.createScriptProcessor(bufferSize, 1, 1);
    this.scriptProcessor.onaudioprocess = this.processAudio.bind(this);
    
    // Create analyser for visualization
    this.analyserNode = context.createAnalyser();
    this.analyserNode.fftSize = 2048;
    
    // Connect audio graph
    this.inputNode.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.outputNode);
    this.inputNode.connect(this.analyserNode);
    
    // Start context analysis loop
    this.startContextAnalysis();
  }
  
  /**
   * Process audio with pitch correction
   */
  private processAudio(event: AudioProcessingEvent): void {
    if (!this.isProcessing || this.settings.strength === 0) {
      // Bypass: copy input to output
      const input = event.inputBuffer.getChannelData(0);
      const output = event.outputBuffer.getChannelData(0);
      output.set(input);
      return;
    }
    
    const input = event.inputBuffer.getChannelData(0);
    const output = event.outputBuffer.getChannelData(0);
    const timestamp = this.context.currentTime;
    
    // Detect pitch
    const pitchData = this.pitchDetector.detect(input, timestamp);
    
    if (pitchData) {
      this.currentPitch = pitchData;
      this.onPitchDetected?.(pitchData);
      
      // Calculate target pitch using intelligent corrector
      const targetFreq = this.corrector.calculateTargetPitch(pitchData);
      
      // Calculate correction ratio
      const correctionRatio = this.corrector.calculateCorrectionAmount(
        pitchData.frequency,
        targetFreq
      );
      
      // Apply pitch correction
      const corrected = this.pitchShifter.shift(input, correctionRatio);
      
      // Copy to output (handle length difference)
      const copyLength = Math.min(output.length, corrected.length);
      for (let i = 0; i < copyLength; i++) {
        output[i] = corrected[i];
      }
    } else {
      // No pitch detected, pass through
      output.set(input);
    }
  }
  
  /**
   * Start context analysis loop
   */
  private async startContextAnalysis(): Promise<void> {
    const analyze = async () => {
      if (this.settings.useAIContext) {
        const context = await this.contextEngine.analyzeContext();
        if (context) {
          this.corrector.updateContext(context);
          this.onContextUpdated?.(context);
        }
      }
      
      if (this.isProcessing) {
        setTimeout(analyze, 500); // Update every 500ms
      }
    };
    
    analyze();
  }
  
  /**
   * Connect mix bus for context analysis
   */
  connectMixBus(mixBus: AudioNode): void {
    this.contextEngine.connectSource(mixBus);
  }
  
  /**
   * Update settings
   */
  setSettings(newSettings: Partial<MixxTuneSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.corrector.updateSettings(this.settings);
  }
  
  /**
   * Load style preset
   */
  loadPreset(style: 'future' | 'drake' | 'natural' | 't-pain'): void {
    const preset = STYLE_PRESETS[style];
    if (preset) {
      this.setSettings({ ...preset, style });
    }
  }
  
  getSettings(): MixxTuneSettings {
    return { ...this.settings };
  }
  
  getCurrentPitch(): PitchData | null {
    return this.currentPitch;
  }
  
  getCurrentContext(): MusicalContext | null {
    return this.contextEngine.getCurrentContext();
  }
  
  /**
   * Bypass control
   */
  setBypass(bypass: boolean): void {
    this.isProcessing = !bypass;
  }
  
  dispose(): void {
    this.isProcessing = false;
    this.scriptProcessor.disconnect();
    this.analyserNode.disconnect();
    this.inputNode.disconnect();
    this.outputNode.disconnect();
    this.mixInputNode.disconnect();
    this.contextEngine.dispose();
  }
}
