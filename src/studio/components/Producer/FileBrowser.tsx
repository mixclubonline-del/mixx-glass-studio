/**
 * File Browser - Local file management
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileAudio, Folder, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FileBrowser: React.FC = () => {
  const { toast } = useToast();

  const handleUpload = () => {
    toast({
      title: 'Upload Files',
      description: 'Drag and drop audio files here',
    });
  };

  return (
    <div className="space-y-4">
      <Button 
        className="w-full gap-2" 
        variant="outline"
        onClick={handleUpload}
      >
        <Upload size={16} />
        Upload Audio Files
      </Button>
      
      <div className="space-y-2">
        <div className="glass p-3 rounded-lg flex items-center gap-3 hover:glass-glow cursor-pointer">
          <Folder size={18} className="text-blue-400" />
          <div className="flex-1">
            <div className="text-sm font-medium">Recent Recordings</div>
            <div className="text-xs text-muted-foreground">3 files</div>
          </div>
        </div>
        
        <div className="glass p-3 rounded-lg flex items-center gap-3 hover:glass-glow cursor-pointer">
          <Folder size={18} className="text-purple-400" />
          <div className="flex-1">
            <div className="text-sm font-medium">Imported Samples</div>
            <div className="text-xs text-muted-foreground">12 files</div>
          </div>
        </div>
        
        <div className="glass p-3 rounded-lg flex items-center gap-3 hover:glass-glow cursor-pointer">
          <FileAudio size={18} className="text-cyan-400" />
          <div className="flex-1">
            <div className="text-sm font-medium">Vocal Take 01.wav</div>
            <div className="text-xs text-muted-foreground">2.4 MB • 140 BPM</div>
          </div>
        </div>
      </div>
    </div>
  );
};
