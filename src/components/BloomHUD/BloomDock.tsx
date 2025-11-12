import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { PlayIcon, PauseIcon, RewindIcon, FastForwardIcon, LoopIcon, HushIcon, SaveIcon, LoadIcon, SlidersIcon, MixerIcon, SquaresPlusIcon, StarIcon, PlusCircleIcon, SparklesIcon, SplitIcon, MergeIcon, RefreshIcon, BulbIcon } from '../icons';
import { ArrangeClip, ClipId } from '../../hooks/useArrange';
import FXMenu from '../FXMenu';
import { FxWindowConfig, FxWindowId } from '../../App';
import { hexToRgba } from '../../utils/ALS';
import type { PulsePalette } from '../../utils/ALS';
import type { BloomActionMeta } from '../../types/bloom';

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

interface BloomDockProps {
    position: { x: number; y: number };
    onPositionChange: (position: { x: number; y: number }) => void;
    alsPulseAgent?: PulsePalette | null;
    isPlaying: boolean;
    isLooping: boolean;
    onPlayPause: () => void;
    onRewind: () => void;
    onFastForward: () => void;
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
    viewMode: 'arrange' | 'mixer';
    onToggleViewMode: () => void;
    onOpenAIHub: () => void;
    currentTime: number;
    canRecallLastImport: boolean;
    followPlayhead: boolean;
    contextLabel?: string;
    contextAccent?: string;
}

const ViewToggle: React.FC<{ mode: 'arrange' | 'mixer'; onToggle: () => void }> = ({ mode, onToggle }) => {
    return (
        <div className="flex items-center space-x-1 p-1 rounded-full border border-glass-border bg-glass-surface shadow-[0_18px_46px_rgba(4,12,26,0.48)] backdrop-blur-xl">
            <button onClick={onToggle} disabled={mode === 'arrange'} className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center space-x-2 ${mode === 'arrange' ? 'bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 text-ink shadow-[0_14px_32px_rgba(56,189,248,0.4)]' : 'text-ink/60 hover:bg-glass-surface-soft hover:text-ink'}`}>
              <SquaresPlusIcon className="w-5 h-5" />
              <span>Arrange</span>
            </button>
            <button onClick={onToggle} disabled={mode === 'mixer'} className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center space-x-2 ${mode === 'mixer' ? 'bg-gradient-to-r from-fuchsia-300 via-violet-400 to-indigo-400 text-ink shadow-[0_14px_32px_rgba(192,132,252,0.4)]' : 'text-ink/60 hover:bg-glass-surface-soft hover:text-ink'}`}>
              <MixerIcon className="w-5 h-5" />
              <span>Mix</span>
            </button>
        </div>
    );
};

const DOCK_DEFAULT_POSITION = { x: 160, y: 664 };

