/**
 * Enhanced Delay Effect
 * Stereo/ping-pong delay with BPM sync
 */

import { EffectBase } from './EffectBase';

export interface DelayParams {
  time: number; // 0 to 2 seconds (or BPM-synced)
  feedback: number; // 0 to 0.95
  mix: number; // 0 to 1
  pingPong: boolean;
}

export class Delay extends EffectBase {
  private input: GainNode;
  private output: GainNode;
  private delayNodeL: DelayNode;
  private delayNodeR: DelayNode;
  private feedbackL: GainNode;
  private feedbackR: GainNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private params: DelayParams;
  
  constructor(context: AudioContext) {
    super(context);
    
    this.input = context.createGain();
    this.output = context.createGain();
    this.delayNodeL = context.createDelay(5.0);
    this.delayNodeR = context.createDelay(5.0);
    this.feedbackL = context.createGain();
    this.feedbackR = context.createGain();
    this.wetGain = context.createGain();
    this.dryGain = context.createGain();
    
    this.params = {
      time: 0.375,
      feedback: 0.4,
      mix: 0.2,
      pingPong: false,
    };
    
    // Setup routing
    this.setupRouting();
    this.updateParams();
  }
  
  get inputNode(): AudioNode {
    return this.input;
  }
  
  get outputNode(): AudioNode {
    return this.output;
  }
  
  private setupRouting() {
    // Input splits to both delay lines
    this.input.connect(this.delayNodeL);
    this.input.connect(this.delayNodeR);
    
    // Delay outputs to feedback and wet mix
    this.delayNodeL.connect(this.feedbackL);
    this.delayNodeR.connect(this.feedbackR);
    
    this.delayNodeL.connect(this.wetGain);
    this.delayNodeR.connect(this.wetGain);
    
    // Feedback loops (will be configured based on pingPong)
    this.feedbackL.connect(this.delayNodeL);
    this.feedbackR.connect(this.delayNodeR);
    
    // Wet/dry mix
    this.wetGain.connect(this.output);
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
  }
  
  setTime(time: number) {
    this.params.time = Math.max(0, Math.min(5, time));
    this.delayNodeL.delayTime.value = this.params.time;
    this.delayNodeR.delayTime.value = this.params.time;
  }
  
  setFeedback(feedback: number) {
    this.params.feedback = Math.max(0, Math.min(0.95, feedback));
    this.feedbackL.gain.value = this.params.feedback;
    this.feedbackR.gain.value = this.params.feedback;
  }
  
  setMix(mix: number) {
    this.params.mix = Math.max(0, Math.min(1, mix));
    this.wetGain.gain.value = this.params.mix;
    this.dryGain.gain.value = 1 - this.params.mix;
  }
  
  setPingPong(pingPong: boolean) {
    this.params.pingPong = pingPong;
    
    // Reconfigure feedback routing
    this.feedbackL.disconnect();
    this.feedbackR.disconnect();
    
    if (pingPong) {
      // Cross feedback for ping-pong
      this.feedbackL.connect(this.delayNodeR);
      this.feedbackR.connect(this.delayNodeL);
    } else {
      // Normal feedback
      this.feedbackL.connect(this.delayNodeL);
      this.feedbackR.connect(this.delayNodeR);
    }
  }
  
  syncToBPM(bpm: number, division: number = 0.25) {
    // division: 0.25 = quarter note, 0.125 = eighth note, etc.
    const secondsPerBeat = 60 / bpm;
    const time = secondsPerBeat * division;
    this.setTime(time);
  }
  
  private updateParams() {
    this.setTime(this.params.time);
    this.setFeedback(this.params.feedback);
    this.setMix(this.params.mix);
    this.setPingPong(this.params.pingPong);
  }
  
  dispose() {
    this.input.disconnect();
    this.delayNodeL.disconnect();
    this.delayNodeR.disconnect();
    this.feedbackL.disconnect();
    this.feedbackR.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    this.output.disconnect();
  }
}
