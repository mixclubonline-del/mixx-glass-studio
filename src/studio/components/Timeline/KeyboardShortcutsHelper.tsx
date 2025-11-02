/**
 * Keyboard Shortcuts Helper - Display available shortcuts
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Keyboard, X } from 'lucide-react';

export const KeyboardShortcutsHelper: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { category: 'Transport', items: [
      { keys: 'Space', action: 'Play/Pause' },
      { keys: 'R', action: 'Record' },
      { keys: 'Esc', action: 'Stop' },
      { keys: 'L', action: 'Toggle Loop' },
      { keys: 'J/K/L', action: 'Shuttle (Back/Stop/Forward)' },
    ]},
    { category: 'Navigation', items: [
      { keys: '←/→', action: 'Step (hold Shift for larger steps)' },
      { keys: 'Home', action: 'Go to start' },
      { keys: 'End', action: 'Go to end' },
      { keys: 'I', action: 'Set loop in point' },
      { keys: 'O', action: 'Set loop out point' },
    ]},
    { category: 'Editing', items: [
      { keys: 'Cmd+C', action: 'Copy regions' },
      { keys: 'Cmd+V', action: 'Paste regions' },
      { keys: 'Cmd+D', action: 'Duplicate regions' },
      { keys: 'Alt+Drag', action: 'Duplicate while dragging' },
      { keys: 'Delete', action: 'Delete regions' },
      { keys: 'Shift+Delete', action: 'Delete with ripple' },
      { keys: 'Cmd+Drag', action: 'Slip edit (shift audio)' },
    ]},
    { category: 'Tools', items: [
      { keys: '1', action: 'Select tool' },
      { keys: '2', action: 'Range tool' },
      { keys: '3', action: 'Split tool' },
      { keys: '4', action: 'Trim tool' },
      { keys: '5', action: 'Fade tool' },
      { keys: 'B', action: 'Toggle browser panel' },
    ]},
    { category: 'Track', items: [
      { keys: 'S', action: 'Solo selected track' },
      { keys: 'M', action: 'Mute selected track' },
      { keys: 'Cmd+A', action: 'Select all regions' },
      { keys: 'Cmd+Shift+R', action: 'Toggle ripple edit' },
    ]},
    { category: 'View', items: [
      { keys: 'Cmd+Plus', action: 'Zoom in' },
      { keys: 'Cmd+Minus', action: 'Zoom out' },
      { keys: 'Cmd+0', action: 'Reset zoom' },
    ]},
  ];

  if (!isOpen) {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="gap-2"
        title="Keyboard Shortcuts"
      >
        <Keyboard size={16} />
        <span className="text-xs">Shortcuts</span>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="glass-ultra w-[800px] max-h-[80vh] overflow-auto rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Keyboard size={20} className="text-primary" />
            <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsOpen(false)}
          >
            <X size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {shortcuts.map((section, i) => (
            <div key={i} className="space-y-2">
              <h3 className="text-sm font-semibold text-primary mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, j) => (
                  <div key={j} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.action}</span>
                    <kbd className="px-2 py-1 rounded bg-muted text-xs font-mono">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Tip:</span> Hold{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Cmd/Ctrl</kbd>
            {' '}+ Click to multi-select regions
          </p>
        </div>
      </div>
    </div>
  );
};
