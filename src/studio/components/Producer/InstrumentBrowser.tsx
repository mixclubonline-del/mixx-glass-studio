/**
 * Instrument Browser - Virtual instruments for production
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drum, Piano, Music2, Mic2, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const INSTRUMENTS = [
  { id: 'drum-machine', name: 'Drum Machine', icon: Drum, color: 'from-red-500 to-orange-500' },
  { id: 'synth-rack', name: 'Synth Rack', icon: Radio, color: 'from-purple-500 to-pink-500' },
  { id: 'sampler', name: 'Sampler', icon: Mic2, color: 'from-blue-500 to-cyan-500' },
  { id: 'keys', name: 'Keys', icon: Piano, color: 'from-green-500 to-emerald-500' },
  { id: 'bass', name: 'Bass', icon: Music2, color: 'from-yellow-500 to-amber-500' },
];

export const InstrumentBrowser: React.FC = () => {
  const { toast } = useToast();

  const handleLoadInstrument = (name: string) => {
    toast({
      title: `${name} Loaded`,
      description: 'Instrument ready on new MIDI track',
    });
  };

  return (
    <div className="space-y-4">
      <Input 
        placeholder="Search instruments..." 
        className="glass"
      />
      
      <div className="grid grid-cols-2 gap-3">
        {INSTRUMENTS.map((instrument) => {
          const Icon = instrument.icon;
          return (
            <Button
              key={instrument.id}
              variant="outline"
              className="h-24 flex flex-col gap-2 glass hover:glass-glow group"
              onClick={() => handleLoadInstrument(instrument.name)}
            >
              <div className={`p-3 rounded-lg bg-gradient-to-br ${instrument.color} group-hover:scale-110 transition-transform`}>
                <Icon size={20} className="text-white" />
              </div>
              <span className="text-xs font-medium">{instrument.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
