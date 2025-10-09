/**
 * Automation Panel - Container for automation lanes
 */

import { useState } from 'react';
import { AutomationLane } from './AutomationLane';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AutomationTrack {
  id: string;
  trackName: string;
  parameter: string;
  color: string;
}

const INITIAL_AUTOMATIONS: AutomationTrack[] = [
  { id: 'auto-1', trackName: 'Track 1', parameter: 'Volume', color: 'hsl(210, 60%, 50%)' },
  { id: 'auto-2', trackName: 'Track 2', parameter: 'Pan', color: 'hsl(180, 50%, 50%)' },
  { id: 'auto-3', trackName: 'Track 4', parameter: 'Filter Cutoff', color: 'hsl(280, 50%, 45%)' },
];

export function AutomationPanel() {
  const [automations, setAutomations] = useState<AutomationTrack[]>(INITIAL_AUTOMATIONS);
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!isExpanded) {
    return (
      <div className="h-10 border-t border-border/50 bg-muted/30 flex items-center justify-between px-4">
        <div className="text-sm text-muted-foreground">Automation</div>
        <button
          onClick={() => setIsExpanded(true)}
          className="p-1 rounded hover:bg-muted/50"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }
  
  return (
    <div className="border-t border-border/50 bg-background">
      {/* Header */}
      <div className="h-10 border-b border-border/50 bg-muted/30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Automation</div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => {
              const newId = `auto-${Date.now()}`;
              setAutomations([...automations, {
                id: newId,
                trackName: `Track ${automations.length + 1}`,
                parameter: 'Volume',
                color: 'hsl(var(--primary))',
              }]);
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 rounded hover:bg-muted/50"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      {/* Automation Lanes */}
      <div className="max-h-64 overflow-y-auto">
        {automations.map((automation) => (
          <AutomationLane
            key={automation.id}
            trackId={automation.trackName}
            parameter={automation.parameter}
            color={automation.color}
          />
        ))}
      </div>
    </div>
  );
}
