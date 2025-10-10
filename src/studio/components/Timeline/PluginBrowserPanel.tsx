/**
 * Plugin Browser Panel - Compact plugin browser for left sidebar
 */

import React, { useState } from 'react';
import { Search, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PluginManager } from '@/audio/plugins/PluginManager';

interface PluginBrowserPanelProps {
  onPluginSelect?: (pluginId: string) => void;
  selectedTrackId?: string | null;
}

export const PluginBrowserPanel: React.FC<PluginBrowserPanelProps> = ({ 
  onPluginSelect,
  selectedTrackId 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['All', 'AI', 'Effects', 'Dynamics', 'Creative', 'Mastering'];

  const allPlugins = PluginManager.getAllMetadata();
  const filteredPlugins = allPlugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || 
                           plugin.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Selected Track Indicator */}
      {selectedTrackId && (
        <div className="px-3 py-2 bg-primary/10 border-b border-primary/20">
          <div className="text-xs text-muted-foreground">Loading to:</div>
          <div className="text-sm font-medium text-primary truncate">{selectedTrackId}</div>
        </div>
      )}
      
      {!selectedTrackId && (
        <div className="px-3 py-2 bg-muted/30 border-b border-border/30">
          <div className="text-xs text-muted-foreground">Select a track first</div>
        </div>
      )}
      
      {/* Search */}
      <div className="p-3 border-b border-border/30">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm bg-background/50"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-3 py-2 border-b border-border/30">
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === 'All' ? null : category)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                (category === 'All' && !selectedCategory) || category === selectedCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/50 hover:bg-primary/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Plugin List */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {filteredPlugins.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No plugins found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredPlugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-primary/10 cursor-pointer group transition-colors"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('plugin-id', plugin.id);
                  }}
                  onClick={() => onPluginSelect?.(plugin.id)}
                >
                  <Zap size={16} className="text-primary shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{plugin.name}</div>
                    <div className="text-xs text-muted-foreground">{plugin.category}</div>
                  </div>

                  <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    Drag
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
