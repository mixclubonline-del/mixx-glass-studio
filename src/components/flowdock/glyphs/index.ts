import { PlayIcon } from "./PlayIcon";
import { StopIcon } from "./StopIcon";
import { RecordIcon } from "./RecordIcon";
import { AddTrackIcon } from "./AddTrackIcon";
import { TrimIcon } from "./TrimIcon";
import { SplitIcon } from "./SplitIcon";
import { TimeStretchIcon } from "./TimeStretchIcon";
import { UndoIcon } from "./UndoIcon";
import { RedoIcon } from "./RedoIcon";
import { PanIcon } from "./PanIcon";
import { InsertsIcon } from "./InsertsIcon";
import { RoutingIcon } from "./RoutingIcon";
import { AutomationIcon } from "./AutomationIcon";
import { QuantizeIcon } from "./QuantizeIcon";
import { ScaleLockIcon } from "./ScaleLockIcon";
import { SoloIcon } from "./SoloIcon";
import { MuteIcon } from "./MuteIcon";
import { ArmIcon } from "./ArmIcon";
import { ZoomInIcon } from "./ZoomInIcon";
import { ZoomOutIcon } from "./ZoomOutIcon";
import { FitIcon } from "./FitIcon";
import { FitSelectionIcon } from "./FitSelectionIcon";
import { LoopIcon } from "./LoopIcon";
import { MarkerPrevIcon } from "./MarkerPrevIcon";
import { MarkerNextIcon } from "./MarkerNextIcon";
import { NudgeLeftIcon } from "./NudgeLeftIcon";
import { NudgeRightIcon } from "./NudgeRightIcon";
import { GainLineIcon } from "./GainLineIcon";
import { WarpIcon } from "./WarpIcon";
import { ConsolidateIcon } from "./ConsolidateIcon";
import { ScrollModeIcon } from "./ScrollModeIcon";
import { MiniMapIcon } from "./MiniMapIcon";
import { InputMonitorIcon } from "./InputMonitorIcon";
import { CountInIcon } from "./CountInIcon";
import { PunchInIcon } from "./PunchInIcon";
import { PunchOutIcon } from "./PunchOutIcon";
import { AutoPunchIcon } from "./AutoPunchIcon";
import { HushMeterIcon } from "./HushMeterIcon";
import { TakeListIcon } from "./TakeListIcon";
import { BrowseSoundsIcon } from "./BrowseSoundsIcon";
import { AddMidiPatternIcon } from "./AddMidiPatternIcon";
import { HarmonyToolsIcon } from "./HarmonyToolsIcon";
import { ChordPaletteIcon } from "./ChordPaletteIcon";
import { SectionsIcon } from "./SectionsIcon";
import { RepeatRateIcon } from "./RepeatRateIcon";
import { ArpIcon } from "./ArpIcon";
import { ChordMemoryIcon } from "./ChordMemoryIcon";
import { PadLayerIcon } from "./PadLayerIcon";
import { PerformanceSettingsIcon } from "./PerformanceSettingsIcon";
import { MasterMeterIcon } from "./MasterMeterIcon";
import { SendsIcon } from "./SendsIcon";
import { PrimeBrainIcon } from "./PrimeBrainIcon";
import { BloomIcon } from "./BloomIcon";

export const GLYPH_MAP = {
  // Core transport
  play: PlayIcon,
  stop: StopIcon,
  record: RecordIcon,
  
  // Track & clip management
  addTrack: AddTrackIcon,
  addInstrument: AddTrackIcon,
  
  // Editing tools
  trim: TrimIcon,
  split: SplitIcon,
  timeStretch: TimeStretchIcon,
  gainLine: GainLineIcon,
  warp: WarpIcon,
  nudgeLeft: NudgeLeftIcon,
  nudgeRight: NudgeRightIcon,
  consolidate: ConsolidateIcon,
  
  // History
  undo: UndoIcon,
  redo: RedoIcon,
  
  // Mixing
  pan: PanIcon,
  inserts: InsertsIcon,
  routing: RoutingIcon,
  sends: SendsIcon,
  automation: AutomationIcon,
  solo: SoloIcon,
  mute: MuteIcon,
  arm: ArmIcon,
  masterMeter: MasterMeterIcon,
  
  // Performance
  quantize: QuantizeIcon,
  scaleLock: ScaleLockIcon,
  repeatRate: RepeatRateIcon,
  arp: ArpIcon,
  chordMemory: ChordMemoryIcon,
  padLayer: PadLayerIcon,
  performanceSettings: PerformanceSettingsIcon,
  
  // Navigation
  zoomOut: ZoomOutIcon,
  zoomIn: ZoomInIcon,
  fit: FitIcon,
  fitSelection: FitSelectionIcon,
  scrollMode: ScrollModeIcon,
  markerPrev: MarkerPrevIcon,
  markerNext: MarkerNextIcon,
  loopRegion: LoopIcon,
  miniMap: MiniMapIcon,
  
  // Recording
  inputMonitor: InputMonitorIcon,
  countIn: CountInIcon,
  punchIn: PunchInIcon,
  punchOut: PunchOutIcon,
  autoPunch: AutoPunchIcon,
  hushMeter: HushMeterIcon,
  takeList: TakeListIcon,
  
  // Composition
  browseSounds: BrowseSoundsIcon,
  addMidiPattern: AddMidiPatternIcon,
  harmonyTools: HarmonyToolsIcon,
  chordPalette: ChordPaletteIcon,
  sections: SectionsIcon,
  
  // Meta
  primeBrain: PrimeBrainIcon,
  bloom: BloomIcon,
};

