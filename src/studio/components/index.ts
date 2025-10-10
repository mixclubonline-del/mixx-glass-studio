/**
 * Studio Components - Central exports for 2027 DAW
 */

// Timeline
export { AdvancedTimelineView } from './Timeline/AdvancedTimelineView';
export { TimelineRuler } from './Timeline/TimelineRuler';
export { Playhead } from './Timeline/Playhead';
export { GridOverlay } from './Timeline/GridOverlay';
export { WaveformRenderer } from './Timeline/WaveformRenderer';
export { TimelineToolbar } from './Timeline/TimelineToolbar';
export { AddTrackDialog } from './Timeline/AddTrackDialog';
export { IORoutingPanel } from './Timeline/IORoutingPanel';
export { LoopPanel } from './Timeline/LoopPanel';
export * from './Timeline/CursorTools';

// Mixer
export { NextGenMixerView } from './Mixer/NextGenMixerView';
export { GlassChannelStrip } from './Mixer/GlassChannelStrip';
export { MasterChannelStrip } from './Mixer/MasterChannelStrip';
export { PeakMeter } from './Mixer/PeakMeter';
export { Fader } from './Mixer/Fader';

// Metering
export { MeteringDashboard } from './Metering/MeteringDashboard';
export { SpectrumAnalyzer } from './Metering/SpectrumAnalyzer';
export { MasterMeteringPanel } from './Metering/MasterMeteringPanel';
export { ProfessionalPeakMeter } from './Metering/ProfessionalPeakMeter';

// Controls
export { IceFireFader } from './Controls/IceFireFader';
export { IceFireKnob } from './Controls/IceFireKnob';

// Edit
export { WaveformEditor } from './Edit/WaveformEditor';

// Editing utilities
export * from './Editing';

// Navigation
export { ViewSwitcher } from './Navigation/ViewSwitcher';
export { TopMenuBar } from './Navigation/TopMenuBar';
export { ViewContainer } from './Navigation/ViewContainer';

// AI
export { AIAssistantPanel } from './AI/AIAssistantPanel';
export { MixxAIStudio } from './AI/MixxAIStudio';

// Producer
export { ProducerLab } from './Producer/ProducerLab';

// Transport
export { TransportControls } from './TransportControls';
