/**
 * Snapshot Manager - Save and restore project states
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBetaFeaturesStore } from '@/store/betaFeaturesStore';
import { Camera, Clock, Trash2, Upload, GitCompare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const SnapshotManager: React.FC = () => {
  const { 
    snapshots, 
    currentSnapshot, 
    createSnapshot, 
    loadSnapshot, 
    deleteSnapshot,
    enableCompareMode
  } = useBetaFeaturesStore();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const { toast } = useToast();
  
  const handleCreateSnapshot = () => {
    if (!snapshotName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a snapshot name",
        variant: "destructive",
      });
      return;
    }
    
    // Capture current project state (simplified)
    const projectState = {
      tracks: [],
      mixer: {},
      plugins: [],
      timestamp: Date.now(),
    };
    
    createSnapshot(snapshotName, snapshotDescription, projectState);
    
    toast({
      title: "Snapshot Created",
      description: `"${snapshotName}" saved successfully`,
    });
    
    setSnapshotName('');
    setSnapshotDescription('');
    setShowCreateForm(false);
  };
  
  const handleCompareSelect = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((s) => s !== id));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };
  
  const handleStartCompare = () => {
    if (selectedForCompare.length === 2) {
      enableCompareMode(selectedForCompare[0], selectedForCompare[1]);
      toast({
        title: "Compare Mode Enabled",
        description: "Press Space to switch between versions",
      });
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <Card className="glass border-primary/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold gradient-flow">Snapshots</h3>
          <p className="text-xs text-muted-foreground">Save & restore project states</p>
        </div>
        <Badge variant="outline" className="text-primary">
          {snapshots.length} Saved
        </Badge>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-2 flex-1"
        >
          <Camera className="w-4 h-4" />
          {showCreateForm ? 'Cancel' : 'New Snapshot'}
        </Button>
        
        {selectedForCompare.length === 2 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartCompare}
            className="gap-2"
          >
            <GitCompare className="w-4 h-4" />
            Compare
          </Button>
        )}
      </div>
      
      {/* Create Form */}
      {showCreateForm && (
        <div className="space-y-3 p-3 glass-glow rounded border border-primary/30">
          <Input
            placeholder="Snapshot name..."
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
          />
          <Textarea
            placeholder="Description (optional)..."
            value={snapshotDescription}
            onChange={(e) => setSnapshotDescription(e.target.value)}
            rows={2}
          />
          <Button size="sm" onClick={handleCreateSnapshot} className="w-full">
            Create Snapshot
          </Button>
        </div>
      )}
      
      {/* Snapshot List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No snapshots yet
            </div>
          ) : (
            snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className={cn(
                  "p-3 rounded border transition-all",
                  currentSnapshot === snapshot.id
                    ? "bg-primary/20 border-primary"
                    : "bg-background/50 border-border hover:border-primary/50",
                  selectedForCompare.includes(snapshot.id) && "ring-2 ring-accent"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{snapshot.name}</h4>
                    {snapshot.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {snapshot.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(snapshot.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSnapshot(snapshot.id)}
                      className="h-6 px-2 text-xs"
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompareSelect(snapshot.id)}
                      className={cn(
                        "h-6 px-2 text-xs",
                        selectedForCompare.includes(snapshot.id) && "bg-accent text-accent-foreground"
                      )}
                      disabled={selectedForCompare.length === 2 && !selectedForCompare.includes(snapshot.id)}
                    >
                      <GitCompare className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSnapshot(snapshot.id)}
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Compare Mode Hint */}
      {selectedForCompare.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {selectedForCompare.length === 1 
            ? 'Select one more snapshot to compare'
            : 'Ready to compare! Click Compare button'}
        </div>
      )}
    </Card>
  );
};
