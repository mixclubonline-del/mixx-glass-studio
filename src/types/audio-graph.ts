// types/audio-graph.ts

import { FourAnchors, MusicalContext } from './sonic-architecture';

export interface IAudioEngine {
  input: AudioNode;
  output: AudioNode;
  makeup: GainNode; // A dedicated makeup gain node, part of the internal chain

  audioContext: BaseAudioContext | null; // Allow engines to hold context reference

  /**
   * Optional sidechain input node for external keying/triggering.
   * Used for sidechain compression, ducking, and other keyed effects.
   */
  sidechainInput?: AudioNode;

  /**
   * Initializes the engine and creates its internal Web Audio nodes.
   * @param ctx The global AudioContext.
   */
  initialize(ctx: BaseAudioContext): Promise<void>;

  /**
   * Provides a clock source to the engine for synchronized effects.
   * @param getBeatPhase A function that returns the current phase of the beat (0 to 1).
   */
  setClock(getBeatPhase: () => number): void;

  /**
   * Disconnects all internal nodes and cleans up resources.
   */
  dispose(): void;

  /**
   * Checks if the engine is currently initialized and active.
   */
  isActive(): boolean;

  /**
   * Gets the current initialization status of the engine.
   */
  getIsInitialized(): boolean;

  /**
   * Sets a specific parameter of the audio engine.
   * @param name The name of the parameter.
   * @param value The value to set.
   */
  setParameter(name: string, value: number): void;

  /**
   * Gets the current value of a specific parameter.
   * @param name The name of the parameter.
   * @returns The current value of the parameter.
   */
  getParameter(name: string): number;

  /**
   * Gets a list of all automatable parameter names for this engine.
   * @returns An array of parameter names.
   */
  getParameterNames(): string[];

  /**
   * Gets the minimum value for a specific parameter.
   * @param name The name of the parameter.
   * @returns The minimum value.
   */
  getParameterMin(name: string): number;

  /**
   * Gets the maximum value for a specific parameter.
   * @param name The name of the parameter.
   * @returns The maximum value.
   */
  getParameterMax(name: string): number;

  /**
   * Sets the sidechain source for this engine.
   * @param source The audio node to use as sidechain source, or null to disconnect.
   */
  setSidechainSource?(source: AudioNode | null): void;

  /**
   * Gets the current sidechain source node, if any.
   * @returns The sidechain source node, or null if not connected.
   */
  getSidechainSource?(): AudioNode | null;

  // Optional methods for context-aware engines
  adaptToAnchors?(anchors: FourAnchors): void;
  setContext?(context: MusicalContext): void;
}