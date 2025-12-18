import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { PlayIcon, PauseIcon, RewindIcon, FastForwardIcon, LoopIcon, HushIcon, SaveIcon, LoadIcon, SlidersIcon, BloomModuleIcon, MixerIcon, SparklesIcon, ArrangeViewIcon, PianoIcon, EditSurfaceIcon, SamplerIcon, SquaresPlusIcon, PlusCircleIcon, SplitIcon, MergeIcon, RefreshIcon, BulbIcon, StarIcon } from '../icons';
import { ArrangeClip, ClipId } from '../../hooks/useArrange';
import PluginBrowser from '../PluginBrowser';
import { FxWindowConfig, FxWindowId } from '../../App';
import type { PluginInventoryItem } from '../../audio/pluginTypes';
import { hexToRgba, ALSActionPulse } from '../../utils/ALS';
import { AuraColors, AuraEffects, AuraPalette, AuraGradients, auraAlpha } from '../../theme/aura-tokens';
import type { PulsePalette } from '../../utils/ALS';
import type { BloomActionMeta, BloomContext } from '../../types/bloom';
import { getSeekBehavior } from '../transport/contextualTransportItems';
import type { PrimeBrainStatus } from '../../types/primeBrainStatus';
import type { TranslationProfileKey, TranslationProfileInfo, CalibrationPreset } from '../../audio/TranslationMatrix';
import type { IngestJobSnapshot } from '../../ingest/IngestQueueManager';
import { detectIntent, getALSGlowState, getPrimeBrainState, formatGuidanceForDock, setGhostLayer, updateGhostLayer, getGhostLayer } from '../../core/flowdock';
import { applyModeOverride } from '../../core/flowdock/modePriority';
import type { DockMode } from '../../core/flowdock/types';
import { PrimeBrainIcon } from '../flowdock/glyphs/PrimeBrainIcon';
import { FlowDockDebug } from '../dock/debug/FlowDockDebug';
import { FlowPulseGraph } from '../dock/debug/FlowPulseGraph';
import { ALSEventLog } from '../dock/debug/ALSEventLog';
import { ALSSyncMonitor } from '../dock/debug/ALSSyncMonitor';
import { ProfessionalTransport } from '../transport/ProfessionalTransport';
import './ArrangeBloomStrip.css';
import './BloomDock.css';

type ImportProgressLike = {
    id: string;
    label: string;
    percent: number;
    type: string;
    color?: string;
    parentId?: string;
};

type TransportPulseType = 'play' | 'pause' | 'rewind' | 'forward' | 'loop' | 'record';

