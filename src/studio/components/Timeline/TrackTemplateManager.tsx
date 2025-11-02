/**
 * Track Template Manager - Save and load track configurations
 */

import React, { useState } from 'react';
import { Save, FolderOpen, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface TrackTemplate {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  config: {
    tracks: any[];
    routing: any;
    effects: any;
  };
  createdAt: string;
}

interface TrackTemplateManagerProps {
  templates: TrackTemplate[];
  onSaveTemplate: (name: string, description: string) => void;
  onLoadTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
}

export const TrackTemplateManager: React.FC<TrackTemplateManagerProps> = ({
  templates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
}) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  const handleSave = () => {
    if (templateName) {
      onSaveTemplate(templateName, templateDesc);
      setTemplateName('');
      setTemplateDesc('');
      setSaveDialogOpen(false);
      toast.success('Template saved');
    }
  };

  const handleLoad = (templateId: string) => {
    onLoadTemplate(templateId);
    setLoadDialogOpen(false);
    toast.success('Template loaded');
  };

  const handleDelete = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteTemplate(templateId);
    toast.success('Template deleted');
  };

  // Built-in templates
  const builtInTemplates: TrackTemplate[] = [
    {
      id: 'mixing-session',
      name: 'Mixing Session',
      description: '8 audio tracks + 2 bus tracks + master',
      trackCount: 11,
      config: { tracks: [], routing: {}, effects: {} },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mastering',
      name: 'Mastering',
      description: 'Stereo master with metering',
      trackCount: 1,
      config: { tracks: [], routing: {}, effects: {} },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'podcast-edit',
      name: 'Podcast Editing',
      description: '4 dialogue tracks + music track',
      trackCount: 5,
      config: { tracks: [], routing: {}, effects: {} },
      createdAt: new Date().toISOString(),
    },
  ];

  return (
    <div className="flex gap-2">
      {/* Save Template */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Track Template</DialogTitle>
            <DialogDescription>
              Save current track configuration for future sessions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., My Mix Setup"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Template */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Load Template
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Track Template</DialogTitle>
            <DialogDescription>
              Choose from built-in or custom templates
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 py-4">
              {/* Built-in Templates */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Built-in Templates</h3>
                {builtInTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleLoad(template.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {template.trackCount} tracks
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* User Templates */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">My Templates</h3>
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors group"
                      onClick={() => handleLoad(template.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {template.trackCount} tracks
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleDelete(template.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
