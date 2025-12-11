import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import type {
  MixerSettings,
  TrackAnalysisData,
  TrackData,
  FxWindowConfig,
  FxWindowId,
  ChannelDynamicsSettings,
  ChannelEQSettings,
  MixerBusStripData,
  MixerBusId,
} from '../../App';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';
import FlowChannelStrip from './FlowChannelStrip';
import FlowMasterStrip from './FlowMasterStrip';
import FlowBusStrip from './FlowBusStrip';
import FlowConsoleHeader, { type ConsoleViewMode } from './FlowConsoleHeader';
import FlowConsoleMatrixView from './FlowConsoleMatrixView';
import FlowConsoleAnalyzerView, { type AnalyzerType } from './FlowConsoleAnalyzerView';
import FlowConsoleCompactView from './FlowConsoleCompactView';
import {
  MIXER_CONSOLE_MAX_WIDTH,
  MIXER_CONSOLE_MIN_WIDTH,
  MIXER_FADER_HEIGHT_RATIO,
  MIXER_HEADER_OFFSET,
  MIXER_HUD_OFFSET,
  MIXER_MASTER_PADDING,
  MIXER_METER_HEIGHT_RATIO,
  MIXER_MASTER_METER_HEIGHT_RATIO,
  MIXER_STRIP_WIDTH,
} from './mixerConstants';
import {
  TRACK_COLOR_SWATCH,
  deriveTrackALSFeedback,
} from '../../utils/ALS';
import type { TrackALSFeedback, ALSActionPulse } from '../../utils/ALS';
import { publishAlsSignal } from '../../state/flowSignals';
import type { PluginPreset } from '../../utils/pluginState';
import type { PluginInventoryItem } from "../../audio/pluginTypes";

interface FlowConsoleProps {
  tracks: TrackData[];
  mixerSettings: Record<string, MixerSettings>;
  trackAnalysis: Record<string, TrackAnalysisData>;
  onMixerChange: (
    trackId: string,
    setting: keyof MixerSettings,
    value: number | boolean
  ) => void;
  soloedTracks: Set<string>;
  onToggleSolo: (trackId: string) => void;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
  masterBalance: number;
  onBalanceChange: (balance: number) => void;
  masterAnalysis: { level: number; transient: boolean; waveform: Uint8Array };
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  armedTracks: Set<string>;
  onToggleArm: (trackId: string) => void;
  onRenameTrack: (trackId: string, newName: string) => void;
  inserts: Record<string, FxWindowId[]>;
  fxWindows: FxWindowConfig[];
  onOpenPluginBrowser: (trackId: string) => void;
  onAddPlugin?: (trackId: string, pluginId: FxWindowId) => void;
  onRemovePlugin?: (trackId: string, index: number) => void;
  onMovePlugin?: (trackId: string, fromIndex: number, toIndex: number) => void;
  onOpenPluginSettings?: (fxId: FxWindowId) => void;
  fxBypassState?: Record<FxWindowId, boolean>;
  onToggleBypass?: (fxId: FxWindowId, trackId?: string) => void;
  availableSends?: Array<{
    id: string;
    name: string;
    color: string;
    glow: string;
    shortLabel?: string;
  }>;
  trackSendLevels?: Record<string, Record<string, number>>;
  onSendLevelChange?: (trackId: string, busId: string, value: number) => void;
  buses?: MixerBusStripData[];
  selectedBusId?: MixerBusId | null;
  onSelectBus?: (busId: MixerBusId) => void;
  dynamicsSettings?: Record<string, ChannelDynamicsSettings>;
  eqSettings?: Record<string, ChannelEQSettings>;
  onDynamicsChange?: (
    trackId: string,
    patch: Partial<ChannelDynamicsSettings>
  ) => void;
  onEQChange?: (trackId: string, patch: Partial<ChannelEQSettings>) => void;
  pluginInventory?: PluginInventoryItem[];
  pluginFavorites?: Record<FxWindowId, boolean>;
  onTogglePluginFavorite?: (pluginId: FxWindowId) => void;
  pluginPresets?: Record<FxWindowId, PluginPreset[]>;
  onSavePluginPreset?: (pluginId: FxWindowId, label: string, trackId: string) => void;
  onLoadPluginPreset?: (pluginId: FxWindowId, presetId: string, trackId: string) => void;
  onDeletePluginPreset?: (pluginId: FxWindowId, presetId: string) => void;
  mixerActionPulse?: {
    trackId: string;
    pulse: ALSActionPulse;
    message: string;
  } | null;
  onToggleAutomationLaneWithParam?: (
    trackId: string,
    fxId: string,
    paramName: string
  ) => void;
  /** Flow-Follow Mode: Transport state for meter animation */
  isPlaying?: boolean;
  currentTime?: number;
  followPlayhead?: boolean;
}

