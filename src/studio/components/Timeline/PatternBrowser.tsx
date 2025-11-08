/**
 * Pattern Browser - FL Studio-style pattern management
 */

import React, { useState } from 'react';
import { usePatternStore } from '@/store/patternStore';
import { useTracksStore } from '@/store/tracksStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Copy, 
  Trash2, 
  GripVertical,
  Music,
  Layers,
} from 'lucide-react';
import { ColorPalette, TRAP_COLOR_PALETTES } from '@/types/timeline';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const PatternBrowser: React.FC = () => {
  const { patterns, selectedPatternId, selectPattern, createPattern, deletePattern, duplicatePattern, createPatternFromSelection } = usePatternStore();
  const { selectedRegionIds } = useTracksStore();
  const [draggedPattern, setDraggedPattern] = useState<string | null>(null);
  const [newPatternName, setNewPatternName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ColorPalette>('drums');

  const handleCreatePattern = () => {
    if (!newPatternName.trim()) {
      toast.error('Enter a pattern name');
      return;
    }

    if (selectedRegionIds.length === 0) {
      toast.error('Select regions to create pattern');
      return;
    }

    const pattern = createPatternFromSelection(
      newPatternName.trim(),
      selectedCategory,
      selectedRegionIds
    );

    if (pattern) {
      setNewPatternName('');
      toast.success(`Pattern "${pattern.name}" created`);
    }
  };

  const handleDragStart = (patternId: string, e: React.DragEvent) => {
    setDraggedPattern(patternId);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('patternId', patternId);
  };

  const handleDragEnd = () => {
    setDraggedPattern(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const pattern = patterns.find(p => p.id === id);
    deletePattern(id);
    toast.success(`Pattern "${pattern?.name}" deleted`);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPattern = duplicatePattern(id);
    toast.success(`Pattern "${newPattern.name}" created`);
  };

  // Group patterns by category
  const patternsByCategory = patterns.reduce((acc, pattern) => {
    if (!acc[pattern.category]) {
      acc[pattern.category] = [];
    }
    acc[pattern.category].push(pattern);
    return acc;
  }, {} as Record<ColorPalette, typeof patterns>);

  const categories: ColorPalette[] = ['drums', '808s', 'melody', 'vocals', 'fx'];

  return (
    <div className="h-full flex flex-col glass-ultra border-r border-gradient">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-gradient">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Pattern Browser</h3>
        </div>

        {/* Create Pattern */}
        <div className="space-y-2">
          <Input
            placeholder="New pattern name..."
            value={newPatternName}
            onChange={(e) => setNewPatternName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreatePattern();
            }}
            className="h-8 text-xs"
          />
          
          <div className="flex gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'flex-1 h-6 rounded text-xs font-medium transition-all',
                  selectedCategory === cat
                    ? 'ring-2 ring-offset-1 ring-offset-background'
                    : 'opacity-60 hover:opacity-100'
                )}
                style={{
                  backgroundColor: TRAP_COLOR_PALETTES[cat],
                  color: 'white',
                  ...(selectedCategory === cat && {
                    ringColor: TRAP_COLOR_PALETTES[cat],
                  }),
                }}
                title={cat.charAt(0).toUpperCase() + cat.slice(1)}
              >
                {cat.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={handleCreatePattern}
            disabled={selectedRegionIds.length === 0}
            className="w-full h-8"
          >
            <Plus className="h-3 w-3 mr-1" />
            Create Pattern
          </Button>
        </div>
      </div>

      {/* Pattern List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {categories.map((category) => {
            const categoryPatterns = patternsByCategory[category] || [];
            if (categoryPatterns.length === 0) return null;

            return (
              <div key={category} className="space-y-1">
                {/* Category Header */}
                <div className="flex items-center gap-2 px-2 py-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TRAP_COLOR_PALETTES[category] }}
                  />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    ({categoryPatterns.length})
                  </span>
                </div>

                {/* Patterns */}
                {categoryPatterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    draggable
                    onDragStart={(e) => handleDragStart(pattern.id, e)}
                    onDragEnd={handleDragEnd}
                    onClick={() => selectPattern(pattern.id)}
                    className={cn(
                      'group relative flex items-center gap-2 px-2 py-2 rounded cursor-move transition-all',
                      'hover:bg-white/5',
                      selectedPatternId === pattern.id && 'bg-white/10 ring-1 ring-white/20',
                      draggedPattern === pattern.id && 'opacity-50'
                    )}
                    style={{
                      borderLeft: `3px solid ${pattern.color}`,
                    }}
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                    <Music className="h-3 w-3" style={{ color: pattern.color }} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{pattern.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {pattern.regionIds.length} region{pattern.regionIds.length !== 1 ? 's' : ''}
                        {pattern.variants > 0 && ` • ${pattern.variants} variant${pattern.variants !== 1 ? 's' : ''}`}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDuplicate(pattern.id, e)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(pattern.id, e)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {patterns.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No patterns yet</p>
              <p className="text-[10px] mt-1">
                Select regions and create patterns
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Help */}
      <div className="flex-none px-3 py-2 border-t border-border/30 text-[10px] text-muted-foreground">
        <div className="space-y-1">
          <div>• Select regions → Create pattern</div>
          <div>• Drag patterns to timeline</div>
          <div>• Ctrl+B: Create from selection</div>
        </div>
      </div>
    </div>
  );
};
