/**
 * Plugin Browser - Full-screen overlay with search and categories
 */

import { useState, useEffect } from 'react';
import { Search, X, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PluginManager, PluginDefinition } from '@/audio/plugins/PluginManager';
import { cn } from '@/lib/utils';
import mixxtuneCover from '@/assets/plugins/mixxtune-cover.png';
import mixxreverbCover from '@/assets/plugins/mixxreverb-cover.png';
import mixxdelayCover from '@/assets/plugins/mixxdelay-cover.png';
import mixxeqCover from '@/assets/plugins/mixxeq-cover.png';
import mixxchorusCover from '@/assets/plugins/mixxchorus-cover.png';
import mixxcompressorCover from '@/assets/plugins/mixxcompressor-cover.png';
import mixxexciterCover from '@/assets/plugins/mixxexciter-cover.png';
import mixxflangerCover from '@/assets/plugins/mixxflanger-cover.png';
import mixxgateCover from '@/assets/plugins/mixxgate-cover.png';
import mixxlimiterCover from '@/assets/plugins/mixxlimiter-cover.png';
import mixxmultibandcompCover from '@/assets/plugins/mixxmultibandcomp-cover.png';
import mixxphaserCover from '@/assets/plugins/mixxphaser-cover.png';
import mixxsaturatorCover from '@/assets/plugins/mixxsaturator-cover.png';
import mixxstereoimagerCover from '@/assets/plugins/mixxstereoimager-cover.png';
import mixxtransientCover from '@/assets/plugins/mixxtransient-cover.png';

interface PluginBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onPluginSelect: (pluginId: string) => void;
}

const categories = [
  { id: 'all', name: 'All Plugins' },
  { id: 'dynamics', name: 'Dynamics' },
  { id: 'effects', name: 'Effects' },
  { id: 'ai', name: 'AI' },
  { id: 'mastering', name: 'Mastering' },
  { id: 'creative', name: 'Creative' },
];

