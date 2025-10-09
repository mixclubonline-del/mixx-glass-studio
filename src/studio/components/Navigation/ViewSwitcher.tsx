/**
 * View Switcher - Toggle between Arrange, Mix, and Edit views
 */

import React from 'react';
import { useViewStore, ViewType } from '@/store/viewStore';
import { Layout, Sliders, Edit3 } from 'lucide-react';

export const ViewSwitcher: React.FC = () => {
  const { currentView, setView } = useViewStore();
  
  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'arrange', label: 'Arrange', icon: <Layout size={16} /> },
    { id: 'mix', label: 'Mix', icon: <Sliders size={16} /> },
    { id: 'edit', label: 'Edit', icon: <Edit3 size={16} /> },
  ];
  
  return (
    <div className="flex gap-1 glass rounded-lg p-1">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => setView(view.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            currentView === view.id
              ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          {view.icon}
          <span className="text-sm font-medium">{view.label}</span>
        </button>
      ))}
    </div>
  );
};
