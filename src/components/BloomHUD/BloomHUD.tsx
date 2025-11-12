

import React, { useState, useMemo } from 'react';
// FIX: Add StarIcon and PlusCircleIcon to the imports, remove unused clip action icons
import { PlayIcon, PauseIcon, RewindIcon, FastForwardIcon, LoopIcon, HushIcon, SaveIcon, LoadIcon, SlidersIcon, MixerIcon, SquaresPlusIcon, StarIcon, PlusCircleIcon, SparklesIcon } from '../icons';
import { ArrangeClip, ClipId } from '../../hooks/useArrange';
import FXMenu from '../FXMenu';
import { FxWindowConfig, FxWindowId, TrackData } from '../../App';
import { MusicalContext } from '../../types/sonic-architecture';

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

interface BloomHUDProps {
    isPlaying: boolean;
    isLooping: boolean;
    onPlayPause: () => void;
    onRewind: () => void;
    onFastForward: () => void;
    onToggleLoop: () => void;
    masterAnalysis: { level: number; transient: boolean; waveform: Uint8Array };
    selectedClips: ArrangeClip[];
    onAction: (action: string, payload?: any) => void;
    isAnyTrackArmed: boolean;
    isHushActive: boolean;
    fxWindows: FxWindowConfig[];
    fxVisibility: Record<FxWindowId, boolean>;
    onToggleFxVisibility: (fxId: FxWindowId) => void;
    tracks: TrackData[];
    selectedTrackId: string | null;
    // New props from Header
    viewMode: 'arrange' | 'mixer';
    onToggleViewMode: () => void;
    musicalContext: MusicalContext;
    onContextChange: (newContext: MusicalContext) => void;
    onOpenAIHub: () => void; // New prop for opening AI Hub
}

const ViewToggle: React.FC<{ mode: 'arrange' | 'mixer'; onToggle: () => void }> = ({ mode, onToggle }) => {
    return (
        <div className="flex items-center space-x-1 p-1 rounded-full bg-black/20 border border-gray-100/10">
            <button onClick={onToggle} disabled={mode === 'arrange'} className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center space-x-2 ${mode === 'arrange' ? 'bg-cyan-500/80 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:bg-white/10'}`}>
              <SquaresPlusIcon className="w-5 h-5" />
              <span>Arrange</span>
            </button>
            <button onClick={onToggle} disabled={mode === 'mixer'} className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center space-x-2 ${mode === 'mixer' ? 'bg-fuchsia-500/80 text-white shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'text-gray-400 hover:bg-white/10'}`}>
              <MixerIcon className="w-5 h-5" />
              <span>Mix</span>
            </button>
        </div>
    );
}

