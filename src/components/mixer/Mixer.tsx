import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  MixerSettings,
  TrackAnalysisData,
  TrackData,
  FxWindowConfig,
  FxWindowId,
} from '../../App';
import FlowChannelStrip from './FlowChannelStrip';
import FlowBusStrip from './FlowBusStrip';
import FlowMasterStrip from './FlowMasterStrip';
import {
  MIXER_CONSOLE_MAX_WIDTH,
  MIXER_CONSOLE_MIN_WIDTH,
  MIXER_FADER_HEIGHT_RATIO,
  MIXER_HEADER_OFFSET,
  MIXER_HUD_OFFSET,
  MIXER_MASTER_PADDING,
  MIXER_METER_HEIGHT_RATIO,
  MIXER_STRIP_WIDTH,
} from './mixerConstants';
import {
  TRACK_COLOR_SWATCH,
  deriveTrackALSFeedback,
  deriveBusALSColors,
} from '../../utils/ALS';
import type { TrackALSFeedback } from '../../utils/ALS';

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
}

interface BusGroupMeta {
  id: string;
  name: string;
  members: string[];
  colorKey: keyof typeof TRACK_COLOR_SWATCH;
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
}) => {
  void onAddPlugin;
  void onRemovePlugin;
  void onMovePlugin;
  void onOpenPluginSettings;
  void onAddPlugin;
  void onRemovePlugin;
  void onMovePlugin;
  void onOpenPluginSettings;
  const [stageHeights, setStageHeights] = useState(computeStageHeights);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setStageHeights(computeStageHeights());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const busGroups = useMemo<BusGroupMeta[]>(() => {
    const groups = new Map<string, BusGroupMeta>();
    tracks.forEach((track) => {
      const existing = groups.get(track.group);
      if (existing) {
        existing.members.push(track.id);
        return;
      }
      groups.set(track.group, {
        id: track.group.toLowerCase(),
        name: track.group,
        members: [track.id],
        colorKey: track.trackColor,
      });
    });
    return Array.from(groups.values());
  }, [tracks]);

  const busVisuals = useMemo(() => {
    return busGroups.map((bus) => {
      const analysisValues = bus.members
        .map((memberId) => trackAnalysis[memberId]?.level ?? 0)
        .filter((value) => !Number.isNaN(value));
      const levelAvg =
        analysisValues.length
          ? analysisValues.reduce((sum, value) => sum + value, 0) / analysisValues.length
          : 0;

      const transientActive = bus.members.some(
        (memberId) => trackAnalysis[memberId]?.transient
      );
      const { base, glow } = TRACK_COLOR_SWATCH[bus.colorKey];
      const palette = deriveBusALSColors(base, glow, levelAvg);

      return {
        id: bus.id,
        name: bus.name,
        members: bus.members,
        alsColor: palette.base,
        alsGlow: palette.glow,
        alsGlowStrength: levelAvg,
        alsIntensity: levelAvg,
        alsPulse: transientActive ? 1 : levelAvg * 0.65,
      };
    });
  }, [busGroups, trackAnalysis]);

  useEffect(() => {
    const selectedTrack = tracks.find((track) => track.id === selectedTrackId);
    if (!selectedTrack) {
      setSelectedBusId(null);
      return;
    }
    setSelectedBusId(selectedTrack.group.toLowerCase());
  }, [selectedTrackId, tracks]);

  const handleSelectBus = useCallback(
    (busId: string, members: string[]) => {
      setSelectedBusId(busId);
      const firstMember = members[0];
      if (firstMember) {
        onSelectTrack(firstMember);
      }
    },
    [onSelectTrack]
  );

  const trackCount = tracks.length;
  const consoleWidth = Math.max(
    (trackCount + 2) * MIXER_STRIP_WIDTH + MIXER_MASTER_PADDING,
    MIXER_CONSOLE_MIN_WIDTH
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-6">
      <div
        className="relative w-full px-8"
        style={{ maxWidth: `${MIXER_CONSOLE_MAX_WIDTH}px` }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/45 via-black/10 to-transparent" />
          <div className="absolute left-1/2 -translate-x-1/2 top-8 h-1 w-2/3 rounded-full bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-sm" />
        </div>

        <div className="overflow-x-auto">
          <div
            className="relative mx-auto h-full flex flex-col"
            style={{ width: consoleWidth, height: stageHeights.stageHeight }}
          >
            {busVisuals.length > 0 && (
              <div className="flex justify-center gap-3 pb-4">
                {busVisuals.map((bus) => (
                  <FlowBusStrip
                    key={bus.id}
                    busId={bus.id}
                    name={bus.name}
                    members={bus.members}
                    alsIntensity={bus.alsIntensity}
                    alsPulse={bus.alsPulse}
                    alsColor={bus.alsColor}
                    alsGlow={bus.alsGlow}
                    alsGlowStrength={bus.alsGlowStrength}
                    isActive={selectedBusId === bus.id}
                    onSelectBus={(id) => handleSelectBus(id, bus.members)}
                  />
                ))}
                <div className="w-8 flex-shrink-0" />
              </div>
            )}

            <div className="flex items-end justify-center gap-x-3">
              {tracks.map((track) => {
                const analysis = trackAnalysis[track.id] ?? { level: 0, transient: false };
                const settings =
                  mixerSettings[track.id] ?? { volume: 0.75, pan: 0, isMuted: false };
                const { base, glow } = TRACK_COLOR_SWATCH[track.trackColor];
                const alsFeedback = trackFeedbackMap[track.id];

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
                    trackPrimaryColor={base}
                    trackGlowColor={glow}
                    fxWindows={fxWindows}
                    onOpenPluginBrowser={() => onOpenPluginBrowser(track.id)}
                  />
                );
              })}
              <div className="w-8 flex-shrink-0" />
              <FlowMasterStrip
                volume={masterVolume}
                onVolumeChange={onMasterVolumeChange}
                balance={masterBalance}
                onBalanceChange={onBalanceChange}
                analysis={masterAnalysis}
                stageHeight={stageHeights.stageHeight}
                meterHeight={stageHeights.meterHeight}
                faderHeight={stageHeights.faderHeight}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowConsole;
