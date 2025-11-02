/**
 * Production Sidebar - Unified panel for production features
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrackGroupManager } from './TrackGroupManager';
import { TrackTemplateManager } from './TrackTemplateManager';
import { Folder, Users, FileStack } from 'lucide-react';
import { TrackGroup, TrackTemplate } from '@/types/timeline-extended';

interface ProductionSidebarProps {
  // Track Groups
  trackGroups: TrackGroup[];
  selectedTrackIds: string[];
  onCreateGroup: (name: string, trackIds: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleCollapse: (groupId: string) => void;
  onVCAChange: (groupId: string, volume: number) => void;
  
  // Templates
  templates: TrackTemplate[];
  onSaveTemplate: (name: string, description: string) => void;
  onLoadTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
}

export const ProductionSidebar: React.FC<ProductionSidebarProps> = ({
  trackGroups,
  selectedTrackIds,
  onCreateGroup,
  onDeleteGroup,
  onToggleCollapse,
  onVCAChange,
  templates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
}) => {
  const [activeTab, setActiveTab] = useState('groups');

  return (
    <div className="h-full glass-ultra border-r border-gradient flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border/50">
          <TabsTrigger value="groups" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden lg:inline">Groups</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileStack className="h-4 w-4" />
            <span className="hidden lg:inline">Templates</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="groups" className="p-4 space-y-4 mt-0">
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Track Groups
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Group tracks together for unified VCA control
              </p>
              <TrackGroupManager
                groups={trackGroups}
                selectedTrackIds={selectedTrackIds}
                onCreateGroup={onCreateGroup}
                onDeleteGroup={onDeleteGroup}
                onToggleCollapse={onToggleCollapse}
                onVCAChange={onVCAChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="templates" className="p-4 space-y-4 mt-0">
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileStack className="h-4 w-4" />
                Track Templates
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Save and load session configurations
              </p>
              <TrackTemplateManager
                templates={templates}
                onSaveTemplate={onSaveTemplate}
                onLoadTemplate={onLoadTemplate}
                onDeleteTemplate={onDeleteTemplate}
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
