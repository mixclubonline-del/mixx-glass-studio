import React from 'react';
import { PluginKey } from '../../constants';

// --- MINI-VISUALIZER PREVIEW COMPONENTS (REFINED) ---

// MixxTune: Shows a "raw" waveform snapping to a corrected line.
const TunePreview: React.FC = () => (
    <svg viewBox="0 0 40 24" className="w-full h-full">
        {/* Corrected pitch line */}
        <path d="M 0 12 L 40 12" stroke="var(--glow-cyan)" strokeWidth="1.5" fill="none" />
        {/* Raw, animated waveform */}
        <path d="M 0 12 Q 10 18, 20 12 T 40 12" strokeWidth="1.5" stroke="rgba(255,255,255,0.5)" fill="none" className="animate-[mini-tune-snap_1.5s_infinite_ease-in-out]" />
    </svg>
);

// MixxVerb: A pulsing 3D wireframe space.
const VerbPreview: React.FC = () => (
    <div className="w-full h-full [perspective:50px]">
        <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-20deg) rotateY(-30deg)' }}>
            <div className="absolute w-4 h-4 border border-cyan-400 animate-[mini-verb-space-pulse_3s_infinite_ease-in-out]" style={{ left: '50%', top: '50%', transform: 'translate3d(-50%, -50%, 8px)' }}></div>
            <div className="absolute w-4 h-4 border border-cyan-400/50 animate-[mini-verb-space-pulse_3s_infinite_ease-in-out]" style={{ left: '50%', top: '50%', transform: 'translate3d(-50%, -50%, -8px)' }}></div>
        </div>
    </div>
);

// MixxDelay: A central pulse with animated echoes fading out.
const DelayPreview: React.FC = () => (
    <div className="w-full h-full relative flex items-center justify-center">
        {/* Main pulse */}
        <div className="w-3 h-3 border border-pink-400 rounded-md animate-pulse" />
        {/* Echoes */}
        {Array.from({length: 3}).map((_, i) => (
             <div key={i} className="absolute w-3 h-3 border border-pink-400/80 rounded-md" style={{
                 animation: `mini-delay-echo 2s infinite linear`,
                 animationDelay: `${i * 0.4}s`,
             }} />
        ))}
    </div>
);

// MixxDrive: An intense, crackling energy core.
const DrivePreview: React.FC = () => (
    <div className="w-full h-full relative flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-orange-500 animate-[mini-drive-core-pulse_1s_infinite]" style={{'--core-color': '#f97316'} as React.CSSProperties}/>
        {/* Crackle particles */}
        {Array.from({length: 3}).map((_, i) => (
            <div key={i} className="absolute w-px h-1 bg-white" style={{
                transform: `rotate(${i*120}deg) translateY(-6px)`,
                animation: `mini-drive-crackle 0.5s infinite`,
                animationDelay: `${i*0.15}s`,
            }}/>
        ))}
    </div>
);

// MixxAura: Visualizes stereo width with orbiting side channels.
const AuraPreview: React.FC = () => (
    <div className="w-full h-full relative flex items-center justify-center">
        <div className="absolute w-7 h-7 animate-[mini-aura-orbit_6s_linear_infinite]">
            {/* Left and Right channel dots */}
            <div className="absolute w-1.5 h-1.5 top-1/2 -translate-y-1/2 left-0 rounded-full bg-pink-400" />
            <div className="absolute w-1.5 h-1.5 top-1/2 -translate-y-1/2 right-0 rounded-full bg-cyan-400" />
        </div>
        {/* Center/Mono dot */}
        <div className="w-2 h-2 rounded-full bg-white/80" />
    </div>
);

// MixxPolish: A waveform being swept with light and sparkles.
const PolishPreview: React.FC = () => (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 40 10" className="w-full h-1/2">
            <path d="M 0 5 Q 10 0, 20 5 T 40 5" stroke="rgba(250, 204, 21, 0.6)" strokeWidth="1" fill="none" />
        </svg>
        <div className="absolute w-2 h-full bg-white/80 blur-sm animate-[mini-polish-light-sweep_2s_infinite_ease-in-out]" />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-[30%] left-[60%] animate-[mini-polish-sparkle_2s_infinite]" style={{animationDelay: '0.5s'}}/>
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-[60%] left-[25%] animate-[mini-polish-sparkle_2s_infinite]" style={{animationDelay: '1.2s'}}/>
    </div>
);

// MixxLimiter: Shows input hitting a ceiling and gain reduction.
const LimiterPreview: React.FC = () => (
    <div className="w-full h-full relative flex items-end justify-center p-1 gap-0.5">
        <div className="w-2 h-[80%] bg-amber-400/50 rounded-t-sm" />
        {/* GR flash */}
        <div className="absolute top-1 w-2 h-[30%] bg-red-500 rounded-t-sm animate-[mini-limiter-gr-flash_1s_infinite]" />
        {/* Ceiling Line */}
        <div className="absolute w-full h-px bg-amber-300 top-1" />
    </div>
);

