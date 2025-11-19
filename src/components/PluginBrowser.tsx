// components/PluginBrowser.tsx
import React, { useMemo, useState, useCallback } from "react";
import type { FxWindowId } from "../App";
import { PlusCircleIcon, XIcon, StarIcon } from "./icons";
import { hexToRgba } from "../utils/ALS";
import styles from "./PluginBrowser.module.css";
import type {
  PluginInventoryItem,
  PluginTier,
} from "../audio/pluginTypes";
import { TIER_ORDER } from "../audio/pluginCatalog";

interface PluginBrowserProps {
  trackId: string;
  trackName?: string;
  activeInserts: FxWindowId[];
  inventory: PluginInventoryItem[];
  favorites: Record<FxWindowId, boolean>;
  onAddPlugin: (trackId: string, pluginId: FxWindowId) => void;
  onToggleFavorite: (pluginId: FxWindowId) => void;
  onClose: () => void;
  onPreview?: (trackId: string, pluginId: FxWindowId) => void;
}

const tierHeadline: Record<PluginTier, string> = {
  pillar: "Five Pillars",
  core: "Core Tier",
  neural: "Neural Tier",
  master: "Master Tier",
  system: "System Layer",
  signature: "Signature Halo",
};

const tierSubtitle: Record<PluginTier, string> = {
  pillar: "Five pillars locked in",
  core: "Anchor energy steady",
  neural: "Neural net listening",
  master: "Translation guardians awake",
  system: "System lattice humming",
  signature: "Signature halo breathing",
};

const motionBadge: Record<PluginInventoryItem["lightingProfile"]["motion"], string> = {
  float: "Float",
  breathe: "Breathe",
  pulse: "Pulse",
  burst: "Burst",
  shimmer: "Shimmer",
  sweep: "Sweep",
  drift: "Drift",
  expand: "Expand",
  flare: "Flare",
  bars: "Meters",
  glow: "Glow",
  heartbeat: "Heartbeat",
  mirror: "Mirror",
};

const gradientFor = (item: PluginInventoryItem) => {
  const { hueStart, hueEnd } = item.lightingProfile;
  return `linear-gradient(135deg, hsla(${hueStart}, 82%, 62%, 0.28), hsla(${hueEnd}, 78%, 58%, 0.32))`;
};

const tierSort = (a: PluginTier, b: PluginTier) =>
  (TIER_ORDER[a] ?? 99) - (TIER_ORDER[b] ?? 99);

