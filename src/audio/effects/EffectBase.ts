/**
 * Base class for all audio effects
 */

export abstract class EffectBase {
  protected context: AudioContext;
  protected _bypass: boolean = false;
  protected _wetDryMix: number = 1.0;
  
  constructor(context: AudioContext) {
    this.context = context;
  }
  
  abstract get inputNode(): AudioNode;
  abstract get outputNode(): AudioNode;
  abstract dispose(): void;
  
  get bypass(): boolean {
    return this._bypass;
  }
  
  set bypass(value: boolean) {
    this._bypass = value;
    // Implementations should handle bypass logic
  }
  
  get wetDryMix(): number {
    return this._wetDryMix;
  }
  
  set wetDryMix(value: number) {
    this._wetDryMix = Math.max(0, Math.min(1, value));
  }
}
