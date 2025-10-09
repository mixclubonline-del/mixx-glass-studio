/**
 * Add Track Dialog - Professional track creation modal
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, Music, Radio, Folder, Disc } from 'lucide-react';

export type TrackType = 'audio-mono' | 'audio-stereo' | 'midi' | 'aux' | 'group' | 'folder';

interface AddTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTrack: (config: TrackConfig) => void;
}

export interface TrackConfig {
  type: TrackType;
  name: string;
  color: string;
  count: number;
  height: 'compact' | 'medium' | 'tall';
  inputRouting?: string;
}

export const AddTrackDialog: React.FC<AddTrackDialogProps> = ({
  open,
  onOpenChange,
  onCreateTrack
}) => {
  const [selectedType, setSelectedType] = useState<TrackType>('audio-stereo');
  const [trackName, setTrackName] = useState('');
  const [trackColor, setTrackColor] = useState('#B91C8C'); // neon pink default
  const [trackCount, setTrackCount] = useState(1);
  const [trackHeight, setTrackHeight] = useState<'compact' | 'medium' | 'tall'>('medium');
  
  const trackTypes: { id: TrackType; icon: React.ReactNode; label: string; description: string }[] = [
    { id: 'audio-mono', icon: <Mic size={24} />, label: 'Audio (Mono)', description: 'Single channel audio recording' },
    { id: 'audio-stereo', icon: <Mic size={24} />, label: 'Audio (Stereo)', description: 'Stereo audio recording' },
    { id: 'midi', icon: <Music size={24} />, label: 'MIDI', description: 'MIDI instrument track' },
    { id: 'aux', icon: <Radio size={24} />, label: 'Aux/FX Bus', description: 'Effect send bus' },
    { id: 'group', icon: <Disc size={24} />, label: 'Group Bus', description: 'Submix group' },
    { id: 'folder', icon: <Folder size={24} />, label: 'Folder', description: 'Track organization' }
  ];
  
  const colorPresets = [
    '#B91C8C', // neon pink
    '#BB13C4', // prime purple
    '#3B82F6', // blue
    '#06B6D4', // cyan
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6'  // violet
  ];
  
  const handleCreate = () => {
    const config: TrackConfig = {
      type: selectedType,
      name: trackName || getDefaultName(),
      color: trackColor,
      count: trackCount,
      height: trackHeight
    };
    
    onCreateTrack(config);
    onOpenChange(false);
    
    // Reset form
    setTrackName('');
    setTrackCount(1);
  };
  
  const getDefaultName = () => {
    const typeNames: Record<TrackType, string> = {
      'audio-mono': 'Audio',
      'audio-stereo': 'Audio',
      'midi': 'MIDI',
      'aux': 'Aux',
      'group': 'Group',
      'folder': 'Folder'
    };
    return typeNames[selectedType];
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass-glow">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Track</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Track type selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Track Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {trackTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all ${
                    selectedType === type.id
                      ? 'border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                      : 'border-border/50 hover:border-primary/50 bg-background/50'
                  }`}
                >
                  <div className={selectedType === type.id ? 'text-primary' : 'text-muted-foreground'}>
                    {type.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Track name */}
          <div>
            <Label htmlFor="trackName" className="text-sm font-medium mb-2 block">
              Track Name
            </Label>
            <Input
              id="trackName"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder={`${getDefaultName()} 1`}
              className="glass"
            />
          </div>
          
          {/* Track color */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Track Color</Label>
            <div className="flex items-center gap-2">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  onClick={() => setTrackColor(color)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    trackColor === color
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    background: color,
                    boxShadow: trackColor === color ? `0 0 20px ${color}` : 'none'
                  }}
                />
              ))}
              <input
                type="color"
                value={trackColor}
                onChange={(e) => setTrackColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer glass"
              />
            </div>
          </div>
          
          {/* Track count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trackCount" className="text-sm font-medium mb-2 block">
                Number of Tracks
              </Label>
              <Input
                id="trackCount"
                type="number"
                min="1"
                max="32"
                value={trackCount}
                onChange={(e) => setTrackCount(parseInt(e.target.value) || 1)}
                className="glass"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Track Height</Label>
              <div className="flex gap-2">
                {(['compact', 'medium', 'tall'] as const).map((height) => (
                  <button
                    key={height}
                    onClick={() => setTrackHeight(height)}
                    className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      trackHeight === height
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    {height.charAt(0).toUpperCase() + height.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} className="shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
            Create Track{trackCount > 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
