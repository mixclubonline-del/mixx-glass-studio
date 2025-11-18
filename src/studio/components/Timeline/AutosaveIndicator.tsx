/**
 * Autosave Indicator - Shows last save time in the toolbar
 */

import { useEffect, useState } from 'react';
import { useAutosave } from '@/hooks/useAutosave';
import { Cloud, CloudOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AutosaveIndicator = () => {
  const { lastSaveTime } = useAutosave(false);
  const [showSaved, setShowSaved] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (lastSaveTime > 0) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSaveTime]);

  useEffect(() => {
    const updateTimeAgo = () => {
      if (lastSaveTime === 0) {
        setTimeAgo('Not saved');
        return;
      }

      const seconds = Math.floor((Date.now() - lastSaveTime) / 1000);
      
      if (seconds < 10) {
        setTimeAgo('Just now');
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else if (seconds < 3600) {
        setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      } else {
        setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, [lastSaveTime]);

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all',
        showSaved
          ? 'glass-glow text-success-foreground'
          : 'glass text-muted-foreground'
      )}
    >
      {showSaved ? (
        <>
          <Check className="h-3 w-3 text-success animate-scale-in" />
          <span className="font-medium">Saved</span>
        </>
      ) : lastSaveTime > 0 ? (
        <>
          <Cloud className="h-3 w-3" />
          <span>{timeAgo}</span>
        </>
      ) : (
        <>
          <CloudOff className="h-3 w-3 text-muted-foreground/50" />
          <span>Not saved</span>
        </>
      )}
    </div>
  );
};