const PluginBrowser: React.FC<PluginBrowserProps> = ({
  trackId,
  trackName,
  activeInserts,
  inventory,
  favorites,
  onAddPlugin,
  onToggleFavorite,
  onClose,
  onPreview,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const curatedHighlights = useMemo(() => {
    return inventory
      .filter((item) => item.isCurated)
      .sort((a, b) => {
        const tierDelta = tierSort(a.tier, b.tier);
        if (tierDelta !== 0) return tierDelta;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [inventory]);

  const favoriteList = useMemo(() => {
    return inventory
      .filter((item) => favorites[item.id])
      .sort((a, b) => {
        if (a.tier === b.tier) {
          return a.name.localeCompare(b.name);
        }
        return tierSort(a.tier, b.tier);
      });
  }, [favorites, inventory]);

  const filteredInventory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return inventory;
    }
    return inventory.filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.moodResponse.toLowerCase().includes(term)
      );
    });
  }, [inventory, searchTerm]);

  const groupedByTier = useMemo(() => {
    const groups = new Map<PluginTier, PluginInventoryItem[]>();
    filteredInventory.forEach((item) => {
      if (!groups.has(item.tier)) {
        groups.set(item.tier, []);
      }
      groups.get(item.tier)!.push(item);
    });
    return Array.from(groups.entries())
      .sort(([tierA], [tierB]) => tierSort(tierA, tierB))
      .map(([tier, plugins]) => ({
        tier,
        headline: tierHeadline[tier] ?? tier,
        plugins: plugins.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [filteredInventory]);

  const handleAdd = useCallback(
    (pluginId: FxWindowId) => {
      if (activeInserts.includes(pluginId)) return;
      onAddPlugin(trackId, pluginId);
    },
    [activeInserts, onAddPlugin, trackId]
  );

  const handleHover = useCallback(
    (pluginId: FxWindowId) => {
      onPreview?.(trackId, pluginId);
    },
    [onPreview, trackId]
  );

  // Generate dynamic CSS for plugin-specific styles
  const dynamicStyles = useMemo(() => {
    try {
      const allPlugins = [...curatedHighlights, ...groupedByTier.flatMap(g => g.plugins)];
      // Sanitize plugin IDs for CSS class names (remove special characters)
      const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9-_]/g, '-');
      
      return allPlugins.map(plugin => {
        const glowColor = hexToRgba(plugin.glow, 0.26);
        const gradient = gradientFor(plugin);
        const safeId = sanitizeId(plugin.id);
        return `
          .plugin-${safeId} {
            --plugin-glow: ${glowColor};
            --plugin-gradient: ${gradient};
          }
        `;
      }).join('\n');
    } catch (error) {
      console.warn('[PluginBrowser] Error generating dynamic styles:', error);
      return '';
    }
  }, [curatedHighlights, groupedByTier]);

  return (
    <>
      <style>{dynamicStyles}</style>
      <div
        className="fixed inset-0 z-[160] flex items-center justify-center bg-[rgba(2,4,12,0.76)] backdrop-blur-3xl"
      onClick={onClose}
    >
      <div
        className="relative flex h-[620px] w-[880px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(6,14,32,0.85)] shadow-[0_45px_120px_rgba(4,10,26,0.65)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between px-8 pt-7 pb-5">
          <div>
            <p className="text-[0.5rem] uppercase tracking-[0.45em] text-cyan-200/65">
              {trackName ? `Routing into ${trackName}` : "Flow Insert Browser"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[0.18em] text-white">
              Bloom Module Halo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white/70 transition-colors hover:bg-white/16 hover:text-white"
            aria-label="Close plug-in browser"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-col gap-4 px-8 pb-7">
          <div className="flex items-center gap-4">
            <div className="flex flex-1 items-center rounded-2xl border border-white/12 bg-[rgba(10,24,44,0.6)] px-4 py-3 backdrop-blur">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by vibe, tier, or mood response"
                className="flex-1 bg-transparent text-sm uppercase tracking-[0.35em] text-white/80 placeholder:text-white/35 focus:outline-none"
              />
            </div>
            {favoriteList.length > 0 && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200/20 bg-amber-400/8 px-4 py-3">
                <StarIcon filled className="h-4 w-4 text-amber-200" />
                <span className="text-[0.55rem] uppercase tracking-[0.35em] text-amber-100/80">
                  Favorites pulsing
                </span>
              </div>
            )}
          </div>

          {!searchTerm && curatedHighlights.length > 0 && (
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[0.48rem] uppercase tracking-[0.45em] text-white/55">
                  Curated Flow Chain
                </span>
                <span className="text-[0.45rem] uppercase tracking-[0.3em] text-white/30">
                  Tap to load
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {curatedHighlights.map((plugin) => (
                  <button
                    key={`curated-${plugin.id}`}
                    onClick={() => handleAdd(plugin.id)}
                    onMouseEnter={() => handleHover(plugin.id)}
                    className={`plugin-${plugin.id.replace(/[^a-zA-Z0-9-_]/g, '-')} rounded-2xl border border-white/12 bg-[rgba(12,24,48,0.78)] px-4 py-2 text-left transition-all hover:border-white/25 hover:bg-[rgba(16,36,68,0.85)] ${styles.curatedPluginButton}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[0.58rem] uppercase tracking-[0.32em] text-white/85">
                        {plugin.name}
                      </span>
                      <span className="rounded-full bg-white/15 px-2 py-[2px] text-[0.42rem] uppercase tracking-[0.32em] text-white/70">
                        {motionBadge[plugin.lightingProfile.motion]}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.48rem] uppercase tracking-[0.25em] text-white/55">
                      {plugin.moodResponse}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="relative flex-1 overflow-hidden px-8 pb-8">
          <div className="absolute left-0 top-0 h-12 w-full bg-gradient-to-b from-[rgba(6,14,32,0.95)] to-transparent" />
          <div className="absolute bottom-0 left-0 h-12 w-full bg-gradient-to-t from-[rgba(6,14,32,0.95)] to-transparent" />
          <div className="h-full w-full overflow-y-auto pr-2">
            <div className="flex flex-col gap-6 pb-6">
              {groupedByTier.map(({ tier, headline, plugins }) => (
                <section key={tier} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[0.42rem] uppercase tracking-[0.42em] text-white/35">
                        {headline}
                      </span>
                      <p className="mt-1 text-[0.62rem] uppercase tracking-[0.42em] text-white/55">
                        {tierSubtitle[tier]}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {plugins.map((plugin) => {
                      const isAdded = activeInserts.includes(plugin.id);
                      const isFavorite = favorites[plugin.id];
                      return (
                        <article
                          key={plugin.id}
                          onMouseEnter={() => handleHover(plugin.id)}
                          className={`plugin-${plugin.id.replace(/[^a-zA-Z0-9-_]/g, '-')} group relative flex flex-col justify-between rounded-[24px] border border-white/10 bg-[rgba(8,16,36,0.78)] p-5 transition-all duration-200 hover:border-white/25 hover:shadow-[0_22px_48px_rgba(6,16,38,0.55)] ${styles.pluginCard}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-sm uppercase tracking-[0.3em] text-white">
                                {plugin.name}
                              </h3>
                              <p className="mt-2 text-[0.55rem] uppercase tracking-[0.28em] text-white/65">
                                {plugin.description}
                              </p>
                            </div>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onToggleFavorite(plugin.id);
                              }}
                              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                                isFavorite
                                  ? "border-amber-200/60 bg-amber-200/15 text-amber-100"
                                  : "border-white/18 bg-white/8 text-white/60 hover:text-white"
                              }`}
                              aria-label={isFavorite ? "Remove favorite" : "Add to favorites"}
                            >
                              <StarIcon filled={isFavorite} className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-3 text-[0.48rem] uppercase tracking-[0.28em] text-white/50">
                            {plugin.moodResponse}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.4rem] uppercase tracking-[0.35em] text-white/70">
                              {motionBadge[plugin.lightingProfile.motion]}
                            </span>
                            <button
                              onClick={() => handleAdd(plugin.id)}
                              disabled={isAdded}
                              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[0.55rem] uppercase tracking-[0.32em] transition-all ${
                                isAdded
                                  ? "cursor-default border-white/15 bg-white/12 text-white/45"
                                  : "border-white/25 bg-white/15 text-white/85 hover:bg-white/25"
                              }`}
                            >
                              {isAdded ? "In Chain" : "Add Module"}
                              {!isAdded && <PlusCircleIcon className="h-4 w-4" />}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
              {!groupedByTier.length && (
                <div className="py-16 text-center text-[0.55rem] uppercase tracking-[0.38em] text-white/35">
                  Nothing matches that vibe yet
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-white/8 bg-[rgba(4,10,24,0.9)] px-8 py-4">
          <div className="text-[0.42rem] uppercase tracking-[0.32em] text-white/40">
            Modules respond to ALS — no numbers, only flow.
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/15 px-4 py-2 text-[0.55rem] uppercase tracking-[0.28em] text-white/70 transition-all hover:border-white/30 hover:text-white"
          >
            Close Browser
          </button>
        </footer>
      </div>
    </div>
    </>
  );
};

export default PluginBrowser;
