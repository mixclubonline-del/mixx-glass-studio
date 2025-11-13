import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";
import type {
  TrackData,
  MixerSettings,
  FxWindowId,
  TrackAnalysisData,
} from "../../App";
import type { TrackALSFeedback, ALSActionPulse } from "../../utils/ALS";
import { hexToRgba } from "../../utils/ALS";
import type { PluginPreset } from "../../utils/pluginState";
import type { PluginInventoryItem } from "../../audio/pluginTypes";
import FlowMeter from "./FlowMeter";
import FlowFader from "./FlowFader";
import {
  MIXER_STRIP_WIDTH,
  MIXER_STRIP_MIN_WIDTH,
  MIXER_STRIP_MAX_WIDTH,
  MIXER_STRIP_GAP_PX,
} from "./mixerConstants";

interface ChannelDynamicsSettings {
  drive: number;
  release: number;
  blend: number;
}

interface ChannelEQSettings {
  low: number;
  mid: number;
  air: number;
  tilt: number;
}

const CHANNEL_MODE_DEFINITIONS = [
  { id: "mix", label: "Mix" },
  { id: "modules", label: "Modules" },
  { id: "routing", label: "Routing" },
  { id: "automation", label: "Automation" },
] as const;

type ChannelMode = (typeof CHANNEL_MODE_DEFINITIONS)[number]["id"];

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
  plugins?: Array<{
    id: FxWindowId;
    name: string;
    color: string;
    glow?: string;
    isBypassed: boolean;
    index: number;
  }>;
  trackPrimaryColor: string;
  trackGlowColor: string;
  stageHeight: number;
  meterHeight: number;
  faderHeight: number;
  availableSends?: Array<{
    id: string;
    name: string;
    color: string;
    glow: string;
    shortLabel?: string;
  }>;
  sendLevels?: Record<string, number>;
  onSendLevelChange?: (trackId: string, busId: string, value: number) => void;
  onOpenPluginBrowser?: (trackId: string) => void;
  onTogglePluginBypass?: (trackId: string, fxId: FxWindowId) => void;
  onOpenPluginSettings?: (fxId: FxWindowId) => void;
  onRemovePlugin?: (trackId: string, index: number) => void;
  onMovePlugin?: (trackId: string, fromIndex: number, toIndex: number) => void;
  dynamicsSettings?: ChannelDynamicsSettings;
  eqSettings?: ChannelEQSettings;
  onDynamicsChange?: (
    trackId: string,
    patch: Partial<ChannelDynamicsSettings>
  ) => void;
  onEQChange?: (trackId: string, patch: Partial<ChannelEQSettings>) => void;
  selectedBusId?: string | null;
  pluginInventory: PluginInventoryItem[];
  pluginFavorites: Record<FxWindowId, boolean>;
  onTogglePluginFavorite?: (pluginId: FxWindowId) => void;
  onAddPlugin?: (trackId: string, pluginId: FxWindowId) => void;
  pluginPresets?: Record<FxWindowId, PluginPreset[]>;
  onSavePluginPreset?: (pluginId: FxWindowId, label: string, trackId: string) => void;
  onLoadPluginPreset?: (pluginId: FxWindowId, presetId: string, trackId: string) => void;
  onDeletePluginPreset?: (pluginId: FxWindowId, presetId: string) => void;
  actionPulse?: ALSActionPulse | null;
  actionMessage?: string | null;
  onToggleAutomationLaneWithParam?: (
    trackId: string,
    fxId: string,
    paramName: string
  ) => void;
}

