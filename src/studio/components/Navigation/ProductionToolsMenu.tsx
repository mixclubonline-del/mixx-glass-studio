/**
 * Production Tools Menu - Quick access to all production features
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Wrench,
  Piano,
  Grid3x3,
  Waves,
  Clock,
  Layers,
  GitBranch,
  Music2,
  Gauge,
  Download,
  Sparkles,
  Volume2,
  Mic,
  FileMusic,
  AudioWaveform,
} from 'lucide-react';
import { useViewStore } from '@/store/viewStore';

export const ProductionToolsMenu: React.FC = () => {
  const { togglePanel, setExportDialogOpen } = useViewStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wrench className="h-4 w-4" />
          <span>Tools</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-background border-border">
        <DropdownMenuLabel>MIDI & Production</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => togglePanel('pianoRoll')}>
          <Piano className="h-4 w-4 mr-2" />
          Piano Roll Editor
          <span className="ml-auto text-xs text-muted-foreground">P</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => togglePanel('stepSequencer')}>
          <Grid3x3 className="h-4 w-4 mr-2" />
          Step Sequencer
          <span className="ml-auto text-xs text-muted-foreground">S</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Audio Processing</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => togglePanel('grooveEngine')}>
          <Waves className="h-4 w-4 mr-2" />
          Groove Engine
          <span className="ml-auto text-xs text-muted-foreground">G</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => togglePanel('timeStretch')}>
          <Clock className="h-4 w-4 mr-2" />
          Time Stretch & Pitch
          <span className="ml-auto text-xs text-muted-foreground">T</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => togglePanel('comping')}>
          <Layers className="h-4 w-4 mr-2" />
          Comping Manager
          <span className="ml-auto text-xs text-muted-foreground">C</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Mixing & Routing</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => togglePanel('routing')}>
          <GitBranch className="h-4 w-4 mr-2" />
          Routing Matrix
          <span className="ml-auto text-xs text-muted-foreground">R</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => togglePanel('automation')}>
          <Music2 className="h-4 w-4 mr-2" />
          Advanced Automation
          <span className="ml-auto text-xs text-muted-foreground">A</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => togglePanel('metering')}>
          <Gauge className="h-4 w-4 mr-2" />
          Metering & Analysis
          <span className="ml-auto text-xs text-muted-foreground">M</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Export</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export Mix
          <span className="ml-auto text-xs text-muted-foreground">E</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Advanced Audio</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => togglePanel('stemSeparation')}>
          <Sparkles className="h-4 w-4 mr-2" />
          Stem Separation
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => togglePanel('audioRestoration')}>
          <Volume2 className="h-4 w-4 mr-2" />
          Audio Restoration
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => togglePanel('advancedPitch')}>
          <Mic className="h-4 w-4 mr-2" />
          Pitch Correction
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => togglePanel('audioToMIDI')}>
          <FileMusic className="h-4 w-4 mr-2" />
          Audio to MIDI
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => togglePanel('voiceIsolation')}>
          <AudioWaveform className="h-4 w-4 mr-2" />
          Voice Isolation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
