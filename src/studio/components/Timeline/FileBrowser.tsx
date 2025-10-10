/**
 * File Browser - Navigate and preview audio files
 */

import React, { useState } from 'react';
import { Search, File, Folder, Play, Star, Clock, HardDrive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface FileBrowserProps {
  onFileSelect?: (file: File) => void;
}

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: Date;
  favorite?: boolean;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ onFileSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([
    { name: 'Track_01.wav', type: 'file', size: 5242880, modified: new Date(), favorite: false },
    { name: 'Vocals_take2.mp3', type: 'file', size: 3145728, modified: new Date(), favorite: true },
    { name: 'Bass_loop.wav', type: 'file', size: 2097152, modified: new Date(), favorite: false },
  ]);

  const handleBrowseFiles = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      input.multiple = true;
      
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0 && onFileSelect) {
          Array.from(files).forEach(file => onFileSelect(file));
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error browsing files:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const filteredFiles = recentFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border/30">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm bg-background/50"
          />
        </div>
      </div>

      {/* Browse Button */}
      <div className="p-3 border-b border-border/30">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleBrowseFiles}
        >
          <HardDrive size={14} />
          Browse Files...
        </Button>
      </div>

      {/* Recent Files */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Clock size={12} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Recent</span>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No files found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded hover:bg-primary/10 cursor-pointer group transition-colors"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', file.name);
                  }}
                >
                  {file.type === 'folder' ? (
                    <Folder size={16} className="text-primary shrink-0" />
                  ) : (
                    <File size={16} className="text-muted-foreground shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    {file.size && (
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1 hover:bg-primary/20 rounded"
                      title="Preview"
                    >
                      <Play size={12} />
                    </button>
                    <button
                      className="p-1 hover:bg-primary/20 rounded"
                      title="Favorite"
                    >
                      <Star size={12} className={file.favorite ? 'fill-current text-accent' : ''} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