const computeStageHeights = () => {
  const viewport = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const stageHeight = Math.max(
    viewport - MIXER_HEADER_OFFSET - MIXER_HUD_OFFSET - 48,
    640
  );

  return {
    stageHeight,
    meterHeight: Math.round(stageHeight * MIXER_METER_HEIGHT_RATIO),
    masterMeterHeight: Math.round(stageHeight * MIXER_MASTER_METER_HEIGHT_RATIO),
    faderHeight: Math.round(stageHeight * MIXER_FADER_HEIGHT_RATIO),
  };
};

const FlowConsole: React.FC<FlowConsoleProps> = ({
  tracks,
  mixerSettings,
  trackAnalysis,
  onMixerChange,
  soloedTracks,
  onToggleSolo,
  masterVolume,
  onMasterVolumeChange,
  masterBalance,
  onBalanceChange,
  masterAnalysis,
  selectedTrackId,
  onSelectTrack,
  armedTracks,
  onToggleArm,
  onRenameTrack,
  inserts,
  fxWindows,
  onOpenPluginBrowser,
  onAddPlugin,
  onRemovePlugin,
  onMovePlugin,
  onOpenPluginSettings,
  fxBypassState,
  onToggleBypass,
  availableSends,
  trackSendLevels,
  onSendLevelChange,
  selectedBusId,
  dynamicsSettings,
  eqSettings,
  onDynamicsChange,
  onEQChange,
  pluginInventory,
  pluginFavorites,
  onTogglePluginFavorite,
  pluginPresets,
  onSavePluginPreset,
  onLoadPluginPreset,
  onDeletePluginPreset,
  mixerActionPulse,
  buses = [],
  onSelectBus,
  onToggleAutomationLaneWithParam,
  isPlaying = false,
  currentTime = 0,
  followPlayhead = false,
}) => {
  const [stageHeights, setStageHeights] = useState(computeStageHeights);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [consoleViewMode, setConsoleViewMode] = useState<ConsoleViewMode>('strips');
  const [selectedAnalyzer, setSelectedAnalyzer] = useState<AnalyzerType | null>(null);

  useEffect(() => {
    const handleResize = () => setStageHeights(computeStageHeights());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Convert vertical mouse wheel to horizontal scroll
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  const trackFeedbackMap = useMemo<Record<string, TrackALSFeedback>>(() => {
    return tracks.reduce((acc, track) => {
      const analysis = trackAnalysis[track.id];
      const settings = mixerSettings[track.id];
      acc[track.id] = deriveTrackALSFeedback({
        level: analysis?.level ?? 0,
        transient: analysis?.transient ?? false,
        volume: settings?.volume ?? 0.75,
        color: track.trackColor,
      });
      return acc;
    }, {} as Record<string, TrackALSFeedback>);
  }, [tracks, trackAnalysis, mixerSettings]);

  const trackCount = tracks.length;
  const busCount = buses.length;
  const masterFeedback = useMemo(
    () =>
      deriveTrackALSFeedback({
        level: masterAnalysis.level ?? 0,
        transient: masterAnalysis.transient ?? false,
        volume: masterVolume,
        color: "purple",
      }),
    [masterAnalysis.level, masterAnalysis.transient, masterVolume]
  );

  useEffect(() => {
    publishAlsSignal({
      source: "mixer",
      tracks: trackFeedbackMap,
      master: masterFeedback,
      meta: { trackCount },
    });
  }, [trackFeedbackMap, masterFeedback, trackCount]);

  const resolvedPluginInventory = pluginInventory ?? [];
  const resolvedPluginFavorites = pluginFavorites ?? {};
  const resolvedPluginPresets = pluginPresets ?? {};
  const consoleWidth = Math.max(
    (trackCount + busCount + 2) * MIXER_STRIP_WIDTH + MIXER_MASTER_PADDING,
    MIXER_CONSOLE_MIN_WIDTH
  );
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : consoleWidth;
  const stageWidth = Math.max(consoleWidth, viewportWidth - 96);

  const renderView = () => {
    switch (consoleViewMode) {
      case 'matrix':
        return (
          <FlowConsoleMatrixView
            tracks={tracks}
            buses={buses.map((bus) => ({
              id: bus.id,
              name: bus.name,
              color: bus.alsColor,
              glow: bus.alsGlow,
            }))}
            trackSendLevels={trackSendLevels ?? {}}
            trackFeedbackMap={trackFeedbackMap}
            onSendLevelChange={onSendLevelChange}
            selectedBusId={selectedBusId}
            onSelectBus={onSelectBus}
          />
        );

      case 'analyzer':
        return (
          <FlowConsoleAnalyzerView
            analyzerType={selectedAnalyzer ?? 'spectrum'}
            tracks={tracks}
            trackFeedbackMap={trackFeedbackMap}
            masterAnalysis={masterAnalysis}
          />
        );

      case 'compact':
        return (
          <FlowConsoleCompactView
            tracks={tracks}
            mixerSettings={mixerSettings}
            trackAnalysis={trackAnalysis}
            trackFeedbackMap={trackFeedbackMap}
            selectedTrackId={selectedTrackId}
            onSelectTrack={onSelectTrack}
            onMixerChange={onMixerChange}
            soloedTracks={soloedTracks}
            onToggleSolo={onToggleSolo}
          />
        );

      case 'strips':
      default:
        return (
          <div 
            ref={scrollContainerRef}
            style={composeStyles(
              layout.position.relative,
              layout.width.full,
              { height: '100%' },
              layout.overflow.x.auto
            )}
            onWheel={handleWheel}
          >
            <div
              style={composeStyles(
                layout.position.relative,
                { margin: '0 auto' },
                layout.flex.container('col'),
                { height: '100%' },
                {
                  width: stageWidth,
                  height: stageHeights.stageHeight,
                }
              )}
            >
              <div style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.end,
                layout.flex.justify.center,
                { gap: '12px' }
              )}>
              {tracks.map((track) => {
                const analysis = trackAnalysis[track.id] ?? { level: 0, transient: false };
                const settings =
                  mixerSettings[track.id] ?? { volume: 0.75, pan: 0, isMuted: false };
                const { base, glow } = TRACK_COLOR_SWATCH[track.trackColor];
                const alsFeedback = trackFeedbackMap[track.id];
                const plugins =
                  (inserts[track.id] ?? []).map((fxId, insertIndex) => {
                    const fxConfig = fxWindows.find((fw) => fw.id === fxId);
                    const inventoryMeta = resolvedPluginInventory.find((item) => item.id === fxId);
                    return {
                      id: fxId,
                      name: fxConfig?.name ?? inventoryMeta?.name ?? fxId.toUpperCase(),
                      color: inventoryMeta?.base ?? glow,
                      glow: inventoryMeta?.glow ?? glow,
                      isBypassed: fxBypassState?.[fxId] ?? false,
                      index: insertIndex,
                    };
                  }) ?? [];

                const stripActionPulse =
                  mixerActionPulse?.trackId === track.id ? mixerActionPulse.pulse : null;
                const stripActionMessage =
                  mixerActionPulse?.trackId === track.id ? mixerActionPulse.message : null;

                return (
                  <FlowChannelStrip
                    key={track.id}
                    track={track}
                    settings={settings}
                    stageHeight={stageHeights.stageHeight}
                    meterHeight={stageHeights.meterHeight}
                    faderHeight={stageHeights.faderHeight}
                    alsFeedback={alsFeedback}
                    analysis={analysis}
                    onMixerChange={onMixerChange}
                    isSoloed={soloedTracks.has(track.id)}
                    onToggleSolo={onToggleSolo}
                    selectedTrackId={selectedTrackId}
                    onSelectTrack={onSelectTrack}
                    isArmed={armedTracks.has(track.id)}
                    onToggleArm={onToggleArm}
                    onRenameTrack={onRenameTrack}
                    inserts={inserts[track.id] ?? []}
                    plugins={plugins}
                    trackPrimaryColor={base}
                    trackGlowColor={glow}
                    onTogglePluginBypass={(channelId, fxId) =>
                      onToggleBypass?.(fxId, channelId)
                    }
                    onOpenPluginSettings={onOpenPluginSettings}
                    onRemovePlugin={onRemovePlugin}
                    onMovePlugin={onMovePlugin}
                    onOpenPluginBrowser={() => onOpenPluginBrowser(track.id)}
                    availableSends={availableSends}
                    sendLevels={trackSendLevels?.[track.id]}
                    onSendLevelChange={onSendLevelChange}
                    dynamicsSettings={dynamicsSettings?.[track.id]}
                    eqSettings={eqSettings?.[track.id]}
                    onDynamicsChange={onDynamicsChange}
                    onEQChange={onEQChange}
                    pluginInventory={resolvedPluginInventory}
                    pluginFavorites={resolvedPluginFavorites}
                    onTogglePluginFavorite={onTogglePluginFavorite}
                    onAddPlugin={onAddPlugin}
                    pluginPresets={resolvedPluginPresets}
                    onSavePluginPreset={onSavePluginPreset}
                    onLoadPluginPreset={onLoadPluginPreset}
                    onDeletePluginPreset={onDeletePluginPreset}
                    actionPulse={stripActionPulse}
                    actionMessage={stripActionMessage}
                    selectedBusId={selectedBusId}
                    onToggleAutomationLaneWithParam={onToggleAutomationLaneWithParam}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    followPlayhead={followPlayhead}
                  />
                );
              })}
              {buses.map((bus) => (
                <FlowBusStrip
                  key={`bus-${bus.id}`}
                  busId={bus.id}
                  name={bus.name}
                  members={bus.members}
                  alsIntensity={bus.alsIntensity}
                  alsPulse={bus.alsPulse}
                  alsColor={bus.alsColor}
                  alsGlow={bus.alsGlow}
                  alsHaloColor={bus.alsHaloColor}
                  alsGlowStrength={bus.alsGlowStrength}
                  busLevel={bus.busLevel}
                  busPeak={bus.busPeak}
                  busTransient={bus.busTransient}
                  onSelectBus={onSelectBus}
                  isActive={selectedBusId === bus.id}
                />
              ))}
              <div style={{ width: '32px', flexShrink: 0 }} />
                <FlowMasterStrip
                  volume={masterVolume}
                  onVolumeChange={onMasterVolumeChange}
                  balance={masterBalance}
                  onBalanceChange={onBalanceChange}
                  analysis={masterAnalysis}
                  stageHeight={stageHeights.stageHeight}
                  meterHeight={stageHeights.masterMeterHeight || stageHeights.meterHeight}
                  faderHeight={stageHeights.faderHeight}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={composeStyles(
      layout.flex.container('col'),
      { height: '100%', width: '100%' },
      spacing.gap(6),
      spacing.px(4),
      spacing.py(6)
    )}>
      <div style={composeStyles(
        layout.position.relative,
        { flex: 1 },
        layout.overflow.hidden,
        effects.border.radius.custom('32px'),
        {
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(8,12,24,0.82)',
          boxShadow: '0 32px 90px rgba(4,12,26,0.6)',
        }
      )}>
        <div style={composeStyles(
          layout.position.absolute,
          { inset: 0 },
          { pointerEvents: 'none' }
        )}>
          <div style={composeStyles(
            layout.position.absolute,
            { left: 0, right: 0, top: 0 },
            {
              height: '128px',
              background: 'linear-gradient(to bottom, rgba(21,45,88,0.9), transparent)',
            }
          )} />
          <div style={composeStyles(
            layout.position.absolute,
            { top: 0, bottom: 0, left: 0 },
            {
              width: '80px',
              background: 'linear-gradient(to right, rgba(12,28,58,0.75), rgba(12,28,58,0.2), transparent)',
            }
          )} />
          <div style={composeStyles(
            layout.position.absolute,
            { top: 0, bottom: 0, right: 0 },
            {
              width: '80px',
              background: 'linear-gradient(to left, rgba(12,28,58,0.75), rgba(12,28,58,0.2), transparent)',
            }
          )} />
          <div style={composeStyles(
            layout.position.absolute,
            { left: '50%', top: '32px' },
            transitions.transform.combine('translateX(-50%)'),
            effects.border.radius.full,
            {
              height: '4px',
              width: '66.666%',
              background: 'linear-gradient(to right, rgba(64,120,210,0.45), rgba(126,162,235,0.35), rgba(64,120,210,0.45))',
              filter: 'blur(4px)',
            }
          )} />
        </div>
        
        {/* Console Header */}
        <FlowConsoleHeader
          viewMode={consoleViewMode}
          onViewModeChange={setConsoleViewMode}
          trackCount={trackCount}
          busCount={busCount}
          masterFeedback={{
            temperature: masterFeedback.temperature,
            flow: masterFeedback.flow,
            pulse: masterFeedback.pulse,
          }}
          selectedAnalyzer={selectedAnalyzer}
          onAnalyzerChange={(analyzer) => {
            setSelectedAnalyzer(analyzer);
            if (analyzer && consoleViewMode !== 'analyzer') {
              setConsoleViewMode('analyzer');
            }
          }}
        />

        {/* View Content */}
        <div style={composeStyles(
          layout.position.relative,
          layout.width.full,
          {
            height: 'calc(100% - 80px)',
          }
        )}>
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default FlowConsole;
