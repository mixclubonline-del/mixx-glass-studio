/**
 * Enhanced Top Menu Bar - Complete Professional DAW Menu System
 */

import { 
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarCheckboxItem,
} from "@/components/ui/menubar";
import { useViewStore } from '@/store/viewStore';
import { useTimelineStore } from '@/store/timelineStore';
import { useTracksStore } from '@/store/tracksStore';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, Save, FolderOpen, FileDown, Undo2, Redo2, Upload, 
  Plus, Trash2, Copy, Scissors, Volume2, Music, Zap,
  Eye, EyeOff, Settings, Home, Lightbulb
} from 'lucide-react';
import mixxclubLogo from '@/assets/mixxclub-logo.png';
import { useState } from 'react';

interface EnhancedTopMenuBarProps {
  onExport?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onImport?: () => void;
  onNewProject?: () => void;
  transportHidden?: boolean;
  transportFloating?: boolean;
  onToggleTransportHide?: () => void;
  onToggleTransportFloat?: () => void;
}

export function EnhancedTopMenuBar({ 
  onExport, 
  onSave, 
  onLoad, 
  onImport,
  onNewProject,
  transportHidden = false,
  transportFloating = false,
  onToggleTransportHide,
  onToggleTransportFloat,
}: EnhancedTopMenuBarProps) {
  const { setView, togglePanel } = useViewStore();
  const { 
    setCurrentTool, toggleRippleEdit, rippleEdit, 
    autoScrollEnabled, setAutoScrollEnabled,
    loopEnabled, setLoopEnabled
  } = useTimelineStore();
  const { addTrack, removeTrack, selectedTrackId, setAddTrackDialogOpen } = useTracksStore();
  const { toast } = useToast();
  
  const [showStartPage, setShowStartPage] = useState(false);
  
  const handleAddTrack = (type: 'audio' | 'instrument' | 'folder' | 'automation') => {
    const newTrack = {
      id: `track-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track`,
      type,
      volume: 0,
      pan: 0,
      muted: false,
      solo: false,
      color: '#8b5cf6',
      height: 80,
      inserts: []
    };
    addTrack(newTrack as any);
    toast({ title: `Added ${type} track` });
  };
  
  return (
    <Menubar className="border-b-2 border-primary/40 bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-sm rounded-none">
      <div className="flex items-center gap-4 px-4 py-2">
        <img 
          src={mixxclubLogo} 
          alt="MixxClub Studio" 
          className="h-10 w-auto logo-glow logo-pulse cursor-pointer transition-all hover:scale-110" 
          onClick={() => setShowStartPage(true)}
        />
        <div className="flex flex-col">
          <span className="text-xs font-black gradient-flow uppercase tracking-wider">
            MixxClub
          </span>
          <span className="text-[0.6rem] text-primary font-bold uppercase tracking-wide">
            Studio 2027
          </span>
        </div>
        <div className="h-8 w-px bg-gradient-to-b from-primary to-secondary"></div>
      </div>
      
      {/* File Menu */}
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => setShowStartPage(true)}>
            <Home className="w-4 h-4 mr-2" />
            Start Page
            <MenubarShortcut>⌥⇧F</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onNewProject}>
            <Plus className="w-4 h-4 mr-2" />
            New Song
            <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
            <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => toast({ title: "Save As..." })}>
            Save As...
            <MenubarShortcut>⌘⇧S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onLoad}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Open...
            <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Recent Songs</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>My Latest Mix.song</MenubarItem>
              <MenubarItem>Beat Session 01.song</MenubarItem>
              <MenubarItem>Vocal Recording.song</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem onClick={onImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import File...
            <MenubarShortcut>⌥⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Import Song Data...
            <MenubarShortcut>⌥⌘I</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onExport}>
            <FileDown className="w-4 h-4 mr-2" />
            Export Mixdown...
            <MenubarShortcut>⌘E</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Export Stems...
            <MenubarShortcut>⌥⌘E</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Song Setup...</MenubarItem>
          <MenubarItem>Song Information</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* Edit Menu */}
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Undo2 className="w-4 h-4 mr-2" />
            Undo
            <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Redo2 className="w-4 h-4 mr-2" />
            Redo
            <MenubarShortcut>⌘⇧Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Scissors className="w-4 h-4 mr-2" />
            Cut
            <MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Copy className="w-4 h-4 mr-2" />
            Copy
            <MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Paste
            <MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Paste at Original Position
            <MenubarShortcut>⌥⌘V</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Duplicate
            <MenubarShortcut>⌘D</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Select All
            <MenubarShortcut>⌘A</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Select From Start to Cursor
            <MenubarShortcut>⇧P</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Select From Cursor to End
            <MenubarShortcut>⇧N</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem checked={rippleEdit} onCheckedChange={toggleRippleEdit}>
            Ripple Edit
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* Track Menu */}
      <MenubarMenu>
        <MenubarTrigger>Track</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => handleAddTrack('audio')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Audio Track (mono)
            <MenubarShortcut>T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => handleAddTrack('audio')}>
            Add Audio Track (stereo)
          </MenubarItem>
          <MenubarItem onClick={() => handleAddTrack('instrument')}>
            <Music className="w-4 h-4 mr-2" />
            Add Instrument Track
          </MenubarItem>
          <MenubarItem onClick={() => handleAddTrack('automation')}>
            Add Automation Track
          </MenubarItem>
          <MenubarItem onClick={() => handleAddTrack('folder')}>
            Add Folder Track
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Add Tracks for all Inputs
          </MenubarItem>
          <MenubarItem>
            Add Bus for Selected Channels
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => selectedTrackId && removeTrack(selectedTrackId)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Remove Track
            <MenubarShortcut>⌥T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Duplicate
          </MenubarItem>
          <MenubarItem>
            Duplicate (complete)
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Transform</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Merge to Audio Part</MenubarItem>
              <MenubarItem>Render to Audio Track</MenubarItem>
              <MenubarItem>Convert to Folder</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger>Automation</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Show Automation</MenubarItem>
              <MenubarItem>Hide Automation</MenubarItem>
              <MenubarItem>Clear Automation</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>
            Store Track Preset...
          </MenubarItem>
          <MenubarItem>
            Load Track Preset...
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* Audio Menu */}
      <MenubarMenu>
        <MenubarTrigger>Audio</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Volume2 className="w-4 h-4 mr-2" />
            Normalize Audio
            <MenubarShortcut>⌃N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Reverse Audio
            <MenubarShortcut>⌘R</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Zap className="w-4 h-4 mr-2" />
            Separate Stems
            <MenubarShortcut>⌘U</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Strip Silence
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Fade In to Cursor
          </MenubarItem>
          <MenubarItem>
            Fade Out from Cursor
          </MenubarItem>
          <MenubarItem>
            Create Autofades
            <MenubarShortcut>⌥X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Create Crossfades
            <MenubarShortcut>X</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Increase Volume
            <MenubarShortcut>⌃+</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Decrease Volume
            <MenubarShortcut>⌃-</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Reset Gain Envelope
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Lightbulb className="w-4 h-4 mr-2" />
            Detect Tempo
          </MenubarItem>
          <MenubarItem>
            Detect Transients
          </MenubarItem>
          <MenubarItem>
            Extract to Tempo Track
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Detect Chords
          </MenubarItem>
          <MenubarItem>
            Extract to Chord Track
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* Transport Menu */}
      <MenubarMenu>
        <MenubarTrigger>Transport</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Start
            <MenubarShortcut>⎵</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Stop
            <MenubarShortcut>0</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Return to Zero
            <MenubarShortcut>,</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Goto Time...
            <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem checked={loopEnabled} onCheckedChange={(checked) => setLoopEnabled(checked)}>
            Loop Active
            <MenubarShortcut>/</MenubarShortcut>
          </MenubarCheckboxItem>
          <MenubarItem>
            Loop Selection
            <MenubarShortcut>⌥P</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Goto Loop Start
            <MenubarShortcut>1</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Goto Loop End
            <MenubarShortcut>2</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Insert Marker
            <MenubarShortcut>Y</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Goto Next Marker
            <MenubarShortcut>⌥N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Goto Previous Marker
            <MenubarShortcut>⌥B</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem checked={autoScrollEnabled} onCheckedChange={(checked) => setAutoScrollEnabled(checked)}>
            Follow Playhead
          </MenubarCheckboxItem>
          <MenubarItem>
            Metronome Setup
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* View Menu */}
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => setShowStartPage(true)}>
            <Home className="w-4 h-4 mr-2" />
            Start Page
            <MenubarShortcut>⌥⇧F</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => setView('arrange')}>
            Arrange View
            <MenubarShortcut>F2</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => setView('mix')}>
            Mix View
            <MenubarShortcut>F3</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => setView('edit')}>
            Edit View
            <MenubarShortcut>F4</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem checked={true} onCheckedChange={() => togglePanel('browser')}>
            <Eye className="w-4 h-4 mr-2" />
            Browser
            <MenubarShortcut>F5</MenubarShortcut>
          </MenubarCheckboxItem>
          <MenubarItem onClick={() => togglePanel('inspector')}>
            Inspector
            <MenubarShortcut>F6</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => togglePanel('mixer')}>
            Mixer
            <MenubarShortcut>F7</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => togglePanel('metering')}>
            Metering Dashboard
          </MenubarItem>
          <MenubarItem>
            Plugin Manager
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Zoom</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Zoom In<MenubarShortcut>⌘+</MenubarShortcut></MenubarItem>
              <MenubarItem>Zoom Out<MenubarShortcut>⌘-</MenubarShortcut></MenubarItem>
              <MenubarItem>Zoom to Selection<MenubarShortcut>⌘⇧Z</MenubarShortcut></MenubarItem>
              <MenubarItem>Zoom Full<MenubarShortcut>⌘⇧F</MenubarShortcut></MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
      
      {/* AI Tools Menu */}
      <MenubarMenu>
        <MenubarTrigger>
          <Brain className="w-4 h-4 mr-1" />
          AI Tools
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Brain className="w-4 h-4 mr-2" />
            AI Mix Assistant
            <MenubarShortcut>⌘⇧A</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Stem Separation
            <MenubarShortcut>⌘U</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Auto-Master
            <MenubarShortcut>⌘⇧M</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Vocal Tune
          </MenubarItem>
          <MenubarItem>
            Smart EQ
          </MenubarItem>
          <MenubarItem>
            Intelligent Compress
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Voice Control
            <MenubarShortcut>⌘K</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* Help Menu */}
      <MenubarMenu>
        <MenubarTrigger>Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Keyboard Shortcuts
            <MenubarShortcut>?</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => window.open('https://docs.mixxclub.com', '_blank')}>
            Documentation
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Check for Updates
          </MenubarItem>
          <MenubarItem>
            About MixxClub Studio
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}