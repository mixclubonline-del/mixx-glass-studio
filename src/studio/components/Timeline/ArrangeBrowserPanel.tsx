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
      <div className="h-full w-12 glass border-r border-border/30 flex flex-col items-center py-4 gap-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-primary/10 rounded transition-colors"
          title="Expand Browser"
        >
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>
        <div className="flex flex-col gap-3">
          <Files size={18} className="text-muted-foreground" />
          <Grid3x3 size={18} className="text-muted-foreground" />
          <Info size={18} className="text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-[320px] glass border-r border-border/30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <h3 className="text-sm font-semibold text-foreground">Browser</h3>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-primary/10 rounded transition-colors"
          title="Collapse Browser"
        >
          <ChevronLeft size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border/30 bg-transparent p-0">
          <TabsTrigger 
            value="files" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Files size={14} className="mr-1.5" />
            Files
          </TabsTrigger>
          <TabsTrigger 
            value="plugins"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Grid3x3 size={14} className="mr-1.5" />
            Plugins
          </TabsTrigger>
          <TabsTrigger 
            value="inspector"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Info size={14} className="mr-1.5" />
            Inspector
          </TabsTrigger>
          <TabsTrigger 
            value="loops"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Music size={14} className="mr-1.5" />
            Loops
          </TabsTrigger>
          <TabsTrigger 
            value="project"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Folder size={14} className="mr-1.5" />
            Project
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="files" className="h-full m-0 p-0">
            <FileBrowser onFileSelect={onFileSelect} />
          </TabsContent>

          <TabsContent value="plugins" className="h-full m-0 p-0">
            <PluginBrowserPanel onPluginSelect={onPluginSelect} />
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
