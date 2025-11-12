import React, { memo, useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type {
  TrackData,
  MixerSettings,
  FxWindowId,
  FxWindowConfig,
  TrackAnalysisData,
} from "../../App";
import type { TrackALSFeedback } from "../../utils/ALS";
import { hexToRgba } from "../../utils/ALS";
import FlowMeter from "./FlowMeter";
import FlowFader from "./FlowFader";
import {
  MIXER_STRIP_WIDTH,
  MIXER_STRIP_MIN_WIDTH,
  MIXER_STRIP_MAX_WIDTH,
  MIXER_STRIP_GAP_PX,
} from "./mixerConstants";

interface FlowChannelStripProps {
  track: TrackData;
  settings: MixerSettings;
  alsFeedback: TrackALSFeedback | null;
  analysis?: TrackAnalysisData;
  onMixerChange: (
    trackId: string,
    setting: keyof MixerSettings,
    value: number | boolean
  ) => void;
  isSoloed: boolean;
  onToggleSolo: (trackId: string) => void;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  isArmed: boolean;
  onToggleArm: (trackId: string) => void;
  onRenameTrack: (trackId: string, newName: string) => void;
  inserts: FxWindowId[];
  trackPrimaryColor: string;
  trackGlowColor: string;
  stageHeight: number;
  meterHeight: number;
  faderHeight: number;
  availableSends?: Array<{ id: string; name: string; color: string; glow: string }>;
  sendLevels?: Record<string, number>;
  onSendLevelChange?: (trackId: string, busId: string, value: number) => void;
  fxWindows?: FxWindowConfig[];
  onOpenPluginBrowser?: (trackId: string) => void;
}

const ModuleChip: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <motion.div
    className={`px-2 py-1 rounded-full border border-white/15 text-[0.45rem] uppercase tracking-[0.3em] ${
      active ? "bg-white/15 text-white" : "text-white/35"
    }`}
    animate={{ scale: active ? [1, 1.06, 1] : 1, opacity: active ? [0.6, 1, 0.6] : 0.5 }}
    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
  >
    {label}
  </motion.div>
);

