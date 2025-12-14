
import React, { useState, useMemo } from 'react';
import { useFlowMotion, useAnimatePresence, AnimatePresence } from '../../../../components/mixxglass';
import { PLUGIN_TIERS, TierName, PluginKey, findPlugin } from '../constants';
import { pluginPreviews } from './shared/MiniVisualizers';
import { PluginBrowserProps, Plugin } from '../types';
import { SearchIcon, MenuIcon, RefreshCwIcon, ArrowUpDownIcon, CheckCircleIcon } from './shared/Icons';
import { MixxGlassKnob } from '../../../../components/mixxglass';

const allPluginsWithKeys = Object.entries(PLUGIN_TIERS).flatMap(([tierName, tierData]) =>
  Object.entries(tierData).map(([pluginKey, pluginData]) => ({
    pluginKey: pluginKey as PluginKey,
    ...pluginData,
  }))
);

const tierCategoryMap: Record<string, string> = {
    core: 'Dynamics',
    neural: 'AI',
    master: 'Mastering',
    signature: 'Creative',
    system: 'Effects',
};

const tierColorMap: Record<string, { text: string, border: string, bg: string }> = {
    core: { text: 'text-cyan-400', border: 'border-cyan-400', bg: 'bg-cyan-400' },
    neural: { text: 'text-pink-400', border: 'border-pink-400', bg: 'bg-pink-400' },
    master: { text: 'text-amber-400', border: 'border-amber-400', bg: 'bg-amber-400' },
    signature: { text: 'text-rose-400', border: 'border-rose-400', bg: 'bg-rose-400' },
    system: { text: 'text-violet-400', border: 'border-violet-400', bg: 'bg-violet-400' },
};

