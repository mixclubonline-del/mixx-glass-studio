
// audio/plugins.ts
import { IAudioEngine } from '../types/audio-graph';
import VelvetCurveVisualizer from '../components/VelvetCurveVisualizer';
import { getVelvetCurveEngine } from './VelvetCurveEngine';
import HarmonicLatticeVisualizer from '../components/HarmonicLatticeVisualizer';
import { getHarmonicLattice } from './HarmonicLattice';
import MixxFXVisualizer from '../components/MixxFXVisualizer';
import { getMixxFXEngine } from './MixxFXEngine';
import TimeWarpVisualizer from '../components/TimeWarpVisualizer';
import { getTimeWarpEngine } from './TimeWarpEngine';
import MixxTuneVisualizer from '../components/plugins/MixxTuneVisualizer';
import { getMixxTuneEngine } from './MixxTuneEngine';
import MixxVerbVisualizer from '../components/plugins/MixxVerbVisualizer';
import { getMixxVerbEngine } from './MixxVerbEngine';
import MixxDelayVisualizer from '../components/plugins/MixxDelayVisualizer';
import { getMixxDelayEngine } from './MixxDelayEngine';
import MixxLimiterVisualizer from '../components/plugins/MixxLimiterVisualizer';
import { getMixxLimiterEngine } from './MixxLimiterEngine';
import MixxClipperVisualizer from '../components/plugins/MixxClipperVisualizer';
import { getMixxClipperEngine } from './MixxClipperEngine';
import MixxDriveVisualizer from '../components/plugins/MixxDriveVisualizer';
import { getMixxDriveEngine } from './MixxDriveEngine';
import MixxGlueVisualizer from '../components/plugins/MixxGlueVisualizer';
import { getMixxGlueEngine } from './MixxGlueEngine';

export type PluginId =
  | 'velvet-curve'
  | 'harmonic-lattice'
  | 'mixx-fx'
  | 'time-warp'
  | 'mixx-tune'
  | 'mixx-verb'
  | 'mixx-delay'
  | 'mixx-drive'
  | 'mixx-glue'
  | 'mixx-limiter'
  | 'mixx-clip'
  | string;

export interface PluginConfig {
  id: PluginId;
  name: string;
  component: React.FC<any>; // Visualizer component
  engineInstance: (ctx: BaseAudioContext) => IAudioEngine; // Factory for the audio engine instance
}

// A placeholder for generic plugins or those not yet implemented
export class PlaceholderAudioEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null = null;
  private isInitialized = false;
  private params: Record<string, number> = {};

  constructor(ctx: BaseAudioContext) {
    this.audioContext = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.makeup = ctx.createGain();
    // Directly connect input to output for placeholder
    this.input.connect(this.makeup);
    this.makeup.connect(this.output);
  }
  
  async initialize(ctx: BaseAudioContext): Promise<void> {
    if(!this.audioContext) this.audioContext = ctx;
    this.isInitialized = true;
  }

  getIsInitialized(): boolean {
      return this.isInitialized;
  }

  setClock(getBeatPhase: () => number): void {}
  dispose(): void {
      this.input.disconnect();
      this.output.disconnect();
      this.makeup.disconnect();
  }
  isActive(): boolean { return this.isInitialized; }
  setParameter(name: string, value: number): void { this.params[name] = value; }
  getParameter(name: string): number { return this.params[name] || 0; }
  getParameterNames(): string[] { return Object.keys(this.params); }
  getParameterMin(name: string): number { return 0; }
  getParameterMax(name: string): number { return 1; }
}


const PLUGIN_REGISTRY: Omit<PluginConfig, 'engineInstance'>[] = [
  { id: 'velvet-curve', name: 'Velvet Curve', component: VelvetCurveVisualizer },
  { id: 'harmonic-lattice', name: 'Harmonic Lattice', component: HarmonicLatticeVisualizer },
  { id: 'mixx-tune', name: 'Mixx Tune', component: MixxTuneVisualizer },
  { id: 'mixx-verb', name: 'Mixx Verb', component: MixxVerbVisualizer },
  { id: 'mixx-delay', name: 'Mixx Delay', component: MixxDelayVisualizer },
  { id: 'mixx-drive', name: 'Mixx Drive', component: MixxDriveVisualizer },
  { id: 'mixx-glue', name: 'Mixx Glue', component: MixxGlueVisualizer },
  { id: 'mixx-limiter', name: 'Mixx Limiter', component: MixxLimiterVisualizer },
  { id: 'mixx-clip', name: 'Mixx Clip', component: MixxClipperVisualizer },
  { id: 'mixx-fx', name: 'Mixx FX', component: MixxFXVisualizer },
  { id: 'time-warp', name: 'Time Warp', component: TimeWarpVisualizer },
];

export function getPluginRegistry(ctx: BaseAudioContext): PluginConfig[] {
    return PLUGIN_REGISTRY.map(p => {
        let engineInstance: (ctx: BaseAudioContext) => IAudioEngine;
        switch(p.id) {
            case 'velvet-curve':
                engineInstance = () => getVelvetCurveEngine(ctx);
                break;
            case 'harmonic-lattice':
                engineInstance = () => getHarmonicLattice(ctx);
                break;
            case 'mixx-tune':
                engineInstance = () => getMixxTuneEngine(ctx);
                break;
            case 'mixx-verb':
                engineInstance = () => getMixxVerbEngine(ctx);
                break;
            case 'mixx-delay':
                engineInstance = () => getMixxDelayEngine(ctx);
                break;
            case 'mixx-drive':
                engineInstance = () => getMixxDriveEngine(ctx);
                break;
            case 'mixx-glue':
                engineInstance = () => getMixxGlueEngine(ctx);
                break;
            case 'mixx-limiter':
                engineInstance = () => getMixxLimiterEngine(ctx);
                break;
            case 'mixx-clip':
                engineInstance = () => getMixxClipperEngine(ctx);
                break;
            case 'mixx-fx':
                engineInstance = () => getMixxFXEngine(ctx);
                break;
            case 'time-warp':
                engineInstance = () => getTimeWarpEngine(ctx);
                break;
            default:
                engineInstance = (ctx) => new PlaceholderAudioEngine(ctx);
        }
        return { ...p, engineInstance };
    });
}
