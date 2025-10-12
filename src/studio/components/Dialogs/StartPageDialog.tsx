/**
 * Start Page Dialog - Project Templates & Quick Start
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Music, Mic, FileAudio, Headphones, Radio,
  Clock, Sparkles, Settings
} from 'lucide-react';
import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}

const templates: Template[] = [
  {
    id: 'play',
    name: 'Play Now',
    description: 'Play piano, synth, guitar or drums',
    icon: Music,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'content',
    name: 'Create Content',
    description: 'Create a podcast with or without video',
    icon: Mic,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'import',
    name: 'Import Files',
    description: 'Import files and start mixing',
    icon: FileAudio,
    color: 'from-violet-500 to-purple-500'
  },
  {
    id: 'interfaces',
    name: 'Audio Interfaces',
    description: 'Record with PreSonus and Fender devices',
    icon: Headphones,
    color: 'from-orange-500 to-yellow-500'
  },
  {
    id: 'demos',
    name: 'Demos',
    description: 'Demo song(s)',
    icon: Radio,
    color: 'from-cyan-500 to-blue-500'
  },
];

const recentProjects = [
  { name: 'My Latest Mix', date: '2025-10-10' },
  { name: 'Beat Session 01', date: '2025-10-09' },
  { name: 'Vocal Recording', date: '2025-10-08' },
];

interface StartPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewProject?: (templateId: string, projectName: string) => void;
}

export function StartPageDialog({ open, onOpenChange, onNewProject }: StartPageDialogProps) {
  const [projectName, setProjectName] = useState('My New Project');
  const [sampleRate, setSampleRate] = useState('48000');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const handleCreateProject = () => {
    if (selectedTemplate && onNewProject) {
      onNewProject(selectedTemplate, projectName);
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold gradient-flow">
            MixxClub Studio
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="templates" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6">
            <TabsTrigger value="templates" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <Sparkles className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <Clock className="w-4 h-4 mr-2" />
              Recent
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`group relative p-6 rounded-lg border-2 transition-all text-left ${
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/5 scale-[1.02]'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${template.color} rounded-t-lg`} />
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${template.color}`}>
                      <template.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {selectedTemplate && (
              <div className="space-y-4 p-6 border border-border rounded-lg bg-background/50">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Project Settings
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sample-rate">Sample Rate</Label>
                    <select
                      id="sample-rate"
                      value={sampleRate}
                      onChange={(e) => setSampleRate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background"
                    >
                      <option value="44100">44.1 kHz</option>
                      <option value="48000">48 kHz</option>
                      <option value="88200">88.2 kHz</option>
                      <option value="96000">96 kHz</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleCreateProject} className="w-full" size="lg">
                  Create Project
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent" className="flex-1 overflow-auto p-6">
            <div className="space-y-2">
              {recentProjects.map((project, i) => (
                <button
                  key={i}
                  className="w-full p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last modified: {project.date}
                      </p>
                    </div>
                    <FileAudio className="w-8 h-8 text-primary" />
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}