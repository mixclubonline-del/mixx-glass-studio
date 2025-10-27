import { useState, useEffect, useRef } from "react";
import { AudioEngine } from "@/audio/AudioEngine";
import {
  TopMenuBar,
  ViewContainer,
  AdvancedTimelineView,
  NextGenMixerView,
  MeteringDashboard,
  WaveformEditor,
  ViewSwitcher,
  TransportControls,
  AIAssistantPanel
} from "@/studio/components";
import { PluginBrowser } from "@/studio/components/Plugins/PluginBrowser";
import { PluginWindowManager } from "@/studio/components/Plugins/PluginWindowManager";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useViewStore } from "@/store/viewStore";
import { useTimelineStore } from "@/store/timelineStore";
import { useTracksStore } from "@/store/tracksStore";
import { useMixerStore } from "@/store/mixerStore";
import { Bot, Upload } from "lucide-react";
import type { TimelineTrack, Region } from "@/types/timeline";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AudioAnalyzer } from "@/audio/analysis/AudioAnalyzer";
import { MixxAmbientOverlay } from "@/components/MixxAmbientOverlay";
import { BeastModeAmbient } from "@/components/BeastModeAmbient";
import { primeBrain } from "@/ai/primeBrain";
import { predictionEngine } from "@/ai/predictionEngine";
import { beastModeEngine } from "@/services/BeastModeEngine";
import { useBeastModeStore } from "@/store/beastModeStore";
import { BeastModePanel } from "@/studio/components/AI/BeastModePanel";
import { AISuggestionsPanel } from "@/studio/components/AI/AISuggestionsPanel";

const TRACK_HEADER_WIDTH = 220;
const DEFAULT_TRACK_HEIGHT = 100;
const DEFAULT_INSERT_SLOTS = 8;

type TrackHeaderProps = {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
  recordArmed?: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  onMute: (id: string) => void;
  onSolo: (id: string) => void;
  onRecordArm: (id: string) => void;
  onRemove?: (id: string) => void;
};

function TrackHeader({
  id,
  name,
  color,
  muted,
  solo,
  recordArmed,
  selected,
  onSelect,
  onMute,
  onSolo,
  onRecordArm,
  onRemove,
}: TrackHeaderProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 border-b border-border/30 cursor-pointer ${selected ? "bg-primary/10" : "bg-background/60 hover:bg-background/80"}`}
      onClick={() => onSelect(id)}
      style={{ height: DEFAULT_TRACK_HEIGHT }}
    >
      <div
        className="w-2 h-8 rounded"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wide opacity-70">Track</div>
        <div className="text-sm font-medium truncate">{name}</div>
      </div>
      <div className="flex items-center gap-1">
        <button
          className={`text-[11px] px-2 py-1 rounded border ${solo ? "bg-amber-500/30 border-amber-500" : "border-border/40 hover:bg-background"}`}
          title="Solo"
          onClick={(e) => { e.stopPropagation(); onSolo(id); }}
        >S</button>
        <button
          className={`text-[11px] px-2 py-1 rounded border ${muted ? "bg-slate-600/40 border-slate-400" : "border-border/40 hover:bg-background"}`}
          title="Mute"
          onClick={(e) => { e.stopPropagation(); onMute(id); }}
        >M</button>
        <button
          className={`text-[11px] px-2 py-1 rounded border ${recordArmed ? "bg-red-600/40 border-red-500" : "border-border/40 hover:bg-background"}`}
          title="Record Arm"
          onClick={(e) => { e.stopPropagation(); onRecordArm(id); }}
        >R</button>
        {onRemove && (
          <button
            className="text-[11px] px-2 py-1 rounded border border-border/40 hover:bg-destructive/10"
            title="Remove Track"
            onClick={(e) => { e.stopPropagation(); onRemove(id); }}
          >✕</button>
        )}
      </div>
    </div>
  );
}

const Index = () => {
  const engineRef = useRef<AudioEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerRailRef = useRef<HTMLDivElement>(null);
  const [audioBuffers, setAudioBuffers] = useState<Map<string, AudioBuffer>>(new Map());
  const [isExporting, setIsExporting] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [pluginBrowserOpen, setPluginBrowserOpen] = useState(false);
  const [selectedTrackForPlugin, setSelectedTrackForPlugin] = useState<string | null>(null);
  const [selectedSlotForPlugin, setSelectedSlotForPlugin] = useState<number>(1);
  const [openPluginWindows, setOpenPluginWindows] = useState<Map<string, { trackId: string; slotNumber: number; pluginId: string }>>(new Map());
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [transportFloating, setTransportFloating] = useState(false);
  const [transportCollapsed, setTransportCollapsed] = useState(false);
  const [transportCovered, setTransportCovered] = useState(false);
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const [detectedKey, setDetectedKey] = useState<string | null>(null);
  const { toast } = useToast();

  // Global stores
  const { currentView, isPanelOpen, togglePanel } = useViewStore();
 