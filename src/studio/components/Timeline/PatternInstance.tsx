/**
 * Pattern Instance - Rendered pattern block on timeline
 */

import React from 'react';
import { PatternInstance as PatternInstanceType } from '@/types/timeline';
import { usePatternStore } from '@/store/patternStore';
import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatternInstanceProps {
  instance: PatternInstanceType;
  zoom: number;
  scrollX: number;
  trackHeight: number;
  isSelected: boolean;
  onSelect: (id: string, multi?: boolean) => void;
}

export const PatternInstance: React.FC<PatternInstanceProps> = ({
  instance,
  zoom,
  scrollX,
  trackHeight,
  isSelected,
  onSelect,
}) => {
  const { patterns, makePatternUnique } = usePatternStore();
  const pattern = patterns.find((p) => p.id === instance.patternId);

  if (!pattern) return null;

  const x = instance.startTime * zoom - scrollX;
  const width = instance.duration * zoom;
  const color = instance.color || pattern.color;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(instance.id, e.shiftKey || e.metaKey);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!instance.unique) {
      makePatternUnique(instance.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'absolute rounded cursor-pointer transition-all group',
        'hover:brightness-110',
        isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-background'
      )}
      style={{
        left: x,
        top: 4,
        width: Math.max(width, 20),
        height: trackHeight - 8,
        backgroundColor: color,
        opacity: instance.muted ? 0.3 : 0.85,
      }}
    >
      {/* Pattern header */}
      <div className="px-2 py-1 flex items-center justify-between text-white">
        <div className="flex items-center gap-1 min-w-0">
          {instance.unique ? (
            <Unlock className="h-3 w-3 flex-shrink-0" />
          ) : (
            <Lock className="h-3 w-3 flex-shrink-0 opacity-50" />
          )}
          <span className="text-xs font-medium truncate">{pattern.name}</span>
        </div>
        
        {pattern.variants > 0 && (
          <span className="text-[9px] opacity-70 flex-shrink-0">
            v{pattern.variants}
          </span>
        )}
      </div>

      {/* Pattern grid visualization */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-white"
            style={{ left: `${(i / 8) * 100}%` }}
          />
        ))}
      </div>

      {/* Hover hint */}
      <div className="absolute bottom-1 right-1 text-[9px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
        {instance.unique ? 'Unique' : 'Double-click to make unique'}
      </div>
    </div>
  );
};
