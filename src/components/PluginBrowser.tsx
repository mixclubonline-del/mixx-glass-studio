// components/PluginBrowser.tsx
import React, { useMemo, useState, useCallback, useRef } from "react";
import type { FxWindowId } from "../App";
import { PlusCircleIcon, XIcon, StarIcon } from "./icons";
import { hexToRgba } from "../utils/ALS";
import type {
  PluginInventoryItem,
  PluginTier,
} from "../audio/pluginTypes";
import { TIER_ORDER } from "../audio/pluginCatalog";
import { spacing, typography, layout, effects, transitions, composeStyles } from "../design-system";

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

  const handleDragStart = useCallback(
    (e: React.DragEvent, pluginId: FxWindowId) => {
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("application/plugin-id", pluginId);
      e.dataTransfer.setData("text/plain", pluginId); // Fallback for compatibility
      // Add visual feedback
      if (e.dataTransfer.setDragImage) {
        const dragImage = document.createElement("div");
        dragImage.style.position = "absolute";
        dragImage.style.top = "-1000px";
        dragImage.style.padding = "8px 16px";
        dragImage.style.background = "rgba(6, 14, 32, 0.95)";
        dragImage.style.border = "1px solid rgba(255, 255, 255, 0.3)";
        dragImage.style.borderRadius = "8px";
        dragImage.style.color = "white";
        dragImage.style.fontSize = "0.75rem";
        dragImage.style.textTransform = "uppercase";
        dragImage.style.letterSpacing = "0.1em";
        dragImage.textContent = inventory.find(p => p.id === pluginId)?.name || pluginId;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
      }
    },
    [inventory]
  );

  return (
    <div
      style={composeStyles(
        layout.position.fixed,
        { inset: 0, zIndex: 200 },
        layout.flex.container('row'),
        layout.flex.align.start,
        layout.flex.justify.center,
        {
          paddingTop: '60px',
          background: 'rgba(5,8,18,0.88)',
          backdropFilter: 'blur(32px)',
        }
      )}
      onClick={onClose}
    >
      <div
        style={composeStyles(
          layout.position.relative,
          layout.flex.container('col'),
          layout.overflow.hidden,
          effects.border.radius.xl,
          {
            height: '560px',
            width: '820px',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            background: 'rgba(10,14,28,0.98)',
            boxShadow: '0 35px 90px rgba(0,0,0,0.7), 0 0 50px rgba(139, 92, 246, 0.1)',
          }
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <header style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          layout.flex.justify.between,
          spacing.px(8),
          spacing.pt(7),
          spacing.pb(5)
        )}>
          <div>
            <p style={composeStyles(
              typography.transform('uppercase'),
              typography.tracking.widest,
              {
                fontSize: '0.5rem',
                color: 'rgba(165, 243, 252, 0.65)',
              }
            )}>
              {trackName ? `Routing into ${trackName}` : "Flow Insert Browser"}
            </p>
            <h2 style={composeStyles(
              typography.weight('semibold'),
              spacing.mt(2),
              typography.tracking.widest,
              {
                fontSize: '1.5rem',
                color: 'white',
              }
            )}>
              Bloom Module Halo
            </h2>
          </div>
          <button
            onClick={onClose}
            style={composeStyles(
              layout.flex.container('row'),
              layout.flex.align.center,
              layout.flex.justify.center,
              effects.border.radius.full,
              transitions.transition.standard('all', 200, 'ease-out'),
              {
                width: '40px',
                height: '40px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
              }
            )}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
            aria-label="Close plug-in browser"
          >
            <XIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </header>

        <div style={composeStyles(
          layout.flex.container('col'),
          spacing.gap(4),
          spacing.px(8),
          spacing.pb(7)
        )}>
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            spacing.gap(4)
          )}>
            <div style={composeStyles(
              layout.flex.container('row'),
              layout.flex.align.center,
              { flex: 1 },
              effects.border.radius.xl,
              spacing.px(4),
              spacing.py(3),
              {
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(10,24,44,0.6)',
                backdropFilter: 'blur(8px)',
              }
            )}>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by vibe, tier, or mood response"
                style={composeStyles(
                  { flex: 1 },
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    background: 'transparent',
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.8)',
                    outline: 'none',
                  }
                )}
                onFocus={(e) => {
                  e.currentTarget.style.color = 'white';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                }}
              />
            </div>
            {favoriteList.length > 0 && (
              <div style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                spacing.gap(3),
                effects.border.radius.xl,
                spacing.px(4),
                spacing.py(3),
                {
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  background: 'rgba(251, 191, 36, 0.08)',
                }
              )}>
                <StarIcon filled style={{ width: '16px', height: '16px', color: 'rgba(253, 224, 71, 1)' }} />
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.55rem',
                    color: 'rgba(254, 243, 199, 0.8)',
                  }
                )}>
                  Favorites pulsing
                </span>
              </div>
            )}
          </div>

          {!searchTerm && curatedHighlights.length > 0 && (
            <section style={composeStyles(
              layout.flex.container('col'),
              spacing.gap(2)
            )}>
              <div style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.between
              )}>
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.48rem',
                    color: 'rgba(255,255,255,0.55)',
                  }
                )}>
                  Curated Flow Chain
                </span>
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.45rem',
                    color: 'rgba(255,255,255,0.3)',
                  }
                )}>
                  Tap to load
                </span>
              </div>
              <div style={composeStyles(
                layout.flex.container('row'),
                layout.flex.wrap.wrap,
                spacing.gap(3)
              )}>
                {curatedHighlights.map((plugin) => (
                  <button
                    key={`curated-${plugin.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, plugin.id)}
                    onClick={() => handleAdd(plugin.id)}
                    onMouseEnter={(e) => {
                      handleHover(plugin.id);
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                      e.currentTarget.style.background = 'rgba(16,36,68,0.85)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.background = 'rgba(12,24,48,0.78)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.cursor = 'grabbing';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.cursor = 'grab';
                    }}
                  >
                    <div style={composeStyles(
                      layout.flex.container('row'),
                      layout.flex.align.center,
                      spacing.gap(2)
                    )}>
                      <span style={composeStyles(
                        typography.transform('uppercase'),
                        typography.tracking.widest,
                        {
                          fontSize: '0.58rem',
                          color: 'rgba(255,255,255,0.85)',
                        }
                      )}>
                        {plugin.name}
                      </span>
                      <span style={composeStyles(
                        effects.border.radius.full,
                        spacing.px(2),
                        spacing.py(0.5),
                        typography.transform('uppercase'),
                        typography.tracking.widest,
                        {
                          fontSize: '0.42rem',
                          background: 'rgba(255,255,255,0.15)',
                          color: 'rgba(255,255,255,0.7)',
                        }
                      )}>
                        {motionBadge[plugin.lightingProfile.motion]}
                      </span>
                    </div>
                    <p style={composeStyles(
                      spacing.mt(1),
                      typography.transform('uppercase'),
                      typography.tracking.widest,
                      {
                        fontSize: '0.48rem',
                        color: 'rgba(255,255,255,0.55)',
                      }
                    )}>
                      {plugin.moodResponse}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <div style={composeStyles(
          layout.position.relative,
          { flex: 1 },
          layout.overflow.hidden,
          spacing.px(8),
          spacing.pb(8)
        )}>
          <div style={composeStyles(
            layout.position.absolute,
            { left: 0, top: 0, width: '100%', height: '48px' },
            {
              background: 'linear-gradient(to bottom, rgba(6,14,32,0.95), transparent)',
            }
          )} />
          <div style={composeStyles(
            layout.position.absolute,
            { left: 0, bottom: 0, width: '100%', height: '48px' },
            {
              background: 'linear-gradient(to top, rgba(6,14,32,0.95), transparent)',
            }
          )} />
          <div style={composeStyles(
            { height: '100%', width: '100%' },
            layout.overflow.y.auto,
            spacing.pr(2)
          )}>
            <div style={composeStyles(
              layout.flex.container('col'),
              spacing.gap(6),
              spacing.pb(6)
            )}>
              {groupedByTier.map(({ tier, headline, plugins }) => (
                <section key={tier} style={composeStyles(
                  layout.flex.container('col'),
                  spacing.gap(3)
                )}>
                  <div style={composeStyles(
                    layout.flex.container('row'),
                    layout.flex.align.center,
                    layout.flex.justify.between
                  )}>
                    <div>
                      <span style={composeStyles(
                        typography.transform('uppercase'),
                        typography.tracking.widest,
                        {
                          fontSize: '0.42rem',
                          color: 'rgba(255,255,255,0.35)',
                        }
                      )}>
                        {headline}
                      </span>
                      <p style={composeStyles(
                        spacing.mt(1),
                        typography.transform('uppercase'),
                        typography.tracking.widest,
                        {
                          fontSize: '0.62rem',
                          color: 'rgba(255,255,255,0.55)',
                        }
                      )}>
                        {tierSubtitle[tier]}
                      </p>
                    </div>
                  </div>
                  <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '16px',
                    }}>
                    {plugins.map((plugin) => {
                      const isAdded = activeInserts.includes(plugin.id);
                      const isFavorite = favorites[plugin.id];
                      return (
                        <article
                          key={plugin.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, plugin.id)}
                          onMouseEnter={(e) => {
                            handleHover(plugin.id);
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                            e.currentTarget.style.boxShadow = '0 22px 48px rgba(6,16,38,0.55)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onMouseDown={(e) => {
                            e.currentTarget.style.cursor = 'grabbing';
                          }}
                          onMouseUp={(e) => {
                            e.currentTarget.style.cursor = 'grab';
                          }}
                        >
                          <div style={composeStyles(
                            layout.flex.container('row'),
                            layout.flex.align.start,
                            layout.flex.justify.between,
                            spacing.gap(4)
                          )}>
                            <div>
                              <h3 style={composeStyles(
                                typography.transform('uppercase'),
                                typography.tracking.widest,
                                {
                                  fontSize: '0.875rem',
                                  color: 'white',
                                }
                              )}>
                                {plugin.name}
                              </h3>
                              <p style={composeStyles(
                                spacing.mt(2),
                                typography.transform('uppercase'),
                                typography.tracking.widest,
                                {
                                  fontSize: '0.55rem',
                                  color: 'rgba(255,255,255,0.65)',
                                }
                              )}>
                                {plugin.description}
                              </p>
                            </div>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onToggleFavorite(plugin.id);
                              }}
                              style={composeStyles(
                                layout.flex.container('row'),
                                layout.flex.align.center,
                                layout.flex.justify.center,
                                effects.border.radius.full,
                                transitions.transition.standard('all', 200, 'ease-out'),
                                {
                                  width: '36px',
                                  height: '36px',
                                  border: isFavorite 
                                    ? '1px solid rgba(253, 224, 71, 0.6)' 
                                    : '1px solid rgba(255,255,255,0.18)',
                                  background: isFavorite 
                                    ? 'rgba(253, 224, 71, 0.15)' 
                                    : 'rgba(255,255,255,0.08)',
                                  color: isFavorite 
                                    ? 'rgba(254, 243, 199, 1)' 
                                    : 'rgba(255,255,255,0.6)',
                                }
                              )}
                              onMouseLeave={(e) => {
                                if (!isFavorite) {
                                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                }
                              }}
                              aria-label={isFavorite ? "Remove favorite" : "Add to favorites"}
                            >
                              <StarIcon filled={isFavorite} style={{ width: '16px', height: '16px' }} />
                            </button>
                          </div>
                          <p style={composeStyles(
                            spacing.mt(3),
                            typography.transform('uppercase'),
                            typography.tracking.widest,
                            {
                              fontSize: '0.48rem',
                              color: 'rgba(255,255,255,0.5)',
                            }
                          )}>
                            {plugin.moodResponse}
                          </p>
                          <div style={composeStyles(
                            spacing.mt(4),
                            layout.flex.container('row'),
                            layout.flex.align.center,
                            layout.flex.justify.between
                          )}>
                            <span style={composeStyles(
                              effects.border.radius.full,
                              spacing.px(3),
                              spacing.py(1),
                              typography.transform('uppercase'),
                              typography.tracking.widest,
                              {
                                fontSize: '0.4rem',
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.7)',
                              }
                            )}>
                              {motionBadge[plugin.lightingProfile.motion]}
                            </span>
                            <button
                              onClick={() => handleAdd(plugin.id)}
                              disabled={isAdded}
                              style={composeStyles(
                                layout.flex.container('row'),
                                layout.flex.align.center,
                                spacing.gap(2),
                                effects.border.radius.full,
                                spacing.px(4),
                                spacing.py(2),
                                typography.transform('uppercase'),
                                typography.tracking.widest,
                                transitions.transition.standard('all', 200, 'ease-out'),
                                {
                                  fontSize: '0.55rem',
                                  border: isAdded 
                                    ? '1px solid rgba(255,255,255,0.15)' 
                                    : '1px solid rgba(255,255,255,0.25)',
                                  background: isAdded 
                                    ? 'rgba(255,255,255,0.12)' 
                                    : 'rgba(255,255,255,0.15)',
                                  color: isAdded 
                                    ? 'rgba(255,255,255,0.45)' 
                                    : 'rgba(255,255,255,0.85)',
                                  cursor: isAdded ? 'default' : 'pointer',
                                }
                              )}
                              onMouseLeave={(e) => {
                                if (!isAdded) {
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                }
                              }}
                            >
                              {isAdded ? "In Chain" : "Add Module"}
                              {!isAdded && <PlusCircleIcon style={{ width: '16px', height: '16px' }} />}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
              {!groupedByTier.length && (
                <div style={composeStyles(
                  spacing.py(16),
                  {
                    textAlign: 'center',
                    fontSize: '0.55rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.38em',
                    color: 'rgba(255,255,255,0.35)',
                  }
                )}>
                  Nothing matches that vibe yet
                </div>
              )}
            </div>
          </div>
        </div>

        <footer style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          layout.flex.justify.between,
          effects.border.top(),
          spacing.px(8),
          spacing.py(4),
          {
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(4,10,24,0.9)',
          }
        )}>
          <div style={composeStyles(
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              fontSize: '0.42rem',
              color: 'rgba(255,255,255,0.4)',
            }
          )}>
            Modules respond to ALS — no numbers, only flow.
          </div>
          <button
            onClick={onClose}
            style={composeStyles(
              effects.border.radius.full,
              spacing.px(4),
              spacing.py(2),
              typography.transform('uppercase'),
              typography.tracking.widest,
              transitions.transition.standard('all', 200, 'ease-out'),
              {
                fontSize: '0.55rem',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)',
              }
            )}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            Close Browser
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PluginBrowser;
