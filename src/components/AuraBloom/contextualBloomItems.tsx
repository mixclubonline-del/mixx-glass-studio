/**
 * Contextual Bloom Menu Items
 * 
 * Maps each BloomContext to appropriate AURA menu items.
 * These items dynamically change based on what the user is doing in the studio.
 */

import React from 'react';
import type { BloomContext } from '../../types/bloom';
import { BLOOM_CONTEXT_ACCENTS } from '../../types/bloom';

import {
  PlusIcon,
  CopyIcon,
  ScissorsIcon,
  LoopIcon,
  RecordIcon,
  MicrophoneIcon,
  WaveformIcon,
  MixerIcon,
  SpeakerIcon,
  MuteIcon,
  HeadphonesIcon,
  ExportIcon,
  SparkleIcon,
  MagicWandIcon,
  BoltIcon,
  ImportIcon,
  FolderIcon,
  SettingsIcon,
  SynthIcon,
  DrumIcon,
  PianoIcon,
  UndoIcon,
  RedoIcon,
  ZoomInIcon,
  PlayIcon,
  StopIcon,
  SaveIcon,
  PluginsIcon,
} from './bloomIcons';

export interface ContextualMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: string;
  color?: string;
  disabled?: boolean;
  description?: string;
}

const ICON_SIZE = 24;

// ═══════════════════════════════════════════════════════════════════════════
// ARRANGE CONTEXT - Timeline / Clip editing tools
// ═══════════════════════════════════════════════════════════════════════════
export const arrangeItems: ContextualMenuItem[] = [
  { id: 'addTrack', label: 'Track', icon: <PlusIcon size={ICON_SIZE} />, action: 'addTrack', color: BLOOM_CONTEXT_ACCENTS.arrange },
  { id: 'duplicate', label: 'Copy', icon: <CopyIcon size={ICON_SIZE} />, action: 'duplicateClips', color: '#f6cfff' },
  { id: 'stems', label: 'Stems', icon: <WaveformIcon size={ICON_SIZE} />, action: 'stems:show', color: '#4be0b6' },
  { id: 'split', label: 'Split', icon: <ScissorsIcon size={ICON_SIZE} />, action: 'splitSelection', color: '#9dd6ff' },
  { id: 'plugins', label: 'Plugins', icon: <PluginsIcon size={ICON_SIZE} />, action: 'plugins:browser:open', color: '#e879f9' },
  { id: 'undo', label: 'Undo', icon: <UndoIcon size={ICON_SIZE} />, action: 'undo', color: '#8be4ff' },
  { id: 'redo', label: 'Redo', icon: <RedoIcon size={ICON_SIZE} />, action: 'redo', color: '#8be4ff' },
  { id: 'zoom', label: 'Zoom', icon: <ZoomInIcon size={ICON_SIZE} />, action: 'zoomToSelection', color: '#7fffd4' },
  { id: 'save', label: 'Save', icon: <SaveIcon size={ICON_SIZE} />, action: 'project:save', color: '#22d3ee' },
];

// ═══════════════════════════════════════════════════════════════════════════
// RECORD CONTEXT - Recording session tools
// ═══════════════════════════════════════════════════════════════════════════
export const recordItems: ContextualMenuItem[] = [
  { id: 'arm', label: 'Arm', icon: <RecordIcon size={ICON_SIZE} />, action: 'armSelectedTrack', color: BLOOM_CONTEXT_ACCENTS.record },
  { id: 'take', label: 'Take', icon: <MicrophoneIcon size={ICON_SIZE} />, action: 'createNewTake', color: '#ff9db2' },
  { id: 'punchIn', label: 'Punch', icon: <BoltIcon size={ICON_SIZE} />, action: 'toggleAutoPunch', color: '#ffb3c1' },
  { id: 'monitor', label: 'Monitor', icon: <HeadphonesIcon size={ICON_SIZE} />, action: 'toggleInputMonitor', color: '#ffc9d4' },
  { id: 'metronome', label: 'Click', icon: <DrumIcon size={ICON_SIZE} />, action: 'toggleMetronome', color: '#ffdce4' },
  { id: 'countIn', label: 'Count', icon: <PlayIcon size={ICON_SIZE} />, action: 'toggleCountIn', color: '#ffe8ed' },
];

