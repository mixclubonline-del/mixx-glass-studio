import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PluginKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  color?: 'prime' | 'blue' | 'pink';
}

export function PluginKnob({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  unit = '',
  color = 'prime'
}: PluginKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(value);

  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = (percentage / 100) * 270 - 135; // -135° to 135°

  const colorClasses = {
    prime: 'from-[hsl(var(--prime-500))] to-[hsl(var(--neon-pink))]',
    blue: 'from-[hsl(var(--neon-blue))] to-[hsl(var(--prime-500))]',
    pink: 'from-[hsl(var(--neon-pink))] to-[hsl(var(--prime-500))]'
  };

  const glowClasses = {
    prime: 'shadow-[0_0_20px_hsl(var(--prime-500)/0.5)]',
    blue: 'shadow-[0_0_20px_hsl(var(--neon-blue)/0.5)]',
    pink: 'shadow-[0_0_20px_hsl(var(--neon-pink)/0.5)]'
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = startY - e.clientY;
      const sensitivity = 0.5;
      const range = max - min;
      const change = (deltaY * sensitivity * range) / 100;
      
      const newValue = Math.min(max, Math.max(min, startValue + change));
      const steppedValue = Math.round(newValue / step) * step;
      
      onChange(steppedValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging, startY, startValue, min, max, step, onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
  };

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div
        ref={knobRef}
        className={cn(
          "relative w-16 h-16 rounded-full glass cursor-ns-resize transition-all",
          isDragging && "scale-105",
          glowClasses[color]
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeDasharray={`${(percentage / 100) * 175.93} 175.93`}
            strokeLinecap="round"
            className="transition-all duration-150"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={cn("transition-colors", colorClasses[color].split(' ')[0].replace('from-', 'stop-'))} />
              <stop offset="100%" className={cn("transition-colors", colorClasses[color].split(' ')[1].replace('to-', 'stop-'))} />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Indicator */}
        <div
          className="absolute inset-0 flex items-start justify-center pt-1"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className={cn("w-1 h-6 rounded-full bg-gradient-to-b", colorClasses[color])} />
        </div>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("w-3 h-3 rounded-full bg-gradient-to-br", colorClasses[color])} />
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
        <div className={cn("text-sm font-bold bg-gradient-to-r bg-clip-text text-transparent", colorClasses[color])}>
          {value.toFixed(2)}{unit}
        </div>
      </div>
    </div>
  );
}