// MixxMotion: A classic LFO sine wave animation.
const MotionPreview: React.FC = () => (
    <div className="w-full h-full relative overflow-hidden">
        <svg viewBox="0 0 20 10" className="absolute w-[200%] h-full animate-[mini-motion-wave-pan_2s_linear_infinite]">
            <path d="M 0 5 Q 5 0, 10 5 T 20 5" stroke="rgba(217, 70, 239, 1)" strokeWidth="1" fill="none" />
        </svg>
    </div>
);

// MixxSoul: Flowing, organic particles representing "vibe".
const SoulPreview: React.FC = () => (
    <div className="w-full h-full relative">
        {Array.from({length: 3}).map((_, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full bg-rose-400" style={{
                '--x1': `${20 + i*30}%`, '--y1': `${80}%`,
                '--x2': `${40 - i*10}%`, '--y2': `${10}%`,
                animation: `mini-soul-flow ${3 + i}s infinite alternate`,
            } as React.CSSProperties}/>
        ))}
    </div>
);

// MixxGlue: Gooey compression effect.
const GluePreview: React.FC = () => (
    <div className="w-full h-full relative flex items-center justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-violet-400 animate-[mini-glue-compress_1.5s_infinite_ease-in-out]" />
    </div>
);

// PrimeEQ: Dynamic bar graph.
const EQPreview: React.FC = () => (
     <div className="w-full h-full relative flex items-end justify-center gap-px p-1">
        {Array.from({length: 3}).map((_, i) => (
             <div key={i} className="w-2 h-full rounded-t-sm bg-cyan-400" style={{
                animation: `mini-eq-dance ${1 + i*0.2}s infinite alternate ease-in-out`,
                animationDelay: `${i*0.1}s`
             }} />
        ))}
    </div>
);

// MixxBalance: Lissajous-style stereo field.
const BalancePreview: React.FC = () => (
    <div className="w-full h-full relative flex items-center justify-center">
        <div className="w-6 h-3 border border-cyan-400 rounded-full" />
    </div>
);

// MixxMorph: A shape being wiped over by another color.
const MorphPreview: React.FC = () => (
    <div className="w-full h-full relative">
        <div className="absolute inset-0 bg-cyan-400 rounded-sm" />
        <div className="absolute inset-0 bg-pink-400 rounded-sm animate-[mini-morph-wipe_2s_infinite_alternate_ease-in-out]" />
    </div>
);

// MixxCeiling: Waveform getting clipped.
const CeilingPreview: React.FC = () => (
    <svg viewBox="0 0 40 24" className="w-full h-full">
        {/* Ceiling Line */}
        <line x1="0" y1="6" x2="40" y2="6" stroke="hsl(50, 100%, 85%)" strokeWidth="1.5" />
        {/* Clipped part of wave */}
        <path d="M 0 14 Q 10 2, 20 2 Q 30 2, 40 14" className="animate-[mini-ceiling-clip-flash_0.5s_infinite]" />
        {/* Unclipped part */}
        <path d="M 0 14 Q 10 10, 20 14 T 40 14" stroke="hsl(50, 100%, 85%)" strokeWidth="1" fill="none" />
    </svg>
);

// MixxBrainwave: Neural generative lines.
const BrainwavePreview: React.FC = () => (
    <div className="w-full h-full relative">
        {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="absolute h-px bg-violet-300" style={{
                width: `${20 + Math.random()*40}%`,
                left: `${10 + Math.random()*40}%`,
                top: `${20 + i*15}%`,
                transformOrigin: 'left',
                animation: `mini-brainwave-fire ${1 + Math.random()}s infinite`,
                animationDelay: `${Math.random()}s`,
            }} />
        ))}
    </div>
);

// MixxSpirit: Crowd energy rising.
const SpiritPreview: React.FC = () => (
    <div className="w-full h-full relative">
        {Array.from({length: 5}).map((_, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full bg-rose-300" style={{
                left: `${15 + i*15 + Math.random()*10}%`,
                bottom: '0%',
                animation: `mini-spirit-rise ${1.5 + Math.random()}s infinite alternate`,
                animationDelay: `${Math.random()}s`,
            }} />
        ))}
    </div>
);

// PrimeLens: Audio to visual translation.
const LensPreview: React.FC = () => (
    <svg viewBox="0 0 40 24" className="w-full h-full">
        <path d="M 2 12 Q 6 4, 10 12 T 18 12" stroke="var(--glow-cyan)" strokeWidth="1" fill="none"/>
        <circle cx="28" cy="12" r="6" stroke="var(--glow-pink)" strokeWidth="1" fill="none" strokeDasharray="2 4" className="animate-[mini-lens-radiate_2s_infinite_linear]" />
    </svg>
);