export const BloomDock: React.FC<BloomDockProps> = (props) => {
    const { 
        position,
        onPositionChange,
        alsPulseAgent,
        isPlaying, isLooping, onPlayPause, onRewind, onFastForward, onToggleLoop,
        masterAnalysis, selectedClips, onAction, isAnyTrackArmed, isHushActive, fxWindows,
        fxVisibility, onToggleFxVisibility, selectedTrackId,
        viewMode, onToggleViewMode, onOpenAIHub,
        currentTime, canRecallLastImport, followPlayhead,
        contextLabel = 'FLOW',
        contextAccent = '#86efac',
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
    const seekIntervalRef = useRef<number | null>(null);
    const activeSeekRef = useRef<'rewind' | 'forward' | null>(null);

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
        return () => {
            if (cleanupDragListenersRef.current) {
                cleanupDragListenersRef.current();
            }
            if (seekIntervalRef.current) {
                window.clearInterval(seekIntervalRef.current);
            }
            if (transportPulseTimeoutRef.current) {
                window.clearTimeout(transportPulseTimeoutRef.current);
            }
        };
    }, []);

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

    const stopSeekLoop = useCallback(() => {
        if (seekIntervalRef.current) {
            window.clearInterval(seekIntervalRef.current);
            seekIntervalRef.current = null;
        }
        activeSeekRef.current = null;
    }, []);

    const startSeekLoop = useCallback(
        (direction: 'rewind' | 'forward') => {
            stopSeekLoop();
            activeSeekRef.current = direction;
            const action = direction === 'rewind' ? onRewind : onFastForward;
            const pulseType: TransportPulseType = direction === 'rewind' ? 'rewind' : 'forward';
            action();
            cueTransportPulse(pulseType);
            seekIntervalRef.current = window.setInterval(() => {
                action();
                cueTransportPulse(pulseType);
            }, 160);
        },
        [cueTransportPulse, onFastForward, onRewind, stopSeekLoop]
    );

    const hasSelection = selectedClips.length > 0;
    const singleSelectedClip = selectedClips.length === 1 ? selectedClips[0] : null;
    const canSplit =
      selectedClips.some(
        (clip) => currentTime > clip.start && currentTime < clip.start + clip.duration
      );
    const canConsolidate = selectedClips.length > 1;
    const canReingest = Boolean(singleSelectedClip?.sourceJobId);
    
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

    const arrangeWorkflowCluster = (
        <div className="flex items-center gap-2.5">
            {actionButton(<SquaresPlusIcon className="w-5 h-5" />, 'addTrack', undefined, 'Add New Track')}
            {actionButton(<PlusCircleIcon className="w-5 h-5" />, 'importAudio', undefined, 'Import Audio File')}
            {actionButton(<SaveIcon className="w-5 h-5" />, 'saveProject', undefined, 'Save Project')}
            {actionButton(<LoadIcon className="w-5 h-5" />, 'loadProject', undefined, 'Load Project File')}
            {actionButton(
                <BulbIcon className={`w-5 h-5 ${followPlayhead ? 'text-cyan-200' : 'text-slate-400'}`} />,
                'toggleFollowPlayhead',
                undefined,
                followPlayhead ? 'Pause playhead follow' : 'Enable playhead follow'
            )}
            {actionButton(
                <SlidersIcon className="w-5 h-5 text-indigo-200" />,
                'openTrackCapsule',
                { trackId: selectedTrackId ?? undefined },
                'Open track capsule',
                !selectedTrackId
            )}
            {actionButton(
                <SparklesIcon className="w-5 h-5 text-violet-200" />,
                'toggleTrackCollapse',
                { trackId: selectedTrackId ?? undefined },
                'Collapse / expand selected track',
                !selectedTrackId
            )}
            {actionButton(
                <RefreshIcon className="w-5 h-5 text-emerald-200" />,
                'recallLastImport',
                undefined,
                'Recall last import',
                !canRecallLastImport
            )}
        </div>
    );

    const editingCluster = hasSelection ? (
        <div className="flex items-center gap-2.5">
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
                <RefreshIcon className="w-5 h-5 text-cyan-200 transform rotate-180" />,
                'reingestClip',
                singleSelectedClip?.id,
                'Re-ingest source audio',
                !canReingest
            )}
        </div>
    ) : null;

    const recordCluster = isAnyTrackArmed ? (
        <div className="flex items-center gap-2.5">
            <button
                onPointerDown={(event) => {
                    event.preventDefault();
                    toggleHush();
                }}
                onKeyDown={(event) => {
                    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
                        event.preventDefault();
                        toggleHush();
                    }
                }}
                title="Toggle HUSH Input System"
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                    isHushActive ? 'text-cyan-300 bg-cyan-500/20 ring-2 ring-cyan-200/50' : 'text-ink/80 bg-glass-surface'
                } ${transportPulse === 'record' ? 'ring-2 ring-cyan-200/70 scale-[1.03]' : ''}`}
                aria-label={isHushActive ? 'Deactivate HUSH input system' : 'Activate HUSH input system'}
            >
                <HushIcon className="w-6 h-6" />
            </button>
        </div>
    ) : null;

    const mixCluster = (
        <div className="flex items-center gap-2.5">
            {actionButton(<SaveIcon className="w-5 h-5" />, 'saveProject', undefined, 'Save Project')}
            {actionButton(<LoadIcon className="w-5 h-5" />, 'loadProject', undefined, 'Load Project File')}
            {actionButton(
                <RefreshIcon className="w-5 h-5 text-emerald-200" />,
                'recallLastImport',
                undefined,
                'Recall last import',
                !canRecallLastImport
            )}
            <button
                onClick={() => onAction('analyzeMaster', undefined, { source: 'bloom-dock' })}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-colors text-amber-200 bg-[rgba(120,98,255,0.18)] hover:bg-[rgba(120,98,255,0.32)]"
                title="Analyze Master"
            >
                <StarIcon className="w-5 h-5" />
            </button>
        </div>
    );

    const leftSegments: React.ReactNode[] = [];

    if (viewMode === 'arrange') {
        leftSegments.push(arrangeWorkflowCluster);
        if (editingCluster) {
            leftSegments.push(editingCluster);
        }
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
            stopSeekLoop();
            cueTransportPulse(isPlaying ? 'pause' : 'play');
            onPlayPause();
        },
        [cueTransportPulse, isPlaying, onPlayPause, stopSeekLoop]
    );

    const handleRewindPointerDown = useCallback(
        (event: React.PointerEvent<HTMLButtonElement>) => {
            event.preventDefault();
            startSeekLoop('rewind');
            const release = () => {
                stopSeekLoop();
                window.removeEventListener('pointerup', release);
                window.removeEventListener('pointercancel', release);
            };
            window.addEventListener('pointerup', release, { once: true });
            window.addEventListener('pointercancel', release, { once: true });
        },
        [startSeekLoop, stopSeekLoop]
    );

    const handleFastForwardPointerDown = useCallback(
        (event: React.PointerEvent<HTMLButtonElement>) => {
            event.preventDefault();
            startSeekLoop('forward');
            const release = () => {
                stopSeekLoop();
                window.removeEventListener('pointerup', release);
                window.removeEventListener('pointercancel', release);
            };
            window.addEventListener('pointerup', release, { once: true });
            window.addEventListener('pointercancel', release, { once: true });
        },
        [startSeekLoop, stopSeekLoop]
    );

    const handleSeekButtonPointerUp = useCallback(
        (event: React.PointerEvent<HTMLButtonElement>) => {
            event.preventDefault();
            stopSeekLoop();
        },
        [stopSeekLoop]
    );

    const toggleLoop = useCallback(() => {
        cueTransportPulse('loop');
        onToggleLoop();
    }, [cueTransportPulse, onToggleLoop]);

    const toggleHush = useCallback(() => {
        cueTransportPulse('record');
        onAction('toggleHush', undefined, { source: 'bloom-dock' });
    }, [cueTransportPulse, onAction]);

    const transportModule = (
        <div className="relative w-48 h-[4.6rem] flex items-center justify-center">
            <div className="absolute w-full h-full">
                <MasterWaveform waveform={masterAnalysis.waveform} color={pulseAccent} />
            </div>
            <div
                className={`relative z-10 w-16 h-[4.2rem] rounded-full bg-glass-surface border-2 border-cyan-300/55 shadow-lg flex items-center justify-center text-ink transition-transform duration-150 ${
                    transportPulse === 'play'
                        ? 'ring-2 ring-cyan-200/70 scale-[1.05]'
                        : transportPulse === 'pause'
                        ? 'ring-2 ring-indigo-200/70 scale-[1.03]'
                        : 'ring-0'
                }`}
                style={{
                    boxShadow: isPlaying
                        ? `0 0 20px ${pulseGlow}, 0 0 ${46 + pulseStrength * 20}px ${pulseGlow}`
                        : `0 0 12px ${pulseGlow}`,
                    transition: 'box-shadow 0.3s ease-in-out',
                }}
            >
                <button
                    onPointerDown={handlePlayPointerDown}
                    className="w-full h-full flex items-center justify-center focus:outline-none"
                    aria-label={isPlaying ? 'Pause playback' : 'Play'}
                >
                    {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 pl-1" />}
                </button>
            </div>
            <button
                onPointerDown={handleRewindPointerDown}
                onPointerUp={handleSeekButtonPointerUp}
                onPointerLeave={handleSeekButtonPointerUp}
                onPointerCancel={handleSeekButtonPointerUp}
                className={`absolute left-0 z-10 p-2 transition-colors ${
                    transportPulse === 'rewind' ? 'text-cyan-200' : 'text-ink/50 hover:text-ink'
                }`}
                aria-label="Rewind five seconds"
                title="Rewind five seconds"
            >
                <RewindIcon className="w-6 h-6" />
            </button>
            <button
                onPointerDown={handleFastForwardPointerDown}
                onPointerUp={handleSeekButtonPointerUp}
                onPointerLeave={handleSeekButtonPointerUp}
                onPointerCancel={handleSeekButtonPointerUp}
                className={`absolute right-0 z-10 p-2 transition-colors ${
                    transportPulse === 'forward' ? 'text-cyan-200' : 'text-ink/50 hover:text-ink'
                }`}
                aria-label="Fast forward five seconds"
                title="Fast forward five seconds"
            >
                <FastForwardIcon className="w-6 h-6" />
            </button>
        </div>
    );

    const loopButton = (
        <button
            onPointerDown={(event) => {
                event.preventDefault();
                toggleLoop();
            }}
            onKeyDown={(event) => {
                if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
                    event.preventDefault();
                    toggleLoop();
                }
            }}
            title="Toggle Loop"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                isLooping
                    ? 'text-cyan-300 bg-[rgba(30,78,140,0.65)]'
                    : 'text-ink/60 bg-glass-surface-soft hover:bg-glass-surface hover:text-ink'
            } ${transportPulse === 'loop' ? 'ring-2 ring-cyan-200/70' : ''}`}
            aria-label={isLooping ? 'Disable loop playback' : 'Enable loop playback'}
        >
            <LoopIcon className="w-5 h-5" />
        </button>
    );

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
                if (event.repeat) return;
                event.preventDefault();
                startSeekLoop('rewind');
            } else if (event.code === 'ArrowRight') {
                if (event.repeat) return;
                event.preventDefault();
                startSeekLoop('forward');
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
                stopSeekLoop();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [cueTransportPulse, isPlaying, onPlayPause, startSeekLoop, stopSeekLoop]);

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
                            <ViewToggle mode={viewMode} onToggle={onToggleViewMode} />
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
