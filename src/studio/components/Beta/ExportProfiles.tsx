/**
 * Export Profiles - Manage export settings
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBetaFeaturesStore, type ExportProfile } from '@/store/betaFeaturesStore';
import { FileAudio, Download, Settings2, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const ExportProfiles: React.FC = () => {
  const { exportProfiles, selectedProfile, selectProfile, deleteProfile } = useBetaFeaturesStore();
  const { toast } = useToast();
  
  const handleExport = (profile: ExportProfile) => {
    toast({
      title: "Export Started",
      description: `Exporting with ${profile.name}...`,
    });
    
    // Export logic would go here
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `File saved successfully`,
      });
    }, 2000);
  };
  
  const getFormatBadge = (format: string) => {
    const colors = {
      wav: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      mp3: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      flac: 'bg-green-500/20 text-green-400 border-green-500/30',
      stems: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    
    return colors[format as keyof typeof colors] || '';
  };
  
  return (
    <Card className="glass border-primary/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold gradient-flow">Export Profiles</h3>
          <p className="text-xs text-muted-foreground">Quick export presets</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New
        </Button>
      </div>
      
      {/* Profiles List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {exportProfiles.map((profile) => (
            <div
              key={profile.id}
              className={cn(
                "p-3 rounded border transition-all cursor-pointer",
                selectedProfile === profile.id
                  ? "bg-primary/20 border-primary"
                  : "bg-background/50 border-border hover:border-primary/50"
              )}
              onClick={() => selectProfile(profile.id)}
            >
              {/* Profile Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <FileAudio className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-medium">{profile.name}</h4>
                </div>
                <Badge variant="outline" className={cn("text-xs", getFormatBadge(profile.format))}>
                  {profile.format.toUpperCase()}
                </Badge>
              </div>
              
              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                <div className="flex justify-between">
                  <span>Sample Rate:</span>
                  <span className="text-primary font-mono">
                    {(profile.sampleRate / 1000).toFixed(1)} kHz
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bit Depth:</span>
                  <span className="text-primary font-mono">{profile.bitDepth}-bit</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality:</span>
                  <span className="text-primary capitalize">{profile.quality}</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="text-primary uppercase">{profile.format}</span>
                </div>
              </div>
              
              {/* Options */}
              <div className="flex gap-4 text-xs mb-3 pt-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Switch checked={profile.normalize} disabled />
                  <span className="text-muted-foreground">Normalize</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={profile.dithering} disabled />
                  <span className="text-muted-foreground">Dithering</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(profile);
                  }}
                  className="gap-2 flex-1 h-7 text-xs"
                >
                  <Download className="w-3 h-3" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 px-2"
                >
                  <Settings2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProfile(profile.id);
                  }}
                  className="h-7 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Quick Export */}
      <div className="pt-2 border-t border-border/30">
        <Button
          size="sm"
          className="w-full gap-2"
          onClick={() => {
            const selected = exportProfiles.find((p) => p.id === selectedProfile);
            if (selected) handleExport(selected);
          }}
        >
          <Download className="w-4 h-4" />
          Quick Export with Selected Profile
        </Button>
      </div>
    </Card>
  );
};
