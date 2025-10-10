/**
 * Bus Manager - Create and manage buses/auxes
 */

import React, { useState } from 'react';
import { Plus, Radio, Disc, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BusState } from '@/store/mixerStore';

interface BusManagerProps {
  buses: BusState[];
  onCreateBus: (name: string, type: 'aux' | 'group') => void;
  onDeleteBus: (id: string) => void;
}

export const BusManager: React.FC<BusManagerProps> = ({
  buses,
  onCreateBus,
  onDeleteBus,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [busName, setBusName] = useState('');
  const [busType, setBusType] = useState<'aux' | 'group'>('aux');
  
  const handleCreate = () => {
    if (busName.trim()) {
      onCreateBus(busName.trim(), busType);
      setBusName('');
      setCreateDialogOpen(false);
    }
  };
  
  const auxBuses = buses.filter(b => b.type === 'aux');
  const groupBuses = buses.filter(b => b.type === 'group');
  
  return (
    <div className="glass-glow rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Bus Manager</h3>
        <Button
          size="sm"
          onClick={() => setCreateDialogOpen(true)}
          className="h-7 px-2 text-xs"
        >
          <Plus size={14} className="mr-1" />
          New Bus
        </Button>
      </div>
      
      {/* Aux Buses */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Radio size={14} className="text-[hsl(var(--neon-blue))]" />
          <span className="text-xs font-medium text-muted-foreground">AUX BUSES</span>
        </div>
        <div className="space-y-1">
          {auxBuses.length === 0 ? (
            <div className="text-xs text-muted-foreground italic px-2 py-1">No aux buses</div>
          ) : (
            auxBuses.map((bus) => (
              <div
                key={bus.id}
                className="flex items-center justify-between px-2 py-1 rounded hover:bg-background/50 group"
              >
                <span className="text-xs font-medium">{bus.name}</span>
                <button
                  onClick={() => onDeleteBus(bus.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Group Buses */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Disc size={14} className="text-[hsl(var(--neon-pink))]" />
          <span className="text-xs font-medium text-muted-foreground">GROUP BUSES</span>
        </div>
        <div className="space-y-1">
          {groupBuses.length === 0 ? (
            <div className="text-xs text-muted-foreground italic px-2 py-1">No group buses</div>
          ) : (
            groupBuses.map((bus) => (
              <div
                key={bus.id}
                className="flex items-center justify-between px-2 py-1 rounded hover:bg-background/50 group"
              >
                <span className="text-xs font-medium">{bus.name}</span>
                <button
                  onClick={() => onDeleteBus(bus.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[400px] glass-glow">
          <DialogHeader>
            <DialogTitle>Create Bus</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Bus Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBusType('aux')}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    busType === 'aux'
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  <Radio size={18} />
                  <span className="text-sm font-medium">Aux/FX</span>
                </button>
                
                <button
                  onClick={() => setBusType('group')}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    busType === 'group'
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  <Disc size={18} />
                  <span className="text-sm font-medium">Group</span>
                </button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="busName" className="text-sm font-medium mb-2 block">
                Bus Name
              </Label>
              <Input
                id="busName"
                value={busName}
                onChange={(e) => setBusName(e.target.value)}
                placeholder={busType === 'aux' ? 'Reverb' : 'Drums'}
                className="glass"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!busName.trim()}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
