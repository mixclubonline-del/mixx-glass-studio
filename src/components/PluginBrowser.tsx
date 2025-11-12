// components/PluginBrowser.tsx
import React, { useMemo, useState } from "react";
import { FxWindowConfig, FxWindowId } from "../App";
import { PlusCircleIcon, XIcon, StarIcon } from "./icons";
import { hexToRgba } from "../utils/ALS";

interface PluginBrowserProps {
  trackId: string;
  onClose: () => void;
  onAddPlugin: (trackId: string, pluginId: FxWindowId) => void;
  fxWindows: FxWindowConfig[]; // All available plugin configs
  inserts: Record<string, FxWindowId[]>; // Current inserts for all tracks
  inventory: Array<{
    id: FxWindowId;
    name: string;
    base: string;
    glow: string;
    isFavorite: boolean;
    isCurated: boolean;
  }>;
  favorites: Record<FxWindowId, boolean>;
  onToggleFavorite: (pluginId: FxWindowId) => void;
}

const PluginBrowser: React.FC<PluginBrowserProps> = ({
  trackId,
  onClose,
  onAddPlugin,
  fxWindows,
  inserts,
  inventory,
  favorites,
  onToggleFavorite,
}) => {
  const currentTrackInserts = inserts[trackId] || [];
  const [searchTerm, setSearchTerm] = useState("");

  const fxConfigMap = useMemo(() => {
    const map = new Map<FxWindowId, FxWindowConfig>();
    fxWindows.forEach((fx) => map.set(fx.id, fx));
    return map;
  }, [fxWindows]);

  // Browser roster: what -> ordered map of available modules, why -> fuel curated/favorite groupings, how -> stable sort by name with ALS tint metadata. (Reduction / Flow / Recall)
  const normalizedInventory = useMemo(() => {
    const sorted = [...inventory];
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory]);

  const curatedList = useMemo(
    () => normalizedInventory.filter((item) => item.isCurated),
    [normalizedInventory]
  );

  const favoriteList = useMemo(
    () => normalizedInventory.filter((item) => favorites[item.id]),
    [favorites, normalizedInventory]
  );

  const filteredInventory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return normalizedInventory;
    return normalizedInventory.filter((item) =>
      item.name.toLowerCase().includes(term)
    );
  }, [normalizedInventory, searchTerm]);

  const handleAdd = (pluginId: FxWindowId) => {
    if (currentTrackInserts.includes(pluginId)) return;
    onAddPlugin(trackId, pluginId);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-filter backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-[480px] h-[560px] rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-900/50 border border-gray-500/40 flex flex-col p-6 shadow-2xl shadow-purple-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold tracking-[0.4em] text-gray-100 uppercase">
            Insert Bloom
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            aria-label="Close plugin browser"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </header>

        <div className="flex flex-col gap-3 flex-grow overflow-hidden">
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/35 px-3 py-2">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search flow modules"
              className="flex-1 bg-transparent text-[0.6rem] uppercase tracking-[0.35em] text-white/80 placeholder:text-white/30 focus:outline-none"
            />
          </div>

          {!searchTerm && favoriteList.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="text-[0.48rem] uppercase tracking-[0.35em] text-white/55">
                Favorites
              </div>
              <div className="flex flex-wrap gap-2">
                {favoriteList.map((plugin) => (
                  <button
                    key={`fav-${plugin.id}`}
                    onClick={() => handleAdd(plugin.id)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[0.48rem] uppercase tracking-[0.35em] text-white/80 border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
                    style={{
                      boxShadow: `0 0 12px ${hexToRgba(plugin.glow, 0.35)}`,
                      background: `linear-gradient(135deg, ${hexToRgba(
                        plugin.base,
                        0.18
                      )}, transparent)`
                    }}
                  >
                    <span className="truncate">{plugin.name}</span>
                    <StarIcon filled className="w-3 h-3 text-amber-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!searchTerm && curatedList.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="text-[0.48rem] uppercase tracking-[0.35em] text-white/55">
                Curated signal chain
              </div>
              <div className="flex flex-wrap gap-2">
                {curatedList.map((plugin) => (
                  <button
                    key={`curated-${plugin.id}`}
                    onClick={() => handleAdd(plugin.id)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[0.48rem] uppercase tracking-[0.35em] text-white/80 border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
                    style={{
                      boxShadow: `0 0 10px ${hexToRgba(plugin.glow, 0.3)}`,
                      background: `linear-gradient(135deg, ${hexToRgba(
                        plugin.glow,
                        0.2
                      )}, transparent)`
                    }}
                  >
                    <span className="truncate">{plugin.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-1">
            {filteredInventory.map((plugin) => {
              const isAdded = currentTrackInserts.includes(plugin.id);
              const config = fxConfigMap.get(plugin.id);
              return (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between rounded-xl border border-white/12 bg-black/30 px-3 py-2 mb-2 shadow-[0_4px_18px_rgba(10,10,20,0.35)]"
                  style={{ boxShadow: `0 0 14px ${hexToRgba(plugin.glow, 0.22)}` }}
                >
                  <div className="flex flex-col">
                    <span className="text-[0.55rem] uppercase tracking-[0.35em] text-white/80">
                      {plugin.name}
                    </span>
                    <span className="text-[0.45rem] uppercase tracking-[0.3em] text-white/35">
                      {config?.component?.name ?? "Flow module"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleFavorite(plugin.id)}
                      className={`p-1 rounded-full border border-white/15 transition-colors ${
                        favorites[plugin.id]
                          ? "bg-amber-300/20 text-amber-200"
                          : "text-white/40 hover:text-white/70"
                      }`}
                      aria-label={favorites[plugin.id] ? "Unfavorite" : "Favorite"}
                    >
                      <StarIcon filled={favorites[plugin.id]} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAdd(plugin.id)}
                      disabled={isAdded}
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[0.48rem] uppercase tracking-[0.35em] border border-white/15 transition-all ${
                        isAdded
                          ? "bg-white/10 text-white/40 cursor-default"
                          : "bg-white/15 text-white/80 hover:bg-white/25"
                      }`}
                    >
                      {isAdded ? "In chain" : "Add"}
                      {!isAdded && <PlusCircleIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
            {!filteredInventory.length && (
              <div className="text-[0.5rem] uppercase tracking-[0.35em] text-white/40 text-center py-8">
                No modules match
              </div>
            )}
          </div>
        </div>

        <footer className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[0.55rem] uppercase tracking-[0.35em] text-white/70 transition-colors"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PluginBrowser;
