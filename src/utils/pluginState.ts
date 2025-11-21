/**
 * F.L.O.W. Plugin State Persistence
 * what: Local persistence for plugin favorites and presets.
 * why: Preserve Flow by keeping a user's go-to modules close, and reinforce Mixx Recall.
 * how: Wrap window.localStorage with safe read/write helpers. (Reduction / Flow / Recall)
 * Created by Ravenis Prime (F.L.O.W)
 */
export interface PluginPreset {
  id: string;
  label: string;
  params: Record<string, number>;
  savedAt: string;
  trackContext?: string;
}

type PluginFavoritesStore = Record<string, boolean>;
type PluginPresetStore = Record<string, PluginPreset[]>;

const FAVORITES_KEY = "flow:plugin-favorites";
const PRESETS_KEY = "flow:plugin-presets";

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const inBrowser = () => typeof window !== "undefined" && !!window.localStorage;

export const loadPluginFavorites = (): PluginFavoritesStore => {
  if (!inBrowser()) return {};
  return safeParse(window.localStorage.getItem(FAVORITES_KEY), {});
};

export const savePluginFavorites = (favorites: PluginFavoritesStore) => {
  if (!inBrowser()) return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

export const loadPluginPresets = (): PluginPresetStore => {
  if (!inBrowser()) return {};
  return safeParse(window.localStorage.getItem(PRESETS_KEY), {});
};

export const savePluginPresets = (presets: PluginPresetStore) => {
  if (!inBrowser()) return;
  window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
};

export const upsertPluginPreset = (
  store: PluginPresetStore,
  pluginId: string,
  preset: PluginPreset
): PluginPresetStore => {
  const existing = store[pluginId] ?? [];
  const filtered = existing.filter((entry) => entry.id !== preset.id);
  return {
    ...store,
    [pluginId]: [...filtered, preset],
  };
};

export const removePluginPreset = (
  store: PluginPresetStore,
  pluginId: string,
  presetId: string
): PluginPresetStore => {
  const existing = store[pluginId] ?? [];
  return {
    ...store,
    [pluginId]: existing.filter((entry) => entry.id !== presetId),
  };
};



