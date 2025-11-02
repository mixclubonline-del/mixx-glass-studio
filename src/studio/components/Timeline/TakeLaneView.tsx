/**
 * Take Lane View - Manages multiple takes/comps per region
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Take } from '@/types/timeline-extended';

interface TakeLaneViewProps {
  regionId: string;
  takes: Take[];
  onTakeSelect: (takeId: string) => void;
  onTakeToggle: (takeId: string) => void;
  onTakeComp: (takeIds: string[]) => void;
  expanded?: boolean;
}

export const TakeLaneView: React.FC<TakeLaneViewProps> = ({
  regionId,
  takes,
  onTakeSelect,
  onTakeToggle,
  onTakeComp,
  expanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [selectedTakes, setSelectedTakes] = useState<Set<string>>(new Set());

  if (takes.length <= 1) return null;

  const handleTakeClick = (takeId: string, multi: boolean) => {
    if (multi) {
      const newSelected = new Set(selectedTakes);
      if (newSelected.has(takeId)) {
        newSelected.delete(takeId);
      } else {
        newSelected.add(takeId);
      }
      setSelectedTakes(newSelected);
    } else {
      onTakeSelect(takeId);
    }
  };

  const handleCompClick = () => {
    if (selectedTakes.size > 0) {
      onTakeComp(Array.from(selectedTakes));
      setSelectedTakes(new Set());
    }
  };

  return (
    <div className="border-t border-border/50">
      {/* Take Lane Header */}
      <div className="flex items-center gap-2 px-2 py-1 bg-background/50 hover:bg-background/80 transition-colors">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          {takes.length} takes
        </span>
        {selectedTakes.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs ml-auto"
            onClick={handleCompClick}
          >
            Comp {selectedTakes.size} takes
          </Button>
        )}
      </div>

      {/* Take Lanes */}
      {isExpanded && (
        <div className="space-y-px bg-background/30">
          {takes.map((take) => {
            const isSelected = selectedTakes.has(take.id);
            const isActive = take.active;

            return (
              <div
                key={take.id}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors',
                  'hover:bg-accent/50',
                  isSelected && 'bg-accent',
                  isActive && 'border-l-2 border-primary'
                )}
                onClick={(e) => handleTakeClick(take.id, e.shiftKey || e.metaKey)}
              >
                {/* Active Indicator */}
                <div className="w-4 flex items-center justify-center">
                  {isActive && <Check className="h-3 w-3 text-primary" />}
                </div>

                {/* Take Color */}
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: take.color }}
                />

                {/* Take Name */}
                <span className="text-xs flex-1">{take.name}</span>

                {/* Mute Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTakeToggle(take.id);
                  }}
                >
                  {take.muted ? (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
