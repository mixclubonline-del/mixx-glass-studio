/**
 * Mixx Recall Context
 * 
 * Extracts user preferences, patterns, and context from the Studio
 * to inject into Prime Brain LLM prompts for personalized responses.
 * 
 * This enables the AI to remember:
 * - User's preferred genres and styles
 * - Common plugin settings and presets
 * - Workflow patterns and habits
 * - Project history and preferences
 */

interface MixxRecallData {
  // User preferences
  preferredGenres?: string[];
  preferredPlugins?: string[];
  commonPresets?: Array<{ name: string; plugin: string }>;
  
  // Workflow patterns
  typicalBPM?: number;
  commonKeys?: string[];
  preferredMixLevel?: number; // LUFS
  
  // Project context
  recentProjects?: Array<{ genre?: string; bpm?: number; key?: string }>;
  
  // Plugin preferences
  favoritePlugins?: string[];
  commonSettings?: Record<string, Record<string, number>>;
}

/**
 * Extract Mixx Recall context from localStorage and window globals
 */
export function getMixxRecallContext(): MixxRecallData {
  const context: MixxRecallData = {};

  if (typeof window === 'undefined') {
    return context;
  }

  try {
    // Get plugin favorites and presets
    const favoritesJson = localStorage.getItem('mixxclub:plugin-favorites');
    const presetsJson = localStorage.getItem('mixxclub:plugin-presets');
    
    if (favoritesJson) {
      const favorites: Record<string, boolean> = JSON.parse(favoritesJson);
      context.favoritePlugins = Object.keys(favorites).filter(k => favorites[k]);
    }

    if (presetsJson) {
      const presets: Array<{ label: string; trackContext?: string }> = JSON.parse(presetsJson);
      context.commonPresets = presets.map(p => ({
        name: p.label,
        plugin: p.trackContext || 'unknown',
      }));
    }

    // Get current project context from window globals
    const playbackState = (window as any).__mixx_playbackState;
    if (playbackState?.bpm) {
      context.typicalBPM = playbackState.bpm;
    }

    // Get musical context if available
    const musicalContext = (window as any).__mixx_musicalContext;
    if (musicalContext?.key) {
      context.commonKeys = [musicalContext.key];
    }

    // Get recent project history (if stored)
    const projectHistoryJson = localStorage.getItem('mixxclub:project-history');
    if (projectHistoryJson) {
      try {
        const history: Array<{ genre?: string; bpm?: number; key?: string }> = 
          JSON.parse(projectHistoryJson);
        context.recentProjects = history.slice(-5); // Last 5 projects
      } catch {
        // Ignore parse errors
      }
    }

    // Extract genre preferences from recent projects
    if (context.recentProjects) {
      const genres = context.recentProjects
        .map(p => p.genre)
        .filter((g): g is string => !!g);
      if (genres.length > 0) {
        context.preferredGenres = [...new Set(genres)];
      }
    }

  } catch (error) {
    console.warn('Mixx Recall context extraction error:', error);
  }

  return context;
}

/**
 * Format Mixx Recall context as a prompt string
 */
export function formatMixxRecallPrompt(context: MixxRecallData): string {
  const parts: string[] = [];

  if (context.preferredGenres && context.preferredGenres.length > 0) {
    parts.push(`User's preferred genres: ${context.preferredGenres.join(', ')}`);
  }

  if (context.typicalBPM) {
    parts.push(`User typically works at ${context.typicalBPM} BPM`);
  }

  if (context.commonKeys && context.commonKeys.length > 0) {
    parts.push(`User commonly works in keys: ${context.commonKeys.join(', ')}`);
  }

  if (context.favoritePlugins && context.favoritePlugins.length > 0) {
    parts.push(`User's favorite plugins: ${context.favoritePlugins.join(', ')}`);
  }

  if (context.commonPresets && context.commonPresets.length > 0) {
    const presetList = context.commonPresets
      .slice(0, 5)
      .map(p => `${p.name} (${p.plugin})`)
      .join(', ');
    parts.push(`User frequently uses presets: ${presetList}`);
  }

  if (context.preferredMixLevel) {
    parts.push(`User typically targets ${context.preferredMixLevel.toFixed(1)} LUFS`);
  }

  if (parts.length === 0) {
    return '';
  }

  return `\n\nUser Context (Mixx Recall):\n${parts.join('\n')}\n\nConsider these preferences when providing recommendations.`;
}

/**
 * Inject Mixx Recall context into a prompt
 */
export function injectMixxRecall(prompt: string): string {
  const context = getMixxRecallContext();
  const recallText = formatMixxRecallPrompt(context);
  
  if (!recallText) {
    return prompt; // No context available
  }

  return prompt + recallText;
}

/**
 * Save project context for future Mixx Recall
 */
export function saveProjectContext(data: {
  genre?: string;
  bpm?: number;
  key?: string;
  lufs?: number;
}): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const historyJson = localStorage.getItem('mixxclub:project-history');
    const history: Array<{ genre?: string; bpm?: number; key?: string; lufs?: number; timestamp: number }> = 
      historyJson ? JSON.parse(historyJson) : [];

    // Add new entry
    history.push({
      ...data,
      timestamp: Date.now(),
    });

    // Keep only last 20 projects
    const trimmed = history.slice(-20);
    
    localStorage.setItem('mixxclub:project-history', JSON.stringify(trimmed));
  } catch (error) {
    console.warn('Failed to save project context:', error);
  }
}
