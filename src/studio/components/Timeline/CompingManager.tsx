/**
 * Comping Manager - Professional audio comping with take lanes
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Scissors,
  Check,
  X,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Take {
  id: string;
  name: string;
  regionId: string;
  visible: boolean;
  muted: boolean;
  starred: boolean;
  color: string;
  sections: TakeSection[];
}

interface TakeSection {
  id: string;
  startTime: number;
  endTime: number;
  active: boolean; // Part of the comp
}

interface CompingManagerProps {
  trackId: string;
  onClose?: () => void;
}

export const CompingManager: React.FC<CompingManagerProps> = ({
  trackId,
  onClose,
}) => {
  const [takes, setTakes] = useState<Take[]>([
    {
      id: 'take-1',
      name: 'Take 1',
      regionId: 'region-1',
      visible: true,
      muted: false,
      starred: true,
      color: 'hsl(142 100% 50%)',
      sections: [
        { id: 's1', startTime: 0, endTime: 4, active: true },
        { id: 's2', startTime: 4, endTime: 8, active: false },
      ],
    },
    {
      id: 'take-2',
      name: 'Take 2',
      regionId: 'region-2',
      visible: true,
      muted: false,
      starred: false,
      color: 'hsl(191 100% 50%)',
      sections: [
        { id: 's3', startTime: 0, endTime: 4, active: false },
        { id: 's4', startTime: 4, endTime: 8, active: true },
      ],
    },
    {
      id: 'take-3',
      name: 'Take 3',
      regionId: 'region-3',
      visible: true,
      muted: false,
      starred: false,
      color: 'hsl(280 100% 60%)',
      sections: [
        { id: 's5', startTime: 0, endTime: 4, active: false },
        { id: 's6', startTime: 4, endTime: 8, active: false },
      ],
    },
  ]);

  const [selectedTake, setSelectedTake] = useState<string | null>(null);
  const [compMode, setCompMode] = useState<'quick' | 'advanced'>('quick');
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const toggleTakeVisibility = (takeId: string) => {
    setTakes((prev) =>
      prev.map((take) =>
        take.id === takeId ? { ...take, visible: !take.visible } : take
      )
    );
  };

  const toggleTakeMute = (takeId: string) => {
    setTakes((prev) =>
      prev.map((take) =>
        take.id === takeId ? { ...take, muted: !take.muted } : take
      )
    );
  };

  const toggleTakeStar = (takeId: string) => {
    setTakes((prev) =>
      prev.map((take) =>
        take.id === takeId ? { ...take, starred: !take.starred } : take
      )
    );
  };

  const deleteTake = (takeId: string) => {
    setTakes((prev) => prev.filter((take) => take.id !== takeId));
    toast.success('Take deleted');
  };

  const duplicateTake = (takeId: string) => {
    const take = takes.find((t) => t.id === takeId);
    if (!take) return;

    const newTake: Take = {
      ...take,
      id: `take-${Date.now()}`,
      name: `${take.name} (Copy)`,
      sections: take.sections.map((s) => ({ ...s, id: `${s.id}-copy` })),
    };

    setTakes((prev) => [...prev, newTake]);
    toast.success('Take duplicated');
  };

  const toggleSection = (takeId: string, sectionId: string) => {
    setTakes((prev) =>
      prev.map((take) =>
        take.id === takeId
          ? {
              ...take,
              sections: take.sections.map((section) =>
                section.id === sectionId
                  ? { ...section, active: !section.active }
                  : section
              ),
            }
          : take
      )
    );
  };

  const quickSwipeComp = (takeId: string) => {
    // Activate all sections of this take
    setTakes((prev) =>
      prev.map((take) =>
        take.id === takeId
          ? {
              ...take,
              sections: take.sections.map((s) => ({ ...s, active: true })),
            }
          : {
              ...take,
              sections: take.sections.map((s) => ({ ...s, active: false })),
            }
      )
    );
    toast.success(`Comped ${takes.find((t) => t.id === takeId)?.name}`);
  };

  const createComp = () => {
    const activeSections = takes.flatMap((take) =>
      take.sections.filter((s) => s.active).map((s) => ({ take, section: s }))
    );

    if (activeSections.length === 0) {
      toast.error('No active sections to comp');
      return;
    }

    toast.success(`Created comp with ${activeSections.length} sections`);
    // Would create actual comp region here
  };

  const clearComp = () => {
    setTakes((prev) =>
      prev.map((take) => ({
        ...take,
        sections: take.sections.map((s) => ({ ...s, active: false })),
      }))
    );
    toast.info('Comp cleared');
  };

  const visibleTakes = showOnlyActive
    ? takes.filter((take) => take.sections.some((s) => s.active))
    : takes.filter((take) => take.visible);

  return (
    <div className="border border-border/30 rounded-lg bg-background/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-gradient-to-r from-primary/20 to-purple-500/20">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Comping Manager</h2>
          <span className="text-xs text-muted-foreground">
            {takes.length} takes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted/20 rounded-md p-1">
            <Button
              size="sm"
              variant={compMode === 'quick' ? 'secondary' : 'ghost'}
              onClick={() => setCompMode('quick')}
              className="h-6 px-2 text-xs"
            >
              Quick
            </Button>
            <Button
              size="sm"
              variant={compMode === 'advanced' ? 'secondary' : 'ghost'}
              onClick={() => setCompMode('advanced')}
              className="h-6 px-2 text-xs"
            >
              Advanced
            </Button>
          </div>

          <Button size="sm" variant="outline" onClick={clearComp}>
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>

          <Button size="sm" variant="default" onClick={createComp}>
            <Check className="h-3 w-3 mr-1" />
            Create Comp
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-border/30 bg-muted/10 flex items-center gap-4">
        <Button
          size="sm"
          variant={showOnlyActive ? 'secondary' : 'ghost'}
          onClick={() => setShowOnlyActive(!showOnlyActive)}
          className="h-6"
        >
          {showOnlyActive ? 'Show All' : 'Show Active Only'}
        </Button>

        <div className="text-xs text-muted-foreground">
          {compMode === 'quick' ? (
            <>Click take to quick-comp entire take</>
          ) : (
            <>Click sections to build comp</>
          )}
        </div>
      </div>

      {/* Take Lanes */}
      <div className="p-4 space-y-2">
        {visibleTakes.map((take) => {
          const isSelected = selectedTake === take.id;
          const activeSections = take.sections.filter((s) => s.active).length;

          return (
            <div
              key={take.id}
              className={cn(
                "border border-border/30 rounded-lg overflow-hidden transition-all",
                isSelected && "ring-2 ring-primary"
              )}
            >
              {/* Take Header */}
              <div
                className="flex items-center justify-between px-3 py-2 bg-muted/20 cursor-pointer hover:bg-muted/30"
                onClick={() =>
                  compMode === 'quick'
                    ? quickSwipeComp(take.id)
                    : setSelectedTake(isSelected ? null : take.id)
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: take.color }}
                  />
                  
                  <span className="text-sm font-medium">{take.name}</span>
                  
                  {take.starred && <Star className="h-3 w-3 text-yellow-400 fill-current" />}
                  
                  {activeSections > 0 && (
                    <span className="text-xs text-primary font-mono">
                      {activeSections} active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleTakeStar(take.id)}
                  >
                    <Star
                      className={cn(
                        "h-3 w-3",
                        take.starred && "fill-current text-yellow-400"
                      )}
                    />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleTakeVisibility(take.id)}
                  >
                    {take.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => duplicateTake(take.id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => deleteTake(take.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Take Sections (Advanced Mode) */}
              {compMode === 'advanced' && isSelected && (
                <div className="p-3 space-y-2 bg-muted/5">
                  <Label className="text-xs text-muted-foreground">Sections</Label>
                  <div className="flex gap-2">
                    {take.sections.map((section) => (
                      <button
                        key={section.id}
                        className={cn(
                          "flex-1 px-3 py-2 rounded border-2 transition-all text-xs font-mono",
                          section.active
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border/30 bg-muted/20 hover:border-primary/50"
                        )}
                        onClick={() => toggleSection(take.id, section.id)}
                      >
                        <div className="font-medium">
                          {section.startTime}s - {section.endTime}s
                        </div>
                        {section.active && (
                          <div className="text-[10px] text-primary">ACTIVE</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="px-4 py-3 border-t border-border/30 bg-muted/10">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Comp Workflow:</div>
          <ul className="list-disc list-inside space-y-0.5">
            <li><span className="font-medium">Quick Mode:</span> Click take to comp entire take</li>
            <li><span className="font-medium">Advanced Mode:</span> Select specific sections</li>
            <li>Star your favorite takes for quick access</li>
            <li>Click "Create Comp" to finalize your composite track</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
