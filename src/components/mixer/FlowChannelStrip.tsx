import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFlowMotion, usePulseAnimation } from "../mixxglass";
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
import { MixxGlassFader, MixxGlassMeter } from "../mixxglass";
import { GlassFader } from "./GlassFader";
import { ZMeter3D } from "./ZMeter3D";
import { GlassPanOrb } from "./GlassPanOrb";
import { WidthLens } from "./WidthLens";
import { MicroTrim } from "./MicroTrim";
import { MuteIcon, SoloIcon, ArmIcon } from "../icons";
import { als } from "../../utils/alsFeedback";
import {
  MIXER_STRIP_WIDTH,
  MIXER_STRIP_MIN_WIDTH,
  MIXER_STRIP_MAX_WIDTH,
  MIXER_STRIP_GAP_PX,
} from "./mixerConstants";
import { spacing, typography, layout, effects, transitions, composeStyles } from "../../design-system";

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
  /** Flow-Follow Mode: Transport state for meter animation */
  isPlaying?: boolean;
  currentTime?: number;
  followPlayhead?: boolean;
}

// Component for pulsing send indicator
const PulsingSendIndicator: React.FC<{
  level: number;
  color: string;
  glow: string;
  isSelected: boolean;
}> = ({ level, color, glow, isSelected }) => {
  const pulseOpacity = usePulseAnimation(0.6, 1, 1400, 'ease-in-out');
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        effects.border.radius.full,
        {
          inset: '0 0 0 0',
          left: 0,
          width: `${Math.min(1, Math.max(0, level)) * 100}%`,
          background: `linear-gradient(90deg, ${hexToRgba(
            color,
            isSelected ? 0.95 : 0.75
          )}, ${hexToRgba(glow, isSelected ? 0.55 : 0.35)})`,
          boxShadow: `0 0 12px ${hexToRgba(glow, isSelected ? 0.45 : 0.3)}`,
          opacity: pulseOpacity,
        }
      )}
    />
  );
};

// Component for action pulse animation
const ActionPulseContainer: React.FC<{
  actionPulse: ALSActionPulse | null | undefined;
  children: React.ReactNode;
}> = ({ actionPulse, children }) => {
  const pulseGlow = usePulseAnimation(0.25, 0.4, 1400, 'ease-in-out');
  const pulseHalo = usePulseAnimation(0.25, 0.4, 1400, 'ease-in-out');
  
  if (!actionPulse) {
    return <>{children}</>;
  }

  const boxShadow = actionPulse
    ? `0 0 ${8 + pulseGlow * 2}px ${hexToRgba(actionPulse.glow, 0.25 + pulseGlow * 0.15)}, 0 0 ${14 + pulseHalo * 8}px ${hexToRgba(actionPulse.halo, 0.25 + pulseHalo * 0.15)}`
    : undefined;

  return (
    <div
      style={composeStyles(
        layout.flex.container('col'),
        spacing.gap(2),
        spacing.px(2),
        spacing.py(2),
        effects.border.radius.xl,
        {
          border: `1px solid ${hexToRgba(actionPulse.accent, 0.58)}`,
          background: 'rgba(9,18,36,0.72)',
          boxShadow,
        }
      )}
    >
      {children}
    </div>
  );
};

// Component for picker open animation
const PickerOpenContainer: React.FC<{
  isPickerOpen: boolean;
  trackGlowColor: string;
  children: React.ReactNode;
}> = ({ isPickerOpen, trackGlowColor, children }) => {
  const pulseGlow = usePulseAnimation(0.25, 0.4, 1200, 'ease-in-out');
  
  const boxShadow = isPickerOpen
    ? `0 0 ${6 + pulseGlow * 2}px ${hexToRgba(trackGlowColor, 0.25 + pulseGlow * 0.15)}, 0 0 ${12 + pulseGlow * 6}px ${hexToRgba(trackGlowColor, 0.25 + pulseGlow * 0.15)}`
    : undefined;

  return (
    <div
      style={composeStyles(
        layout.flex.container('col'),
        spacing.gap(1),
        spacing.px(2),
        spacing.py(2),
        effects.border.radius.xl,
        {
          border: '1px solid rgba(102, 140, 198, 0.45)',
          background: 'rgba(9,18,36,0.75)',
          boxShadow,
        }
      )}
    >
      {children}
    </div>
  );
};

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
    style={composeStyles(
      layout.flex.container('row'),
      layout.flex.align.center,
      spacing.gap(2),
      spacing.px(2),
      spacing.py(1),
      effects.border.radius.xl,
      transitions.transition.colors(200),
      {
        background: isSelected ? 'rgba(12,24,46,0.68)' : 'transparent',
      }
    )}
  >
    <div
      style={composeStyles(
        layout.flex.container('row'),
        layout.flex.align.center,
        layout.flex.justify.center,
        effects.border.radius.full,
        typography.transform('uppercase'),
        typography.tracking.widest,
        {
          width: '24px',
          height: '24px',
          fontSize: '0.45rem',
          border: isSelected
            ? '1px solid rgba(103, 232, 249, 0.7)'
            : '1px solid rgba(102, 140, 198, 0.6)',
          color: isSelected ? 'rgba(207, 250, 254, 1)' : 'rgba(230, 240, 255, 0.7)',
          background: isSelected ? 'rgba(16,50,95,0.6)' : 'transparent',
        }
      )}
      title={fullLabel}
    >
      {label}
    </div>
    <div style={composeStyles(
      { flex: 1 },
      layout.position.relative,
      layout.overflow.hidden,
      effects.border.radius.full,
      {
        height: '6px',
        background: 'rgba(9,18,36,0.6)',
      }
    )}>
      <PulsingSendIndicator
        level={level}
        color={color}
        glow={glow}
        isSelected={isSelected}
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
        style={composeStyles(
          layout.position.absolute,
          { inset: 0 },
          layout.width.full,
          layout.height.full,
          {
            opacity: 0,
            cursor: 'pointer',
          }
        )}
        onClick={(event) => event.stopPropagation()}
        aria-label={`Send level ${fullLabel}`}
      />
    </div>
  </div>
);

// Component for pulsing channel background
const PulsingChannelBackground: React.FC<{
  channelColor: string;
  channelGlow: string;
  intensity: number;
}> = ({ channelColor, channelGlow, intensity }) => {
  const pulseOpacity = usePulseAnimation({
    duration: 2500,
    minOpacity: 0.6,
    maxOpacity: 1,
    easing: 'ease-in-out',
  });
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        { inset: 0 },
        {
          background: `radial-gradient(circle at 50% 20%, ${hexToRgba(
            channelGlow,
            0.25 + intensity * 0.3
          )} 0%, transparent 100%)`,
          boxShadow: `inset 0 0 ${20 + intensity * 15}px ${hexToRgba(channelGlow, 0.15 + intensity * 0.25)}`,
          opacity: pulseOpacity.opacity,
        }
      )}
    />
  );
};

