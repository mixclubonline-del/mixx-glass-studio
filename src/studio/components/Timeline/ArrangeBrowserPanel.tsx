/**
 * Arrange Browser Panel - Left sidebar with tabs for Files, Plugins, Inspector, etc.
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileBrowser } from './FileBrowser';
import { PluginBrowserPanel } from './PluginBrowserPanel';
import { InspectorPanel } from './InspectorPanel';
import { Files, Grid3x3, Info, Music, Folder, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArrangeBrowserPanelProps {
  selectedTrackId?: string;
  onFileSelect?: (file: File) => void;
  onPluginSelect?: (pluginId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ArrangeBrowserPanel: React.FC<ArrangeBrowserPanelProps> = ({
  selectedTrackId,
  onFileSelect,
  onPluginSelect,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [activeTab, setActiveTab] = useState('files');

  if (isCollapsed) {
    return (
      <div 
        className="h-full flex-shrink-0 glass-ultra border-l border-primary/20 flex flex-col items-center py-4 gap-4"
        style={{ 
          width: '56px',
          minWidth: '56px',
          backdropFilter: 'blur(80px) saturate(200%)',
          boxShadow: 'inset -1px 0 0 rgba(167, 139, 250, 0.15)'
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-primary/20 rounded transition-all micro-interact chromatic-hover group"
          title="Expand Browser"
        >
          <ChevronLeft size={18} className="text-primary group-hover:scale-110 transition-transform" />
        </button>
        
        {/* Mini tab icons when collapsed */}
        <div className="flex flex-col gap-3 mt-4">
          <div title="Files">
            <Files size={18} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
          </div>
          <div title="Plugins">
            <Grid3x3 size={18} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
          </div>
          <div title="Inspector">
            <Info size={18} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
          </div>
          <div title="Loops">
            <Music size={18} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
          </div>
          <div title="Project">
            <Folder size={18} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full flex-shrink-0 border-l border-primary/20 flex flex-col glass-ultra"
      style={{
        width: '320px',
        minWidth: '320px',
        backdropFilter: 'blur(80px) saturate(220%)',
        boxShadow: 'inset -1px 0 0 rgba(167, 139, 250, 0.15), 0 0 40px rgba(167, 139, 250, 0.1)'
      }}
    >
      {/* Compact Header */}
      <div 
        className="flex items-center justify-between px-4 py-2.5 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent"
      >
        <div className="flex items-center gap-2">
          <Folder size={14} className="text-primary" />
          <h3 className="text-xs font-bold gradient-flow uppercase tracking-wider">Browser</h3>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-primary/20 rounded transition-all micro-interact chromatic-hover"
          title="Collapse Browser"
        >
          <ChevronRight size={16} className="text-primary" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-0 px-1">
          <TabsTrigger 
            value="files" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all text-xs"
          >
            <Files size={13} className="mr-1.5" />
            Files
          </TabsTrigger>
          <TabsTrigger 
            value="plugins"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all text-xs"
          >
            <Grid3x3 size={13} className="mr-1.5" />
            Plugins
          </TabsTrigger>
          <TabsTrigger 
            value="inspector"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all text-xs"
          >
            <Info size={13} className="mr-1.5" />
            Inspector
          </TabsTrigger>
          <TabsTrigger 
            value="loops"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all text-xs"
          >
            <Music size={13} className="mr-1.5" />
            Loops
          </TabsTrigger>
          <TabsTrigger 
            value="project"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all text-xs"
          >
            <Folder size={13} className="mr-1.5" />
            Project
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="files" className="h-full m-0 p-0">
            <FileBrowser onFileSelect={onFileSelect} />
          </TabsContent>

          <TabsContent value="plugins" className="h-full m-0 p-0">
            <PluginBrowserPanel 
              onPluginSelect={onPluginSelect}
              selectedTrackId={selectedTrackId}
            />
          </TabsContent>

          <TabsContent value="inspector" className="h-full m-0 p-0">
            <InspectorPanel selectedTrackId={selectedTrackId} />
          </TabsContent>

          <TabsContent value="loops" className="h-full m-0 p-0">
            <div className="p-4 text-sm text-muted-foreground text-center">
              <Music size={32} className="mx-auto mb-2 opacity-50" />
              Loop library coming soon
            </div>
          </TabsContent>

          <TabsContent value="project" className="h-full m-0 p-0">
            <div className="p-4 text-sm text-muted-foreground text-center">
              <Folder size={32} className="mx-auto mb-2 opacity-50" />
              Project browser coming soon
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
