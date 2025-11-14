
import React, { ReactElement, RefObject } from 'react';
import useDraggable from '../hooks/useDraggable';
import { XIcon, PowerIcon, ABIcon } from './icons'; 
import { TrackData } from '../App';
import useResizable from '../hooks/useResizable';
import { useState } from 'react';

export interface FXWindowProps {
  children: ReactElement;
  title: string;
  id: string;
  initialPosition?: { x: number; y: number };
  initialWidth?: number;
  initialHeight?: number;
  isPlaying?: boolean;
  currentTime?: number;
  constraintsRef?: RefObject<HTMLDivElement>;
  onClose: () => void;
  isBypassed: boolean;
  onToggleBypass: (fxId: string) => void; // Expects fxId
  style?: React.CSSProperties; 
  connectedColor?: TrackData['trackColor']; // Color derived from the track it's connected to
  onOpenPluginSettings: (fxId: string) => void; // For PluginBadges to open this window
}

const colorStyles: { [key in TrackData['trackColor']]: { border: string, shadow: string, bg: string, nodeGlow: string, hexForCss: string } } = {
    cyan:    { border: 'border-cyan-400/80',    shadow: 'shadow-[0_0_20px_theme(colors.cyan.500/0.4)]', bg: 'bg-cyan-500', nodeGlow: 'shadow-[0_0_15px_2px_theme(colors.cyan.400)]', hexForCss: '#06b6d4' },
    magenta: { border: 'border-fuchsia-400/80', shadow: 'shadow-[0_0_20px_theme(colors.fuchsia.500/0.4)]', bg: 'bg-fuchsia-500', nodeGlow: 'shadow-[0_0_15px_2px_theme(colors.fuchsia.400)]', hexForCss: '#d946ef' },
    blue:    { border: 'border-blue-500/80',    shadow: 'shadow-[0_0_20px_theme(colors.blue.500/0.4)]', bg: 'bg-blue-500', nodeGlow: 'shadow-[0_0_15px_2px_theme(colors.blue.500)]', hexForCss: '#3b82f6' },
    green:   { border: 'border-green-500/80',   shadow: 'shadow-[0_0_20px_theme(colors.green.500/0.4)]', bg: 'bg-green-500', nodeGlow: 'shadow-[0_0_15px_2px_theme(colors.green.500)]', hexForCss: '#22c55e' },
    purple:  { border: 'border-violet-500/80',  shadow: 'shadow-[0_0_20px_theme(colors.violet.500/0.4)]', bg: 'bg-violet-500', nodeGlow: 'shadow-[0_0_15px_2px_theme(colors.violet.500)]', hexForCss: '#8b5cf6' },
    crimson: { border: 'border-rose-500/80',    shadow: 'shadow-[0_0_20px_theme(colors.rose.500/0.4)]', bg: 'bg-rose-500', nodeGlow: 'shadow-[0_0_15px_2px_theme(colors.rose.400)]', hexForCss: '#f43f5e' },
};

const FXWindow: React.FC<FXWindowProps> = (props) => {
  const { 
    children, title, id, initialPosition, initialWidth, initialHeight, 
    isPlaying, currentTime, constraintsRef, onClose, isBypassed, onToggleBypass, style, connectedColor 
  } = props;
  const { elementRef, position, isDragging } = useDraggable(initialPosition, constraintsRef);
  const { size, isResizing, resizeHandleRef } = useResizable({minWidth: 280, minHeight: 180, initialWidth: initialWidth ?? 320, initialHeight: initialHeight ?? 220});
  
  const borderClass = connectedColor ? `${colorStyles[connectedColor].border} ${colorStyles[connectedColor].shadow}` : 'border-gray-100/10 shadow-black/50';

  const [isHovered, setIsHovered] = useState(false);
  const inactiveStyle = (!isHovered && !isDragging && !isResizing) ? { opacity: 0.3, transform: 'scale(0.98)' } : { opacity: 1, transform: 'scale(1)' };
  
  return (
    <div
      ref={elementRef}
      className={`absolute flex flex-col rounded-2xl bg-black/50 border backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${isDragging || isResizing ? 'shadow-fuchsia-500/50' : borderClass}`}
      style={{ top: `${position.y}px`, left: `${position.x}px`, width: `${size.width}px`, height: `${size.height}px`, ...inactiveStyle, ...style }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseUp={(e) => e.stopPropagation()} // Prevent app-level cancelRouting from firing
    >
      <header className="flex items-center justify-between p-2 pl-6 text-sm font-bold text-gray-300 cursor-move bg-white/5 flex-shrink-0">
        <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleBypass(id)}
              className={`w-4 h-4 rounded-full transition-colors ${!isBypassed && connectedColor ? colorStyles[connectedColor].bg : 'bg-gray-600'}`}
              aria-label={isBypassed ? "Enable effect" : "Bypass effect"}
              title={isBypassed ? "Enable effect" : "Bypass effect"}
            >
                <PowerIcon className="w-4 h-4 text-black/50 p-0.5" />
            </button>
            <span>{title}</span>
        </div>
        <div className="flex items-center">
            <button
              onClick={() => onToggleBypass(id)}
              aria-label={isBypassed ? "Enable effect (A/B)" : "Bypass effect (A/B)"}
              title={isBypassed ? "Enable effect (A/B)" : "Bypass effect (A/B)"}
              className={`p-1 rounded-md text-xs transition-colors ${isBypassed ? 'bg-amber-500/50 text-amber-200' : 'text-gray-500 hover:bg-white/10 hover:text-gray-300'}`}
            >
                <ABIcon className="w-4 h-4"/>
            </button>
            <button
              onClick={onClose}
              aria-label="Close plugin window"
              title="Close plugin window"
              className="p-1 rounded-full hover:bg-white/10"
            >
              <XIcon className="w-4 h-4" />
            </button>
        </div>
      </header>
      <div className={`flex-grow relative w-full h-full bg-black/20 transition-opacity ${isBypassed ? 'opacity-30' : 'opacity-100'}`}>
        {/* Pass connectedColor to children */}
        {React.cloneElement(children as React.ReactElement<any>, { isPlaying, currentTime, connectedColor })}
      </div>

       {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10"
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400/50 opacity-50 hover:opacity-100 transition-opacity"></div>
      </div>
    </div>
  );
};

export default FXWindow;