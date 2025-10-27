/**
 * Audio Graph Types - Five Pillars Doctrine
 */

export interface AudioGraphNode {
  id: string;
  type: string;
  input: AudioNode;
  output: AudioNode;
}

export interface IAudioEngine {
  input: AudioNode;
  output: AudioNode;
  makeup: GainNode;
  
  initialize(ctx: AudioContext): Promise<void>;
  setClock?(getBeatPhase: () => number): void;
  dispose(): void;
}
