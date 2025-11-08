/**
 * View Switcher - Toggle between Arrange, Mix, and Edit views
 */

import React from 'react';
import { useViewStore, ViewType } from '@/store/viewStore';
import { Layout, Sliders, Edit3, Sparkles, Disc3, Gauge } from 'lucide-react';

export const ViewSwitcher: React.FC = () => {
  const { currentView, setView } = useViewStore();
  
  const views: { id: ViewType; label: string; icon: React.ReactNode; tooltip?: string }[] = [
    { id: 'arrange', label: 'Arrange', icon: <Layout size={16} />, tooltip: 'Timeline arrangement view' },
    { id: 'mix', label: 'Mix Console', icon: <Sliders size={16} />, tooltip: 'Split view with timeline and mixer' },
    { id: 'edit', label: 'Edit', icon: <Edit3 size={16} />, tooltip: 'Waveform editor' },
    { id: 'producer-lab', label: 'Producer Lab', icon: <Disc3 size={16} />, tooltip: 'Production tools and instruments' },
    { id: 'master', label: 'Master', icon: <Gauge size={16} />, tooltip: 'Mastering suite' },
    { id: 'ai-studio', label: 'AI Studio', icon: <Sparkles size={16} />, tooltip: 'AI-powered music tools' },
  ];
  
  return (
    <div className="btn-group">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => setView(view.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
            currentView === view.id
              ? 'btn-glass-active text-primary-foreground'
              : 'btn-glass text-muted-foreground hover:text-foreground'
          }`}
          title={view.tooltip}
        >
          {view.icon}
          <span className="text-sm font-medium">{view.label}</span>
        </button>
      ))}
    </div>
  );
};
