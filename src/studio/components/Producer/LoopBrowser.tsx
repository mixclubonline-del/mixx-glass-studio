/**
 * Loop Browser - Sample loops organized by genre
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LOOP_PACKS = [
  { id: 1, name: 'Trap Essentials Vol. 1', genre: 'Trap', bpm: 140, loops: 50 },
  { id: 2, name: 'Drill Beats Pack', genre: 'Drill', bpm: 150, loops: 40 },
  { id: 3, name: 'R&B Soul Collection', genre: 'R&B', bpm: 85, loops: 60 },
  { id: 4, name: 'Hip-Hop Classics', genre: 'Hip-Hop', bpm: 90, loops: 45 },
  { id: 5, name: 'Melodic Trap Loops', genre: 'Trap', bpm: 145, loops: 35 },
];

export const LoopBrowser: React.FC = () => {
  const { toast } = useToast();

  const handlePlayLoop = (name: string) => {
    toast({
      title: 'Preview',
      description: `Playing ${name}...`,
    });
  };

  const handleAddLoop = (name: string) => {
    toast({
      title: 'Loop Added',
      description: `${name} added to arrangement`,
    });
  };

  return (
    <div className="space-y-4">
      <Input 
        placeholder="Search loops by genre, BPM, or key..." 
        className="glass"
      />
      
      <div className="space-y-2">
        {LOOP_PACKS.map((pack) => (
          <div
            key={pack.id}
            className="glass p-3 rounded-lg hover:glass-glow transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{pack.name}</h4>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{pack.genre}</Badge>
                  <Badge variant="outline" className="text-xs">{pack.bpm} BPM</Badge>
                  <Badge variant="outline" className="text-xs">{pack.loops} loops</Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handlePlayLoop(pack.name)}
                >
                  <Play size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAddLoop(pack.name)}
                >
                  <Download size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
