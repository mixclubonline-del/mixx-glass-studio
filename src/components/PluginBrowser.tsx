// components/PluginBrowser.tsx
import React from 'react';
import { FxWindowConfig, FxWindowId, TrackData } from '../App';
import { PlusCircleIcon, XIcon } from './icons';

interface PluginBrowserProps {
  trackId: string;
  onClose: () => void;
  onAddPlugin: (trackId: string, pluginId: FxWindowId) => void;
  fxWindows: FxWindowConfig[]; // All available plugin configs
  inserts: Record<string, FxWindowId[]>; // Current inserts for all tracks
}

const PluginBrowser: React.FC<PluginBrowserProps> = ({ trackId, onClose, onAddPlugin, fxWindows, inserts }) => {
  const currentTrackInserts = inserts[trackId] || [];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-filter backdrop-blur-md" onClick={onClose}>
      <div 
        className="relative w-[400px] h-[500px] rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-900/50 border border-gray-500/50 flex flex-col p-6 shadow-2xl shadow-gray-500/20" 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-widest text-gray-200">ADD PLUGIN</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </header>
        
        <div className="flex-grow overflow-y-auto pr-2">
          {fxWindows.length === 0 && <p className="text-gray-400 text-center">No plugins available.</p>}
          {fxWindows.map(plugin => {
            const isAdded = currentTrackInserts.includes(plugin.id);
            return (
              <div 
                key={plugin.id} 
                className={`flex items-center justify-between p-3 mb-2 rounded-md transition-colors 
                            ${isAdded ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed' : 'bg-gray-800/50 hover:bg-white/10 cursor-pointer text-gray-200'}`}
                onClick={() => !isAdded && onAddPlugin(trackId, plugin.id)}
              >
                <span className="font-semibold">{plugin.name}</span>
                {isAdded ? (
                  <span className="text-sm text-gray-500">Added</span>
                ) : (
                  <PlusCircleIcon className="w-5 h-5 text-cyan-400" />
                )}
              </div>
            );
          })}
        </div>

        <footer className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors">Close</button>
        </footer>
      </div>
    </div>
  );
};

export default PluginBrowser;