// Plugin Card Component - uses hook at component level
const PluginCard: React.FC<{
    plugin: Plugin & { pluginKey: PluginKey };
    hoveredPlugin: Plugin & { pluginKey: PluginKey } | null;
    setHoveredPlugin: (plugin: Plugin & { pluginKey: PluginKey }) => void;
    onSelectPlugin: (pluginKey: PluginKey) => void;
    tierColorMap: Record<string, { text: string, border: string, bg: string }>;
    showAiRecommendations: boolean;
}> = ({ plugin, hoveredPlugin, setHoveredPlugin, onSelectPlugin, tierColorMap, showAiRecommendations }) => {
    const PreviewComponent = pluginPreviews[plugin.pluginKey as PluginKey];
    const colors = tierColorMap[plugin.tier];
    const isSelected = hoveredPlugin?.id === plugin.id;
    
    // Hook is now called at component level
    const pluginAnimation = useAnimatePresence({
        isVisible: true,
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 200 },
    });

    return (
        <div
            onMouseEnter={() => setHoveredPlugin(plugin)}
            className="w-full"
            style={pluginAnimation.style}
        >
            <div
                onClick={() => onSelectPlugin(plugin.pluginKey)}
                className={`relative w-full h-48 p-4 flex flex-col justify-between rounded-lg border-2 transition-all duration-200 cursor-pointer
                    ${isSelected && colors ? `${colors.border} bg-[#0d1117]/50` : 'border-gray-700 bg-[#0d1117]/80 hover:border-gray-500'}
                `}
            >
                <div>
                    <h3 className={`font-bold ${colors ? colors.text : 'text-gray-400'}`}>{plugin.name}</h3>
                    <p className="text-xs text-gray-400">{plugin.description}</p>
                </div>
                <div className="w-full h-12">
                    {PreviewComponent && <PreviewComponent />}
                </div>
                {showAiRecommendations && plugin.suggestedBy && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-cyan-400">
                        <CheckCircleIcon className="w-3 h-3" />
                        <span>Suggested by {plugin.suggestedBy}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Inspector Panel Component
const InspectorPanel: React.FC<{
    hoveredPlugin: Plugin & { pluginKey: PluginKey };
    onSelectPlugin: (pluginKey: PluginKey) => void;
    tierCategoryMap: Record<string, string>;
}> = ({ hoveredPlugin, onSelectPlugin, tierCategoryMap }) => {
    const panelAnimation = useAnimatePresence({
        isVisible: true,
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
        transition: { duration: 200 },
    });

    return (
        <div
            className="w-72 flex-shrink-0 bg-[#0d1117] rounded-lg border border-gray-700 p-6 flex flex-col justify-between"
            style={panelAnimation.style}
        >
            <div>
                <h2 className="font-orbitron text-2xl font-bold text-white">{hoveredPlugin.name}</h2>
                <p className="text-gray-400">{tierCategoryMap[hoveredPlugin.tier]}</p>

                <div className="my-8 flex items-center justify-center">
                    <MixxGlassKnob value={50} setValue={() => {}} label="" paramName="" isLearning={false} onMidiLearn={() => {}} size={120} />
                </div>

                <p className="text-sm text-gray-300">
                    A powerful {tierCategoryMap[hoveredPlugin.tier].toLowerCase()} tool for professional {hoveredPlugin.description.toLowerCase()}
                </p>
            </div>
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => onSelectPlugin(hoveredPlugin.pluginKey)}
                    className="w-full py-3 bg-cyan-500 text-black font-bold rounded-md hover:bg-cyan-400 transition-colors"
                >
                    Load
                </button>
                <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">Favorite</button>
                    <button className="flex-1 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">Demo</button>
                </div>
            </div>
        </div>
    );
};


export const PluginBrowser: React.FC<PluginBrowserProps> = ({ onSelectPlugin }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [hoveredPlugin, setHoveredPlugin] = useState<(Plugin & { pluginKey: PluginKey }) | null>(allPluginsWithKeys[0]);
    const [showAiRecommendations, setShowAiRecommendations] = useState(true);

    const categories = ['All', ...Object.values(tierCategoryMap)];

    const filteredPlugins = useMemo(() => {
        return allPluginsWithKeys.filter(plugin => {
            const nameMatch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase());
            const categoryMatch = activeCategory === 'All' || tierCategoryMap[plugin.tier] === activeCategory;
            return nameMatch && categoryMatch;
        });
    }, [searchQuery, activeCategory]);

    return (
        <div className="w-full h-full flex flex-col bg-[#161b22] p-4 font-sans">
            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-gray-700">
                 <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>File</span>
                    <span>Edit</span>
                    <span>View</span>
                    <span>Mix</span>
                    <span>AI Tools</span>
                    <span>Help</span>
                </div>
                <h1 className="font-orbitron text-xl font-bold text-gray-200">Plugin Browser</h1>
                <button className="text-gray-400 hover:text-white">
                    <MenuIcon className="w-6 h-6" />
                </button>
            </header>

            {/* Search and Filter Bar */}
            <div className="flex-shrink-0 flex items-center gap-6 py-4 border-b border-gray-700">
                <div className="relative flex-grow max-w-xs">
                    <SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Find a plugin..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0d1117] border border-gray-600 rounded-md pl-10 pr-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {categories.map(cat => (
                         <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                activeCategory === cat 
                                ? 'bg-cyan-500 text-black'
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex mt-4 overflow-hidden gap-4">
                {/* Plugin Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        <AnimatePresence>
                        {filteredPlugins.map(plugin => (
                            <PluginCard
                                key={plugin.id}
                                plugin={plugin}
                                hoveredPlugin={hoveredPlugin}
                                setHoveredPlugin={setHoveredPlugin}
                                onSelectPlugin={onSelectPlugin}
                                tierColorMap={tierColorMap}
                                showAiRecommendations={showAiRecommendations}
                            />
                        ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Inspector Panel */}
                <AnimatePresence mode="wait">
                {hoveredPlugin && (
                    <InspectorPanel
                        key={hoveredPlugin.id}
                        hoveredPlugin={hoveredPlugin}
                        onSelectPlugin={onSelectPlugin}
                        tierCategoryMap={tierCategoryMap}
                    />
                )}
                {!hoveredPlugin && (
                    <div className="w-72 flex-shrink-0 bg-[#0d1117] rounded-lg border border-gray-700 p-6 flex flex-col justify-center text-center text-gray-500">
                        <p>Hover over a plugin to see details.</p>
                    </div>
                )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <footer className="flex-shrink-0 flex items-center justify-between pt-4 mt-4 border-t border-gray-700">
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-gray-400 hover:text-white"><RefreshCwIcon className="w-4 h-4" /> Refresh</button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-white"><ArrowUpDownIcon className="w-4 h-4" /> Sort</button>
                </div>
                 <div className="flex items-center gap-3">
                    <label htmlFor="ai-recs" className="text-gray-400 font-semibold">AI Recommendations</label>
                    <button onClick={() => setShowAiRecommendations(!showAiRecommendations)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${showAiRecommendations ? 'bg-cyan-500' : 'bg-gray-600'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showAiRecommendations ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </footer>
        </div>
    );
};