export function PluginBrowser({ isOpen, onClose, onPluginSelect }: PluginBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [plugins, setPlugins] = useState<PluginDefinition[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDefinition | null>(null);
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);
  
  useEffect(() => {
    const updatePlugins = () => {
      let filtered = PluginManager.getPlugins();
      
      if (selectedCategory !== 'all') {
        filtered = PluginManager.getPluginsByCategory(selectedCategory);
      }
      
      if (searchQuery) {
        filtered = PluginManager.searchPlugins(searchQuery);
      }
      
      setPlugins(filtered);
    };
    
    updatePlugins();
    const unsubscribe = PluginManager.subscribe(updatePlugins);
    return unsubscribe;
  }, [selectedCategory, searchQuery]);
  
  if (!isOpen) return null;
  
  const handlePluginClick = (plugin: PluginDefinition) => {
    setSelectedPlugin(plugin);
  };
  
  const handlePluginDoubleClick = (plugin: PluginDefinition) => {
    onPluginSelect(plugin.metadata.id);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onClose}
            className="gap-2 neon-glow-prime"
          >
            <X className="w-5 h-5" />
            Close Browser
          </Button>
          
          <div className="h-8 w-px bg-border" />
          
          <h2 className="text-2xl font-bold neon-text">Plugin Suite</h2>
          
          {/* Search */}
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Find a plugin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIRecommendations(!showAIRecommendations)}
          >
            <Sparkles className={cn(
              "w-4 h-4 mr-2",
              showAIRecommendations && "text-[hsl(var(--prime-500))]"
            )} />
            AI Recommendations
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedPlugin(null);
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
      
      {/* Categories */}
      <div className="flex gap-2 px-6 py-3 border-b border-border bg-secondary/20">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Plugin grid */}
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {plugins.map((plugin) => (
              <div
                key={plugin.metadata.id}
                className={cn(
                  "glass rounded-lg p-4 cursor-pointer transition-all hover:scale-105",
                  "border border-border hover:border-[hsl(var(--neon-blue))] hover:shadow-[0_0_20px_hsl(var(--neon-blue)/0.3)]",
                  selectedPlugin?.metadata.id === plugin.metadata.id && "border-[hsl(var(--neon-blue))] shadow-[0_0_20px_hsl(var(--neon-blue)/0.3)]"
                )}
                onClick={() => handlePluginClick(plugin)}
                onDoubleClick={() => handlePluginDoubleClick(plugin)}
              >
                {/* Thumbnail */}
                <div className="aspect-square rounded bg-gradient-to-br from-[hsl(var(--prime-500))]/20 to-[hsl(var(--neon-pink))]/20 mb-3 flex items-center justify-center overflow-hidden">
                  {plugin.metadata.id === 'mixxtune' ? (
                    <img src={mixxtuneCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxreverb' ? (
                    <img src={mixxreverbCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxdelay' ? (
                    <img src={mixxdelayCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxeq' ? (
                    <img src={mixxeqCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxchorus' ? (
                    <img src={mixxchorusCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxcompressor' ? (
                    <img src={mixxcompressorCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxexciter' ? (
                    <img src={mixxexciterCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxflanger' ? (
                    <img src={mixxflangerCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxgate' ? (
                    <img src={mixxgateCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxlimiter' ? (
                    <img src={mixxlimiterCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxmultibandcomp' ? (
                    <img src={mixxmultibandcompCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxphaser' ? (
                    <img src={mixxphaserCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxsaturator' ? (
                    <img src={mixxsaturatorCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxstereoimager' ? (
                    <img src={mixxstereoimagerCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : plugin.metadata.id === 'mixxtransient' ? (
                    <img src={mixxtransientCover} alt={plugin.metadata.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl">∞</div>
                  )}
                </div>
                
                {/* Info */}
                <h3 className="font-semibold text-sm mb-1">{plugin.metadata.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {plugin.metadata.description}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {plugin.metadata.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* AI Badge */}
                {showAIRecommendations && Math.random() > 0.5 && (
                  <div className="mt-2 text-[10px] text-[hsl(var(--prime-500))] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Suggested by Prime
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {plugins.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No plugins found matching your search.</p>
            </div>
          )}
        </ScrollArea>
        
        {/* Preview panel */}
        {selectedPlugin && (
          <div className="w-80 border-l border-border bg-secondary/20 p-6">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-[hsl(var(--prime-500))]/30 to-[hsl(var(--neon-pink))]/30 flex items-center justify-center overflow-hidden">
                  {selectedPlugin.metadata.id === 'mixxtune' ? (
                    <img src={mixxtuneCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxreverb' ? (
                    <img src={mixxreverbCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxdelay' ? (
                    <img src={mixxdelayCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxeq' ? (
                    <img src={mixxeqCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxchorus' ? (
                    <img src={mixxchorusCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxcompressor' ? (
                    <img src={mixxcompressorCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxexciter' ? (
                    <img src={mixxexciterCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxflanger' ? (
                    <img src={mixxflangerCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxgate' ? (
                    <img src={mixxgateCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxlimiter' ? (
                    <img src={mixxlimiterCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxmultibandcomp' ? (
                    <img src={mixxmultibandcompCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxphaser' ? (
                    <img src={mixxphaserCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxsaturator' ? (
                    <img src={mixxsaturatorCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxstereoimager' ? (
                    <img src={mixxstereoimagerCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : selectedPlugin.metadata.id === 'mixxtransient' ? (
                    <img src={mixxtransientCover} alt={selectedPlugin.metadata.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-6xl">∞</div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-1">{selectedPlugin.metadata.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPlugin.metadata.manufacturer}</p>
                </div>
                
                <p className="text-sm">{selectedPlugin.metadata.description}</p>
                
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Category</h4>
                  <span className="text-sm capitalize">{selectedPlugin.metadata.category}</span>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlugin.metadata.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-3 py-1 rounded-full bg-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Presets</h4>
                  <p className="text-sm">{selectedPlugin.metadata.presetCount} factory presets</p>
                </div>
                
                <Button
                  className="w-full"
                  onClick={() => handlePluginDoubleClick(selectedPlugin)}
                >
                  Load Plugin
                </Button>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