const SendIndicator: React.FC<{
  label: string;
  level: number;
  color: string;
  onChange?: (value: number) => void;
}> = ({ label, level, color, onChange }) => (
  <div className="flex items-center gap-1">
    <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[0.45rem] text-white/60 uppercase">
      {label}
    </div>
    <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden relative">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${Math.min(1, Math.max(0, level)) * 100}%`,
          background: `linear-gradient(90deg, ${hexToRgba(color, 0.8)}, ${hexToRgba(
            color,
            0.35
          )})`,
          boxShadow: `0 0 10px ${hexToRgba(color, 0.35)}`,
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={level}
        onChange={(event) => onChange?.(parseFloat(event.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  </div>
);

const FlowChannelStrip: React.FC<FlowChannelStripProps> = memo(
  ({
    track,
    settings,
    alsFeedback,
    analysis,
    onMixerChange,
    isSoloed,
    onToggleSolo,
    selectedTrackId,
    onSelectTrack,
    isArmed,
    onToggleArm,
    onRenameTrack,
    inserts,
    trackPrimaryColor,
    trackGlowColor,
    stageHeight,
    meterHeight,
    faderHeight,
    availableSends,
    sendLevels,
    onSendLevelChange,
    fxWindows,
    onOpenPluginBrowser,
  }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [editedName, setEditedName] = useState(track.trackName);
    const isSelected = selectedTrackId === track.id;

    const temperature = alsFeedback?.temperature ?? "cool";
    const intensity = alsFeedback?.intensity ?? 0;
    const pulse = alsFeedback?.pulse ?? 0;
    const flow = alsFeedback?.flow ?? 0;

    const channelColor = alsFeedback?.color ?? trackPrimaryColor;
    const channelGlow = alsFeedback?.glowColor ?? trackGlowColor;

    const spectralTilt = analysis?.spectralTilt ?? 0;
    const crestFactor = analysis?.crestFactor ?? 1;
    const automationActive = analysis?.automationActive ?? false;

    const sendEnergy = useMemo(() => {
      if (!sendLevels) return 0;
      const values = Object.values(sendLevels);
      if (!values.length) return 0;
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    }, [sendLevels]);

    const moduleStates = useMemo(
      () => [
        {
          label: "DYN",
          active: crestFactor > 2.2 || intensity > 0.55,
        },
        {
          label: "EQ",
          active: Math.abs(spectralTilt) > 0.18,
        },
        {
          label: "SEND",
          active: sendEnergy > 0.2,
        },
        {
          label: "AUTO",
          active: automationActive,
        },
      ],
      [crestFactor, intensity, spectralTilt, sendEnergy, automationActive]
    );

    const pluginDots = useMemo(() => {
      if (!fxWindows || !fxWindows.length) return inserts.slice(0, 5);
      return fxWindows.slice(0, 5).map((fx) => fx.id);
    }, [fxWindows, inserts]);

    const handleRename = useCallback(() => {
      if (editedName.trim()) {
        onRenameTrack(track.id, editedName.trim());
      }
      setIsRenaming(false);
    }, [editedName, onRenameTrack, track.id]);

    return (
      <motion.div
        className={`relative flex flex-col bg-gradient-to-b from-white/6 via-white/0 to-white/6 border border-white/12 rounded-xl backdrop-blur-2xl overflow-hidden transition-all ${
          isSelected
            ? "shadow-[0_0_40px_rgba(232,121,249,0.35)] border-white/20"
            : "shadow-[0_6px_24px_rgba(15,15,25,0.45)]"
        } ${
          isArmed
            ? "border-red-500/60 shadow-[0_0_28px_rgba(220,38,38,0.5)]"
            : ""
        }`}
        style={{
          height: `${stageHeight}px`,
          width: `${MIXER_STRIP_WIDTH}px`,
          minWidth: `${MIXER_STRIP_MIN_WIDTH}px`,
          maxWidth: `${MIXER_STRIP_MAX_WIDTH}px`,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: isSelected ? 1.02 : 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={() => onSelectTrack(track.id)}
      >
        <div className="relative flex-shrink-0 h-18 border-b border-white/12">
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(
                channelColor,
                0.35 + intensity * 0.3
              )} 0%, transparent 70%)`,
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10 px-2 pt-2 flex flex-col gap-1">
            {isRenaming ? (
              <input
                type="text"
                value={editedName}
                onChange={(event) => setEditedName(event.target.value)}
                onBlur={handleRename}
                onKeyDown={(event) => event.key === "Enter" && handleRename()}
                className="w-full text-[0.55rem] uppercase tracking-[0.35em] text-white bg-transparent border-b border-white/30 focus:border-white/60 outline-none"
                autoFocus
                onClick={(event) => event.stopPropagation()}
              />
            ) : (
              <div
                className="text-[0.55rem] uppercase tracking-[0.35em] text-white/90 truncate cursor-pointer"
                style={{ textShadow: `0 0 10px ${hexToRgba(channelGlow, 0.6)}` }}
                onDoubleClick={() => setIsRenaming(true)}
                onClick={(event) => event.stopPropagation()}
              >
                {track.trackName}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-[0.45rem] uppercase tracking-[0.45em] text-white/50 truncate">
                {track.group}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onMixerChange(track.id, "isMuted", !settings.isMuted);
                  }}
                  className={`w-6 h-6 rounded-full text-[0.45rem] uppercase tracking-[0.3em] transition-all ${
                    settings.isMuted
                      ? "bg-red-500/80 text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  M
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleSolo(track.id);
                  }}
                  className={`w-6 h-6 rounded-full text-[0.45rem] uppercase tracking-[0.3em] transition-all ${
                    isSoloed
                      ? "bg-amber-400/80 text-black"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  S
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleArm(track.id);
                  }}
                  className={`w-6 h-6 rounded-full text-[0.45rem] uppercase tracking-[0.3em] transition-all ${
                    isArmed
                      ? "bg-red-400/80 text-black"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  R
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-3 px-2 py-3">
          <div className="flex items-center justify-between gap-2">
            {moduleStates.map(({ label, active }) => (
              <ModuleChip key={label} label={label} active={active} />
            ))}
          </div>

          <div className="flex flex-1 gap-3">
            <div className="flex flex-col flex-1 gap-3">
              <div
                className="w-full flex items-end justify-center"
                style={{ height: `${meterHeight}px` }}
              >
                <FlowMeter
                  level={Math.min(1, Math.max(0, analysis?.rms ?? intensity))}
                  peak={Math.min(1, Math.max(analysis?.peak ?? intensity, intensity))}
                  transient={analysis?.transient ?? false}
                  color={channelColor}
                  glow={channelGlow}
                />
              </div>

              <div className="w-full" style={{ height: `${faderHeight}px` }}>
                <FlowFader
                  value={settings.volume}
                  onChange={(value) => onMixerChange(track.id, "volume", value)}
                  alsFeedback={alsFeedback}
                  trackColor={trackPrimaryColor}
                  glowColor={trackGlowColor}
                  name={`fader-${track.id}`}
                />
              </div>

              <div>
                <div className="h-1 bg-black/30 rounded-full overflow-hidden relative">
                  <motion.div
                    className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20"
                    style={{ transform: "translateX(-50%)" }}
                  />
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${hexToRgba(
                        channelColor,
                        0.8
                      )}, ${hexToRgba(channelGlow, 0.4)})`,
                      width: `${Math.abs(settings.pan) * 100}%`,
                      left:
                        settings.pan >= 0
                          ? "50%"
                          : `${50 - Math.abs(settings.pan) * 50}%`,
                      opacity: 0.45 + intensity * 0.35,
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 4px ${hexToRgba(channelGlow, 0.25)}`,
                        `0 0 10px ${hexToRgba(channelGlow, 0.45)}`,
                        `0 0 4px ${hexToRgba(channelGlow, 0.25)}`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={settings.pan}
                    onChange={(event) =>
                      onMixerChange(track.id, "pan", parseFloat(event.target.value))
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onClick={(event) => event.stopPropagation()}
                  />
                </div>
                <div className="text-[0.45rem] text-white/40 text-center mt-1 uppercase tracking-[0.4em]">
                  Pan
                </div>
              </div>
            </div>

            <div className="flex flex-col w-16 gap-2 pt-1">
              {(inserts.length > 0 || onOpenPluginBrowser) && (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center justify-center gap-1.5">
                    {pluginDots.map((fxId) => {
                      const accent = fxWindows?.find((item) => item.id === fxId)?.color;
                      const color = accent ?? channelGlow;
                      return (
                        <span
                          key={fxId}
                          className="w-2 h-2 rounded-full border border-white/20"
                          style={{
                            background: `radial-gradient(circle at 30% 30%, ${hexToRgba(
                              color,
                              0.85
                            )}, ${hexToRgba(color, 0.25)})`,
                            boxShadow: `0 0 8px ${hexToRgba(color, 0.35)}`,
                          }}
                        />
                      );
                    })}
                    {inserts.length > pluginDots.length && (
                      <span className="w-2 h-2 rounded-full border border-white/15 bg-white/25 animate-pulse" />
                    )}
                  </div>
                  {onOpenPluginBrowser && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenPluginBrowser?.(track.id);
                      }}
                      className="w-full text-[0.45rem] uppercase tracking-[0.35em] text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 rounded py-1 transition-all"
                    >
                      Texture
                    </button>
                  )}
                </div>
              )}

              {availableSends && availableSends.length > 0 && (
                <div className="flex flex-col gap-1">
                  {availableSends.slice(0, 2).map((send) => (
                    <SendIndicator
                      key={send.id}
                      label={send.name.charAt(0)}
                      level={sendLevels?.[send.id] ?? 0}
                      color={send.color}
                      onChange={(value) =>
                        onSendLevelChange?.(track.id, send.id, value)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-2 pb-2">
            <div className="h-1 rounded-full bg-black/30 overflow-hidden relative">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${intensity * 100}%`,
                  background: `linear-gradient(90deg, ${hexToRgba(
                    channelColor,
                    0.6
                  )}, ${hexToRgba(channelGlow, 0.4)})`,
                  boxShadow: `0 0 12px ${hexToRgba(channelGlow, 0.35)}`,
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              {new Array(3).fill(null).map((_, index) => (
                <span
                  key={index}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background:
                      index < Math.round(flow * 3)
                        ? hexToRgba(channelColor, 0.8)
                        : "rgba(255,255,255,0.12)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

FlowChannelStrip.displayName = "FlowChannelStrip";

export default FlowChannelStrip;