// Component for pulsing pan indicator
const PulsingPanIndicator: React.FC<{
  pan: number;
  channelColor: string;
  channelGlow: string;
  intensity: number;
}> = ({ pan, channelColor, channelGlow, intensity }) => {
  const pulseOpacity = usePulseAnimation({
    duration: 2200,
    minOpacity: 0.7,
    maxOpacity: 1,
    easing: 'ease-in-out',
  });
  
  // Map pan from -1 to +1 to 0% to 100% position
  const position = ((pan + 1) / 2) * 100;
  
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        transitions.transform.combine('translateX(-50%)'),
        {
          left: `${position}%`,
          top: '50%',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${hexToRgba(
            channelGlow,
            0.9 + intensity * 0.1
          )} 0%, ${hexToRgba(channelColor, 0.6 + intensity * 0.2)} 100%)`,
          boxShadow: `0 0 ${8 + intensity * 6}px ${hexToRgba(channelGlow, 0.6 + intensity * 0.3)}`,
          opacity: pulseOpacity.opacity,
          pointerEvents: 'none',
        }
      )}
    />
  );
};

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
    // Filter out core processors from displayed plugins
    displayedPlugins = plugins.filter(plugin => {
      const CORE_PROCESSOR_IDS: FxWindowId[] = ['velvet-curve', 'phase-weave', 'velvet-floor', 'harmonic-lattice'];
      return !CORE_PROCESSOR_IDS.includes(plugin.id);
    }),
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
    isPlaying = false,
    currentTime = 0,
    followPlayhead = false,
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
      // Filter out core processors (engine-level only)
      const CORE_PROCESSOR_IDS: FxWindowId[] = ['velvet-curve', 'phase-weave', 'velvet-floor', 'harmonic-lattice'];
      const sorted = [...pluginInventory].filter(plugin => !CORE_PROCESSOR_IDS.includes(plugin.id));
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
        // Prevent adding core processors through UI (engine-level only)
        const CORE_PROCESSOR_IDS: FxWindowId[] = ['velvet-curve', 'phase-weave', 'velvet-floor', 'harmonic-lattice'];
        if (CORE_PROCESSOR_IDS.includes(pluginId)) {
          als.warning(`[FLOW] Core processor ${pluginId} cannot be added via UI - it's engine-level only`);
          return;
        }
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
      () => {
        return displayedPlugins
          .slice(0, 3)
          .map((plugin) => {
            const inventoryMatch = pluginInventory.find((p) => p.id === plugin.id);
            return {
              id: plugin.id,
              name: plugin.name,
              color: inventoryMatch?.base ?? plugin.color,
              glow: inventoryMatch?.glow ?? plugin.glow,
            };
          });
      },
      [displayedPlugins, pluginInventory]
    );

    const sidechainSources = useMemo(() => {
      return displayedPlugins
        .filter((plugin) => /comp|duck|side|gate|pump/i.test(plugin.name))
        .map((plugin) => plugin.name);
    }, [displayedPlugins]);

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
      )} 0%, transparent 100%)`;
      const accentGlow = `radial-gradient(circle at 50% 20%, ${hexToRgba(
        channelColor,
        0.2 + intensity * 0.2
      )} 0%, transparent 100%)`;

      return (
        <div style={composeStyles(
          layout.flex.container('row'),
          { flex: 1 },
          spacing.gap(3)
        )}>
          <div style={composeStyles(
            layout.flex.container('col'),
            { flex: 1 },
            spacing.gap(3)
          )}>
            <div
              style={composeStyles(
                layout.position.relative,
                layout.flex.container('row'),
                layout.flex.align.end,
                layout.flex.justify.center,
                spacing.px(2),
                spacing.py(2),
                effects.border.radius.xl,
                {
                  border: '1px solid rgba(102, 140, 198, 0.7)',
                  background: 'rgba(8,18,34,0.72)',
                  height: `${meterHeight}px`,
                }
              )}
            >
              <div style={composeStyles(
                layout.position.absolute,
                { inset: 0 },
                { pointerEvents: 'none' }
              )}>
                <div
                  style={composeStyles(
                    layout.position.absolute,
                    { inset: 0 },
                    { background: primaryGlow, opacity: 0.75 }
                  )}
                />
                <div
                  style={composeStyles(
                    layout.position.absolute,
                    { inset: 0 },
                    { background: accentGlow, opacity: 0.6 }
                  )}
                />
              </div>
              <div style={composeStyles(
                layout.position.relative,
                layout.width.full,
                layout.flex.container('row'),
                layout.flex.align.end,
                layout.flex.justify.center
              )}>
                {/* MixxGlassMeter with glass aesthetic and ALS integration */}
                <MixxGlassMeter
                  level={Math.min(1, Math.max(0, analysis?.rms ?? intensity))}
                  peak={Math.min(1, Math.max(analysis?.peak ?? intensity, intensity))}
                  transient={analysis?.transient ?? false}
                  alsChannel="pressure"
                  color={channelColor}
                  glowColor={channelGlow}
                  height={meterHeight}
                  width={44}
                />
              </div>
            </div>

            <div
              style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.center,
                spacing.px(2),
                spacing.py(2),
                effects.border.radius.xl,
                {
                  border: '1px solid rgba(102, 140, 198, 0.45)',
                  background: 'rgba(8,18,34,0.72)',
                  height: `${faderHeight}px`,
                }
              )}
            >
              {/* MixxGlassFader with glass aesthetic and ALS integration */}
              <MixxGlassFader
                value={settings.volume}
                onChange={(value) => onMixerChange(track.id, "volume", value)}
                alsChannel="momentum"
                alsIntensity={alsFeedback?.intensity}
                alsPulse={alsFeedback?.pulse}
                trackColor={channelColor}
                glowColor={channelGlow}
                name={track.trackName}
                height={faderHeight}
                showDB={true}
              />
            </div>

            {/* Pan Control - Restored original form factor with drag interaction */}
            <div style={composeStyles(
              spacing.px(3),
              spacing.py(2),
              effects.border.radius.xl,
              {
                border: '1px solid rgba(102, 140, 198, 0.7)',
                background: 'rgba(8,18,34,0.72)',
              }
            )}>
              <div 
                style={composeStyles(
                  layout.position.relative,
                  layout.overflow.hidden,
                  effects.border.radius.full,
                  {
                    height: '4px',
                    background: 'rgba(9,18,36,0.6)',
                    cursor: 'pointer',
                  }
                )}
                onPointerDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const pan = ((x / rect.width) - 0.5) * 2; // -1 to +1
                  onMixerChange(track.id, "pan", Math.min(1, Math.max(-1, pan)));
                }}
              >
                <div
                  style={composeStyles(
                    layout.position.absolute,
                    transitions.transform.combine('translateX(-50%)'),
                    {
                      left: '50%',
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      background: 'rgba(103, 232, 249, 0.4)',
                    }
                  )}
                />
                <PulsingPanIndicator
                  pan={settings.pan}
                  channelColor={channelColor}
                  channelGlow={channelGlow}
                  intensity={intensity}
                />
              </div>
            </div>

            {/* Legacy pan visualization (kept for reference, can be removed later) */}
            <div style={composeStyles(
              spacing.px(2),
              spacing.py(2),
              effects.border.radius.xl,
              {
                border: '1px solid rgba(102, 140, 198, 0.45)',
                background: 'rgba(8,18,34,0.72)',
                display: 'none',
              }
            )}>
              <div style={composeStyles(
                layout.position.relative,
                layout.overflow.hidden,
                effects.border.radius.full,
                {
                  height: '4px',
                  background: 'rgba(9,18,36,0.6)',
                }
              )}>
                <div
                  style={composeStyles(
                    layout.position.absolute,
                    transitions.transform.combine('translateX(-50%)'),
                    {
                      left: '50%',
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      background: 'rgba(103, 232, 249, 0.4)',
                    }
                  )}
                />
                <div
                  style={composeStyles(
                    effects.border.radius.full,
                    {
                      height: '100%',
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
                    }
                  )}
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
                  style={composeStyles(
                    layout.position.absolute,
                    { inset: 0 },
                    layout.width.full,
                    layout.height.full,
                    {
                      opacity: 0,
                      cursor: 'pointer',
                    }
                  )}
                  onClick={(event) => event.stopPropagation()}
                  aria-label="Pan balance"
                />
              </div>
              <div style={composeStyles(
                typography.size('xs'),
                typography.color.ink.muted,
                typography.align('center'),
                spacing.mt(2),
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.6875rem', // 11px minimum
                }
              )}>
                Pan Balance
              </div>
            </div>
          </div>

          <div style={composeStyles(
            layout.flex.container('col'),
            spacing.gap(2),
            { width: '128px' }
          )}>
            <div style={composeStyles(
              spacing.px(3),
              spacing.py(2),
              effects.border.radius.xl,
              {
                border: '1px solid rgba(102, 140, 198, 0.45)',
                background: 'rgba(8,18,34,0.78)',
                color: '#e6f0ff',
              }
            )}>
              <div style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.48rem',
                  color: 'rgba(230, 240, 255, 0.65)',
                }
              )}>
                ALS Core
              </div>
              <div style={composeStyles(
                spacing.mt(1),
                typography.weight('semibold'),
                {
                  fontSize: '0.85rem',
                  letterSpacing: '0.2em',
                  color: 'rgba(207, 250, 254, 1)',
                }
              )}>
                {temperature.toUpperCase()}
              </div>
              <div style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.42rem',
                  color: 'rgba(230, 240, 255, 0.6)',
                }
              )}>
                Flow {flow > 0.7 ? 'Intense' : flow > 0.4 ? 'Active' : 'Subtle'}
              </div>
              <div style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.42rem',
                  color: 'rgba(230, 240, 255, 0.6)',
                }
              )}>
                Pulse {pulse > 0.7 ? 'Strong' : pulse > 0.3 ? 'Present' : 'Calm'}
              </div>
            </div>

            <div style={composeStyles(
              spacing.px(3),
              spacing.py(2),
              effects.border.radius.xl,
              {
                border: '1px solid rgba(102, 140, 198, 0.45)',
                background: 'rgba(8,18,34,0.78)',
                color: '#e6f0ff',
              }
            )}>
              <div style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.48rem',
                  color: 'rgba(230, 240, 255, 0.65)',
                }
              )}>
                Dynamics & Tone
              </div>
              <div style={composeStyles(
                spacing.mt(1),
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.between,
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.6rem',
                }
              )}>
                <span>Crest</span>
                <span>{crestFactor > 12 ? 'Dynamic' : crestFactor > 6 ? 'Punchy' : 'Dense'}</span>
              </div>
              <div style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.between,
                typography.transform('uppercase'),
                typography.tracking.widest,
                typography.color.ink.muted,
                {
                  fontSize: '0.6rem',
                }
              )}>
                <span>Tilt</span>
                <span>
                  {spectralTilt > 0 ? "Air +" : spectralTilt < 0 ? "Body +" : "Flat"}
                </span>
              </div>
              <div style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.between,
                typography.transform('uppercase'),
                typography.tracking.widest,
                typography.color.ink.muted,
                {
                  fontSize: '0.6rem',
                }
              )}>
                <span>Sends</span>
                <span>{sendEnergy >= 0.8 ? 'Hot' : sendEnergy >= 0.5 ? 'Active' : sendEnergy >= 0.2 ? 'Low' : 'Idle'}</span>
              </div>
            </div>

            <div style={composeStyles(
              spacing.px(3),
              spacing.py(2),
              effects.border.radius.xl,
              {
                border: '1px solid rgba(102, 140, 198, 0.45)',
                background: 'rgba(8,18,34,0.78)',
                color: '#e6f0ff',
              }
            )}>
              <div style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.between
              )}>
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.48rem',
                    color: 'rgba(230, 240, 255, 0.65)',
                  }
                )}>
                  Modules
                </span>
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.6875rem', // 11px minimum
                    color: 'rgba(230, 240, 255, 0.5)',
                  }
                )}>
                  {displayedPlugins.length}
                </span>
              </div>
              <div style={composeStyles(
                spacing.mt(1),
                layout.flex.container('col'),
                spacing.gap(1)
              )}>
                {topPlugins.length ? (
                  topPlugins.map((plugin) => (
                    <span
                      key={`preview-${plugin.id}`}
                      style={composeStyles(
                        spacing.px(2),
                        spacing.py(1),
                        effects.border.radius.md,
                        typography.transform('uppercase'),
                        typography.tracking.widest,
                        {
                          border: '1px solid rgba(102, 140, 198, 0.45)',
                          background: 'rgba(6,14,28,0.78)',
                          fontSize: '0.6875rem', // 11px minimum
                          color: 'rgba(230, 240, 255, 0.75)',
                          boxShadow: `0 0 8px ${hexToRgba(plugin.glow ?? plugin.color, 0.22)}`,
                        }
                      )}
                    >
                      {plugin.name}
                    </span>
                  ))
                ) : (
                  <span style={composeStyles(
                    typography.transform('uppercase'),
                    typography.tracking.widest,
                    {
                      fontSize: '0.6875rem', // 11px minimum
                      color: 'rgba(230, 240, 255, 0.45)',
                    }
                  )}>
                    No inserts
                  </span>
                )}
              </div>
            </div>

            <div style={composeStyles(
              spacing.px(3),
              spacing.py(2),
              effects.border.radius.xl,
              {
                border: '1px solid rgba(102, 140, 198, 0.45)',
                background: 'rgba(8,18,34,0.78)',
                color: '#e6f0ff',
              }
            )}>
              <div style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.between
              )}>
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.48rem',
                    color: 'rgba(230, 240, 255, 0.65)',
                  }
                )}>
                  Automation
                </span>
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.48rem',
                    color: automationActive ? 'rgba(110, 231, 183, 1)' : 'rgba(230, 240, 255, 0.45)',
                  }
                )}>
                  {automationActive ? "Active" : "Idle"}
                </span>
              </div>
              <div style={composeStyles(
                spacing.mt(1),
                layout.flex.container('col'),
                spacing.gap(1)
              )}>
                {automationTargets.length ? (
                  automationTargets.slice(0, 3).map((target) => (
                    <span
                      key={target}
                      style={composeStyles(
                        spacing.px(2),
                        spacing.py(1),
                        effects.border.radius.md,
                        typography.transform('uppercase'),
                        typography.tracking.widest,
                        {
                          border: '1px solid rgba(102, 140, 198, 0.45)',
                          background: 'rgba(6,14,28,0.78)',
                          fontSize: '0.6875rem', // 11px minimum
                          color: 'rgba(230, 240, 255, 0.65)',
                        }
                      )}
                    >
                      {target}
                    </span>
                  ))
                ) : (
                  <span style={composeStyles(
                    typography.transform('uppercase'),
                    typography.tracking.widest,
                    {
                      fontSize: '0.6875rem', // 11px minimum
                      color: 'rgba(230, 240, 255, 0.45)',
                    }
                  )}>
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
      <div style={composeStyles(
        layout.flex.container('col'),
        { flex: 1 },
        spacing.gap(2),
        layout.overflow.y.auto,
        spacing.pr(1),
        { color: '#e6f0ff' }
      )}>
        <PickerOpenContainer isPickerOpen={isPickerOpen} trackGlowColor={trackGlowColor}>
          <button
            onClick={(event) => {
              event.stopPropagation();
              setIsPickerOpen((prev) => !prev);
            }}
            style={composeStyles(
              layout.width.full,
              layout.flex.container('row'),
              layout.flex.align.center,
              layout.flex.justify.between,
              spacing.py(1.5),
              effects.border.radius.lg,
              transitions.transition.standard('all', 200, 'ease-out'),
              typography.transform('uppercase'),
              typography.tracking.widest,
              {
                fontSize: '0.48rem',
                color: '#e6f0ff',
                background: 'rgba(12,24,46,0.68)',
                border: '1px solid rgba(102, 140, 198, 0.45)',
                cursor: 'pointer',
              }
            )}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(9,18,36,0.82)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(12,24,46,0.68)';
            }}
          >
            <span>Insert picker</span>
            <span style={{ color: 'rgba(230, 240, 255, 0.6)' }}>{isPickerOpen ? "Close" : "Open"}</span>
          </button>
          {isPickerOpen && (
            <div style={composeStyles(
              layout.flex.container('col'),
              spacing.gap(1)
            )}>
              <input
                value={insertSearch}
                onChange={(event) => setInsertSearch(event.target.value)}
                style={composeStyles(
                  layout.width.full,
                  spacing.px(2),
                  spacing.py(1),
                  effects.border.radius.lg,
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  transitions.transition.standard(['border-color', 'outline'], 200, 'ease-out'),
                  {
                    border: '1px solid rgba(102, 140, 198, 0.45)',
                    background: 'rgba(6,14,28,0.78)',
                    fontSize: '0.48rem',
                    color: '#e6f0ff',
                    outline: 'none',
                  }
                )}
                placeholder="Search modules"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(103, 232, 249, 0.6)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(102, 140, 198, 0.45)';
                }}
                onClick={(event) => event.stopPropagation()}
              />
              <div style={composeStyles(
                layout.flex.container('col'),
                spacing.gap(1),
                { maxHeight: '144px' },
                layout.overflow.y.auto
              )}>
                {quickAddPlugins.length ? (
                  quickAddPlugins.map((plugin) => (
                    <button
                      key={`quick-${plugin.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleQuickAdd(plugin.id);
                      }}
                      style={composeStyles(
                        layout.flex.container('row'),
                        layout.flex.align.center,
                        layout.flex.justify.between,
                        spacing.gap(1),
                        spacing.px(2),
                        spacing.py(1),
                        effects.border.radius.lg,
                        transitions.transition.standard('all', 200, 'ease-out'),
                        typography.transform('uppercase'),
                        typography.tracking.widest,
                        {
                          border: '1px solid rgba(102, 140, 198, 0.45)',
                          background: 'rgba(8,18,34,0.65)',
                          fontSize: '0.48rem',
                          color: '#e6f0ff',
                          cursor: 'pointer',
                          boxShadow: pluginFavorites[plugin.id]
                            ? `0 0 14px ${hexToRgba(plugin.glow, 0.38)}`
                            : `0 0 8px ${hexToRgba(plugin.glow, 0.2)}`,
                        }
                      )}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(12,26,48,0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(8,18,34,0.65)';
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plugin.name}</span>
                      <span
                        style={composeStyles(
                          spacing.ml(1),
                          {
                            fontSize: '0.55rem',
                            color: pluginFavorites[plugin.id] ? 'rgba(252, 211, 77, 1)' : 'rgba(230, 240, 255, 0.4)',
                            cursor: 'pointer',
                          }
                        )}
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
                  <div style={composeStyles(
                    typography.transform('uppercase'),
                    typography.tracking.widest,
                    {
                      fontSize: '0.42rem',
                      color: 'rgba(230, 240, 255, 0.5)',
                    }
                  )}>
                    No matches yet
                  </div>
                )}
              </div>
            </div>
          )}
        </PickerOpenContainer>

        <ActionPulseContainer actionPulse={actionPulse}>
          {displayedPlugins.length ? (
            displayedPlugins.map((plugin, index) => {
              const isFirst = index === 0;
              const isLast = index === displayedPlugins.length - 1;
              return (
                <div
                  key={`${plugin.id}-${plugin.index}`}
                  style={composeStyles(
                    layout.flex.container('col'),
                    spacing.gap(1),
                    spacing.px(2),
                    spacing.py(2),
                    effects.border.radius.lg,
                    {
                      border: '1px solid rgba(102, 140, 198, 0.8)',
                      background: 'rgba(6,14,28,0.82)',
                      boxShadow: `0 0 12px ${hexToRgba(plugin.glow ?? plugin.color, 0.2)}`,
                    }
                  )}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div style={composeStyles(
                    layout.flex.container('row'),
                    layout.flex.align.center,
                    layout.flex.justify.between,
                    spacing.gap(2)
                  )}>
                    <span
                      style={composeStyles(
                        { flex: 1 },
                        typography.transform('uppercase'),
                        typography.tracking.widest,
                        {
                          fontSize: '0.55rem',
                          color: 'rgba(230, 240, 255, 0.85)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textShadow: `0 0 8px ${hexToRgba(
                            plugin.glow ?? plugin.color,
                            0.35
                          )}`,
                        }
                      )}
                    >
                      {plugin.name}
                    </span>
                    <div style={composeStyles(
                      layout.flex.container('row'),
                      layout.flex.align.center,
                      spacing.gap(1)
                    )}>
                      <button
                        style={composeStyles(
                          spacing.px(2),
                          spacing.py(0.5),
                          effects.border.radius.full,
                          typography.transform('uppercase'),
                          typography.tracking.widest,
                          transitions.transition.standard('all', 200, 'ease-out'),
                          {
                            fontSize: '0.6875rem', // 11px minimum
                            border: '1px solid rgba(102, 140, 198, 0.8)',
                            background: plugin.isBypassed
                              ? 'rgba(239, 68, 68, 0.7)'
                              : 'rgba(9,18,36,0.82)',
                            color: plugin.isBypassed ? '#ffffff' : '#e6f0ff',
                            cursor: 'pointer',
                          }
                        )}
                        onClick={() => onTogglePluginBypass?.(track.id, plugin.id)}
                        onMouseEnter={(e) => {
                          if (!plugin.isBypassed) {
                            e.currentTarget.style.background = 'rgba(12,24,46,0.68)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!plugin.isBypassed) {
                            e.currentTarget.style.background = 'rgba(9,18,36,0.82)';
                          }
                        }}
                      >
                        Byp
                      </button>
                      <button
                        style={composeStyles(
                          spacing.px(2),
                          spacing.py(0.5),
                          effects.border.radius.full,
                          typography.transform('uppercase'),
                          typography.tracking.widest,
                          transitions.transition.standard('all', 200, 'ease-out'),
                          {
                            fontSize: '0.6875rem', // 11px minimum
                            color: 'rgba(230, 240, 255, 0.8)',
                            border: '1px solid rgba(102, 140, 198, 0.8)',
                            background: 'transparent',
                            cursor: 'pointer',
                          }
                        )}
                        onClick={() => onOpenPluginSettings?.(plugin.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(9,18,36,0.82)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        ⚙
                      </button>
                      <button
                        style={composeStyles(
                          spacing.px(1.5),
                          spacing.py(0.5),
                          effects.border.radius.full,
                          transitions.transition.standard('all', 200, 'ease-out'),
                          {
                            fontSize: '0.6875rem', // 11px minimum
                            color: 'rgba(230, 240, 255, 0.7)',
                            border: '1px solid rgba(102, 140, 198, 0.8)',
                            background: 'transparent',
                            cursor: isFirst ? 'default' : 'pointer',
                            opacity: isFirst ? 0.3 : 1,
                          }
                        )}
                        onClick={() =>
                          !isFirst && onMovePlugin?.(track.id, plugin.index, plugin.index - 1)
                        }
                        disabled={isFirst}
                        onMouseEnter={(e) => {
                          if (!isFirst) {
                            e.currentTarget.style.background = 'rgba(9,18,36,0.82)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isFirst) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        ↑
                      </button>
                      <button
                        style={composeStyles(
                          spacing.px(1.5),
                          spacing.py(0.5),
                          effects.border.radius.full,
                          transitions.transition.standard('all', 200, 'ease-out'),
                          {
                            fontSize: '0.6875rem', // 11px minimum
                            color: 'rgba(230, 240, 255, 0.7)',
                            border: '1px solid rgba(102, 140, 198, 0.8)',
                            background: 'transparent',
                            cursor: isLast ? 'default' : 'pointer',
                            opacity: isLast ? 0.3 : 1,
                          }
                        )}
                        onClick={() =>
                          !isLast && onMovePlugin?.(track.id, plugin.index, plugin.index + 1)
                        }
                        disabled={isLast}
                        onMouseEnter={(e) => {
                          if (!isLast) {
                            e.currentTarget.style.background = 'rgba(9,18,36,0.82)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLast) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        ↓
                      </button>
                      <button
                        style={composeStyles(
                          spacing.px(1.5),
                          spacing.py(0.5),
                          effects.border.radius.full,
                          transitions.transition.standard('all', 200, 'ease-out'),
                          {
                            fontSize: '0.6875rem', // 11px minimum
                            color: 'rgba(252, 165, 165, 1)',
                            border: '1px solid rgba(248, 113, 113, 0.4)',
                            background: 'transparent',
                            cursor: 'pointer',
                          }
                        )}
                        onClick={() => onRemovePlugin?.(track.id, plugin.index)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {pluginPresets?.[plugin.id]?.length ? (
                    <div style={composeStyles(
                      layout.flex.container('col'),
                      spacing.gap(1),
                      spacing.px(2),
                      spacing.py(2),
                      effects.border.radius.lg,
                      {
                        border: '1px solid rgba(102, 140, 198, 0.6)',
                        background: 'rgba(5,12,24,0.9)',
                      }
                    )}>
                      <div style={composeStyles(
                        layout.flex.container('row'),
                        layout.flex.align.center,
                        layout.flex.justify.between,
                        typography.transform('uppercase'),
                        typography.tracking.widest,
                        {
                          fontSize: '0.6875rem', // 11px minimum
                          color: 'rgba(230, 240, 255, 0.55)',
                        }
                      )}>
                        <span>Captures</span>
                        <button
                          style={composeStyles(
                            transitions.transition.standard('color', 200, 'ease-out'),
                            {
                              color: 'rgba(230, 240, 255, 0.45)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                            }
                          )}
                          onClick={() => setPresetEditor(plugin.id)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'rgba(165, 243, 252, 1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(230, 240, 255, 0.45)';
                          }}
                        >
                          + Capture
                        </button>
                      </div>
                      <div style={composeStyles(
                        layout.flex.container('col'),
                        spacing.gap(1)
                      )}>
                        {pluginPresets[plugin.id]!.map((preset) => {
                          const label = preset.label || "Preset";
                          const displayLabel =
                            label.length > 16 ? `${label.slice(0, 16)}…` : label;
                          return (
                            <div
                              key={`${plugin.id}-${preset.id}`}
                              style={composeStyles(
                                layout.flex.container('row'),
                                layout.flex.align.center,
                                layout.flex.justify.between,
                                spacing.gap(1)
                              )}
                            >
                              <button
                                style={composeStyles(
                                  { flex: 1 },
                                  spacing.px(2),
                                  spacing.py(1),
                                  effects.border.radius.md,
                                  typography.transform('uppercase'),
                                  typography.tracking.widest,
                                  transitions.transition.standard('all', 200, 'ease-out'),
                                  {
                                    border: '1px solid rgba(102, 140, 198, 0.8)',
                                    background: 'rgba(4,10,20,0.85)',
                                    fontSize: '0.6875rem', // 11px minimum
                                    color: 'rgba(230, 240, 255, 0.7)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                  }
                                )}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handlePresetRecall(plugin.id, preset.id);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(12,24,46,0.68)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(4,10,20,0.85)';
                                }}
                              >
                                {displayLabel}
                              </button>
                              <button
                                style={composeStyles(
                                  spacing.px(1.5),
                                  spacing.py(0.5),
                                  effects.border.radius.md,
                                  transitions.transition.standard('color', 200, 'ease-out'),
                                  {
                                    fontSize: '0.6875rem', // 11px minimum
                                    color: 'rgba(230, 240, 255, 0.5)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }
                                )}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handlePresetDelete(plugin.id, preset.id);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = 'rgba(252, 165, 165, 1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'rgba(230, 240, 255, 0.5)';
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
            <div style={composeStyles(
              typography.transform('uppercase'),
              typography.tracking.widest,
              typography.align('center'),
              spacing.py(2),
              {
                fontSize: '0.48rem',
                color: 'rgba(230, 240, 255, 0.5)',
              }
            )}>
              No modules loaded
            </div>
          )}
        </ActionPulseContainer>

        {presetFeedback && (
          <div style={composeStyles(
            spacing.px(3),
            spacing.py(2),
            effects.border.radius.xl,
            typography.align('center'),
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              border: '1px solid rgba(102, 140, 198, 0.6)',
              background: 'rgba(6,14,28,0.74)',
              fontSize: '0.42rem',
              color: 'rgba(110, 231, 183, 0.8)',
            }
          )}>
            {presetFeedback}
          </div>
        )}

        {presetEditor && (
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            spacing.gap(2),
            spacing.px(3),
            spacing.py(2),
            effects.border.radius.xl,
            {
              border: '1px solid rgba(16, 185, 129, 0.6)',
              background: 'rgba(6,20,32,0.9)',
            }
          )}>
            <input
              value={presetLabel}
              onChange={(event) => setPresetLabel(event.target.value)}
              style={composeStyles(
                { flex: 1 },
                spacing.px(2),
                spacing.py(1),
                effects.border.radius.lg,
                typography.transform('uppercase'),
                typography.tracking.widest,
                transitions.transition.standard('outline', 200, 'ease-out'),
                {
                  border: '1px solid rgba(16, 185, 129, 0.6)',
                  background: 'transparent',
                  fontSize: '0.48rem',
                  color: 'rgba(167, 243, 208, 1)',
                  outline: 'none',
                }
              )}
              placeholder="Label capture"
              onClick={(event) => event.stopPropagation()}
            />
            <button
              style={composeStyles(
                spacing.px(3),
                spacing.py(1),
                effects.border.radius.full,
                typography.transform('uppercase'),
                typography.tracking.widest,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  border: '1px solid rgba(110, 231, 183, 0.7)',
                  background: 'transparent',
                  fontSize: '0.6875rem', // 11px minimum
                  color: 'rgba(167, 243, 208, 1)',
                  cursor: 'pointer',
                }
              )}
              onClick={(event) => {
                event.stopPropagation();
                handlePresetCapture(presetEditor);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Save
            </button>
            <button
              style={composeStyles(
                spacing.px(3),
                spacing.py(1),
                effects.border.radius.full,
                typography.transform('uppercase'),
                typography.tracking.widest,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  border: '1px solid rgba(110, 231, 183, 0.4)',
                  background: 'transparent',
                  fontSize: '0.6875rem', // 11px minimum
                  color: 'rgba(167, 243, 208, 0.6)',
                  cursor: 'pointer',
                }
              )}
              onClick={(event) => {
                event.stopPropagation();
                setPresetEditor(null);
                setPresetLabel("");
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
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
            style={composeStyles(
              spacing.px(3),
              spacing.py(2),
              effects.border.radius.xl,
              typography.transform('uppercase'),
              typography.tracking.widest,
              transitions.transition.standard('all', 200, 'ease-out'),
              {
                border: '1px solid rgba(102, 140, 198, 0.45)',
                background: 'rgba(12,24,46,0.68)',
                fontSize: '0.48rem',
                color: '#e6f0ff',
                cursor: 'pointer',
              }
            )}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(9,18,36,0.82)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(12,24,46,0.68)';
            }}
          >
            Open module browser
          </button>
        )}
      </div>
    );

    const renderRoutingSurface = () => (
      <div style={composeStyles(
        layout.flex.container('col'),
        { flex: 1 },
        spacing.gap(2),
        { color: '#e6f0ff' }
      )}>
        <div style={composeStyles(
          spacing.px(3),
          spacing.py(2),
          effects.border.radius.xl,
          {
            border: '1px solid rgba(102, 140, 198, 0.45)',
            background: 'rgba(9,18,36,0.75)',
          }
        )}>
          <div style={composeStyles(
            spacing.mb(2),
            layout.flex.container('row'),
            layout.flex.align.center,
            layout.flex.justify.between
          )}>
            <span style={composeStyles(
              typography.transform('uppercase'),
              typography.tracking.widest,
              {
                fontSize: '0.48rem',
                color: 'rgba(230, 240, 255, 0.65)',
              }
            )}>
              Send matrix
            </span>
            <span style={composeStyles(
              typography.transform('uppercase'),
              typography.tracking.widest,
              {
                fontSize: '0.45rem',
                color: 'rgba(230, 240, 255, 0.45)',
              }
            )}>
              Live
            </span>
          </div>
          <div style={composeStyles(
            layout.flex.container('col'),
            spacing.gap(1)
          )}>
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
              <div style={composeStyles(
                spacing.px(2),
                spacing.py(2),
                effects.border.radius.lg,
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  border: '1px solid rgba(102, 140, 198, 0.6)',
                  background: 'rgba(6,14,28,0.78)',
                  fontSize: '0.6875rem', // 11px minimum
                  color: 'rgba(230, 240, 255, 0.5)',
                }
              )}>
                No sends configured
              </div>
            )}
          </div>
        </div>

        <div style={composeStyles(
          spacing.px(3),
          spacing.py(2),
          effects.border.radius.xl,
          {
            border: '1px solid rgba(102, 140, 198, 0.45)',
            background: 'rgba(9,18,36,0.75)',
          }
        )}>
          <div style={composeStyles(
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              fontSize: '0.48rem',
              color: 'rgba(230, 240, 255, 0.65)',
            }
          )}>
            Bus palette
          </div>
          <div style={composeStyles(
            spacing.mt(2),
            layout.flex.container('row'),
            layout.flex.wrap.wrap,
            spacing.gap(1.5)
          )}>
            {(availableSends ?? []).map((send) => (
              <span
                key={`preview-${send.id}`}
                style={composeStyles(
                  spacing.px(2),
                  spacing.py(0.5),
                  effects.border.radius.full,
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    border: '1px solid rgba(102, 140, 198, 0.7)',
                    background: 'rgba(6,14,28,0.82)',
                    fontSize: '0.6875rem', // 11px minimum
                    color: 'rgba(230, 240, 255, 0.7)',
                    boxShadow: `0 0 8px ${hexToRgba(send.glow, 0.25)}`,
                  }
                )}
              >
                {send.name}
              </span>
            ))}
            {!availableSends?.length && (
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.6875rem', // 11px minimum
                  color: 'rgba(230, 240, 255, 0.45)',
                }
              )}>
                No buses exposed
              </span>
            )}
          </div>
        </div>

        <div style={composeStyles(
          spacing.px(3),
          spacing.py(2),
          effects.border.radius.xl,
          {
            border: '1px solid rgba(102, 140, 198, 0.45)',
            background: 'rgba(9,18,36,0.75)',
          }
        )}>
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            layout.flex.justify.between
          )}>
            <span style={composeStyles(
              typography.transform('uppercase'),
              typography.tracking.widest,
              {
                fontSize: '0.48rem',
                color: 'rgba(230, 240, 255, 0.65)',
              }
            )}>
              Sidechain sources
            </span>
            <span style={composeStyles(
              typography.transform('uppercase'),
              typography.tracking.widest,
              {
                fontSize: '0.45rem',
                color: 'rgba(230, 240, 255, 0.45)',
              }
            )}>
              {sidechainSources.length}
            </span>
          </div>
          <div style={composeStyles(
            spacing.mt(2),
            layout.flex.container('col'),
            spacing.gap(1)
          )}>
            {sidechainSources.length ? (
              sidechainSources.map((name) => (
                <span
                  key={`sidechain-${name}`}
                  style={composeStyles(
                    spacing.px(2),
                    spacing.py(1),
                    effects.border.radius.lg,
                    typography.transform('uppercase'),
                    typography.tracking.widest,
                    {
                      border: '1px solid rgba(102, 140, 198, 0.7)',
                      background: 'rgba(6,14,28,0.85)',
                      fontSize: '0.6875rem', // 11px minimum
                      color: 'rgba(230, 240, 255, 0.7)',
                    }
                  )}
                >
                  {name}
                </span>
              ))
            ) : (
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.6875rem', // 11px minimum
                  color: 'rgba(230, 240, 255, 0.45)',
                }
              )}>
                No sidechain sources detected
              </span>
            )}
          </div>
        </div>
      </div>
    );

    const renderAutomationSurface = () => {
      return (
        <div style={composeStyles(
          layout.flex.container('col'),
          { flex: 1 },
          spacing.gap(2),
          { color: '#e6f0ff' }
        )}>
          <div style={composeStyles(
            spacing.px(3),
            spacing.py(3),
            effects.border.radius.xl,
            {
              border: '1px solid rgba(102, 140, 198, 0.45)',
              background: 'rgba(9,18,36,0.75)',
            }
          )}>
            <div style={composeStyles(
              layout.flex.container('row'),
              layout.flex.align.center,
              layout.flex.justify.between
            )}>
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.48rem',
                  color: 'rgba(230, 240, 255, 0.65)',
                }
              )}>
                ALS automation
              </span>
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.48rem',
                  color: automationActive ? 'rgba(110, 231, 183, 1)' : 'rgba(230, 240, 255, 0.5)',
                }
              )}>
                {automationActive ? "Active" : "Idle"}
              </span>
            </div>
            <div style={composeStyles(
              spacing.mt(2),
              layout.flex.container('row'),
              layout.flex.wrap.wrap,
              spacing.gap(1.5)
            )}>
              {automationTargets.length ? (
                automationTargets.map((target) => (
                  <span
                    key={`automation-${target}`}
                    style={composeStyles(
                      spacing.px(2),
                      spacing.py(0.5),
                      effects.border.radius.full,
                      typography.transform('uppercase'),
                      typography.tracking.widest,
                      {
                        border: '1px solid rgba(102, 140, 198, 0.7)',
                        background: 'rgba(6,14,28,0.82)',
                        fontSize: '0.6875rem', // 11px minimum
                        color: 'rgba(230, 240, 255, 0.7)',
                      }
                    )}
                  >
                    {target}
                  </span>
                ))
              ) : (
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.6875rem', // 11px minimum
                    color: 'rgba(230, 240, 255, 0.45)',
                  }
                )}>
                  No automation passes yet
                </span>
              )}
            </div>
          </div>

          <div style={composeStyles(
            spacing.px(3),
            spacing.py(2),
            effects.border.radius.xl,
            {
              border: '1px solid rgba(102, 140, 198, 0.45)',
              background: 'rgba(9,18,36,0.75)',
            }
          )}>
            <div style={composeStyles(
              layout.flex.container('row'),
              layout.flex.align.center,
              layout.flex.justify.between
            )}>
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.48rem',
                  color: 'rgba(230, 240, 255, 0.65)',
                }
              )}>
                Quick lanes
              </span>
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.6875rem', // 11px minimum
                  color: 'rgba(230, 240, 255, 0.45)',
                }
              )}>
                Sub {(analysis?.rms ?? 0) >= 0.8 ? 'Strong' : (analysis?.rms ?? 0) >= 0.5 ? 'Active' : (analysis?.rms ?? 0) >= 0.2 ? 'Soft' : 'Silent'}
              </span>
            </div>
            <div style={composeStyles(
              spacing.mt(2),
              layout.flex.container('row'),
              layout.flex.wrap.wrap,
              spacing.gap(1.5)
            )}>
              {automationQuickTargets.map(({ fxId, paramName, label }) => {
                const key = `${fxId}:${paramName}`;
                const isActive = automationTargets.includes(key);
                return (
                  <button
                    key={`automation-toggle-${key}`}
                    style={composeStyles(
                      spacing.px(3),
                      spacing.py(1),
                      effects.border.radius.full,
                      typography.transform('uppercase'),
                      typography.tracking.widest,
                      transitions.transition.standard('all', 200, 'ease-out'),
                      {
                        fontSize: '0.6875rem', // 11px minimum
                        border: isActive
                          ? '1px solid rgba(110, 231, 183, 0.7)'
                          : '1px solid rgba(102, 140, 198, 0.45)',
                        background: isActive
                          ? 'rgba(12,48,52,0.7)'
                          : 'transparent',
                        color: isActive
                          ? 'rgba(167, 243, 208, 1)'
                          : 'rgba(230, 240, 255, 0.65)',
                        boxShadow: isActive
                          ? '0 0 14px rgba(74,222,128,0.35)'
                          : 'none',
                        cursor: 'pointer',
                      }
                    )}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleAutomationLaneWithParam?.(track.id, fxId, paramName);
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'rgba(167, 243, 208, 1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'rgba(230, 240, 255, 0.65)';
                      }
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

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

    // Animated entrance and selection
    const entranceStyle = useFlowMotion(
      { opacity: 1, scale: isSelected ? 1.02 : 1 },
      { duration: 300, easing: 'ease-out' }
    );

    return (
      <div
        style={composeStyles(
          layout.position.relative,
          layout.flex.container('col'),
          effects.border.radius.xl,
          effects.backdrop.blur('strong'),
          layout.overflow.hidden,
          transitions.transition.standard('all', 200, 'ease-out'),
          {
            background: 'rgba(9, 18, 36, 0.82)',
            border: isArmed
              ? '1px solid rgba(248, 113, 113, 0.7)'
              : isSelected
              ? '1px solid rgba(103, 232, 249, 0.7)'
              : '1px solid rgba(102, 140, 198, 0.45)',
            boxShadow: isArmed
              ? '0 0 32px rgba(248,113,113,0.5)'
              : isSelected
              ? '0 0 48px rgba(56,189,248,0.45)'
              : '0 22px 70px rgba(4,12,26,0.55)',
            color: '#e6f0ff',
            height: `${stageHeight}px`,
            width: `${MIXER_STRIP_WIDTH}px`,
            minWidth: `${MIXER_STRIP_MIN_WIDTH}px`,
            maxWidth: `${MIXER_STRIP_MAX_WIDTH}px`,
            opacity: entranceStyle.opacity,
            transform: `scale(${entranceStyle.scale})`,
            cursor: 'pointer',
          }
        )}
        onClick={() => onSelectTrack(track.id)}
      >
        <div style={composeStyles(
          layout.position.relative,
          { flexShrink: 0, height: '72px' },
          effects.border.bottom(),
          {
            borderBottom: '1px solid rgba(102, 140, 198, 0.7)',
          }
        )}>
          <PulsingChannelBackground
            channelColor={channelColor}
            channelGlow={channelGlow}
            intensity={intensity}
          />

          <div style={composeStyles(
            layout.position.relative,
            { zIndex: 10 },
            spacing.px(2),
            spacing.pt(2),
            layout.flex.container('col'),
            spacing.gap(1),
            { color: '#e6f0ff' }
          )}>
            {isRenaming ? (
              <input
                type="text"
                value={editedName}
                onChange={(event) => setEditedName(event.target.value)}
                onBlur={handleRename}
                onKeyDown={(event) => event.key === "Enter" && handleRename()}
                style={composeStyles(
                  layout.width.full,
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  transitions.transition.standard('border-color', 200, 'ease-out'),
                  {
                    fontSize: '0.55rem',
                    background: 'transparent',
                    borderBottom: '1px solid rgba(103, 232, 249, 0.4)',
                    color: '#e6f0ff',
                    outline: 'none',
                  }
                )}
                onFocus={(e) => {
                  e.currentTarget.style.borderBottomColor = 'rgba(103, 232, 249, 0.7)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderBottomColor = 'rgba(103, 232, 249, 0.4)';
                }}
                autoFocus
                onClick={(event) => event.stopPropagation()}
                aria-label="Track name"
              />
            ) : (
              <div
                style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.55rem',
                    color: '#e6f0ff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    textShadow: `0 0 10px ${hexToRgba(channelGlow, 0.6)}`,
                  }
                )}
                onDoubleClick={() => setIsRenaming(true)}
                onClick={(event) => event.stopPropagation()}
              >
                {track.trackName}
              </div>
            )}
            <div style={composeStyles(
              layout.flex.container('row'),
              layout.flex.align.center,
              layout.flex.justify.between
            )}>
              <div style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.6875rem', // 11px minimum
                  color: 'rgba(230, 240, 255, 0.6)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }
              )}>
                {track.group}
              </div>
              <div style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                spacing.gap(1)
              )}>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onMixerChange(track.id, "isMuted", !settings.isMuted);
                  }}
                  style={composeStyles(
                    layout.flex.container('row'),
                    layout.flex.align.center,
                    layout.flex.justify.center,
                    effects.border.radius.full,
                    transitions.transition.standard('all', 200, 'ease-out'),
                    {
                      width: '24px',
                      height: '24px',
                      background: settings.isMuted
                        ? 'rgba(239, 68, 68, 0.8)'
                        : 'rgba(16,50,95,0.55)',
                      color: settings.isMuted ? '#ffffff' : '#e6f0ff',
                      cursor: 'pointer',
                    }
                  )}
                  onMouseEnter={(e) => {
                    if (!settings.isMuted) {
                      e.currentTarget.style.background = 'rgba(22,64,122,0.7)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!settings.isMuted) {
                      e.currentTarget.style.background = 'rgba(16,50,95,0.55)';
                    }
                  }}
                  aria-label={settings.isMuted ? "Unmute channel" : "Mute channel"}
                  title={settings.isMuted ? "Unmute channel" : "Mute channel"}
                >
                  <MuteIcon style={{ width: '14px', height: '14px' }} />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleSolo(track.id);
                  }}
                  style={composeStyles(
                    layout.flex.container('row'),
                    layout.flex.align.center,
                    layout.flex.justify.center,
                    effects.border.radius.full,
                    transitions.transition.standard('all', 200, 'ease-out'),
                    {
                      width: '24px',
                      height: '24px',
                      background: isSoloed
                        ? 'rgba(252, 211, 77, 0.8)'
                        : 'rgba(16,50,95,0.55)',
                      color: '#e6f0ff',
                      cursor: 'pointer',
                    }
                  )}
                  onMouseEnter={(e) => {
                    if (!isSoloed) {
                      e.currentTarget.style.background = 'rgba(22,64,122,0.7)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSoloed) {
                      e.currentTarget.style.background = 'rgba(16,50,95,0.55)';
                    }
                  }}
                  aria-label={isSoloed ? "Unsolo channel" : "Solo channel"}
                  title={isSoloed ? "Unsolo channel" : "Solo channel"}
                >
                  <SoloIcon style={{ width: '14px', height: '14px' }} />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleArm(track.id);
                  }}
                  style={composeStyles(
                    layout.flex.container('row'),
                    layout.flex.align.center,
                    layout.flex.justify.center,
                    effects.border.radius.full,
                    transitions.transition.standard('all', 200, 'ease-out'),
                    {
                      width: '24px',
                      height: '24px',
                      background: isArmed
                        ? 'rgba(239, 68, 68, 1)'
                        : 'rgba(16,50,95,0.55)',
                      color: isArmed ? '#ffffff' : 'rgba(230, 240, 255, 0.8)',
                      cursor: 'pointer',
                    }
                  )}
                  onMouseEnter={(e) => {
                    if (!isArmed) {
                      e.currentTarget.style.background = 'rgba(22,64,122,0.7)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isArmed) {
                      e.currentTarget.style.background = 'rgba(16,50,95,0.55)';
                    }
                  }}
                  aria-label={isArmed ? "Disarm recording" : "Arm for recording"}
                  title={isArmed ? "Disarm recording" : "Arm for recording"}
                >
                  <ArmIcon style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={composeStyles(
          layout.flex.container('col'),
          { flex: 1 },
          spacing.gap(3),
          spacing.px(2),
          spacing.py(3)
        )}>
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            layout.flex.justify.between,
            spacing.gap(2)
          )}>
            <div style={composeStyles(
              layout.flex.container('row'),
              layout.flex.wrap.wrap,
              spacing.gap(1.5)
            )}>
              {CHANNEL_MODE_DEFINITIONS.map(({ id, label }) => {
                const isActive = mode === id;
                return (
                  <button
                    key={id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setMode(id);
                    }}
                    style={composeStyles(
                      spacing.px(3),
                      spacing.py(1),
                      effects.border.radius.full,
                      typography.transform('uppercase'),
                      typography.tracking.widest,
                      transitions.transition.standard('all', 200, 'ease-out'),
                      {
                        fontSize: '0.48rem',
                        border: isActive
                          ? '1px solid rgba(103, 232, 249, 0.8)'
                          : '1px solid rgba(102, 140, 198, 0.45)',
                        background: isActive
                          ? 'rgba(16,50,95,0.7)'
                          : 'transparent',
                        color: isActive
                          ? 'rgba(207, 250, 254, 1)'
                          : 'rgba(230, 240, 255, 0.65)',
                        boxShadow: isActive
                          ? '0 0 16px rgba(56,189,248,0.35)'
                          : 'none',
                        cursor: 'pointer',
                      }
                    )}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'rgba(207, 250, 254, 1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'rgba(230, 240, 255, 0.65)';
                      }
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.96)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {actionMessage && (
              <span
                style={composeStyles(
                  spacing.px(3),
                  spacing.py(1),
                  effects.border.radius.full,
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    border: '1px solid rgba(103, 232, 249, 0.6)',
                    background: 'rgba(6,18,34,0.85)',
                    fontSize: '0.6875rem', // 11px minimum
                    color: 'rgba(207, 250, 254, 1)',
                  }
                )}
              >
                {actionMessage}
              </span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {renderModeSurface()}
          </div>
        </div>
      </div>
    );
  }
);

FlowChannelStrip.displayName = "FlowChannelStrip";

export default FlowChannelStrip;


