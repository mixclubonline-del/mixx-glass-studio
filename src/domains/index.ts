/**
 * Domain Providers - Centralized state management
 * Phase 31: App.tsx Decomposition
 * 
 * Usage:
 * import { DomainBridge, useAudioDomain } from './domains';
 */

// Audio Domain
export { AudioDomainProvider, useAudioDomain } from './audio';
export type { AudioDomainContextType, MasterNodes } from './audio';

// Transport Domain
export { TransportDomainProvider, useTransport } from './transport';
export type { TransportDomainContextType, TransportState } from './transport';

// Tracks Domain
export { TracksDomainProvider, useTracks } from './tracks';
export type { TracksDomainContextType, Track, Clip, TrackRole, TrackColor } from './tracks';

// Mixer Domain
export { MixerDomainProvider, useMixer } from './mixer';
export type { MixerDomainContextType, MixerSettings, SendLevel } from './mixer';

// Plugins Domain
export { PluginsDomainProvider, usePlugins } from './plugins';
export type { PluginsDomainContextType, FXWindowState, PluginPreset } from './plugins';

// AI Domain
export { AIDomainProvider, useAI } from './ai';
export type { AIDomainContextType, PrimeBrainMode, BloomContext } from './ai';

// UI Domain
export { UIDomainProvider, useUI } from './ui';
export type { UIDomainContextType, UILayout, DockState, Point } from './ui';

// Domain Bridge (composes all providers)
export { DomainBridge } from './DomainBridge';

// Migration hooks
export { useDomainBridgeSync, useDomainStatus } from './useDomainBridge';
export type { FlowRuntimeState } from './useDomainBridge';

// FlowRuntime bridge hooks
export { 
  useFlowRuntimeBridge, 
  useMixerBridgeSync, 
  useTransportBridgeSync, 
  useAIBridgeSync 
} from './useFlowRuntimeBridge';
