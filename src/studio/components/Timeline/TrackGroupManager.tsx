/**
 * Track Group Manager - Handle track grouping and VCA faders
 */

import React, { useState } from 'react';
import { Folder, FolderOpen, Link, Unlink, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TrackGroup {
  id: string;
  name: string;
  color: string;
  trackIds: string[];
  vcaVolume: number;
  collapsed: boolean;
}

interface TrackGroupManagerProps {
  groups: TrackGroup[];
  selectedTrackIds: string[];
  onCreateGroup: (name: string, trackIds: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleCollapse: (groupId: string) => void;
  onVCAChange: (groupId: string, volume: number) => void;
}

export const TrackGroupManager: React.FC<TrackGroupManagerProps> = ({
  groups,
  selectedTrackIds,
  onCreateGroup,
  onDeleteGroup,
  onToggleCollapse,
  onVCAChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState('');

  const handleCreateGroup = () => {
    if (groupName && selectedTrackIds.length > 0) {
      onCreateGroup(groupName, selectedTrackIds);
      setGroupName('');
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Create Group Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedTrackIds.length === 0}
            className="w-full"
          >
            <Link className="h-4 w-4 mr-2" />
            Create Group ({selectedTrackIds.length})
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Track Group</DialogTitle>
            <DialogDescription>
              Group {selectedTrackIds.length} selected tracks together with VCA control
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Drums, Vocals, etc."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
            </div>
            <Button onClick={handleCreateGroup} className="w-full">
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing Groups */}
      {groups.map((group) => (
        <div
          key={group.id}
          className="border rounded-lg p-3 space-y-2 bg-card"
          style={{ borderLeftColor: group.color, borderLeftWidth: '3px' }}
        >
          {/* Group Header */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onToggleCollapse(group.id)}
            >
              {group.collapsed ? (
                <Folder className="h-4 w-4" />
              ) : (
                <FolderOpen className="h-4 w-4" />
              )}
            </Button>
            <span className="font-medium text-sm flex-1">{group.name}</span>
            <span className="text-xs text-muted-foreground">
              {group.trackIds.length} tracks
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onDeleteGroup(group.id)}
            >
              <Unlink className="h-4 w-4" />
            </Button>
          </div>

          {/* VCA Fader */}
          {!group.collapsed && (
            <div className="flex items-center gap-3 pl-8">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[group.vcaVolume]}
                onValueChange={([value]) => onVCAChange(group.id, value)}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs font-mono w-12 text-right">
                {group.vcaVolume}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