export const BloomHUD: React.FC<BloomHUDProps> = (props) => {
    const { 
        isPlaying, isLooping, onPlayPause, onRewind, onFastForward, onToggleLoop,
        masterAnalysis, selectedClips, onAction, isAnyTrackArmed, isHushActive, fxWindows,
        fxVisibility, onToggleFxVisibility, tracks, selectedTrackId,
        viewMode, onToggleViewMode, musicalContext, onContextChange, onOpenAIHub
    } = props;
    
    const [isFxMenuOpen, setIsFxMenuOpen] = useState(false);

    const hasSelection = selectedClips.length > 0;
    const singleSelectedClip = selectedClips.length === 1 ? selectedClips[0] : null;
    
    const selectStyle = "bg-black/30 border border-gray-100/10 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none transition-colors hover:bg-white/10";

    const actionButton = (icon: React.ReactNode, action: string, payload?: any, tooltip?: string, disabled?: boolean) => (
        <button
            onClick={() => onAction(action, payload)}
            title={tooltip}
            disabled={disabled}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:bg-white/10 hover:text-white disabled:text-gray-600 disabled:bg-white/5 disabled:cursor-not-allowed transition-colors"
        >
            {icon}
        </button>
    );

    return (
        <div className="flex items-center space-x-2 p-2 rounded-full bg-black/30 border border-white/10 backdrop-blur-lg shadow-2xl">
            {/* Left Actions: Context */}
            <div className="flex items-center space-x-2 text-gray-300">
                <select
                    value={musicalContext.genre}
                    onChange={(e) => onContextChange({ ...musicalContext, genre: e.target.value as MusicalContext['genre'] })}
                    className={selectStyle}
                >
                    <option>Streaming</option>
                    <option>Hip-Hop</option>
                    <option>Trap</option>
                    <option>R&amp;B</option>
                    <option>Drill</option>
                    <option>Afrobeat</option>
                    <option>Club</option>
                    <option>Audiophile</option>
                </select>
                <select
                    value={musicalContext.mood}
                    onChange={(e) => onContextChange({ ...musicalContext, mood: e.target.value as MusicalContext['mood'] })}
                    className={selectStyle}
                >
                    <option>Balanced</option>
                    <option>Energetic</option>
                    <option>Calm</option>
                    <option>Dark</option>
                </select>
            </div>


            <div className="w-px h-8 bg-white/10 mx-2" />

            {/* File & Track Actions */}
            <div className="flex items-center space-x-1">
                {actionButton(<SquaresPlusIcon className="w-5 h-5" />, 'addTrack', undefined, 'Add New Track')}
                {actionButton(<PlusCircleIcon className="w-5 h-5" />, 'importAudio', undefined, 'Import Audio File')}
                {actionButton(<SaveIcon className="w-5 h-5" />, 'saveProject', undefined, 'Save Project')}
                {actionButton(<LoadIcon className="w-5 h-5" />, 'loadProject', undefined, 'Load Project File')}
            </div>
            
            <div className="w-px h-8 bg-white/10 mx-2" />

            {/* Core & Transport */}
            <div className="relative w-48 h-16 flex items-center justify-center">
                <div className="absolute w-full h-full">
                    <MasterWaveform waveform={masterAnalysis.waveform} color="#06b6d4" />
                </div>
                <div className="relative z-10 w-16 h-16 rounded-full bg-black/50 border-2 border-cyan-400/50 shadow-lg flex items-center justify-center text-white"
                     style={{
                        boxShadow: isPlaying ? `0 0 20px #06b6d4, 0 0 40px #06b6d4` : '0 0 10px #06b6d4',
                        transition: 'box-shadow 0.3s ease-in-out'
                     }}
                >
                    <button onClick={onPlayPause} className="w-full h-full flex items-center justify-center">
                        {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8 pl-1"/>}
                    </button>
                </div>
                <button onClick={onRewind} className="absolute left-0 z-10 p-2 text-gray-400 hover:text-white transition-colors">
                    <RewindIcon className="w-6 h-6"/>
                </button>
                 <button onClick={onFastForward} className="absolute right-0 z-10 p-2 text-gray-400 hover:text-white transition-colors">
                    <FastForwardIcon className="w-6 h-6"/>
                </button>
            </div>
            
            <div className="w-px h-8 bg-white/10 mx-2" />

            {/* Transport Options & Global Actions */}
            <div className="flex items-center space-x-1">
                <button onClick={onToggleLoop} title="Toggle Loop" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isLooping ? 'text-cyan-300 bg-cyan-500/20' : 'text-gray-400 bg-white/5 hover:bg-white/10'}`}>
                    <LoopIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onAction('toggleHush')}
                    title="Toggle HUSH Input System"
                    disabled={!isAnyTrackArmed}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isHushActive
                            ? 'text-cyan-300 bg-cyan-500/20'
                            : isAnyTrackArmed
                            ? 'text-gray-300 bg-white/5 hover:bg-white/10'
                            : 'text-gray-600 bg-white/5'
                    } disabled:cursor-not-allowed`}
                >
                    <HushIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={() => onAction('analyzeMaster')}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors text-yellow-400 bg-white/5 hover:bg-white/10"
                    title="Analyze with Prime Brain"
                >
                    <StarIcon className="w-5 h-5" />
                </button>
            </div>
            
            <div className="w-px h-8 bg-white/10 mx-2" />

            {/* Right Actions: View Toggle & FX */}
            <div className="flex items-center space-x-2 relative">
                <ViewToggle mode={viewMode} onToggle={onToggleViewMode} />
                 <button onClick={() => setIsFxMenuOpen(prev => !prev)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                    <SlidersIcon className="w-5 h-5" />
                </button>
                {isFxMenuOpen && (
                    <FXMenu
                        fxWindows={fxWindows.map(fw => ({id: fw.id, title: fw.name}))}
                        fxVisibility={fxVisibility}
                        onToggleFxVisibility={onToggleFxVisibility}
                        onClose={() => setIsFxMenuOpen(false)}
                    />
                )}
                 {/* New AI Hub Button */}
                <button
                    onClick={onOpenAIHub}
                    className="w-10 h-10 rounded-full bg-indigo-600/50 flex items-center justify-center text-indigo-200 hover:bg-indigo-500 hover:text-white transition-colors shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    title="Open AI Hub"
                >
                    <SparklesIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
