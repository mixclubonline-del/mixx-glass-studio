import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Track {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
}

interface TrackLoaderProps {
  tracks: Track[];
  onLoadTrack: (file: File) => void;
  onRemoveTrack: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onMuteToggle: (id: string) => void;
}

export function TrackLoader({
  tracks,
  onLoadTrack,
  onRemoveTrack,
  onVolumeChange,
  onMuteToggle
}: TrackLoaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => onLoadTrack(file));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass-glow rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold neon-text">Tracks</h3>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          className="hover-glow border-[hsl(var(--prime-500)/0.5)]"
        >
          <Upload className="w-4 h-4 mr-2" />
          Load Audio
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="space-y-2">
        {tracks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Load audio stems to start mixing</p>
          </div>
        ) : (
          tracks.map((track) => (
            <div
              key={track.id}
              className={cn(
                "glass rounded-lg p-3 flex items-center gap-3",
                "hover:shadow-[0_0_20px_hsl(var(--prime-500)/0.2)] transition-all"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{track.name}</p>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={track.volume}
                onChange={(e) => onVolumeChange(track.id, parseFloat(e.target.value))}
                className="w-24 accent-[hsl(var(--prime-500))]"
              />

              <Button
                size="sm"
                variant={track.muted ? "destructive" : "outline"}
                onClick={() => onMuteToggle(track.id)}
                className="w-8 h-8 p-0"
              >
                M
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveTrack(track.id)}
                className="w-8 h-8 p-0 hover:bg-destructive/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}