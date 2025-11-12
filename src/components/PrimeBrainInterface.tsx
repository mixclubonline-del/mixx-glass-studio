import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrangeClip, ClipId } from '../hooks/useArrange';
import { XIcon } from './icons';

interface PrimeBrainInterfaceProps {
  clip: ArrangeClip;
  onClose: () => void;
  onUpdateClip: (clipId: ClipId, props: Partial<ArrangeClip>) => void;
}

const WaveformPath: React.FC<{ color: string, stretchFactor: number }> = ({ color, stretchFactor }) => {
    // This is a static, stylized representation of a waveform for the UI.
    const d = "M0,50 C15,80 30,20 45,50 S75,80 90,50 C105,20 120,80 135,50 S165,20 180,50 C195,80 210,20 225,50 S255,80 270,50 S300,20 315,50 S345,80 360,50 S390,20 405,50";
    
    // Animate the viewBox to create a stretching effect
    const viewBoxWidth = 405 / stretchFactor;
    const viewBoxX = (405 - viewBoxWidth) / 2;

    return (
        <svg viewBox={`${viewBoxX} 0 ${viewBoxWidth} 100`} className="w-full h-full transition-all duration-100 ease-linear" preserveAspectRatio="none">
            <defs>
                <filter id="waveform-glow">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                 <linearGradient id="waveform-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.5"/>
                    <stop offset="50%" stopColor={color} stopOpacity="0.1"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </linearGradient>
            </defs>
            <path d={d} stroke={color} strokeWidth="2" fill="url(#waveform-gradient)" style={{ filter: 'url(#waveform-glow)'}} />
        </svg>
    );
};


const PrimeBrainInterface: React.FC<PrimeBrainInterfaceProps> = ({ clip, onClose, onUpdateClip }) => {
  const [isWarping, setIsWarping] = useState(false);
  const dragStartRef = useRef({ x: 0, rate: 1.0 });

  const handleTimeNodeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWarping(true);
    dragStartRef.current = {
      x: e.clientX,
      rate: clip.timeStretchRate ?? 1.0,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isWarping) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const sensitivity = 400; // Pixels for a 2x change (from 0.5 to 2.5)
    let newRate = dragStartRef.current.rate + (deltaX / sensitivity) * 2.0;
    
    // Clamp rate between 0.5x (slower) and 2.0x (faster)
    newRate = Math.max(0.5, Math.min(2.0, newRate));

    onUpdateClip(clip.id, { timeStretchRate: newRate });
  }, [isWarping, clip.id, onUpdateClip]);

  const handleMouseUp = useCallback(() => {
    setIsWarping(false);
  }, []);

  useEffect(() => {
    if (isWarping) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
    } else {
      document.body.style.cursor = 'default';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isWarping, handleMouseMove, handleMouseUp]);


  const timeStretchRate = clip.timeStretchRate ?? 1.0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-filter backdrop-blur-lg" onClick={onClose}>
        <div 
            className="relative w-[80vw] h-[70vh] max-w-6xl rounded-3xl bg-black/30 border border-amber-400/20 flex flex-col p-8 shadow-2xl shadow-amber-500/20 overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
        >
            {/* Background Vortex Effect */}
            <div 
                className={`absolute inset-0 transition-opacity duration-500 ${isWarping ? 'opacity-100' : 'opacity-0'}`} 
                style={{
                    background: `radial-gradient(ellipse at center, transparent 30%, ${clip.color}44 150%)`,
                    animation: isWarping ? 'time-warp-vortex 20s linear infinite' : 'none',
                }}
            />

            <header className="flex justify-between items-center text-gray-400 mb-6 z-10">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold tracking-widest text-gray-200">PRIME BRAIN</h2>
                    <p className="text-amber-400">{clip.name}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
            </header>

            <div className="relative flex-grow flex items-center justify-center z-10">
                {/* Central Brain & Waveform */}
                <div className="absolute w-full h-48">
                    <WaveformPath color={clip.color} stretchFactor={timeStretchRate} />
                </div>
                
                <div className="absolute w-40 h-40 rounded-full flex items-center justify-center" style={{ animation: 'brain-pulse 5s ease-in-out infinite' }}>
                    <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-2xl"></div>
                    <div className="w-32 h-32 rounded-full border-2 border-amber-400/80 bg-black/50 flex items-center justify-center text-amber-300 font-bold tracking-widest">
                        BRAIN
                    </div>
                </div>

                {/* Interactive Lattice Points */}
                <div className="absolute w-full h-full">
                    <div className="absolute top-1/2 left-[calc(50%-200px)] -translate-y-1/2 flex flex-col items-center text-center cursor-pointer group">
                        <div className="w-16 h-16 rounded-full border-2 border-cyan-400/50 flex items-center justify-center bg-black/50 group-hover:bg-cyan-400/20 transition-colors" style={{ animation: 'lattice-glow 4s ease-in-out infinite' }}>PITCH</div>
                        <span className="text-xs text-gray-500 mt-2">Drag to shift tonal center</span>
                    </div>
                     <div 
                        className="absolute top-[calc(50%-100px)] left-1/2 -translate-x-1/2 flex flex-col items-center text-center cursor-ew-resize group"
                        onMouseDown={handleTimeNodeMouseDown}
                     >
                        <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center bg-black/50 transition-colors ${isWarping ? 'border-fuchsia-300 bg-fuchsia-400/30' : 'border-fuchsia-400/50 group-hover:bg-fuchsia-400/20'}`} style={{ animation: 'lattice-glow 4s 1s ease-in-out infinite' }}>
                            <div className="flex flex-col items-center">
                               <span className="font-bold">TIME</span>
                               <span className="text-lg font-mono">{timeStretchRate.toFixed(2)}x</span>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500 mt-2">Drag to warp rhythm</span>
                    </div>
                     <div className="absolute top-1/2 right-[calc(50%-200px)] -translate-y-1/2 flex flex-col items-center text-center cursor-pointer group">
                        <div className="w-16 h-16 rounded-full border-2 border-violet-400/50 flex items-center justify-center bg-black/50 group-hover:bg-violet-400/20 transition-colors" style={{ animation: 'lattice-glow 4s 2s ease-in-out infinite' }}>TIMBRE</div>
                        <span className="text-xs text-gray-500 mt-2">Drag to sculpt texture</span>
                    </div>
                </div>
            </div>

            {/* Satellite Controls */}
            <footer className="grid grid-cols-3 gap-8 pt-6 mt-6 border-t border-white/10 text-xs z-10">
                <div className="flex flex-col items-center">
                    <label htmlFor="focus-range" className="font-bold text-gray-400 mb-2">FOCUS</label>
                    <input id="focus-range" type="range" min="0" max="1" step="0.01" defaultValue="0.5" className="w-full h-1 accent-amber-400" />
                </div>
                <div className="flex flex-col items-center">
                    <label htmlFor="aggression-range" className="font-bold text-gray-400 mb-2">AGGRESSION</label>
                    <input id="aggression-range" type="range" min="0" max="1" step="0.01" defaultValue="0.3" className="w-full h-1 accent-amber-400" />
                </div>
                <div className="flex flex-col items-center">
                    <label htmlFor="flow-range" className="font-bold text-gray-400 mb-2">FLOW</label>
                    <input id="flow-range" type="range" min="0" max="1" step="0.01" defaultValue="0.8" className="w-full h-1 accent-amber-400" />
                </div>
            </footer>
        </div>
    </div>
  );
};

export default PrimeBrainInterface;