// ═══════════════════════════════════════════════════════════════════════════
// MIX CONTEXT - Mixing console tools
// ═══════════════════════════════════════════════════════════════════════════
export const mixItems: ContextualMenuItem[] = [
  { id: 'solo', label: 'Solo', icon: <HeadphonesIcon size={ICON_SIZE} />, action: 'soloSelectedTrack', color: BLOOM_CONTEXT_ACCENTS.mix },
  { id: 'mute', label: 'Mute', icon: <MuteIcon size={ICON_SIZE} />, action: 'muteSelectedTrack', color: '#8fd4ff' },
  { id: 'plugins', label: 'Plugins', icon: <PluginsIcon size={ICON_SIZE} />, action: 'plugins:browser:open', color: '#e879f9' },
  { id: 'eq', label: 'EQ', icon: <WaveformIcon size={ICON_SIZE} />, action: 'openEQ', color: '#b9e4ff' },
  { id: 'sends', label: 'Sends', icon: <SpeakerIcon size={ICON_SIZE} />, action: 'openSends', color: '#ceecff' },
  { id: 'mixer', label: 'Mixer', icon: <MixerIcon size={ICON_SIZE} />, action: 'view:mixer', color: '#a4dcff' },
];

// ═══════════════════════════════════════════════════════════════════════════
// MASTER CONTEXT - Mastering & export tools
// ═══════════════════════════════════════════════════════════════════════════
export const masterItems: ContextualMenuItem[] = [
  { id: 'limiter', label: 'Limit', icon: <WaveformIcon size={ICON_SIZE} />, action: 'openLimiter', color: BLOOM_CONTEXT_ACCENTS.master },
  { id: 'loudness', label: 'LUFS', icon: <SpeakerIcon size={ICON_SIZE} />, action: 'showLoudnessMeter', color: '#f7b566' },
  { id: 'plugins', label: 'Plugins', icon: <PluginsIcon size={ICON_SIZE} />, action: 'plugins:browser:open', color: '#e879f9' },
  { id: 'export', label: 'Export', icon: <ExportIcon size={ICON_SIZE} />, action: 'export:show', color: '#f9c780' },
  { id: 'preview', label: 'Preview', icon: <PlayIcon size={ICON_SIZE} />, action: 'previewMaster', color: '#fbd99a' },
  { id: 'analyze', label: 'Analyze', icon: <MagicWandIcon size={ICON_SIZE} />, action: 'analyzeMaster', color: '#fffdce' },
];