const MasterWaveform: React.FC<{ waveform: Uint8Array, color: string }> = ({ waveform, color }) => {
    const pathData = waveform.reduce((d, value, index) => {
        const x = (index / (waveform.length - 1)) * 100;
        const y = 50 + ((value - 128) / 128) * 45;
        return d + (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
                <filter id="core-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                    <feFlood floodColor={color} result="flood" />
                    <feComposite in="flood" in2="blur" operator="in" result="glow" />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <path d={pathData} stroke={color} strokeWidth="1" fill="none" style={{ filter: 'url(#core-glow-filter)', transition: 'd 16ms linear' }}/>
        </svg>
    );
};

type DockViewMode = 'arrange' | 'sampler' | 'mixer' | 'piano';

const VIEW_ORDER: DockViewMode[] = ['arrange', 'mixer', 'sampler', 'piano'];

const VIEW_META: Record<DockViewMode, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    arrange: { label: 'Arrange View', icon: ArrangeViewIcon },
    sampler: { label: 'Sampler View', icon: SamplerIcon },
    mixer: { label: 'Mix View', icon: MixerIcon },
    piano: { label: 'Piano Roll', icon: PianoIcon },
};

const ViewToggle: React.FC<{
    mode: DockViewMode;
    accent: string;
    onSwitch: (next: DockViewMode) => void;
    availableModes?: Partial<Record<DockViewMode, boolean>>;
}> = ({ mode, accent, onSwitch, availableModes }) => {
    const isModeAvailable = useCallback(
        (candidate: DockViewMode) => (availableModes?.[candidate] ?? true),
        [availableModes]
    );

    const currentIndex = VIEW_ORDER.indexOf(mode);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;

    let nextMode: DockViewMode = mode;
    for (let offset = 1; offset <= VIEW_ORDER.length; offset += 1) {
        const candidate = VIEW_ORDER[(safeIndex + offset) % VIEW_ORDER.length];
        if (isModeAvailable(candidate)) {
            nextMode = candidate;
            break;
        }
    }

    const isDisabled = nextMode === mode;
    const currentMeta = VIEW_META[mode] ?? VIEW_META.arrange;
    const nextMeta = VIEW_META[nextMode] ?? VIEW_META.arrange;
    const { label: currentLabel, icon: CurrentIcon } = currentMeta;

    return (
        <button
            type="button"
            onClick={() => {
                if (!isDisabled) {
                    onSwitch(nextMode);
                }
            }}
            disabled={isDisabled}
            className={`bloom-dock-view-toggle group ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            aria-label={
                isDisabled
                    ? `${currentLabel} view`
                    : `Switch to ${nextMeta.label}`
            }
            title={
                isDisabled
                    ? `${currentLabel}`
                    : `Switch to ${nextMeta.label}`
            }
        >
            <span className="flex items-center gap-2">
                <CurrentIcon
                    className={`bloom-dock-view-icon ${
                        isDisabled ? 'text-slate-500' : 'text-cyan-200'
                    }`}
                />
                {currentLabel}
            </span>
            {!isDisabled && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                        boxShadow: `0 0 32px ${hexToRgba(accent, 0.45)}`,
                    }}
                />
            )}
        </button>
    );
};

interface BloomDockProps {
    position: { x: number; y: number };
    onPositionChange: (position: { x: number; y: number }) => void;
    alsPulseAgent?: PulsePalette | null;
    isPlaying: boolean;
    isLooping: boolean;
    onPlayPause: () => void;
    onTransportJump: (direction: 'back' | 'forward') => void;
    onTransportNudge: (direction: 'back' | 'forward') => void;
    onToggleLoop: () => void;
    bloomContext?: BloomContext;
    onSeekAction?: (action: string) => void;
    masterAnalysis: { level: number; transient: boolean; waveform: Uint8Array };
    selectedClips: ArrangeClip[];
    onAction: (action: string, payload?: any, meta?: BloomActionMeta) => void;
    isAnyTrackArmed: boolean;
    isHushActive: boolean;
    fxWindows: FxWindowConfig[];
    fxVisibility: Record<FxWindowId, boolean>;
    onToggleFxVisibility: (fxId: FxWindowId) => void;
    selectedTrackId: string | null;
    viewMode: DockViewMode;
    onViewModeChange: (mode: DockViewMode) => void;
    onOpenAIHub: () => void;
    currentTime: number;
    canRecallLastImport: boolean;
    followPlayhead: boolean;
    contextLabel?: string;
    contextAccent?: string;
    recordingOptions: {
        preRoll: boolean;
        countIn: boolean;
        inputMonitor: boolean;
        hushGate: boolean;
    };
    onToggleRecordingOption: (option: 'preRoll' | 'countIn' | 'inputMonitor' | 'hushGate') => void;
    onDropTakeMarker: () => void;
    primeBrainStatus?: PrimeBrainStatus;
    translationProfile?: TranslationProfileKey;
    translationProfiles?: TranslationProfileInfo[];
    calibrationPresets?: CalibrationPreset[];
    activeCalibration?: CalibrationPreset | null;
    onApplyCalibration?: (preset: CalibrationPreset) => void;
    isRecordingActive?: boolean;
    armedTracks?: Set<string>;
    importProgress?: ImportProgressLike[];
    ingestSnapshot?: IngestJobSnapshot | null;
    mixerActionPulse?: { trackId: string; pulse: ALSActionPulse; message: string } | null;
    onBloomAction?: (action: string, payload?: any, meta?: BloomActionMeta) => void;
    onSetTranslationProfile?: (action: string, payload?: any, meta?: BloomActionMeta) => void;
    pluginInventory?: PluginInventoryItem[];
    pluginFavorites?: Record<FxWindowId, boolean>;
    onAddPlugin?: (trackId: string, pluginId: FxWindowId) => void;
    onTogglePluginFavorite?: (pluginId: FxWindowId) => void;
    tracks?: Array<{ id: string; trackName?: string }>;
}

export const BloomDock: React.FC<BloomDockProps> = (props) => {
    const { 
        position,
        onPositionChange,
        alsPulseAgent,
        isPlaying, isLooping, onPlayPause, onTransportJump, onTransportNudge, onToggleLoop,
        bloomContext = 'idle',
        onSeekAction,
        masterAnalysis, selectedClips, onAction, isAnyTrackArmed, isHushActive, fxWindows,
        fxVisibility, onToggleFxVisibility, selectedTrackId,
        viewMode, onViewModeChange, onOpenAIHub,
        currentTime, canRecallLastImport, followPlayhead,
        contextLabel = 'FLOW',
        contextAccent = AuraColors.violet,
        recordingOptions,
        onToggleRecordingOption,
        onDropTakeMarker,
        pluginInventory = [],
        pluginFavorites = {},
        onAddPlugin,
        onTogglePluginFavorite,
        tracks = [],
    } = props;
    
    const containerRef = useRef<HTMLDivElement>(null);
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = useRef(false);
    const cleanupDragListenersRef = useRef<(() => void) | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPluginBrowserOpen, setIsPluginBrowserOpen] = useState(false);
    const [transportPulse, setTransportPulse] = useState<TransportPulseType | null>(null);
    const transportPulseTimeoutRef = useRef<number | null>(null);
    const holdTimeoutRef = useRef<number | null>(null);
    const holdIntervalRef = useRef<number | null>(null);
    const hasHeldRef = useRef(false);
    
    // Flow Dock intent detection
    const [flowMode, setFlowMode] = useState<DockMode>('nav');
    const [prevFlowMode, setPrevFlowMode] = useState<DockMode>('nav');
    const [alsGlow, setAlsGlow] = useState(getALSGlowState());
    const [primeBrain, setPrimeBrain] = useState(getPrimeBrainState());
    const [ghostMode, setGhostMode] = useState(getGhostLayer());

    const clampPosition = useCallback((rawPosition: { x: number; y: number }) => {
        if (typeof window === 'undefined') return rawPosition;
        const padding = 24;
        const node = containerRef.current;
        const width = node?.offsetWidth ?? 420;
        const height = node?.offsetHeight ?? 132;
        const maxX = Math.max(padding, window.innerWidth - width - padding);
        const maxY = Math.max(padding, window.innerHeight - height - padding);
        return {
            x: Math.min(Math.max(padding, rawPosition.x), maxX),
            y: Math.min(Math.max(padding, rawPosition.y), maxY),
        };
    }, []);

    const handleDragPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (cleanupDragListenersRef.current) {
            cleanupDragListenersRef.current();
            cleanupDragListenersRef.current = null;
        }

        pointerStartRef.current = { x: event.clientX, y: event.clientY };
        hasDraggedRef.current = false;

        const rect = containerRef.current?.getBoundingClientRect();
        dragOffsetRef.current = {
            x: event.clientX - (rect?.left ?? position.x),
            y: event.clientY - (rect?.top ?? position.y),
        };

        const handlePointerMove = (pointerEvent: PointerEvent) => {
            pointerEvent.preventDefault();

            if (!hasDraggedRef.current && pointerStartRef.current) {
                const deltaX = Math.abs(pointerEvent.clientX - pointerStartRef.current.x);
                const deltaY = Math.abs(pointerEvent.clientY - pointerStartRef.current.y);
                if (deltaX >= 6 || deltaY >= 6) {
                    hasDraggedRef.current = true;
                    setIsDragging(true);
                } else {
                    return;
                }
            }

            if (!hasDraggedRef.current) {
                return;
            }

            const nextX = pointerEvent.clientX - dragOffsetRef.current.x;
            const nextY = pointerEvent.clientY - dragOffsetRef.current.y;
            const clamped = clampPosition({ x: nextX, y: nextY });
            if (clamped.x !== position.x || clamped.y !== position.y) {
                requestAnimationFrame(() => onPositionChange(clamped));
            }
        };

        const handlePointerUp = (pointerEvent: PointerEvent) => {
            pointerEvent.preventDefault();

            pointerStartRef.current = null;
            hasDraggedRef.current = false;
            setIsDragging(false);

            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            cleanupDragListenersRef.current = null;
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        cleanupDragListenersRef.current = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [clampPosition, onPositionChange, position.x, position.y]);

    useEffect(() => {
        const clamped = clampPosition(position);
        if (clamped.x !== position.x || clamped.y !== position.y) {
            onPositionChange(clamped);
        }
    }, [clampPosition, onPositionChange, position.x, position.y]);

    const pulseGlow = alsPulseAgent?.glow ?? AuraColors.violet;
    const pulseHalo = alsPulseAgent?.halo ?? AuraColors.blue;
    const pulseStrength = alsPulseAgent?.pulseStrength ?? (isPlaying ? 0.6 : 0.35);
    const pulseAccent = alsPulseAgent?.accent ?? AuraColors.blue;
    
    // Enhanced halo with Flow Dock ALS glow
    const enhancedGlowIntensity = Math.max(pulseStrength, alsGlow.glowIntensity);
    const enhancedGlowColor = alsGlow.glowColor || pulseGlow;

    // AURA Philosophy: Tools serve the music, not the other way around
    // Ethereal presence - there when needed, invisible when not
    const haloStyle = useMemo(() => {
        const baseOpacity = isDragging ? 0.5 : 0.25;
        
        return {
            // Ultra-transparent - music shows through
            background: auraAlpha(AuraPalette.violet[900], baseOpacity),
            // Whisper borders
            borderColor: auraAlpha(contextAccent, isDragging ? 0.3 : 0.12),
            borderWidth: '1px',
            borderStyle: 'solid',
            // Subtle ambient glow - presence without dominance
            boxShadow: `
                0 0 ${30 + enhancedGlowIntensity * 20}px ${auraAlpha(contextAccent, 0.08)},
                inset 0 0 30px ${auraAlpha(AuraPalette.violet.DEFAULT, 0.03)}
            `,
        };
    }, [contextAccent, isDragging, enhancedGlowIntensity]);

    // Developer-mode ALS debug payload (reads from global ALS + current dock state)
    const alsDebugState = useMemo(() => {
        if (typeof window === 'undefined') {
            return {
                pulse: 0,
                flow: 0,
                energy: 'steady',
                hush: isHushActive,
                temperature: 'COLD',
                bpm: 0,
                playing: isPlaying,
                phase: 0,
            };
        }
        const als = (window.__als || {}) as any;
        const pulse = (als.pulse ?? 0) / 100;
        const flow = (als.flow ?? 0) / 100;
        const temperatureRaw = String(als.temperature ?? 'cold');
        const temperature = temperatureRaw.toUpperCase();
        let energy: string = 'cold';
        if (temperature === 'HOT' || temperature === 'BLAZING') energy = 'hot';
        else if (temperature === 'WARM' || temperature === 'WARMING' || temperature === 'BALANCED') energy = 'warm';
        const phase = typeof als.phase === 'number' ? als.phase : 0;
        const bpm = typeof als.bpm === 'number' ? als.bpm : 0;
        return {
            pulse,
            flow,
            energy,
            hush: isHushActive,
            temperature,
            bpm,
            playing: isPlaying,
            phase,
        };
    }, [isHushActive, isPlaying]);

    const pulseDebugState = useMemo(
        () => ({
            glowStrength: enhancedGlowIntensity,
        }),
        [enhancedGlowIntensity],
    );

    const clearSeekTimers = useCallback(() => {
        if (holdTimeoutRef.current) {
            window.clearTimeout(holdTimeoutRef.current);
            holdTimeoutRef.current = null;
        }
        if (holdIntervalRef.current) {
            window.clearInterval(holdIntervalRef.current);
            holdIntervalRef.current = null;
        }
        hasHeldRef.current = false;
    }, []);

    const cueTransportPulse = useCallback((type: TransportPulseType) => {
        setTransportPulse(type);
        if (transportPulseTimeoutRef.current) {
            window.clearTimeout(transportPulseTimeoutRef.current);
        }
        transportPulseTimeoutRef.current = window.setTimeout(() => {
            setTransportPulse(null);
            transportPulseTimeoutRef.current = null;
        }, 220);
    }, []);

    // Flow Dock intent detection (75ms polling)
    useEffect(() => {
        const interval = setInterval(() => {
            const detected = detectIntent();
            const finalMode = applyModeOverride(detected);
            
            if (finalMode !== flowMode) {
                setGhostLayer(flowMode);
                setPrevFlowMode(flowMode);
                setFlowMode(finalMode);
            }
        }, 75);

        return () => clearInterval(interval);
    }, [flowMode]);

    // ALS glow sync (60fps)
    useEffect(() => {
        const interval = setInterval(() => {
            setAlsGlow(getALSGlowState());
        }, 16);

        return () => clearInterval(interval);
    }, []);

    // Prime Brain sync
    useEffect(() => {
        const interval = setInterval(() => {
            setPrimeBrain(getPrimeBrainState());
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // Ghost mode animation
    useEffect(() => {
        const interval = setInterval(() => {
            const ghost = updateGhostLayer();
            setGhostMode(ghost);
        }, 16);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        return () => {
            if (cleanupDragListenersRef.current) {
                cleanupDragListenersRef.current();
            }
            clearSeekTimers();
            if (transportPulseTimeoutRef.current) {
                window.clearTimeout(transportPulseTimeoutRef.current);
            }
        };
    }, [clearSeekTimers]);

    const handleSeekPointerDown = useCallback(
        (direction: 'back' | 'forward') => (event: React.PointerEvent<HTMLButtonElement>) => {
            event.preventDefault();
            clearSeekTimers();
            hasHeldRef.current = false;
            holdTimeoutRef.current = window.setTimeout(() => {
                hasHeldRef.current = true;
                onTransportNudge(direction);
                cueTransportPulse(direction === 'back' ? 'rewind' : 'forward');
                holdIntervalRef.current = window.setInterval(() => {
                    onTransportNudge(direction);
                    cueTransportPulse(direction === 'back' ? 'rewind' : 'forward');
                }, 160);
            }, 220);
        },
        [clearSeekTimers, cueTransportPulse, onTransportNudge]
    );

    const handleSeekPointerUp = useCallback(
        (direction: 'back' | 'forward') => (event: React.PointerEvent<HTMLButtonElement>) => {
            event.preventDefault();
            const wasHeld = hasHeldRef.current;
            clearSeekTimers();
            if (!wasHeld) {
                // Contextual seek action - behavior changes based on bloomContext
                const seekBehavior = getSeekBehavior(bloomContext, direction);
                if (onSeekAction) {
                    onSeekAction(seekBehavior.action);
                } else {
                    // Fallback to standard transport jump if no onSeekAction provided
                    onTransportJump(direction);
                }
                cueTransportPulse(direction === 'back' ? 'rewind' : 'forward');
            }
        },
        [bloomContext, clearSeekTimers, cueTransportPulse, onSeekAction, onTransportJump]
    );

    const hasSelection = selectedClips.length > 0;
    const singleSelectedClip = selectedClips.length === 1 ? selectedClips[0] : null;
    const canSplit =
      selectedClips.some(
        (clip) => currentTime > clip.start && currentTime < clip.start + clip.duration
      );
    const canConsolidate = selectedClips.length > 1;
    const canReingest = Boolean(singleSelectedClip?.sourceJobId);
    const canOpenClipEditor = Boolean(singleSelectedClip?.bufferId);
    
    // AURA-styled action button - ghostly, reveals on hover
    const actionButton = (icon: React.ReactNode, action: string, payload?: any, tooltip?: string, disabled?: boolean, variant: 'primary' | 'secondary' = 'secondary') => {
        const isPrimary = variant === 'primary';
        
        return (
            <button
                onClick={() => onAction(action, payload, { source: "bloom-dock" })}
                title={tooltip}
                disabled={disabled}
                className={`bloom-dock-action-btn ${isPrimary ? 'bloom-dock-action-btn-primary' : ''}`}
            >
                {icon}
            </button>
        );
    };

    const clipEditAvailable = canOpenClipEditor;
    const availableViewModes = useMemo(() => ({ edit: clipEditAvailable, sampler: true }), [clipEditAvailable]);

    const arrangeWorkflowCluster = (
        <div className="flex items-center gap-2.5">
            {actionButton(<SquaresPlusIcon className="w-5 h-5 text-emerald-200" />, 'addTrack', undefined, 'Add track')}
            {actionButton(
                <LoadIcon className="w-5 h-5 text-amber-200" />,
                'importAudio',
                undefined,
                'Import audio or stems'
            )}
            {actionButton(
                <SplitIcon className="w-5 h-5 text-sky-200" />,
                'splitSelection',
                { time: currentTime },
                'Split clips at playhead',
                !canSplit
            )}
            {actionButton(
                <MergeIcon className="w-5 h-5 text-purple-200" />,
                'consolidateSelection',
                undefined,
                'Consolidate selection',
                !canConsolidate
            )}
            {actionButton(
                <RefreshIcon className="w-5 h-5 text-cyan-200" />,
                'recallLastImport',
                undefined,
                'Recall last import',
                !canRecallLastImport,
                'primary'
            )}
        </div>
    );

    const editingCluster =
        singleSelectedClip
            ? (
                <div className="flex items-center gap-2.5">
                    {actionButton(
                        <EditSurfaceIcon className="w-5 h-5 text-rose-200" />,
                        'openClipEditor',
                        { clipId: singleSelectedClip?.id },
                        'Open Clip Edit Surface',
                        !clipEditAvailable
                    )}
                    {actionButton(
                        <RefreshIcon className="w-5 h-5 text-amber-200 rotate-180" />,
                        'reingestClip',
                        singleSelectedClip?.id,
                        'Re-ingest source audio',
                        !canReingest
                    )}
                </div>
            )
            : null;

    const recordToggle = (label: string, option: 'preRoll' | 'countIn' | 'inputMonitor', Icon: React.ComponentType<{ className?: string }>, active: boolean) => (
        <button
            onClick={() => onToggleRecordingOption(option)}
            className={`bloom-dock-record-toggle ${active ? 'active' : ''}`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    const recordCluster = isAnyTrackArmed ? (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
                {recordToggle('Pre-Roll', 'preRoll', LoopIcon, recordingOptions.preRoll)}
                {recordToggle('Count-In', 'countIn', SparklesIcon, recordingOptions.countIn)}
                {recordToggle('Monitor', 'inputMonitor', BulbIcon, recordingOptions.inputMonitor)}
                <button
                    onClick={() => {
                        onToggleRecordingOption('hushGate');
                        onAction('toggleHush', undefined, { source: 'bloom-dock' });
                    }}
                    className={`bloom-dock-hush-btn ${isHushActive ? 'active' : ''}`}
                >
                    <HushIcon className="w-4 h-4" />
                    HUSH
                </button>
            </div>
            <div className="flex items-center gap-2.5">
                <button
                    onClick={onDropTakeMarker}
                    className="bloom-dock-take-btn"
                    title="Drop take marker"
                >
                    Drop Take
                </button>
            </div>
        </div>
    ) : null;

    const mixCluster = (
        <div className="flex items-center gap-2.5">
            {actionButton(<SaveIcon className="w-5 h-5" />, 'saveProject', undefined, 'Save project', false, 'primary')}
            {actionButton(<LoadIcon className="w-5 h-5" />, 'loadProject', undefined, 'Load project file')}
            {actionButton(
                <PlusCircleIcon className="w-5 h-5 text-emerald-200" />,
                'importAudio',
                undefined,
                'Import audio or stems'
            )}
            {actionButton(
                <StarIcon className="w-5 h-5 text-amber-200" />,
                'analyzeMaster',
                undefined,
                'Analyze master energy'
            )}
        </div>
    );

    const samplerCluster = (
        <div className="flex items-center gap-2.5">
            {actionButton(
                <SquaresPlusIcon className="w-5 h-5 text-cyan-200" />,
                'triggerSamplerNoteRepeat',
                { mode: 'triplet' },
                'Note repeat modes'
            )}
            {actionButton(
                <SparklesIcon className="w-5 h-5 text-indigo-200" />,
                'openSamplerMacros',
                undefined,
                'Open sampler macros'
            )}
            {actionButton(
                <PlusCircleIcon className="w-5 h-5 text-rose-200" />,
                'captureSamplerPattern',
                undefined,
                'Capture new pattern'
            )}
        </div>
    );

    // Flow Dock adaptive cluster selection based on intent mode
    const leftSegments: React.ReactNode[] = [];
    const isArrangeSurface = viewMode === 'arrange' || viewMode === 'piano';
    
    // Flow Dock mode-based cluster priority
    if (flowMode === 'record' && isAnyTrackArmed) {
        // Record mode: prioritize recording controls
        if (recordCluster) leftSegments.push(recordCluster);
        if (isArrangeSurface) leftSegments.push(arrangeWorkflowCluster);
    } else if (flowMode === 'edit' && singleSelectedClip) {
        // Edit mode: prioritize editing tools
        if (editingCluster) leftSegments.push(editingCluster);
        if (isArrangeSurface) leftSegments.push(arrangeWorkflowCluster);
    } else if (flowMode === 'mix' && viewMode === 'mixer') {
        // Mix mode: prioritize mixer controls
        leftSegments.push(mixCluster);
        if (recordCluster) leftSegments.push(recordCluster);
    } else if (flowMode === 'perform' && viewMode === 'sampler') {
        // Performance mode: prioritize sampler controls
        leftSegments.push(samplerCluster);
        if (recordCluster) leftSegments.push(recordCluster);
    } else {
        // Default: view-based clusters
        if (isArrangeSurface) {
            leftSegments.push(arrangeWorkflowCluster);
            if (editingCluster) {
                leftSegments.push(editingCluster);
            }
            if (recordCluster) {
                leftSegments.push(recordCluster);
            }
        } else if (viewMode === 'sampler') {
            leftSegments.push(samplerCluster);
            if (recordCluster) {
                leftSegments.push(recordCluster);
            }
        } else if (viewMode === 'mixer') {
            leftSegments.push(mixCluster);
            if (recordCluster) {
                leftSegments.push(recordCluster);
            }
        }
    }

    const handlePlayPointerDown = useCallback(
        (event: React.PointerEvent<HTMLButtonElement>) => {
            event.preventDefault();
            clearSeekTimers();
            cueTransportPulse(isPlaying ? 'pause' : 'play');
            onPlayPause();
        },
        [clearSeekTimers, cueTransportPulse, isPlaying, onPlayPause]
    );

    const toggleLoop = useCallback(() => {
        cueTransportPulse('loop');
        onToggleLoop();
    }, [cueTransportPulse, onToggleLoop]);

    useEffect(() => {
        const shouldIgnoreKeyEvent = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) {
                return false;
            }
            if (target.isContentEditable) {
                return true;
            }
            const tag = target.tagName.toLowerCase();
            return tag === 'input' || tag === 'textarea' || tag === 'select';
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (shouldIgnoreKeyEvent(event)) {
                return;
            }
            if (event.code === 'Space') {
                event.preventDefault();
                cueTransportPulse(isPlaying ? 'pause' : 'play');
                onPlayPause();
            } else if (event.code === 'ArrowLeft') {
                event.preventDefault();
                onTransportNudge('back');
                cueTransportPulse('rewind');
            } else if (event.code === 'ArrowRight') {
                event.preventDefault();
                onTransportNudge('forward');
                cueTransportPulse('forward');
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
                clearSeekTimers();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [clearSeekTimers, cueTransportPulse, isPlaying, onPlayPause, onTransportNudge]);

    const transportEnergy = Math.min(1, Math.max(0, masterAnalysis.level));
    const waveformAccent = hexToRgba(pulseAccent, 0.55);
    const secondaryAccent = hexToRgba(contextAccent, 0.42);
    const pulseGlowStyle = (type: TransportPulseType) =>
        transportPulse === type
            ? {
                  boxShadow: `0 0 28px ${hexToRgba(pulseAccent, 0.42)}, inset 0 0 18px ${hexToRgba(pulseAccent, 0.32)}`,
                  borderColor: hexToRgba(pulseAccent, 0.6),
              }
            : undefined;

    const transportModule = (
        <ProfessionalTransport
            isPlaying={isPlaying}
            isLooping={isLooping}
            currentTime={currentTime}
            onPlayPause={onPlayPause}
            onSeekPointerDown={handleSeekPointerDown}
            onSeekPointerUp={handleSeekPointerUp}
            onPlayPointerDown={handlePlayPointerDown}
            onPlayPointerUp={() => clearSeekTimers()}
            onToggleLoop={onToggleLoop}
            variant="dark"
        />
    );

    const loopActive = isLooping || transportPulse === 'loop';
    // Loop button - whisper when off, gentle glow when on
    const loopButton = (
        <button
            type="button"
            aria-pressed={loopActive}
            aria-label="Toggle loop"
            title="Toggle loop"
            onClick={toggleLoop}
            className={`bloom-dock-loop-btn ${loopActive ? 'active' : ''}`}
        >
            <LoopIcon className="w-4 h-4" />
            Loop
        </button>
    );

    return (
        <div
            ref={containerRef}
            className="bloom-dock-container"
            style={{
                left: position.x,
                top: position.y,
                transition: isDragging ? 'none' : 'transform 0.2s ease, opacity 0.2s ease',
            }}
        >
            {/* Prime Brain Overlay */}
            {primeBrain.showOverlay && (
                <div className="bloom-dock-brain-overlay" style={{ borderColor: hexToRgba(contextAccent, 0.3) }}>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5">
                        <PrimeBrainIcon className="w-3.5 h-3.5 text-indigo-200" />
                    </div>
                    <span>{formatGuidanceForDock(primeBrain.guidance)}</span>
                </div>
            )}
            
            {/* Flow Mode Label with ALS Pulse Line */}
            <div className="bloom-dock-mode-label-container">
                <div
                    className={`bloom-dock-mode-label ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{
                        borderColor: hexToRgba(contextAccent, 0.55),
                        background: `linear-gradient(135deg, ${hexToRgba(contextAccent, 0.25)} 0%, rgba(9,15,32,0.85) 100%)`,
                        color: hexToRgba(contextAccent, 0.9),
                    }}
                    onPointerDown={handleDragPointerDown}
                >
                    {viewMode === 'sampler' && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/40">
                        <SamplerIcon className="w-3 h-3 text-indigo-200" />
                      </span>
                    )}
                    <span>{contextLabel.toUpperCase()}</span>
                </div>
                {/* ALS Pulse Line */}
                <div
                    className="bloom-dock-pulse-line"
                    style={{
                        width: `${alsGlow.pulse * 100}%`,
                        background: alsGlow.glowColor,
                        opacity: alsGlow.glowIntensity,
                    }}
                />
            </div>

            <div
                className="pointer-events-auto"
                style={{
                    transform: isDragging ? 'scale(1.05, 1.1)' : 'scale(1, 1.1)',
                    transition: isDragging ? 'none' : 'transform 0.25s ease',
                }}
            >
                <div
                    className="bloom-dock-main-halo"
                    style={{
                        ...haloStyle,
                    }}
                >
                    <div className="bloom-dock-segment-group">
                        {leftSegments.map((segment, index) => (
                            <React.Fragment key={`dock-left-${index}`}>
                                {index > 0 && <div className="bloom-dock-segment-divider" />}
                                {segment}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex items-center justify-center">
                        {transportModule}
                    </div>
                    <div className="bloom-dock-segment-group">
                        <div className="flex items-center gap-2">
                            {loopButton}
                        </div>
                        <div className="bloom-dock-segment-divider" />
                        <div className="bloom-dock-segment-group relative" style={{ gap: '10px' }}>
                            <ViewToggle
                                mode={viewMode}
                                accent={contextAccent}
                                onSwitch={onViewModeChange}
                                availableModes={availableViewModes}
                            />
                            {/* Plugin browser - ghostly, reveals on hover */}
                            <button
                                onClick={() => setIsPluginBrowserOpen((prev) => !prev)}
                                className="bloom-dock-plugin-browser-btn"
                                aria-label="Open plugin browser"
                                title="Open plugin browser"
                            >
                                <BloomModuleIcon className="w-4 h-4" />
                            </button>
                            {isPluginBrowserOpen && onAddPlugin && (
                                <PluginBrowser
                                    trackId={selectedTrackId || tracks[0]?.id || 'default'}
                                    trackName={selectedTrackId ? tracks.find(t => t.id === selectedTrackId)?.trackName : 'Master Chain'}
                                    activeInserts={fxWindows.filter(fw => fxVisibility[fw.id]).map(fw => fw.id)}
                                    inventory={pluginInventory}
                                    favorites={pluginFavorites}
                                    onAddPlugin={(trackId, pluginId) => {
                                        if (selectedTrackId) {
                                            onAddPlugin(selectedTrackId, pluginId);
                                        } else if (tracks.length > 0) {
                                            onAddPlugin(tracks[0].id, pluginId);
                                        }
                                    }}
                                    onToggleFavorite={onTogglePluginFavorite || (() => {})}
                                    onClose={() => setIsPluginBrowserOpen(false)}
                                />
                            )}
                            {/* AI Hub - slightly more visible as the AI portal, but still ethereal */}
                            <button
                                onClick={onOpenAIHub}
                                className="bloom-dock-ai-hub-btn"
                                title="Open AI Hub"
                            >
                                <SparklesIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Developer diagnostics (dev-only, gated by global flag) */}
            {typeof window !== 'undefined' && (window as any).__ALS_DEBUG__ && (
                <>
                    <FlowDockDebug als={alsDebugState} pulse={pulseDebugState} />
                    <FlowPulseGraph pulseHistory={[]} />
                    <ALSEventLog logs={[]} />
                    <ALSSyncMonitor
                        sync={{
                            phase: alsDebugState.phase || 0,
                            driftMs: 0,
                            tempoLinked: alsDebugState.bpm > 0,
                            pulseRatio:
                                alsDebugState.bpm > 0
                                    ? (alsDebugState.pulse * 100) / alsDebugState.bpm
                                    : 0,
                        }}
                    />
                </>
            )}
        </div>
    );
};
