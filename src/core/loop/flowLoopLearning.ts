/**
 * Flow Loop Learning System
 * 
 * Learns user patterns from session signals and predicts common actions.
 * Powers Bloom Menu predictions and adaptive behavior.
 * 
 * Flow Doctrine: Mixx Recall - the system remembers, so users don't have to.
 */

interface UserAction {
  timestamp: number;
  type: 'tool' | 'view' | 'edit' | 'zoom' | 'plugin' | 'track';
  value: string;
  context?: {
    flow: number;
    pulse: number;
    tension: number;
    mode?: string;
  };
}

interface Pattern {
  action: string;
  frequency: number;
  contexts: Array<{ flow: number; pulse: number; tension: number; mode?: string }>;
  lastUsed: number;
}

class FlowLoopLearning {
  private actionHistory: UserAction[] = [];
  private patterns: Map<string, Pattern> = new Map();
  private readonly MAX_HISTORY = 200; // Keep last 200 actions
  private readonly PATTERN_MIN_FREQUENCY = 3; // Need at least 3 occurrences
  private readonly CONTEXT_WINDOW_MS = 5000; // 5 second context window

  /**
   * Record a user action for learning.
   */
  recordAction(
    type: UserAction['type'],
    value: string,
    context?: UserAction['context']
  ): void {
    const action: UserAction = {
      timestamp: Date.now(),
      type,
      value,
      context,
    };

    this.actionHistory.push(action);

    // Prune old actions
    if (this.actionHistory.length > this.MAX_HISTORY) {
      this.actionHistory.shift();
    }

    // Update patterns
    this.updatePatterns(action);
  }

  /**
   * Update pattern frequency and context.
   */
  private updatePatterns(action: UserAction): void {
    const key = `${action.type}:${action.value}`;
    const existing = this.patterns.get(key);

    if (existing) {
      existing.frequency += 1;
      existing.lastUsed = action.timestamp;
      if (action.context) {
        existing.contexts.push(action.context);
        // Keep only recent contexts (last 10)
        if (existing.contexts.length > 10) {
          existing.contexts.shift();
        }
      }
    } else {
      this.patterns.set(key, {
        action: action.value,
        frequency: 1,
        contexts: action.context ? [action.context] : [],
        lastUsed: action.timestamp,
      });
    }
  }

  /**
   * Get common actions based on frequency and recency.
   * Returns top N actions sorted by frequency and last used time.
   */
  getCommonActions(limit: number = 10): string[] {
    const now = Date.now();
    const recentThreshold = now - 300000; // Last 5 minutes

    const scored = Array.from(this.patterns.entries())
      .filter(([_, pattern]) => pattern.frequency >= this.PATTERN_MIN_FREQUENCY)
      .map(([key, pattern]) => ({
        key,
        action: pattern.action,
        score: pattern.frequency * (pattern.lastUsed > recentThreshold ? 1.5 : 1.0),
        lastUsed: pattern.lastUsed,
      }))
      .sort((a, b) => {
        // Sort by score (frequency * recency), then by last used
        if (Math.abs(a.score - b.score) > 0.1) {
          return b.score - a.score;
        }
        return b.lastUsed - a.lastUsed;
      })
      .slice(0, limit)
      .map(item => item.action);

    return scored;
  }

  /**
   * Predict next actions based on current context.
   * Uses pattern matching on similar contexts.
   */
  predictNextActions(
    currentContext: { flow: number; pulse: number; tension: number; mode?: string },
    limit: number = 5
  ): string[] {
    const predictions: Array<{ action: string; confidence: number }> = [];

    for (const [key, pattern] of this.patterns.entries()) {
      if (pattern.frequency < this.PATTERN_MIN_FREQUENCY) continue;
      if (pattern.contexts.length === 0) continue;

      // Find similar contexts
      let matchCount = 0;
      for (const ctx of pattern.contexts) {
        const flowDiff = Math.abs(ctx.flow - currentContext.flow);
        const pulseDiff = Math.abs(ctx.pulse - currentContext.pulse);
        const tensionDiff = Math.abs(ctx.tension - currentContext.tension);
        const modeMatch = !currentContext.mode || !ctx.mode || ctx.mode === currentContext.mode;

        // Similar if within 0.2 threshold and mode matches
        if (flowDiff < 0.2 && pulseDiff < 0.2 && tensionDiff < 0.2 && modeMatch) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const confidence = (matchCount / pattern.contexts.length) * (pattern.frequency / 10);
        predictions.push({
          action: pattern.action,
          confidence: Math.min(1.0, confidence),
        });
      }
    }

    // Sort by confidence and return top N
    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)
      .map(p => p.action);
  }

  /**
   * Get action frequency for a specific action.
   */
  getActionFrequency(type: string, value: string): number {
    const key = `${type}:${value}`;
    const pattern = this.patterns.get(key);
    return pattern ? pattern.frequency : 0;
  }

  /**
   * Clear learning data (for testing or reset).
   */
  clear(): void {
    this.actionHistory = [];
    this.patterns.clear();
  }
}

// Singleton instance
export const flowLoopLearning = new FlowLoopLearning();

/**
 * Record an action from window globals (called by Flow Loop).
 */
export function recordActionFromSignals(
  signals: {
    editing?: boolean;
    toolSwitches?: Array<{ tool: string; timestamp: number }>;
    viewSwitches?: Array<{ view: string; timestamp: number }>;
    flow?: number;
    pulse?: number;
    tension?: number;
    mode?: string;
  }
): void {
  // Record tool switches
  if (signals.toolSwitches && signals.toolSwitches.length > 0) {
    const latest = signals.toolSwitches[signals.toolSwitches.length - 1];
    flowLoopLearning.recordAction('tool', latest.tool, {
      flow: signals.flow || 0,
      pulse: signals.pulse || 0,
      tension: signals.tension || 0,
      mode: signals.mode,
    });
  }

  // Record view switches
  if (signals.viewSwitches && signals.viewSwitches.length > 0) {
    const latest = signals.viewSwitches[signals.viewSwitches.length - 1];
    flowLoopLearning.recordAction('view', latest.view, {
      flow: signals.flow || 0,
      pulse: signals.pulse || 0,
      tension: signals.tension || 0,
      mode: signals.mode,
    });
  }
}








