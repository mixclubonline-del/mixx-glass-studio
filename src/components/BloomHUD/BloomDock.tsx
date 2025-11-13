import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { PlayIcon, PauseIcon, RewindIcon, FastForwardIcon, LoopIcon, HushIcon, SaveIcon, LoadIcon, SlidersIcon, MixerIcon, SparklesIcon, ArrangeViewIcon, PianoIcon, EditSurfaceIcon, SamplerIcon, SquaresPlusIcon, PlusCircleIcon, SplitIcon, MergeIcon, RefreshIcon, BulbIcon, StarIcon } from '../icons';
import { ArrangeClip, ClipId } from '../../hooks/useArrange';
import FXMenu from '../FXMenu';
import { FxWindowConfig, FxWindowId } from '../../App';
import { hexToRgba, ALSActionPulse } from '../../utils/ALS';
import type { PulsePalette } from '../../utils/ALS';
import type { BloomActionMeta } from '../../types/bloom';
import type { PrimeBrainStatus } from '../../types/primeBrainStatus';
import type { TranslationProfileKey, TranslationProfileInfo, CalibrationPreset } from '../../audio/TranslationMatrix';
import type { IngestJobSnapshot } from '../../ingest/IngestQueueManager';

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

type DockViewMode = 'arrange' | 'sampler' | 'mixer' | 'piano' | 'edit';

const VIEW_ORDER: DockViewMode[] = ['arrange', 'sampler', 'mixer', 'piano', 'edit'];

const VIEW_META: Record<DockViewMode, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    arrange: { label: 'Arrange View', icon: ArrangeViewIcon },
    sampler: { label: 'Sampler View', icon: SamplerIcon },
    mixer: { label: 'Mix View', icon: MixerIcon },
    piano: { label: 'Piano Roll', icon: PianoIcon },
    edit: { label: 'Clip Edit', icon: EditSurfaceIcon },
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
            className={`group relative px-4 py-2 rounded-full border border-white/12 bg-glass-surface-soft text-ink/70 transition-all shadow-[0_18px_46px_rgba(4,12,26,0.38)] backdrop-blur-xl ${
                isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:text-ink hover:border-white/18'
            }`}
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
            <span className="flex items-center gap-2 tracking-[0.32em] text-[11px] uppercase">
                <CurrentIcon
                    className={`w-5 h-5 ${
                        isDisabled ? 'text-slate-500' : 'text-cyan-200 group-hover:text-ink'
                    }`}
                />
                {currentLabel}
            </span>
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                    boxShadow: `0 0 32px ${hexToRgba(accent, 0.45)}`,
                }}
            />
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
}

