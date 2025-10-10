/**
 * Top Menu Bar - Main navigation and menu system
 */

import { 
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useViewStore } from '@/store/viewStore';
import { useTimelineStore } from '@/store/timelineStore';
import { useToast } from '@/hooks/use-toast';
import { Brain, Save, FolderOpen, FileDown, Undo2, Redo2, Upload } from 'lucide-react';

interface TopMenuBarProps {
  onExport?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onImport?: () => void;
  onAIMix?: () => void;
  onStemSeparation?: () => void;
  onAutoMaster?: () => void;
  transportHidden?: boolean;
  transportFloating?: boolean;
  transportCovered?: boolean;
  onToggleTransportHide?: () => void;
  onToggleTransportFloat?: () => void;
  onToggleTransportCover?: () => void;
}

export function TopMenuBar({ 
  onExport, 
  onSave, 
  onLoad, 
  onImport,
  onAIMix,
  onStemSeparation,
  onAutoMaster,
  transportHidden = false,
  transportFloating = false,
  transportCovered = false,
  onToggleTransportHide,
  onToggleTransportFloat,
  onToggleTransportCover
}: TopMenuBarProps) {
  const { setView, togglePanel } = useViewStore();
  const { setCurrentTool, toggleRippleEdit, rippleEdit, autoScrollEnabled, setAutoScrollEnabled } = useTimelineStore();
  const { toast } = useToast();
  
  return (
    <Menubar className="border-b border-border bg-secondary/30 backdrop-blur-sm rounded-none">
      {/* File Menu */}
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Project
            <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onLoad}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Open Project
            <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import Audio Files
            <MenubarShortcut>⌘I</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onExport}>
            <FileDown className="w-4 h-4 mr-2" />
            Export Mix
            <MenubarShortcut>⌘E</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* Edit Menu */}
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer">Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => toast({ title: "Undo", description: "Not yet implemented" })}>
            <Undo2 className="w-4 h-4 mr-2" />
            Undo
            <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => toast({ title: "Redo", description: "Not yet implemented" })}>
            <Redo2 className="w-4 h-4 mr-2" />
            Redo
            <MenubarShortcut>⌘⇧Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => toast({ title: "Cut", description: "Not yet implemented" })}>
            Cut<MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => toast({ title: "Copy", description: "Not yet implemented" })}>
            Copy<MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => toast({ title: "Paste", description: "Not yet implemented" })}>
            Paste<MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => toast({ title: "Duplicate", description: "Not yet implemented" })}>
            Duplicate<MenubarShortcut>⌘D</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => {
            toggleRippleEdit();
            toast({ 
              title: "Ripple Edit", 
              description: rippleEdit ? "Disabled" : "Enabled" 
            });
          }}>
            {rippleEdit ? "✓" : ""} Ripple Edit<MenubarShortcut>⌘R</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* View Menu */}
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer">View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => setView('arrange')}>
            Arrange View<MenubarShortcut>⌘1</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => setView('mix')}>
            Mix View<MenubarShortcut>⌘2</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => setView('edit')}>
            Edit View<MenubarShortcut>⌘3</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => togglePanel('browser')}>
            Plugin Browser<MenubarShortcut>⌘B</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => togglePanel('mixer')}>
            Show Mixer<MenubarShortcut>M</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => togglePanel('effects')}>
            Effects Rack<MenubarShortcut>E</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* Mix Menu */}
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer">Mix</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => togglePanel('mixer')}>
            Show Mixer
          </MenubarItem>
          <MenubarItem onClick={() => togglePanel('effects')}>
            Show Effects Rack
          </MenubarItem>
          <MenubarItem onClick={() => togglePanel('automation')}>
            Show Automation
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* Transport Menu */}
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer">Transport</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => {
            setAutoScrollEnabled(!autoScrollEnabled);
            toast({ 
              title: "Follow Playhead", 
              description: autoScrollEnabled ? "Disabled" : "Enabled" 
            });
          }}>
            {autoScrollEnabled ? "✓" : ""} Follow Playhead
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onToggleTransportHide}>
            {transportHidden ? "✓" : ""} Hide Transport
          </MenubarItem>
          <MenubarItem onClick={onToggleTransportFloat}>
            {transportFloating ? "✓" : ""} Float Transport
          </MenubarItem>
          <MenubarItem onClick={onToggleTransportCover}>
            {transportCovered ? "✓" : ""} Cover Transport
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* AI Menu */}
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer">
          <Brain className="w-4 h-4 mr-1" />
          AI Tools
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => {
            if (onAIMix) {
              onAIMix();
            } else {
              toast({ 
                title: "AI Mix Assistant", 
                description: "Analyzing your mix and providing intelligent suggestions..."
              });
            }
          }}>
            <Brain className="w-4 h-4 mr-2" />
            AI Mix Assistant
          </MenubarItem>
          <MenubarItem onClick={() => {
            if (onStemSeparation) {
              onStemSeparation();
            } else {
              toast({ 
                title: "Stem Separation", 
                description: "Preparing to separate stems from your audio..."
              });
            }
          }}>
            Stem Separation
          </MenubarItem>
          <MenubarItem onClick={() => {
            if (onAutoMaster) {
              onAutoMaster();
            } else {
              toast({ 
                title: "Auto-Master", 
                description: "Analyzing loudness and applying mastering chain..."
              });
            }
          }}>
            Auto-Master
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => toast({ 
            title: "Voice Control", 
            description: "Voice commands: 'Play', 'Stop', 'Add reverb', 'Increase volume'..." 
          })}>
            Voice Control
            <MenubarShortcut>⌘K</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* Help Menu */}
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => toast({ title: "Keyboard Shortcuts", description: "Press ? to view shortcuts" })}>
            Keyboard Shortcuts
          </MenubarItem>
          <MenubarItem onClick={() => window.open('https://docs.mixxclub.com', '_blank')}>
            Documentation
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => toast({ title: "Mixx Club Pro Studio 2027", description: "Revolutionary DAW Interface v1.0" })}>
            About Mixx Club Pro
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
