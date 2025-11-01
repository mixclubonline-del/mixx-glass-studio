/**
 * Smart Top Bar - Project info and session data that blooms on hover
 */

import React from 'react';
import { Cpu, Clock, Save } from 'lucide-react';
import { useTimelineStore } from '@/store/timelineStore';
import { cn } from '@/lib/utils';

interface SmartTopBarProps {
  className?: string;
}

export const SmartTopBar: React.FC<SmartTopBarProps> = ({ className }) => {
  const { loopEnabled, loopStart, loopEnd } = useTimelineStore();
  
  // Mock data - would be real in production
  const projectName = 'Untitled Project';
  const isSaved = true;
  const bpm = 140;
  const timeSignature = '4/4';
  const gridSnap = '1/16';
  const cpuUsage = 23; // %
  
  return (
    <div
      className={cn(
        'glass-ultra border-gradient rounded-lg px-6 py-3',
        'flex items-center justify-between gap-8',
        'shadow-[var(--shadow-float)]',
        className
      )}
    >
      {/* Left: Project Info */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gradient-subtle">
          {projectName}
        </span>
        {isSaved && (
          <Save size={14} className="text-muted-foreground" />
        )}
      </div>
      
      {/* Center: Session Info */}
      <div className="flex items-center gap-6 font-mono text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">BPM</span>
          <span className="text-foreground font-medium">{bpm}</span>
        </div>
        
        <div className="h-4 w-px bg-border/50" />
        
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">TIME</span>
          <span className="text-foreground font-medium">{timeSignature}</span>
        </div>
        
        <div className="h-4 w-px bg-border/50" />
        
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">GRID</span>
          <span className="text-foreground font-medium">{gridSnap}</span>
        </div>
        
        {loopEnabled && (
          <>
            <div className="h-4 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">LOOP</span>
              <span className="text-primary font-medium">
                {loopStart.toFixed(1)}-{loopEnd.toFixed(1)}s
              </span>
            </div>
          </>
        )}
      </div>
      
      {/* Right: System Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">
            {cpuUsage}%
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">
            {new Date().toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