const SendIndicator: React.FC<{
  label: string;
  fullLabel: string;
  level: number;
  color: string;
  glow: string;
  isSelected: boolean;
  onChange?: (value: number) => void;
}> = ({ label, fullLabel, level, color, glow, isSelected, onChange }) => (
  <div
    className={`flex items-center gap-2 rounded-xl px-2 py-1 transition-colors ${
      isSelected ? "bg-glass-surface-soft" : "bg-transparent"
    }`}
  >
    <div
      className={`w-6 h-6 rounded-full border flex items-center justify-center text-[0.45rem] uppercase tracking-[0.3em] ${
        isSelected
          ? "border-cyan-300/70 text-cyan-100 bg-[rgba(16,50,95,0.6)]"
          : "border-glass-border/60 text-ink/70"
      }`}
      title={fullLabel}
    >
      {label}
    </div>
    <div className="flex-1 h-1.5 bg-[rgba(9,18,36,0.6)] rounded-full overflow-hidden relative">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${Math.min(1, Math.max(0, level)) * 100}%`,
          background: `linear-gradient(90deg, ${hexToRgba(
            color,
            isSelected ? 0.95 : 0.75
          )}, ${hexToRgba(glow, isSelected ? 0.55 : 0.35)})`,
          boxShadow: `0 0 12px ${hexToRgba(glow, isSelected ? 0.45 : 0.3)}`,
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
        onChange={(event) =>
          onChange?.(Math.min(1, Math.max(0, parseFloat(event.target.value))))
        }
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onClick={(event) => event.stopPropagation()}
        aria-label={`Send level ${fullLabel}`}
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
    plugins = [],
    trackPrimaryColor,
    trackGlowColor,
    stageHeight,
    meterHeight,
    faderHeight,
    availableSends,
    sendLevels,
    onSendLevelChange,
    onOpenPluginBrowser,
    onTogglePluginBypass,
    onOpenPluginSettings,
    onRemovePlugin,
    onMovePlugin,
    dynamicsSettings: _dynamicsSettings,
    eqSettings: _eqSettings,
    onDynamicsChange: _onDynamicsChange,
    onEQChange: _onEQChange,
    pluginInventory,
    pluginFavorites,
    onTogglePluginFavorite,
    onAddPlugin,
    pluginPresets,
    onSavePluginPreset,
    onLoadPluginPreset,
    onDeletePluginPreset,
    actionPulse,
    actionMessage,
    selectedBusId,
    onToggleAutomationLaneWithParam,
  }) => {
    const [mode, setMode] = useState<ChannelMode>("mix");
    const [isRenaming, setIsRenaming] = useState(false);
    const [editedName, setEditedName] = useState(track.trackName);
    const isSelected = selectedTrackId === track.id;
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [insertSearch, setInsertSearch] = useState("");
    const [openPresetMenu, setOpenPresetMenu] = useState<FxWindowId | null>(null);
    const [presetEditor, setPresetEditor] = useState<FxWindowId | null>(null);
    const [presetLabel, setPresetLabel] = useState("");
    const [presetFeedback, setPresetFeedback] = useState<string | null>(null);
    useEffect(() => {
      if (!presetFeedback || typeof window === "undefined") return;
      const timeout = window.setTimeout(() => setPresetFeedback(null), 1600);
      return () => window.clearTimeout(timeout);
    }, [presetFeedback]);

    const temperature = alsFeedback?.temperature ?? "cool";
    const intensity = alsFeedback?.intensity ?? 0;
    const pulse = alsFeedback?.pulse ?? 0;
    const flow = alsFeedback?.flow ?? 0;

    const channelColor = alsFeedback?.color ?? trackPrimaryColor;
    const channelGlow = alsFeedback?.glowColor ?? trackGlowColor;

    const spectralTilt = analysis?.spectralTilt ?? 0;
    const crestFactor = analysis?.crestFactor ?? 1;
    const automationActive = analysis?.automationActive ?? false;
    const automationTargets = analysis?.automationTargets ?? [];
    const sendEnergy = useMemo(() => {
      if (!sendLevels) return 0;
      const levels = Object.values(sendLevels);
      if (!levels.length) return 0;
      return (
        levels.reduce((accumulator, value) => accumulator + value, 0) /
        levels.length
      );
    }, [sendLevels]);

    const orderedSends = useMemo(() => {
      if (!availableSends) {
        return [];
      }
      const sorted = [...availableSends].sort((a, b) => {
        const aValue = sendLevels?.[a.id] ?? 0;
        const bValue = sendLevels?.[b.id] ?? 0;
        return bValue - aValue;
      });
      if (selectedBusId) {
        const index = sorted.findIndex((entry) => entry.id === selectedBusId);
        if (index > 0) {
          const [selected] = sorted.splice(index, 1);
          sorted.unshift(selected);
        }
      }
      return sorted;
    }, [availableSends, sendLevels, selectedBusId]);

    const normalizedInventory = useMemo(() => {
      const sorted = [...pluginInventory];
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }, [pluginInventory]);

    const favoritePlugins = useMemo(
      () => normalizedInventory.filter((item) => pluginFavorites[item.id]),
      [normalizedInventory, pluginFavorites]
    );

    const curatedPlugins = useMemo(
      () => normalizedInventory.filter((item) => item.isCurated),
      [normalizedInventory]
    );

    const searchTerm = insertSearch.trim().toLowerCase();

    const filteredPlugins = useMemo(() => {
      if (!searchTerm) {
        return normalizedInventory;
      }
      return normalizedInventory.filter((item) =>
        item.name.toLowerCase().includes(searchTerm)
      );
    }, [normalizedInventory, searchTerm]);

    // Insert Picker roster: what -> blend curated pillars with personal favorites, why -> keep go-to modules within one tap, how -> merge filtered favorites and curated list. (Reduction / Flow)
    const quickAddPlugins = useMemo(() => {
      if (searchTerm) {
        return filteredPlugins.slice(0, 6);
      }
      const uniqueMap = new Map<FxWindowId, typeof normalizedInventory[number]>();
      [...favoritePlugins, ...curatedPlugins].forEach((item) => {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      });
      return Array.from(uniqueMap.values()).slice(0, 6);
    }, [curatedPlugins, favoritePlugins, filteredPlugins, searchTerm]);

    const handleRename = useCallback(() => {
      if (editedName.trim()) {
        onRenameTrack(track.id, editedName.trim());
      }
      setIsRenaming(false);
    }, [editedName, onRenameTrack, track.id]);

    const handleQuickAdd = useCallback(
      (pluginId: FxWindowId) => {
        onAddPlugin?.(track.id, pluginId);
        setInsertSearch("");
        setIsPickerOpen(false);
      },
      [onAddPlugin, track.id]
    );

    const handleToggleFavorite = useCallback(
      (pluginId: FxWindowId) => {
        onTogglePluginFavorite?.(pluginId);
      },
      [onTogglePluginFavorite]
    );

    const handlePresetCapture = useCallback(
      (pluginId: FxWindowId) => {
        const label = presetLabel.trim() || `${track.trackName} flow`;
        onSavePluginPreset?.(pluginId, label, track.id);
        setPresetLabel("");
        setPresetEditor(null);
        setPresetFeedback("State captured");
      },
      [onSavePluginPreset, presetLabel, track.id]
    );

    const handlePresetRecall = useCallback(
      (pluginId: FxWindowId, presetId: string) => {
        onLoadPluginPreset?.(pluginId, presetId, track.id);
        setPresetFeedback("Preset recalled");
        setOpenPresetMenu(null);
      },
      [onLoadPluginPreset, track.id]
    );

    const handlePresetDelete = useCallback(
      (pluginId: FxWindowId, presetId: string) => {
        onDeletePluginPreset?.(pluginId, presetId);
      },
      [onDeletePluginPreset]
    );

    const topPlugins = useMemo(
      () => plugins.slice(0, 3),
      [plugins]
    );

    const sidechainSources = useMemo(() => {
      return plugins
        .filter((plugin) => /comp|duck|side|gate|pump/i.test(plugin.name))
        .map((plugin) => plugin.name);
    }, [plugins]);

    const automationQuickTargets = useMemo(() => {
      const base: Array<{ fxId: string; paramName: string; label: string }> = [
        { fxId: "track", paramName: "volume", label: "Track Volume" },
        { fxId: "track", paramName: "pan", label: "Track Pan" },
      ];

      automationTargets.forEach((target) => {
        const [fxId, paramName] = target.split(":");
        if (!fxId || !paramName) return;
        const label =
          fxId === "track"
            ? `Track ${paramName}`
            : `${fxId.toUpperCase()} • ${paramName}`;
        base.push({ fxId, paramName, label });
      });

      const unique = new Map<string, { fxId: string; paramName: string; label: string }>();
      base.forEach((entry) => {
        const key = `${entry.fxId}:${entry.paramName}`;
        if (!unique.has(key)) {
          unique.set(key, entry);
        }
      });

      return Array.from(unique.values());
    }, [automationTargets]);

    const renderMixSurface = () => {
      const primaryGlow = `radial-gradient(circle at 50% 20%, ${hexToRgba(
        channelGlow,
        0.25
      )} 0%, transparent 70%)`;
      const accentGlow = `radial-gradient(circle at 50% 20%, ${hexToRgba(
        channelColor,
        0.2 + intensity * 0.2
      )} 0%, transparent 70%)`;

      return (
        <div className="flex flex-1 gap-3">
          <div className="flex flex-col flex-1 gap-3">
            <div
              className="relative flex items-end justify-center rounded-xl border border-glass-border/70 bg-[rgba(8,18,34,0.72)] px-2 py-2"
              style={{ height: `${meterHeight}px` }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute inset-0"
                  style={{ background: primaryGlow, opacity: 0.75 }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: accentGlow, opacity: 0.6 }}
                />
              </div>
              <div className="relative w-full flex items-end justify-center">
                <FlowMeter
                  level={Math.min(1, Math.max(0, analysis?.rms ?? intensity))}
                  peak={Math.min(1, Math.max(analysis?.peak ?? intensity, intensity))}
                  transient={analysis?.transient ?? false}
                  color={channelColor}
                  glow={channelGlow}
                />
              </div>
            </div>

            <div
              className="rounded-xl border border-glass-border bg-[rgba(8,18,34,0.72)] px-2 py-2"
              style={{ height: `${faderHeight}px` }}
            >
              <FlowFader
                value={settings.volume}
                onChange={(value) => onMixerChange(track.id, "volume", value)}
                alsFeedback={alsFeedback}
                trackColor={trackPrimaryColor}
                glowColor={trackGlowColor}
                name={`fader-${track.id}`}
              />
            </div>

            <div className="rounded-xl border border-glass-border bg-[rgba(8,18,34,0.72)] px-2 py-2">
              <div className="h-1 bg-[rgba(9,18,36,0.6)] rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-300/40"
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
                  aria-label="Pan balance"
                />
              </div>
              <div className="text-[0.45rem] text-ink/55 text-center mt-2 uppercase tracking-[0.4em]">
                Pan Balance
              </div>
            </div>
          </div>

          <div className="flex w-32 flex-col gap-2">
            <div className="rounded-xl border border-glass-border bg-[rgba(8,18,34,0.78)] px-3 py-2 text-ink">
              <div className="text-[0.48rem] uppercase tracking-[0.35em] text-ink/65">
                ALS Core
              </div>
              <div className="mt-1 text-[0.85rem] font-semibold tracking-[0.2em] text-cyan-100">
                {temperature.toUpperCase()}
              </div>
              <div className="text-[0.42rem] uppercase tracking-[0.3em] text-ink/60">
                Flow {(flow * 100).toFixed(0)}%
              </div>
              <div className="text-[0.42rem] uppercase tracking-[0.3em] text-ink/60">
                Pulse {(pulse * 100).toFixed(0)}%
              </div>
            </div>

            <div className="rounded-xl border border-glass-border bg-[rgba(8,18,34,0.78)] px-3 py-2 text-ink">
              <div className="text-[0.48rem] uppercase tracking-[0.35em] text-ink/65">
                Dynamics & Tone
              </div>
              <div className="mt-1 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.3em]">
                <span>Crest</span>
                <span>{crestFactor.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] text-ink/70">
                <span>Tilt</span>
                <span>
                  {spectralTilt > 0 ? "Air +" : spectralTilt < 0 ? "Body +" : "Flat"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] text-ink/70">
                <span>Sends</span>
                <span>{Math.round(sendEnergy * 100)}%</span>
              </div>
            </div>

            <div className="rounded-xl border border-glass-border bg-[rgba(8,18,34,0.78)] px-3 py-2 text-ink">
              <div className="flex items-center justify-between">
                <span className="text-[0.48rem] uppercase tracking-[0.35em] text-ink/65">
                  Modules
                </span>
                <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/50">
                  {plugins.length}
                </span>
              </div>
              <div className="mt-1 flex flex-col gap-1">
                {topPlugins.length ? (
                  topPlugins.map((plugin) => (
                    <span
                      key={`preview-${plugin.id}`}
                      className="rounded-md border border-glass-border bg-[rgba(6,14,28,0.78)] px-2 py-1 text-[0.45rem] uppercase tracking-[0.3em] text-ink/75"
                      style={{
                        boxShadow: `0 0 8px ${hexToRgba(plugin.glow ?? plugin.color, 0.22)}`,
                      }}
                    >
                      {plugin.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/45">
                    No inserts
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-glass-border bg-[rgba(8,18,34,0.78)] px-3 py-2 text-ink">
              <div className="flex items-center justify-between">
                <span className="text-[0.48rem] uppercase tracking-[0.35em] text-ink/65">
                  Automation
                </span>
                <span
                  className={`text-[0.48rem] uppercase tracking-[0.3em] ${
                    automationActive ? "text-emerald-300" : "text-ink/45"
                  }`}
                >
                  {automationActive ? "Active" : "Idle"}
                </span>
              </div>
              <div className="mt-1 flex flex-col gap-1">
                {automationTargets.length ? (
                  automationTargets.slice(0, 3).map((target) => (
                    <span
                      key={target}
                      className="rounded-md border border-glass-border bg-[rgba(6,14,28,0.78)] px-2 py-1 text-[0.45rem] uppercase tracking-[0.3em] text-ink/65"
                    >
                      {target}
                    </span>
                  ))
                ) : (
                  <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/45">
                    No lanes armed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };

    const renderModulesSurface = () => (
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1 text-ink">
        <motion.div
          className="flex flex-col gap-1 rounded-xl border border-glass-border bg-[rgba(9,18,36,0.75)] px-2 py-2"
          animate={
            isPickerOpen
              ? {
                  boxShadow: [
                    `0 0 8px ${hexToRgba(trackGlowColor, 0.25)}`,
                    `0 0 18px ${hexToRgba(trackGlowColor, 0.4)}`,
                    `0 0 8px ${hexToRgba(trackGlowColor, 0.25)}`,
                  ],
                }
              : {}
          }
          transition={{
            duration: 1.2,
            ease: "easeInOut",
            repeat: isPickerOpen ? Infinity : 0,
          }}
        >
          <button
            onClick={(event) => {
              event.stopPropagation();
              setIsPickerOpen((prev) => !prev);
            }}
            className="w-full text-[0.48rem] uppercase tracking-[0.35em] text-ink bg-glass-surface-soft hover:bg-glass-surface border border-glass-border rounded-lg py-1.5 transition-all flex items-center justify-between"
          >
            <span>Insert picker</span>
            <span className="text-ink/60">{isPickerOpen ? "Close" : "Open"}</span>
          </button>
          {isPickerOpen && (
            <div className="flex flex-col gap-1">
              <input
                value={insertSearch}
                onChange={(event) => setInsertSearch(event.target.value)}
                className="w-full rounded-lg border border-glass-border bg-[rgba(6,14,28,0.78)] px-2 py-1 text-[0.48rem] uppercase tracking-[0.3em] text-ink placeholder:text-ink/40 focus:border-cyan-300/60 focus:outline-none"
                placeholder="Search modules"
                onClick={(event) => event.stopPropagation()}
              />
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                {quickAddPlugins.length ? (
                  quickAddPlugins.map((plugin) => (
                    <button
                      key={`quick-${plugin.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleQuickAdd(plugin.id);
                      }}
                      className="group flex items-center justify-between gap-1 rounded-lg border border-glass-border bg-[rgba(8,18,34,0.65)] px-2 py-1 text-[0.48rem] uppercase tracking-[0.3em] text-ink hover:bg-[rgba(12,26,48,0.8)] transition-all"
                      style={{
                        boxShadow: pluginFavorites[plugin.id]
                          ? `0 0 14px ${hexToRgba(plugin.glow, 0.38)}`
                          : `0 0 8px ${hexToRgba(plugin.glow, 0.2)}`,
                      }}
                    >
                      <span className="truncate">{plugin.name}</span>
                      <span
                        className={`ml-1 text-[0.55rem] ${
                          pluginFavorites[plugin.id] ? "text-amber-300" : "text-ink/40"
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleFavorite(plugin.id);
                        }}
                        aria-label={
                          pluginFavorites[plugin.id]
                            ? "Remove favorite"
                            : "Add favorite"
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-[0.42rem] uppercase tracking-[0.3em] text-ink/50">
                    No matches yet
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="flex flex-col gap-2 rounded-xl border border-glass-border bg-[rgba(9,18,36,0.72)] px-2 py-2"
          animate={
            actionPulse
              ? {
                  boxShadow: [
                    `0 0 10px ${hexToRgba(actionPulse.glow, 0.25)}`,
                    `0 0 22px ${hexToRgba(actionPulse.halo, 0.4)}`,
                    `0 0 10px ${hexToRgba(actionPulse.glow, 0.25)}`,
                  ],
                }
              : {}
          }
          transition={{
            duration: 1.4,
            ease: "easeInOut",
            repeat: actionPulse ? Infinity : 0,
          }}
          style={{
            borderColor: actionPulse
              ? hexToRgba(actionPulse.accent, 0.58)
              : "rgba(255,255,255,0.12)",
          }}
        >
          {plugins.length ? (
            plugins.map((plugin, index) => {
              const isFirst = index === 0;
              const isLast = index === plugins.length - 1;
              return (
                <div
                  key={`${plugin.id}-${plugin.index}`}
                  className="flex flex-col gap-1 rounded-lg border border-glass-border/80 bg-[rgba(6,14,28,0.82)] px-2 py-2"
                  style={{
                    boxShadow: `0 0 12px ${hexToRgba(plugin.glow ?? plugin.color, 0.2)}`,
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="flex-1 truncate text-[0.55rem] uppercase tracking-[0.35em] text-ink/85"
                      style={{
                        textShadow: `0 0 8px ${hexToRgba(
                          plugin.glow ?? plugin.color,
                          0.35
                        )}`,
                      }}
                    >
                      {plugin.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        className={`px-2 py-0.5 rounded-full text-[0.45rem] uppercase tracking-[0.3em] border border-glass-border/80 transition-colors ${
                          plugin.isBypassed
                            ? "bg-red-500/70 text-white"
                            : "bg-glass-surface text-ink hover:bg-glass-surface-soft"
                        }`}
                        onClick={() => onTogglePluginBypass?.(track.id, plugin.id)}
                      >
                        Byp
                      </button>
                      <button
                        className="px-2 py-0.5 rounded-full text-[0.45rem] uppercase tracking-[0.3em] text-ink/80 border border-glass-border/80 hover:bg-glass-surface transition-colors"
                        onClick={() => onOpenPluginSettings?.(plugin.id)}
                      >
                        ⚙
                      </button>
                      <button
                        className={`px-1.5 py-0.5 rounded-full text-[0.45rem] text-ink/70 border border-glass-border/80 hover:bg-glass-surface transition-colors ${
                          isFirst ? "opacity-30 cursor-default" : ""
                        }`}
                        onClick={() =>
                          !isFirst && onMovePlugin?.(track.id, plugin.index, plugin.index - 1)
                        }
                        disabled={isFirst}
                      >
                        ↑
                      </button>
                      <button
                        className={`px-1.5 py-0.5 rounded-full text-[0.45rem] text-ink/70 border border-glass-border/80 hover:bg-glass-surface transition-colors ${
                          isLast ? "opacity-30 cursor-default" : ""
                        }`}
                        onClick={() =>
                          !isLast && onMovePlugin?.(track.id, plugin.index, plugin.index + 1)
                        }
                        disabled={isLast}
                      >
                        ↓
                      </button>
                      <button
                        className="px-1.5 py-0.5 rounded-full text-[0.45rem] text-red-300 border border-red-400/40 hover:bg-red-500/30 transition-colors"
                        onClick={() => onRemovePlugin?.(track.id, plugin.index)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {pluginPresets?.[plugin.id]?.length ? (
                    <div className="flex flex-col gap-1 rounded-lg border border-glass-border/60 bg-[rgba(5,12,24,0.9)] px-2 py-2">
                      <div className="flex items-center justify-between text-[0.45rem] uppercase tracking-[0.3em] text-ink/55">
                        <span>Captures</span>
                        <button
                          className="text-ink/45 hover:text-cyan-200 transition-colors"
                          onClick={() => setPresetEditor(plugin.id)}
                        >
                          + Capture
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {pluginPresets[plugin.id]!.map((preset) => {
                          const label = preset.label || "Preset";
                          const displayLabel =
                            label.length > 16 ? `${label.slice(0, 16)}…` : label;
                          return (
                            <div
                              key={`${plugin.id}-${preset.id}`}
                              className="flex items-center justify-between gap-1"
                            >
                              <button
                                className="flex-1 rounded-md border border-glass-border/80 bg-[rgba(4,10,20,0.85)] px-2 py-1 text-[0.45rem] uppercase tracking-[0.3em] text-ink/70 hover:bg-glass-surface-soft transition-colors text-left"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handlePresetRecall(plugin.id, preset.id);
                                }}
                              >
                                {displayLabel}
                              </button>
                              <button
                                className="px-1.5 py-0.5 rounded-md text-[0.45rem] text-ink/50 hover:text-red-300 transition-colors"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handlePresetDelete(plugin.id, preset.id);
                                }}
                                aria-label="Delete preset"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="text-[0.48rem] uppercase tracking-[0.35em] text-ink/50 text-center py-2">
              No modules loaded
            </div>
          )}
        </motion.div>

        {presetFeedback && (
          <div className="rounded-xl border border-glass-border/60 bg-[rgba(6,14,28,0.74)] px-3 py-2 text-center text-[0.42rem] uppercase tracking-[0.3em] text-emerald-300/80">
            {presetFeedback}
          </div>
        )}

        {presetEditor && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/60 bg-[rgba(6,20,32,0.9)] px-3 py-2">
            <input
              value={presetLabel}
              onChange={(event) => setPresetLabel(event.target.value)}
              className="flex-1 rounded-lg border border-emerald-400/60 bg-transparent px-2 py-1 text-[0.48rem] uppercase tracking-[0.3em] text-emerald-200 placeholder:text-emerald-200/40 focus:outline-none"
              placeholder="Label capture"
              onClick={(event) => event.stopPropagation()}
            />
            <button
              className="rounded-full border border-emerald-300/70 px-3 py-1 text-[0.45rem] uppercase tracking-[0.3em] text-emerald-200 hover:bg-emerald-500/20 transition-all"
              onClick={(event) => {
                event.stopPropagation();
                handlePresetCapture(presetEditor);
              }}
            >
              Save
            </button>
            <button
              className="rounded-full border border-emerald-300/40 px-3 py-1 text-[0.45rem] uppercase tracking-[0.3em] text-emerald-100/60 hover:bg-emerald-500/10 transition-all"
              onClick={(event) => {
                event.stopPropagation();
                setPresetEditor(null);
                setPresetLabel("");
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {onOpenPluginBrowser && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onOpenPluginBrowser?.(track.id);
            }}
            className="rounded-xl border border-glass-border bg-glass-surface-soft px-3 py-2 text-[0.48rem] uppercase tracking-[0.35em] text-ink hover:bg-glass-surface transition-all"
          >
            Open module browser
          </button>
        )}
      </div>
    );

    const renderRoutingSurface = () => (
      <div className="flex flex-1 flex-col gap-2 text-ink">
        <div className="rounded-xl border border-glass-border bg-[rgba(9,18,36,0.75)] px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.48rem] uppercase tracking-[0.35em] text-ink/65">
              Send matrix
            </span>
            <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/45">
              Live
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {orderedSends.length ? (
              orderedSends.map((send) => (
                <SendIndicator
                  key={send.id}
                  label={
                    send.shortLabel ??
                    (send.name.length > 2
                      ? send.name.slice(0, 2).toUpperCase()
                      : send.name.charAt(0))
                  }
                  fullLabel={send.name}
                  level={sendLevels?.[send.id] ?? 0}
                  color={send.color}
                  glow={send.glow}
                  isSelected={selectedBusId === send.id}
                  onChange={(value) => onSendLevelChange?.(track.id, send.id, value)}
                />
              ))
            ) : (
              <div className="rounded-lg border border-glass-border/60 bg-[rgba(6,14,28,0.78)] px-2 py-2 text-[0.45rem] uppercase tracking-[0.3em] text-ink/50">
                No sends configured
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-glass-border bg-[rgba(9,18,36,0.75)] px-3 py-2">
          <div className="text-[0.48rem] uppercase tracking-[0.35em] text-ink/65">
            Bus palette
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(availableSends ?? []).map((send) => (
              <span
                key={`preview-${send.id}`}
                className="rounded-full border border-glass-border/70 bg-[rgba(6,14,28,0.82)] px-2 py-0.5 text-[0.45rem] uppercase tracking-[0.3em] text-ink/70"
                style={{
                  boxShadow: `0 0 8px ${hexToRgba(send.glow, 0.25)}`,
                }}
              >
                {send.name}
              </span>
            ))}
            {!availableSends?.length && (
              <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/45">
                No buses exposed
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-glass-border bg-[rgba(9,18,36,0.75)] px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.48rem] uppercase tracking-[0.35em] text-ink/65">
              Sidechain sources
            </span>
            <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/45">
              {sidechainSources.length}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {sidechainSources.length ? (
              sidechainSources.map((name) => (
                <span
                  key={`sidechain-${name}`}
                  className="rounded-lg border border-glass-border/70 bg-[rgba(6,14,28,0.85)] px-2 py-1 text-[0.45rem] uppercase tracking-[0.3em] text-ink/70"
                >
                  {name}
                </span>
              ))
            ) : (
              <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/45">
                No sidechain sources detected
              </span>
            )}
          </div>
        </div>
      </div>
    );

    const renderAutomationSurface = () => (
      <div className="flex flex-1 flex-col gap-2 text-ink">
        <div className="rounded-xl border border-glass-border bg-[rgba(9,18,36,0.75)] px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.48rem] uppercase tracking-[0.35em] text-ink/65">
              ALS automation
            </span>
            <span
              className={`text-[0.48rem] uppercase tracking-[0.3em] ${
                automationActive ? "text-emerald-300" : "text-ink/50"
              }`}
            >
              {automationActive ? "Active" : "Idle"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {automationTargets.length ? (
              automationTargets.map((target) => (
                <span
                  key={`automation-${target}`}
                  className="rounded-full border border-glass-border/70 bg-[rgba(6,14,28,0.82)] px-2 py-0.5 text-[0.45rem] uppercase tracking-[0.3em] text-ink/70"
                >
                  {target}
                </span>
              ))
            ) : (
              <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/45">
                No automation passes yet
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-glass-border bg-[rgba(9,18,36,0.75)] px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.48rem] uppercase tracking-[0.35em] text-ink/65">
              Quick lanes
            </span>
            <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/45">
              Sub {Math.round(Math.min(1, Math.max(0, analysis?.rms ?? 0)) * 100)}%
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {automationQuickTargets.map(({ fxId, paramName, label }) => {
              const key = `${fxId}:${paramName}`;
              const isActive = automationTargets.includes(key);
              return (
                <motion.button
                  key={`automation-toggle-${key}`}
                  whileTap={{ scale: 0.94 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleAutomationLaneWithParam?.(track.id, fxId, paramName);
                  }}
                  className={`rounded-full border px-3 py-1 text-[0.45rem] uppercase tracking-[0.3em] transition ${
                    isActive
                      ? "border-emerald-300/70 bg-[rgba(12,48,52,0.7)] text-emerald-200 shadow-[0_0_14px_rgba(74,222,128,0.35)]"
                      : "border-glass-border text-ink/65 hover:text-emerald-100"
                  }`}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );

    const renderModeSurface = () => {
      switch (mode) {
        case "modules":
          return renderModulesSurface();
        case "routing":
          return renderRoutingSurface();
        case "automation":
          return renderAutomationSurface();
        case "mix":
        default:
          return renderMixSurface();
      }
    };

    return (
      <motion.div
        className={`relative flex flex-col rounded-xl border backdrop-blur-2xl overflow-hidden transition-all bg-glass-surface text-ink ${
          isSelected
            ? "border-cyan-300/70 shadow-[0_0_48px_rgba(56,189,248,0.45)]"
            : "border-glass-border shadow-[0_22px_70px_rgba(4,12,26,0.55)]"
        } ${
          isArmed
            ? "border-red-500/70 shadow-[0_0_32px_rgba(248,113,113,0.5)]"
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
        <div className="relative flex-shrink-0 h-18 border-b border-glass-border/70">
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

          <div className="relative z-10 px-2 pt-2 flex flex-col gap-1 text-ink">
            {isRenaming ? (
              <input
                type="text"
                value={editedName}
                onChange={(event) => setEditedName(event.target.value)}
                onBlur={handleRename}
                onKeyDown={(event) => event.key === "Enter" && handleRename()}
                className="w-full text-[0.55rem] uppercase tracking-[0.35em] bg-transparent border-b border-cyan-300/40 text-ink focus:border-cyan-300/70 outline-none"
                autoFocus
                onClick={(event) => event.stopPropagation()}
                aria-label="Track name"
              />
            ) : (
              <div
                className="text-[0.55rem] uppercase tracking-[0.35em] text-ink truncate cursor-pointer"
                style={{ textShadow: `0 0 10px ${hexToRgba(channelGlow, 0.6)}` }}
                onDoubleClick={() => setIsRenaming(true)}
                onClick={(event) => event.stopPropagation()}
              >
                {track.trackName}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-[0.45rem] uppercase tracking-[0.45em] text-ink/60 truncate">
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
                      : "bg-[rgba(16,50,95,0.55)] text-ink hover:bg-[rgba(22,64,122,0.7)]"
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
                      ? "bg-amber-300/80 text-ink"
                      : "bg-[rgba(16,50,95,0.55)] text-ink/80 hover:bg-[rgba(22,64,122,0.7)]"
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
                      ? "bg-red-500 text-white"
                      : "bg-[rgba(16,50,95,0.55)] text-ink/80 hover:bg-[rgba(22,64,122,0.7)]"
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
            <div className="flex flex-wrap gap-1.5">
              {CHANNEL_MODE_DEFINITIONS.map(({ id, label }) => {
                const isActive = mode === id;
                return (
                  <motion.button
                    key={id}
                    whileTap={{ scale: 0.96 }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setMode(id);
                    }}
                    className={`rounded-full border px-3 py-1 text-[0.48rem] uppercase tracking-[0.35em] transition ${
                      isActive
                        ? "border-cyan-300/80 bg-[rgba(16,50,95,0.7)] text-cyan-100 shadow-[0_0_16px_rgba(56,189,248,0.35)]"
                        : "border-glass-border text-ink/65 hover:text-cyan-100"
                    }`}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
            {actionMessage && (
              <motion.span
                className="rounded-full border border-cyan-300/60 bg-[rgba(6,18,34,0.85)] px-3 py-1 text-[0.45rem] uppercase tracking-[0.3em] text-cyan-100"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                {actionMessage}
              </motion.span>
            )}
          </div>
          <div className="flex flex-1">
            {renderModeSurface()}
          </div>
        </div>
      </motion.div>
    );
  }
);

FlowChannelStrip.displayName = "FlowChannelStrip";

export default FlowChannelStrip;