// ═══════════════════════════════════════════════════════════════════════════
// AI CONTEXT - Prime Brain / AI assistant tools
// ═══════════════════════════════════════════════════════════════════════════
export const aiItems: ContextualMenuItem[] = [
  { id: 'analyze', label: 'Analyze', icon: <SparkleIcon size={ICON_SIZE} />, action: 'ai:analyze', color: BLOOM_CONTEXT_ACCENTS.ai },
  { id: 'suggest', label: 'Suggest', icon: <MagicWandIcon size={ICON_SIZE} />, action: 'ai:suggest', color: '#f68dd8' },
  { id: 'generate', label: 'Create', icon: <BoltIcon size={ICON_SIZE} />, action: 'ai:generate', color: '#f8a8e0' },
  { id: 'learn', label: 'Learn', icon: <PianoIcon size={ICON_SIZE} />, action: 'ai:learn', color: '#fac3e8' },
  { id: 'chat', label: 'Chat', icon: <MicrophoneIcon size={ICON_SIZE} />, action: 'ai:hub:open', color: '#fcdef0' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLER CONTEXT - Drum pad / sampler tools
// ═══════════════════════════════════════════════════════════════════════════
export const samplerItems: ContextualMenuItem[] = [
  { id: 'armPads', label: 'Arm', icon: <DrumIcon size={ICON_SIZE} />, action: 'armSamplerPads', color: BLOOM_CONTEXT_ACCENTS.sampler },
  { id: 'noteRepeat', label: 'Repeat', icon: <LoopIcon size={ICON_SIZE} />, action: 'triggerSamplerNoteRepeat', color: '#8dd4ff' },
  { id: 'plugins', label: 'Plugins', icon: <PluginsIcon size={ICON_SIZE} />, action: 'plugins:browser:open', color: '#e879f9' },
  { id: 'capture', label: 'Capture', icon: <RecordIcon size={ICON_SIZE} />, action: 'captureSamplerPattern', color: '#ffa7d1' },
  { id: 'chop', label: 'Chop', icon: <ScissorsIcon size={ICON_SIZE} />, action: 'chopSample', color: '#ffcc99' },
];

// ═══════════════════════════════════════════════════════════════════════════
// INGEST CONTEXT - Import / file processing tools
// ═══════════════════════════════════════════════════════════════════════════
export const ingestItems: ContextualMenuItem[] = [
  { id: 'import', label: 'Import', icon: <ImportIcon size={ICON_SIZE} />, action: 'importAudio', color: BLOOM_CONTEXT_ACCENTS.ingest },
  { id: 'stems', label: 'Stems', icon: <WaveformIcon size={ICON_SIZE} />, action: 'openStemSeparation', color: '#4be0b6' },
  { id: 'analyze', label: 'Analyze', icon: <MagicWandIcon size={ICON_SIZE} />, action: 'analyzeIngest', color: '#5ee7c1' },
  { id: 'cancel', label: 'Cancel', icon: <StopIcon size={ICON_SIZE} />, action: 'cancelIngest', color: '#71eecc' },
];

// ═══════════════════════════════════════════════════════════════════════════
// EDIT CONTEXT - General editing tools
// ═══════════════════════════════════════════════════════════════════════════
export const editItems: ContextualMenuItem[] = [
  { id: 'cut', label: 'Cut', icon: <ScissorsIcon size={ICON_SIZE} />, action: 'edit:cut', color: BLOOM_CONTEXT_ACCENTS.edit },
  { id: 'copy', label: 'Copy', icon: <CopyIcon size={ICON_SIZE} />, action: 'edit:copy', color: '#9d6ef7' },
  { id: 'paste', label: 'Paste', icon: <PlusIcon size={ICON_SIZE} />, action: 'edit:paste', color: '#af81f8' },
  { id: 'plugins', label: 'Plugins', icon: <PluginsIcon size={ICON_SIZE} />, action: 'plugins:browser:open', color: '#e879f9' },
  { id: 'undo', label: 'Undo', icon: <UndoIcon size={ICON_SIZE} />, action: 'undo', color: '#c194f9' },
  { id: 'redo', label: 'Redo', icon: <RedoIcon size={ICON_SIZE} />, action: 'redo', color: '#d3a7fa' },
];

// ═══════════════════════════════════════════════════════════════════════════
// IDLE CONTEXT - Default / home tools
// ═══════════════════════════════════════════════════════════════════════════
export const idleItems: ContextualMenuItem[] = [
  { id: 'new', label: 'New', icon: <PlusIcon size={ICON_SIZE} />, action: 'project:new', color: '#a0aec0' },
  { id: 'open', label: 'Open', icon: <FolderIcon size={ICON_SIZE} />, action: 'project:open', color: '#a8b5c4' },
  { id: 'plugins', label: 'Plugins', icon: <PluginsIcon size={ICON_SIZE} />, action: 'plugins:browser:open', color: '#e879f9' },
  { id: 'import', label: 'Import', icon: <ImportIcon size={ICON_SIZE} />, action: 'importAudio', color: '#b8c3cc' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={ICON_SIZE} />, action: 'settings:open', color: '#c0cad0' },
];

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT MAP - Quick lookup by BloomContext
// ═══════════════════════════════════════════════════════════════════════════
export const contextualBloomItems: Record<BloomContext, ContextualMenuItem[]> = {
  arrange: arrangeItems,
  record: recordItems,
  mix: mixItems,
  master: masterItems,
  ai: aiItems,
  sampler: samplerItems,
  ingest: ingestItems,
  edit: editItems,
  idle: idleItems,
  system: idleItems,
  "prime-brain": aiItems,
  recording: recordItems,
  "recording-option": recordItems,
  mixer: idleItems,
  "translation-matrix": idleItems,
};

/**
 * Get contextual menu items for a given BloomContext
 */
export function getContextualItems(context: BloomContext): ContextualMenuItem[] {
  return contextualBloomItems[context] ?? idleItems;
}

/**
 * Get the accent color for a given BloomContext
 */
export function getContextAccent(context: BloomContext): string {
  return BLOOM_CONTEXT_ACCENTS[context] ?? BLOOM_CONTEXT_ACCENTS.idle;
}

export default contextualBloomItems;