export const BloomDock: React.FC<BloomDockProps> = (props) => {
    const { 
        position,
        onPositionChange,
        alsPulseAgent,
        isPlaying, isLooping, onPlayPause, onTransportJump, onTransportNudge, onToggleLoop,
        masterAnalysis, selectedClips, onAction, isAnyTrackArmed, isHushActive, fxWindows,
        fxVisibility, onToggleFxVisibility, selectedTrackId,
        viewMode, onViewModeChange, onOpenAIHub,
        currentTime, canRecallLastImport, followPlayhead,
        contextLabel = 'FLOW',
        contextAccent = '#86efac',
        recordingOptions,
        onToggleRecordingOption,
        onDropTakeMarker,
    } = props;
    
    const containerRef = useRef<HTMLDivElement>(null);
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = useRef(false);
    const cleanupDragListenersRef = useRef<(() => void) | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isFxMenuOpen, setIsFxMenuOpen] = useState(false);
    const [transportPulse, setTransportPulse] = useState<TransportPulseType | null>(null);
    const transportPulseTimeoutRef = useRef<number | null>(null);
    const holdTimeoutRef = useRef<number | null>(null);
    const holdIntervalRef = useRef<number | null>(null);
    const hasHeldRef = useRef(false);

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

    const pulseGlow = alsPulseAgent?.glow ?? '#22d3ee';
    const pulseHalo = alsPulseAgent?.halo ?? '#38bdf8';
    const pulseStrength = alsPulseAgent?.pulseStrength ?? (isPlaying ? 0.6 : 0.35);
    const pulseAccent = alsPulseAgent?.accent ?? '#06b6d4';

    const haloStyle = useMemo(() => ({
        boxShadow: `
            0 0 ${26 + pulseStrength * 28}px ${hexToRgba(pulseGlow, isDragging ? 0.7 : 0.5)},
            0 0 ${60 + pulseStrength * 42}px ${hexToRgba(pulseHalo, 0.22)},
            0 0 ${90 + pulseStrength * 48}px ${hexToRgba(contextAccent, 0.28)}
        `,
        borderColor: hexToRgba(contextAccent, 0.55),
        background: `linear-gradient(135deg, ${hexToRgba(contextAccent, 0.22)} 0%, rgba(8,14,28,0.92) 60%, rgba(4,7,16,0.9) 100%)`,
    }), [contextAccent, isDragging, pulseGlow, pulseHalo, pulseStrength]);

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
                onTransportJump(direction);
                cueTransportPulse(direction === 'back' ? 'rewind' : 'forward');
            }
        },
        [clearSeekTimers, cueTransportPulse, onTransportJump]
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
    
    const actionButton = (icon: React.ReactNode, action: string, payload?: any, tooltip?: string, disabled?: boolean) => (
        <button
            onClick={() => onAction(action, payload, { source: "bloom-dock" })}
            title={tooltip}
            disabled={disabled}
            className="w-11 h-11 rounded-full bg-glass-surface-soft flex items-center justify-center text-ink/70 hover:bg-glass-surface hover:text-ink disabled:text-ink/40 disabled:bg-glass-surface disabled:cursor-not-allowed transition-colors shadow-[inset_0_0_18px_rgba(4,12,26,0.4)]"
        >
            {icon}
        </button>
    );

    const clipEditAvailable = canOpenClipEditor || viewMode === 'edit';
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
                !canRecallLastImport
            )}
        </div>
    );

    const editingCluster =
        singleSelectedClip || viewMode === 'edit'
            ? (
                <div className="flex items-center gap-2.5">
                    {actionButton(
                        <EditSurfaceIcon className={`w-5 h-5 ${viewMode === 'edit' ? 'text-violet-200' : 'text-rose-200'}`} />,
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
            className={`px-3 py-2 rounded-full border text-[0.55rem] uppercase tracking-[0.3em] flex items-center gap-2 transition-colors ${
                active ? 'border-cyan-300/60 text-cyan-200 bg-[rgba(16,66,94,0.45)]' : 'border-glass-border text-ink/60 bg-glass-surface-soft hover:text-ink'
            }`}
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
                    className={`px-3 py-2 rounded-full border text-[0.55rem] uppercase tracking-[0.3em] flex items-center gap-2 transition-colors ${
                        isHushActive ? 'border-cyan-300/60 text-cyan-200 bg-[rgba(16,66,94,0.45)]' : 'border-glass-border text-ink/60 bg-glass-surface-soft hover:text-ink'
                    }`}
                >
                    <HushIcon className="w-4 h-4" />
                    HUSH
                </button>
            </div>
            <div className="flex items-center gap-2.5">
                <button
                    onClick={onDropTakeMarker}
                    className="px-3 py-2 rounded-full border border-white/14 text-[0.55rem] uppercase tracking-[0.3em] text-amber-200 bg-[rgba(80,48,20,0.38)] hover:bg-[rgba(120,78,30,0.48)] transition-colors"
                    title="Drop take marker"
                >
                    Drop Take
                </button>
            </div>
        </div>
    ) : null;

    const mixCluster = (
        <div className="flex items-center gap-2.5">
            {actionButton(<SaveIcon className="w-5 h-5" />, 'saveProject', undefined, 'Save project')}
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

    const leftSegments: React.ReactNode[] = [];
    const isArrangeSurface = viewMode === 'arrange' || viewMode === 'piano' || viewMode === 'edit';

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
        <div className="flex items-center gap-4 px-4 py-2 rounded-full border border-white/10 bg-[rgba(6,12,28,0.68)] backdrop-blur-xl shadow-[0_24px_68px_rgba(4,12,26,0.45)]">
            <button
                type="button"
                aria-label="Cue backward"
                title="Cue backward"
                onPointerDown={handleSeekPointerDown('back')}
                onPointerUp={handleSeekPointerUp('back')}
                onPointerLeave={() => clearSeekTimers()}
                onPointerCancel={() => clearSeekTimers()}
                className="relative w-11 h-11 rounded-full border border-white/14 bg-[rgba(12,26,48,0.65)] text-cyan-100 hover:text-white transition-all"
                style={pulseGlowStyle('rewind')}
            >
                <RewindIcon className="w-5 h-5" />
            </button>
            <div className="relative">
                <button
                    type="button"
                    aria-label={isPlaying ? 'Pause transport' : 'Play transport'}
                    title={isPlaying ? 'Pause' : 'Play'}
                    onPointerDown={handlePlayPointerDown}
                    onPointerUp={() => clearSeekTimers()}
                    className={`relative w-14 h-14 rounded-full border transition-all text-white ${
                        isPlaying ? 'bg-[rgba(24,32,76,0.78)] border-white/18' : 'bg-[rgba(18,48,84,0.82)] border-white/14'
                    }`}
                    style={
                        transportPulse === 'play' || transportPulse === 'pause'
                            ? {
                                  boxShadow: `0 0 36px ${hexToRgba(pulseAccent, 0.5)}, inset 0 0 22px ${hexToRgba(pulseAccent, 0.32)}`,
                                  borderColor: hexToRgba(pulseAccent, 0.62),
                              }
                            : undefined
                    }
                >
                    {isPlaying ? (
                        <PauseIcon className="w-6 h-6 text-cyan-100" />
                    ) : (
                        <PlayIcon className="w-6 h-6 translate-x-[1px] text-cyan-100" />
                    )}
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{
                            boxShadow: `0 0 ${isPlaying ? 46 : 32}px ${hexToRgba(pulseGlow, isPlaying ? 0.48 : 0.35)}`,
                            opacity: 0.85,
                        }}
                    />
                </button>
            </div>
            <button
                type="button"
                aria-label="Cue forward"
                title="Cue forward"
                onPointerDown={handleSeekPointerDown('forward')}
                onPointerUp={handleSeekPointerUp('forward')}
                onPointerLeave={() => clearSeekTimers()}
                onPointerCancel={() => clearSeekTimers()}
                className="relative w-11 h-11 rounded-full border border-white/14 bg-[rgba(12,26,48,0.65)] text-cyan-100 hover:text-white transition-all"
                style={pulseGlowStyle('forward')}
            >
                <FastForwardIcon className="w-5 h-5" />
            </button>
            <div className="relative w-40 h-12 rounded-full overflow-hidden border border-white/12 bg-[rgba(4,10,22,0.86)]">
                <div
                    className="absolute inset-0"
                    style={{
                        opacity: 0.38 + transportEnergy * 0.44,
                        background: `linear-gradient(135deg, ${hexToRgba(pulseGlow, 0.28)} 0%, ${secondaryAccent} 100%)`,
                    }}
                />
                <div className="absolute inset-0 mix-blend-screen opacity-80">
                    <MasterWaveform waveform={masterAnalysis.waveform} color={waveformAccent} />
                </div>
                {masterAnalysis.transient && (
                    <div
                        aria-hidden
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                            boxShadow: `0 0 42px ${hexToRgba(pulseAccent, 0.55)}`,
                            opacity: 0.7,
                        }}
                    />
                )}
                {followPlayhead && (
                    <div
                        className="absolute top-1/2 right-3 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-200 shadow-[0_0_16px_rgba(45,212,191,0.65)]"
                        aria-hidden
                    />
                )}
            </div>
        </div>
    );

    const loopActive = isLooping || transportPulse === 'loop';
    const loopButton = (
        <button
            type="button"
            aria-pressed={loopActive}
            aria-label="Toggle loop"
            title="Toggle loop"
            onClick={toggleLoop}
            className={`relative px-4 py-2 rounded-full border transition-all uppercase tracking-[0.32em] text-[10px] flex items-center gap-2 ${
                loopActive
                    ? 'border-cyan-200/70 text-cyan-100 bg-[rgba(12,44,72,0.75)]'
                    : 'border-glass-border text-ink/70 bg-glass-surface-soft hover:text-ink'
            }`}
            style={
                loopActive
                    ? {
                          boxShadow: `0 0 28px ${hexToRgba(pulseAccent, 0.46)}, inset 0 0 18px ${hexToRgba(pulseAccent, 0.3)}`,
                          borderColor: hexToRgba(pulseAccent, 0.58),
                      }
                    : undefined
            }
        >
            <LoopIcon className={`w-5 h-5 ${loopActive ? 'text-cyan-100' : 'text-cyan-200/70'}`} />
            Loop
        </button>
    );

    return (
        <div
            ref={containerRef}
            className="fixed z-40 pointer-events-none select-none"
            style={{
                left: position.x,
                top: position.y,
                transition: isDragging ? 'none' : 'left 0.2s ease, top 0.2s ease',
            }}
        >
            <div
                className={`absolute -top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full border pointer-events-auto backdrop-blur-lg shadow-[0_18px_36px_rgba(4,12,26,0.45)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{
                    borderColor: hexToRgba(contextAccent, 0.55),
                    background: `linear-gradient(135deg, ${hexToRgba(contextAccent, 0.25)} 0%, rgba(9,15,32,0.85) 100%)`,
                    color: hexToRgba(contextAccent, 0.9),
                    letterSpacing: '0.42em',
                    fontSize: '10px',
                }}
                onPointerDown={handleDragPointerDown}
            >
                {contextLabel.toUpperCase()}
            </div>
            <div
                className="pointer-events-auto"
                style={{
                    transform: isDragging ? 'scale(1.05, 1.1)' : 'scale(1, 1.1)',
                    transition: isDragging ? 'none' : 'transform 0.25s ease',
                }}
            >
                <div
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-3 py-3 rounded-full border border-glass-border bg-glass-surface backdrop-blur-2xl shadow-[0_28px_80px_rgba(4,12,26,0.55)]"
                    style={haloStyle}
                >
                    <div className="flex items-center gap-3">
                        {leftSegments.map((segment, index) => (
                            <React.Fragment key={`dock-left-${index}`}>
                                {index > 0 && <div className="w-px h-10 bg-[rgba(102,140,198,0.22)]" />}
                                {segment}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex items-center justify-center">
                        {transportModule}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {loopButton}
                        </div>
                        <div className="w-px h-10 bg-[rgba(102,140,198,0.22)]" />
                        <div className="flex items-center gap-2.5 relative">
                            <ViewToggle
                                mode={viewMode}
                                accent={contextAccent}
                                onSwitch={onViewModeChange}
                                availableModes={availableViewModes}
                            />
                            <button
                                onClick={() => setIsFxMenuOpen((prev) => !prev)}
                                className="w-11 h-11 rounded-full bg-glass-surface-soft flex items-center justify-center text-ink/70 hover:bg-glass-surface hover:text-ink transition-colors shadow-[inset_0_0_15px_rgba(4,12,26,0.4)]"
                                aria-label="Toggle FX menu"
                                title="Toggle FX menu"
                            >
                                <SlidersIcon className="w-5 h-5" />
                            </button>
                            {isFxMenuOpen && (
                                <FXMenu
                                    fxWindows={fxWindows.map((fw) => ({ id: fw.id, title: fw.name }))}
                                    fxVisibility={fxVisibility}
                                    onToggleFxVisibility={onToggleFxVisibility}
                                    onClose={() => setIsFxMenuOpen(false)}
                                />
                            )}
                            <button
                                onClick={onOpenAIHub}
                                className="w-11 h-11 rounded-full bg-indigo-200/70 flex items-center justify-center text-indigo-700 hover:bg-indigo-300 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                                title="Open AI Hub"
                            >
                                <SparklesIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
