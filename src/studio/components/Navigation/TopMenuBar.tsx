/**
 * Mixx Club Studio - Top Menu Bar
 * Professional DAW-style menu with desktop integration
 */

import React, { useState } from 'react';
import { useElectron } from '../../../hooks/useElectron';

const TopMenuBar: React.FC = () => {
  const { isElectron, showOpenDialog, showSaveDialog } = useElectron();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleNewProject = () => {
    console.log('New project created');
    // TODO: Implement new project logic
  };

  const handleOpenProject = async () => {
    if (isElectron) {
      const result = await showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Mixx Club Projects', extensions: ['mixx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (result && !result.canceled) {
        console.log('Opening project:', result.filePaths[0]);
        // TODO: Implement project loading logic
      }
    }
  };

  const handleSaveProject = async () => {
    if (isElectron) {
      const result = await showSaveDialog({
        defaultPath: 'untitled.mixx',
        filters: [
          { name: 'Mixx Club Projects', extensions: ['mixx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (result && !result.canceled) {
        console.log('Saving project to:', result.filePath);
        // TODO: Implement project saving logic
      }
    }
  };

  const handleImportAudio = async () => {
    if (isElectron) {
      const result = await showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Audio Files', extensions: ['wav', 'mp3', 'aiff', 'flac', 'm4a'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (result && !result.canceled) {
        console.log('Importing audio files:', result.filePaths);
        // TODO: Implement audio import logic
      }
    }
  };

  const handleExportMix = () => {
    console.log('Exporting mix');
    // TODO: Implement mix export logic
  };

  const handleExternalLink = (url: string) => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.openExternal(url);
            } else {
      window.open(url, '_blank');
    }
  };

  const menuItems = [
    {
      label: 'File',
      items: [
        { label: 'New Project', action: handleNewProject, shortcut: 'Cmd+N' },
        { label: 'Open Project', action: handleOpenProject, shortcut: 'Cmd+O' },
        { label: 'Save Project', action: handleSaveProject, shortcut: 'Cmd+S' },
        { type: 'separator' },
        { label: 'Import Audio', action: handleImportAudio, shortcut: 'Cmd+I' },
        { type: 'separator' },
        { label: 'Export Mix', action: handleExportMix, shortcut: 'Cmd+E' }
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', action: () => console.log('Undo'), shortcut: 'Cmd+Z' },
        { label: 'Redo', action: () => console.log('Redo'), shortcut: 'Cmd+Shift+Z' },
        { type: 'separator' },
        { label: 'Cut', action: () => console.log('Cut'), shortcut: 'Cmd+X' },
        { label: 'Copy', action: () => console.log('Copy'), shortcut: 'Cmd+C' },
        { label: 'Paste', action: () => console.log('Paste'), shortcut: 'Cmd+V' }
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Timeline', action: () => console.log('Show Timeline') },
        { label: 'Track List', action: () => console.log('Show Track List') },
        { label: 'ALS Panel', action: () => console.log('Show ALS Panel') },
        { label: 'AI Assistant', action: () => console.log('Show AI Assistant') },
        { type: 'separator' },
        { label: 'Full Screen', action: () => console.log('Toggle Full Screen'), shortcut: 'F11' }
      ]
    },
    {
      label: 'Transport',
      items: [
        { label: 'Play/Pause', action: () => console.log('Play/Pause'), shortcut: 'Space' },
        { label: 'Stop', action: () => console.log('Stop'), shortcut: 'Escape' },
        { label: 'Record', action: () => console.log('Record'), shortcut: 'R' }
      ]
    },
    {
      label: 'Help',
      items: [
        { label: 'Documentation', action: () => handleExternalLink('https://docs.mixxclub.com') },
        { label: 'Keyboard Shortcuts', action: () => console.log('Show Shortcuts') },
        { type: 'separator' },
        { label: 'About Mixx Club Studio', action: () => console.log('Show About') }
      ]
    }
  ];

  return (
    <div className="top-menu-bar bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold text-white">
          🎵 Mixx Club Studio
        </div>
        <div className="text-sm text-gray-400">
          The Future of Hip-Hop Production
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex items-center gap-1">
        {menuItems.map((menu, index) => (
          <div key={index} className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
              className="px-3 py-2 text-white hover:bg-gray-800 rounded text-sm font-medium"
            >
              {menu.label}
            </button>
            
            {/* Dropdown Menu */}
            {activeMenu === menu.label && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-48">
                {menu.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    {item.type === 'separator' ? (
                      <div className="border-t border-gray-700 my-1" />
                    ) : (
                      <button
                        onClick={() => {
                          item.action?.();
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 text-sm flex items-center justify-between"
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="text-xs text-gray-400 ml-4">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-400">
          {isElectron ? 'Desktop' : 'Web'}
        </div>
        <div className="w-2 h-2 bg-green-500 rounded-full" title="Audio Engine Active" />
        <div className="w-2 h-2 bg-blue-500 rounded-full" title="AI Assistant Active" />
        <div className="w-2 h-2 bg-purple-500 rounded-full" title="Bloom Menu Active" />
      </div>
    </div>
  );
};

export default TopMenuBar;