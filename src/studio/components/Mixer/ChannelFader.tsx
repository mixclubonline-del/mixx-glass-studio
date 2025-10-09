/**
 * Channel Fader - Vertical fader with meter
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ChannelFaderProps {
  value: number; // 0-100
  color?: string;
  muted?: boolean;
  solo?: boolean;
  record?: boolean;
  label?: string;
  onChange?: (value: number) => void;
  onMuteToggle?: () => void;
  onSoloToggle?: () => void;
  onRecordToggle?: () => void;
}

export function ChannelFader({
  value,
  color = 'hsl(var(--primary))',
  muted = false,
  solo = false,
  record = false,
  label,
  onChange,
  onMuteToggle,
  onSoloToggle,
  onRecordToggle,
}: ChannelFaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    
    const updateValueFromEvent = (clientY: number) => {
      const y = clientY - rect.top;
      const percent = 100 - Math.max(0, Math.min(100, (y / rect.height) * 100));
      onChange?.(percent);
    };
    
    updateValueFromEvent(e.clientY);
    
    const handleMouseMove = (e: MouseEvent) => {
      updateValueFromEvent(e.clientY);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div className="flex flex-col items-center gap-2 w-16">
      {/* Status Buttons */}
      <div className="flex gap-1 text-[10px] font-medium">
        <button
          onClick={onMuteToggle}
          className={cn(
            "w-5 h-5 rounded flex items-center justify-center transition-colors",
            muted ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          M
        </button>
        <button
          onClick={onSoloToggle}
          className={cn(
            "w-5 h-5 rounded flex items-center justify-center transition-colors",
            solo ? "bg-yellow-500 text-black" : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          S
        </button>
        <button
          onClick={onRecordToggle}
          className={cn(
            "w-5 h-5 rounded flex items-center justify-center transition-colors",
            record ? "bg-red-500 text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          R
        </button>
      </div>
      
      {/* Fader Track */}
      <div
        className={cn(
          "relative h-48 w-8 bg-muted/30 rounded-full cursor-pointer",
          isDragging && "bg-muted/50"
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Fill */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
          style={{
            height: `${value}%`,
            backgroundColor: color,
            opacity: muted ? 0.3 : 1,
          }}
        />
        
        {/* Thumb */}
        <div
          className="absolute left-1/2 w-10 h-3 -ml-5 bg-background border-2 rounded-full shadow-lg transition-all"
          style={{
            bottom: `calc(${value}% - 6px)`,
            borderColor: color,
          }}
        />
      </div>
      
      {/* Label */}
      {label && (
        <div className="text-[10px] text-muted-foreground text-center truncate w-full">
          {label}
        </div>
      )}
    </div>
  );
}
