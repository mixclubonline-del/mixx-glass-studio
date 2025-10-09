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
import { Brain, Save, FolderOpen, FileDown, Undo2, Redo2 } from 'lucide-react';

interface TopMenuBarProps {
  onExport?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
}

export function TopMenuBar({ onExport, onSave, onLoad }: TopMenuBarProps) {
  const { setView, togglePanel } = useViewStore();
  
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
          <MenubarItem>Cut<MenubarShortcut>⌘X</MenubarShortcut></MenubarItem>
          <MenubarItem>Copy<MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
          <MenubarItem>Paste<MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
          <MenubarItem>Duplicate<MenubarShortcut>⌘D</MenubarShortcut></MenubarItem>
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
      
      {/* AI Menu */}
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer">
          <Brain className="w-4 h-4 mr-1" />
          AI Tools
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            AI Mix Assistant
          </MenubarItem>
          <MenubarItem>
            Stem Separation
          </MenubarItem>
          <MenubarItem>
            Auto-Master
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Voice Control
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      {/* Help Menu */}
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Keyboard Shortcuts
          </MenubarItem>
          <MenubarItem>
            Documentation
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            About Mixx Club Pro
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
