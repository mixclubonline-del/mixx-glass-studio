/**
 * Mixer Side Panels - Bus Manager, Loop Controls, I/O Routing
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Settings, Radio, Repeat } from 'lucide-react';
import { BusManager } from './BusManager';
import { LoopPanel } from '../Timeline/LoopPanel';
import { BusState } from '@/store/mixerStore';

interface MixerSidePanelsProps {
  buses: BusState[];
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  onCreateBus: (name: string, color: string, type: 'aux' | 'group') => void;
  onDeleteBus: (id: string) => void;
  onLoopEnabledChange: (enabled: boolean) => void;
  onLoopStartChange: (time: number) => void;
  onLoopEndChange: (time: number) => void;
}

export const MixerSidePanels: React.FC<MixerSidePanelsProps> = ({
  buses,
  loopEnabled,
  loopStart,
  loopEnd,
  onCreateBus,
  onDeleteBus,
  onLoopEnabledChange,
  onLoopStartChange,
  onLoopEndChange,
}) => {
  return (
    <div className="flex gap-2">
      {/* Bus Manager */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Radio size={14} />
            Buses
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] glass-glow">
          <SheetHeader>
            <SheetTitle>Bus Manager</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <BusManager
              buses={buses}
              onCreateBus={(name, type) => {
                const color = type === 'aux' ? 'hsl(191, 100%, 50%)' : 'hsl(314, 100%, 65%)';
                onCreateBus(name, color, type);
              }}
              onDeleteBus={onDeleteBus}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Loop Panel */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Repeat size={14} />
            Loop
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] glass-glow">
          <SheetHeader>
            <SheetTitle>Loop & Recording</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <LoopPanel
              loopEnabled={loopEnabled}
              loopStart={loopStart}
              loopEnd={loopEnd}
              preRoll={0}
              countInBars={0}
              punchIn={0}
              punchOut={0}
              onLoopEnabledChange={onLoopEnabledChange}
              onLoopStartChange={onLoopStartChange}
              onLoopEndChange={onLoopEndChange}
              onPreRollChange={() => {}}
              onCountInChange={() => {}}
              onPunchInChange={() => {}}
              onPunchOutChange={() => {}}
              onSetLoopFromSelection={() => {}}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
