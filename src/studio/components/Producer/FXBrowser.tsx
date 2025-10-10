/**
 * FX Browser - Effects plugins for production
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Waves, Sliders, Sparkles, Volume2, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FX_PLUGINS = [
  { id: 'reverb', name: 'MixxVerb', icon: Waves, color: 'from-blue-500 to-cyan-500' },
  { id: 'delay', name: 'MixxDelay', icon: Radio, color: 'from-purple-500 to-pink-500' },
  { id: 'compressor', name: 'MixxCompressor', icon: Sliders, color: 'from-green-500 to-emerald-500' },
  { id: 'saturator', name: 'MixxSaturator', icon: Sparkles, color: 'from-orange-500 to-red-500' },
  { id: 'limiter', name: 'MixxLimiter', icon: Volume2, color: 'from-yellow-500 to-amber-500' },
];

export const FXBrowser: React.FC = () => {
  const { toast } = useToast();

  const handleLoadFX = (name: string) => {
    toast({
      title: `${name} Loaded`,
      description: 'Effect added to insert chain',
    });
  };

  return (
    <div className="space-y-4">
      <Input 
        placeholder="Search effects..." 
        className="glass"
      />
      
      <div className="grid grid-cols-2 gap-3">
        {FX_PLUGINS.map((fx) => {
          const Icon = fx.icon;
          return (
            <Button
              key={fx.id}
              variant="outline"
              className="h-24 flex flex-col gap-2 glass hover:glass-glow group"
              onClick={() => handleLoadFX(fx.name)}
            >
              <div className={`p-3 rounded-lg bg-gradient-to-br ${fx.color} group-hover:scale-110 transition-transform`}>
                <Icon size={20} className="text-white" />
              </div>
              <span className="text-xs font-medium">{fx.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
