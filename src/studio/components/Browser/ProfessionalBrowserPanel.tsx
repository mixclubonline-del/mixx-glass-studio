/**
 * Professional Browser Panel - Studio One Style
 * Tabbed interface for Instruments, Effects, Loops, Files, etc.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Music, Zap, Disc, FolderOpen, Star, Clock, 
  ChevronRight, ChevronDown, Search, Grid, List
} from 'lucide-react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";

interface BrowserItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  icon?: any;
  children?: BrowserItem[];
}

const instrumentsData: BrowserItem[] = [
  {
    id: 'multi',
    name: 'Multi Instruments',
    type: 'folder',
    children: [
      { id: 'piano', name: 'Grand Piano', type: 'file' },
      { id: 'strings', name: 'String Ensemble', type: 'file' },
      { id: 'synth', name: 'Analog Synth', type: 'file' },
    ]
  },
  {
    id: 'external',
    name: 'External Instruments',
    type: 'folder',
    children: []
  },
  {
    id: 'presets',
    name: 'Track Presets',
    type: 'folder',
    children: [
      { id: 'vocal', name: 'Lead Vocal', type: 'file' },
      { id: 'drum', name: 'Drum Bus', type: 'file' },
    ]
  },
  {
    id: 'favorites',
    name: 'Favorites',
    type: 'folder',
    icon: Star,
    children: []
  },
  {
    id: 'recent',
    name: 'Recent',
    type: 'folder',
    icon: Clock,
    children: []
  },
];

const effectsData: BrowserItem[] = [
  {
    id: 'dynamics',
    name: 'Dynamics',
    type: 'folder',
    children: [
      { id: 'comp1', name: 'MixxCompressor', type: 'file' },
      { id: 'limit', name: 'MixxLimiter', type: 'file' },
      { id: 'gate', name: 'MixxGate', type: 'file' },
    ]
  },
  {
    id: 'eq',
    name: 'EQ',
    type: 'folder',
    children: [
      { id: 'eq1', name: 'MixxEQ', type: 'file' },
      { id: 'eq2', name: 'Pro EQ', type: 'file' },
    ]
  },
  {
    id: 'reverb',
    name: 'Reverb & Delay',
    type: 'folder',
    children: [
      { id: 'rev1', name: 'MixxReverb', type: 'file' },
      { id: 'del1', name: 'MixxDelay', type: 'file' },
    ]
  },
  {
    id: 'modulation',
    name: 'Modulation',
    type: 'folder',
    children: [
      { id: 'chorus', name: 'MixxChorus', type: 'file' },
      { id: 'flanger', name: 'MixxFlanger', type: 'file' },
      { id: 'phaser', name: 'MixxPhaser', type: 'file' },
    ]
  },
];

const loopsData: BrowserItem[] = [
  {
    id: 'drums',
    name: 'Drum Loops',
    type: 'folder',
    children: [
      { id: 'loop1', name: 'Hip Hop Beat 120 BPM', type: 'file' },
      { id: 'loop2', name: 'House Drums 128 BPM', type: 'file' },
    ]
  },
  {
    id: 'bass',
    name: 'Bass Loops',
    type: 'folder',
    children: []
  },
];

function BrowserTree({ items, level = 0 }: { items: BrowserItem[]; level?: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['multi', 'dynamics']));
  
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };
  
  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          <div
            className={`flex items-center gap-2 py-1.5 px-2 hover:bg-primary/10 cursor-pointer rounded transition-colors ${
              level > 0 ? 'ml-4' : ''
            }`}
            onClick={() => item.type === 'folder' && toggleExpand(item.id)}
          >
            {item.type === 'folder' ? (
              expanded.has(item.id) ? (
                <ChevronDown className="w-3 h-3 text-primary" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )
            ) : (
              <div className="w-3 h-3" />
            )}
            {item.icon && <item.icon className="w-4 h-4 text-primary" />}
            {item.type === 'folder' ? (
              <FolderOpen className="w-4 h-4 text-primary" />
            ) : (
              <Music className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm text-foreground">{item.name}</span>
          </div>
          {item.type === 'folder' && expanded.has(item.id) && item.children && (
            <BrowserTree items={item.children} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

export function ProfessionalBrowserPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortMode, setSortMode] = useState<'name' | 'date' | 'type'>('name');
  
  return (
    <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm border-r border-border">
      {/* Browser Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant={sortMode === 'name' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => setSortMode('name')}
          >
            Name
          </Button>
          <Button
            variant={sortMode === 'type' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => setSortMode('type')}
          >
            Type
          </Button>
          <Button
            variant={sortMode === 'date' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => setSortMode('date')}
          >
            Recent
          </Button>
        </div>
      </div>
      
      {/* Browser Tabs */}
      <Tabs defaultValue="instruments" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="instruments" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <Music className="w-4 h-4 mr-1" />
            Instruments
          </TabsTrigger>
          <TabsTrigger value="effects" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <Zap className="w-4 h-4 mr-1" />
            Effects
          </TabsTrigger>
          <TabsTrigger value="loops" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <Disc className="w-4 h-4 mr-1" />
            Loops
          </TabsTrigger>
          <TabsTrigger value="files" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <FolderOpen className="w-4 h-4 mr-1" />
            Files
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="instruments" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              <BrowserTree items={instrumentsData} />
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="effects" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              <BrowserTree items={effectsData} />
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="loops" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              <BrowserTree items={loopsData} />
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="files" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-2 text-sm text-muted-foreground">
              <p>Drag audio files here to import</p>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}