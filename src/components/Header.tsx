import React, { useMemo } from 'react';
import { FourAnchors, calculateVelvetScore, getVelvetColor } from '../types/sonic-architecture';

interface HeaderProps {
  analysisResult: FourAnchors | null;
  hushFeedback: { color: string; intensity: number; isEngaged: boolean };
  isPlaying: boolean;
}

const ALSIntelHub: React.FC<{
  analysisResult: FourAnchors | null;
  isPlaying: boolean;
}> = ({ analysisResult, isPlaying }) => {
    
    const velvetScore = analysisResult ? calculateVelvetScore(analysisResult) : null;
    const { gradient, label, color: velvetGlowColor } = getVelvetColor(velvetScore ?? 0);

    if (!analysisResult || velvetScore === null) {
        return (
            <div className="flex-grow flex items-center justify-center h-full">
                <p className="text-gray-500 text-lg font-mono tracking-widest animate-pulse">
                    AWAITING PRIME BRAIN ANALYSIS...
                </p>
            </div>
        );
    }
    
    const getAnchorStyle = (value: number) => ({
        transform: `scale(${0.5 + (value / 100) * 0.7})`,
        opacity: 0.4 + (value / 100) * 0.6,
    });

    const animationClass = isPlaying ? 'animate-als-breathing' : '';
    
    return (
        <div className={`relative flex-grow flex items-center justify-center h-full ${animationClass}`}
             style={{'--als-glow-color': `theme(colors.${velvetGlowColor}.500)`} as React.CSSProperties}>
            
            <div className="absolute w-48 h-48 transition-all duration-500 ease-out group" style={getAnchorStyle(analysisResult.body)}>
                <div className="w-full h-full rounded-full border-2 border-red-500/80"></div>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-red-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Body</span>
            </div>
            <div className="absolute w-40 h-40 transition-all duration-500 ease-out delay-75 group" style={getAnchorStyle(analysisResult.soul)}>
                <div className="w-full h-full rounded-full border-2 border-fuchsia-500/80"></div>
                <span className="absolute top-1/2 -right-4 translate-x-full -translate-y-1/2 text-xs text-fuchsia-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Soul</span>
            </div>
            <div className="absolute w-32 h-32 transition-all duration-500 ease-out delay-150 group" style={getAnchorStyle(analysisResult.air)}>
                <div className="w-full h-full rounded-full border-2 border-cyan-400/80"></div>
                 <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-cyan-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Air</span>
            </div>
             <div className="absolute w-24 h-24 transition-all duration-500 ease-out delay-200 group" style={getAnchorStyle(analysisResult.silk)}>
                <div className="w-full h-full rounded-full border-2 border-violet-400/80"></div>
                <span className="absolute top-1/2 -left-4 -translate-x-full -translate-y-1/2 text-xs text-violet-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Silk</span>
            </div>

            <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center cursor-help group`}>
                 <span className="text-xs font-semibold uppercase tracking-wider text-black/70">{label}</span>
                 <p className="text-4xl font-bold text-white">{velvetScore}</p>
                 <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 p-2 w-48 bg-black/80 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-50 pointer-events-none">
                     Overall serenity and comfort factor (0-100), based on weighted anchors and balance.
                 </div>
            </div>
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ analysisResult, hushFeedback, isPlaying }) => {
  
  const hushGlowStyle: React.CSSProperties = useMemo(() => ({
      transition: 'box-shadow 0.5s ease-in-out',
      boxShadow: hushFeedback.isEngaged
          ? `0 0 ${25 + hushFeedback.intensity * 50}px ${hushFeedback.color}`
          : 'none',
      borderRadius: '50%', // Make the glow circular to match the hub
  }), [hushFeedback]);

  return (
    <header className="absolute top-0 left-0 right-0 z-30 p-4 h-20 flex justify-center items-center text-sm backdrop-blur-sm bg-black/10 pointer-events-none">
      
      {/* Centerpiece: ALS Intel Hub */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[150px] pointer-events-auto" style={hushGlowStyle}>
          <ALSIntelHub 
              analysisResult={analysisResult}
              isPlaying={isPlaying}
          />
      </div>

    </header>
  );
};

export default Header;