// PrimeBrainStem: Central core.
const BrainStemPreview: React.FC = () => (
    <div className="w-full h-full relative flex items-center justify-center">
        <div className="absolute w-3 h-3 rounded-full bg-white/80 animate-[mini-brainstem-pulse_2s_infinite]" />
        {Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="absolute w-full h-px bg-white/30" style={{ transform: `rotate(${i * 30}deg)` }} />
        ))}
    </div>
);

// MixxAnalyzerPro: Spectrum bars.
const AnalyzerProPreview: React.FC = () => (
    <div className="w-full h-full relative flex items-end justify-center gap-px p-1">
        {[0.8, 0.5, 0.9, 0.4, 0.7].map((h, i) => (
             <div key={i} className="w-1.5 h-full rounded-t-sm bg-violet-400" style={{
                '--end-scale': h,
                animation: `mini-eq-dance ${1 + i*0.2}s infinite alternate ease-in-out`,
                animationDelay: `${i*0.1}s`
             } as React.CSSProperties} />
        ))}
    </div>
);

// PrimeRouter: Node matrix.
const RouterPreview: React.FC = () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
        {/* Nodes */}
        {[6, 12, 18].map(y => [6, 12, 18].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="rgba(255,255,255,0.4)" />))}
        {/* Connection */}
        <path d="M 6 12 H 18" stroke="var(--glow-cyan)" strokeWidth="1" strokeDasharray="3" className="animate-[mini-router-flow_1s_infinite_linear]" />
    </svg>
);

// MixxPort: Export progress.
const PortPreview: React.FC = () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
        <circle cx="12" cy="12" r="8" stroke="rgba(167, 139, 250, 0.3)" strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="8" stroke="rgba(167, 139, 250, 1)" strokeWidth="2" fill="none"
            strokeDasharray="32"
            transform="rotate(-90 12 12)"
            className="animate-[mini-port-progress_2s_infinite_linear]" />
    </svg>
);

// TelemetryCollector: Heartbeat line.
const TelemetryPreview: React.FC = () => (
    <svg viewBox="0 0 40 24" className="w-full h-full">
        <path d="M 0 12 L 10 12 L 15 16 L 25 8 L 30 12 L 40 12"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="40"
            strokeDashoffset="40"
            className="animate-[mini-telemetry-draw_1.5s_infinite_linear]"
        />
    </svg>
);

// PrimeBotConsole: Blinking cursor.
const BotConsolePreview: React.FC = () => (
    <div className="w-full h-full relative flex items-center font-mono text-xs p-1">
        <span className="text-white/80">&gt;</span>
        <div className="w-1.5 h-3 bg-white/80 animate-[mini-bot-blink_1.2s_infinite_step-end]" />
    </div>
);

// PrimeMasterEQ: A mastering-style shelf EQ curve.
const MasterEQPreview: React.FC = () => (
    <svg viewBox="0 0 40 24" className="w-full h-full">
        <path d="M 0 16 C 10 16, 12 6, 20 6 S 30 18, 40 18" stroke="hsl(50, 100%, 85%)" strokeWidth="1.5" fill="none" />
        <line x1="0" y1="12" x2="40" y2="12" stroke="hsl(50, 100%, 85%)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5"/>
    </svg>
);

// MixxDither: Shimmering noise floor.
const DitherPreview: React.FC = () => (
    <div className="w-full h-full relative overflow-hidden">
        {Array.from({length: 10}).map((_, i) => (
             <div key={i} className="absolute bottom-1 w-0.5 h-1 bg-white/80" style={{
                left: `${10 + i * 8}%`,
                animation: `mini-polish-sparkle ${1 + Math.random()}s infinite`,
                animationDelay: `${Math.random()}s`,
             }} />
        ))}
    </div>
);

// --- PLUGIN PREVIEW MAPPING ---
export const pluginPreviews: Partial<Record<PluginKey, React.FC>> = {
    'MixxTune': TunePreview,
    'MixxVerb': VerbPreview,
    'MixxDelay': DelayPreview,
    'MixxDrive': DrivePreview,
    'MixxGlue': GluePreview,
    'MixxAura': AuraPreview,
    'PrimeEQ': EQPreview,
    'MixxPolish': PolishPreview,
    'MixxLimiter': LimiterPreview,
    'MixxBalance': BalancePreview,
    'MixxMotion': MotionPreview,
    'MixxSoul': SoulPreview,
    'MixxMorph': MorphPreview,
    'MixxCeiling': CeilingPreview,
    'MixxBrainwave': BrainwavePreview,
    'MixxSpirit': SpiritPreview,
    'PrimeLens': LensPreview,
    'PrimeBrainStem': BrainStemPreview,
    'MixxAnalyzerPro': AnalyzerProPreview,
    'PrimeRouter': RouterPreview,
    'MixxPort': PortPreview,
    'TelemetryCollector': TelemetryPreview,
    'PrimeBotConsole': BotConsolePreview,
    'PrimeMasterEQ': MasterEQPreview,
    'MixxDither': DitherPreview,
};