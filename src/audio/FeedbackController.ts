/**
 * FEEDBACK CONTROLLER
 * 
 * Safety limiter to prevent feedback explosion.
 * Detects and prevents infinite loops in routing.
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

export interface FeedbackPath {
  from: string;
  to: string;
  gain: number;
}

export interface FeedbackController {
  /**
   * Check if adding a connection would create a feedback loop.
   * @param from Source track/plugin ID
   * @param to Destination track/plugin ID
   * @param existingPaths Current routing paths
   * @returns true if feedback loop would be created
   */
  wouldCreateLoop(from: string, to: string, existingPaths: FeedbackPath[]): boolean;

  /**
   * Detect all feedback loops in current routing.
   * @param paths Current routing paths
   * @returns Array of detected loop paths
   */
  detectLoops(paths: FeedbackPath[]): FeedbackPath[][];

  /**
   * Get maximum safe gain for a feedback path.
   * @param pathLength Length of the feedback path
   * @returns Maximum safe gain (0-1)
   */
  getMaxSafeGain(pathLength: number): number;
}

/**
 * Create a new FeedbackController instance.
 */
export function createFeedbackController(): FeedbackController {
  return {
    wouldCreateLoop(from: string, to: string, existingPaths: FeedbackPath[]): boolean {
      // Build adjacency map
      const graph = new Map<string, string[]>();
      existingPaths.forEach(path => {
        if (!graph.has(path.from)) {
          graph.set(path.from, []);
        }
        graph.get(path.from)!.push(path.to);
      });

      // Check if 'to' can reach 'from' (would create cycle)
      const visited = new Set<string>();
      const queue: string[] = [to];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === from) {
          return true; // Cycle detected
        }
        if (visited.has(current)) continue;
        visited.add(current);

        const neighbors = graph.get(current) || [];
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        });
      }

      return false;
    },

    detectLoops(paths: FeedbackPath[]): FeedbackPath[][] {
      const loops: FeedbackPath[][] = [];
      const graph = new Map<string, { to: string; path: FeedbackPath }[]>();

      // Build graph
      paths.forEach(path => {
        if (!graph.has(path.from)) {
          graph.set(path.from, []);
        }
        graph.get(path.from)!.push({ to: path.to, path });
      });

      // DFS to find cycles
      const visited = new Set<string>();
      const recStack = new Set<string>();
      const currentPath: FeedbackPath[] = [];

      const dfs = (node: string): void => {
        visited.add(node);
        recStack.add(node);

        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor.to)) {
            currentPath.push(neighbor.path);
            dfs(neighbor.to);
            currentPath.pop();
          } else if (recStack.has(neighbor.to)) {
            // Cycle found
            const cycleStart = currentPath.findIndex(p => p.from === neighbor.to);
            if (cycleStart !== -1) {
              loops.push([...currentPath.slice(cycleStart), neighbor.path]);
            }
          }
        }

        recStack.delete(node);
      };

      graph.forEach((_, node) => {
        if (!visited.has(node)) {
          dfs(node);
        }
      });

      return loops;
    },

    getMaxSafeGain(pathLength: number): number {
      // Longer paths allow less gain to prevent explosion
      // Path length 1: 0.9 max, length 2: 0.7, length 3+: 0.5
      if (pathLength === 1) return 0.9;
      if (pathLength === 2) return 0.7;
      return 0.5;
    },
  };
}

