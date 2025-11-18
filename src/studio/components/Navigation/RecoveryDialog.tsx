/**
 * Recovery Dialog - Prompts user to restore autosaved session on page load
 */

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAutosave, AutosaveData } from '@/hooks/useAutosave';
import { Clock, RefreshCw, Trash2 } from 'lucide-react';

export const RecoveryDialog = () => {
  const [open, setOpen] = useState(false);
  const [autosaveData, setAutosaveData] = useState<AutosaveData | null>(null);
  const { load, restore, clear, hasAutosave } = useAutosave(false);

  useEffect(() => {
    // Check for autosave on mount
    if (hasAutosave()) {
      const data = load();
      if (data) {
        setAutosaveData(data);
        setOpen(true);
      }
    }
  }, []);

  const handleRestore = () => {
    if (autosaveData) {
      restore(autosaveData);
      clear();
      setOpen(false);
    }
  };

  const handleDiscard = () => {
    clear();
    setOpen(false);
  };

  if (!autosaveData) return null;

  const saveDate = new Date(autosaveData.timestamp);
  const timeAgo = getTimeAgo(autosaveData.timestamp);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="glass border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <RefreshCw className="h-5 w-5 text-prime-400" />
            Recover Previous Session?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-sm">
            <div className="glass-inner p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Last saved:</span>
                <span className="text-muted-foreground">{timeAgo}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {saveDate.toLocaleString()}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-foreground font-medium">Session includes:</div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• {autosaveData.tracks.length} tracks</li>
                <li>• {autosaveData.regions.length} regions</li>
                <li>• {autosaveData.mixer.channels.length} mixer channels</li>
                <li>• Timeline and loop settings</li>
              </ul>
            </div>

            <div className="text-xs text-amber-400/80 glass-inner p-2 rounded">
              ⚠️ Note: Audio files are not saved. You'll need to reimport them.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={handleDiscard}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRestore}
            className="gap-2 bg-prime-500 hover:bg-prime-600"
          >
            <RefreshCw className="h-4 w-4" />
            Restore Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}
