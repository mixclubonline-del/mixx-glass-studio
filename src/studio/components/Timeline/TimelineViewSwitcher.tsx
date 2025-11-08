/**
 * Timeline View Switcher - Compact view toggle for timeline area
 */

import React from 'react';
import { useViewStore, ViewType } from '@/store/viewStore';
import { Layout, Sliders, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TimelineViewSwitcher: React.FC = () => {
  const { currentView, setView } = useViewStore();
  
  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'arrange', label: 'Arrange', icon: <Layout size={14} /> },
    { id: 'mix', label: 'Mix', icon: <Sliders size={14} /> },
    { id: 'edit', label: 'Edit', icon: <Edit3 size={14} /> },
  ];
  
  return (
    <div className="inline-flex items-center gap-0.5 glass-light rounded-md p-0.5 shadow-sm">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => setView(view.id)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-xs font-medium micro-interact',
            currentView === view.id
              ? 'bg-primary text-primary-foreground shadow-[var(--glow-subtle)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          )}
          title={`${view.label} View`}
        >
          {view.icon}
          <span>{view.label}</span>
        </button>
      ))}
    </div>
  );
};
