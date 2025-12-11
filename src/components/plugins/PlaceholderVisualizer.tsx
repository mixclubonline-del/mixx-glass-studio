import React from "react";
import { VisualizerProps } from "../../App";
import { PLUGIN_CATALOG } from "../../audio/pluginCatalog";

/**
 * Placeholder visualizer for plugins that are cataloged but don't have
 * full visualizer components yet. Displays plugin info with tier-appropriate styling.
 * 
 * Supports Flow by providing immediate visual feedback without blocking plugin usage.
 * Supports Reduction by using a single component for all placeholders.
 * Supports Recall by preserving plugin metadata and tier information.
 */
const PlaceholderVisualizer: React.FC<VisualizerProps<any>> = ({
  params,
  onChange,
  trackId,
  fxId,
}) => {
  const pluginInfo = PLUGIN_CATALOG[fxId as keyof typeof PLUGIN_CATALOG];
  const tier = pluginInfo?.tier || "default";
  
  const tierColors: Record<string, { gradient: string; text: string; border: string }> = {
    pillar: {
      gradient: "from-purple-500/20 to-purple-600/30",
      text: "text-purple-200",
      border: "border-purple-400/30",
    },
    core: {
      gradient: "from-sky-400/20 to-blue-500/30",
      text: "text-sky-200",
      border: "border-sky-400/30",
    },
    neural: {
      gradient: "from-fuchsia-500/20 to-pink-600/30",
      text: "text-fuchsia-300",
      border: "border-fuchsia-500/30",
    },
    master: {
      gradient: "from-yellow-200/20 to-amber-300/30",
      text: "text-yellow-200",
      border: "border-yellow-400/30",
    },
    signature: {
      gradient: "from-rose-400/20 to-pink-500/30",
      text: "text-rose-200",
      border: "border-rose-500/30",
    },
    system: {
      gradient: "from-gray-300/20 to-slate-400/30",
      text: "text-gray-200",
      border: "border-gray-400/30",
    },
    default: {
      gradient: "from-gray-500/20 to-gray-700/30",
      text: "text-gray-300",
      border: "border-gray-500/30",
    },
  };

  const colors = tierColors[tier] || tierColors.default;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div
        className={`relative w-64 h-64 rounded-2xl bg-gradient-to-br ${colors.gradient} border ${colors.border} flex flex-col items-center justify-center backdrop-blur-sm`}
      >
        <div className="absolute inset-0 rounded-2xl bg-black/20" />
        <div className="relative z-10 text-center">
          <h3 className={`text-2xl font-bold ${colors.text} mb-2`}>
            {pluginInfo?.name || fxId}
          </h3>
          <p className="text-white/60 text-sm mb-4 max-w-xs">
            {pluginInfo?.description || "Plugin visualizer coming soon"}
          </p>
          {pluginInfo?.tierLabel && (
            <span className={`inline-block px-3 py-1 rounded-full text-xs ${colors.text} bg-white/10 border ${colors.border}`}>
              {pluginInfo.tierLabel}
            </span>
          )}
        </div>
      </div>
      {pluginInfo?.moodResponse && (
        <div className="mt-6 text-center max-w-md">
          <p className="text-white/50 text-sm italic">
            {pluginInfo.moodResponse}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlaceholderVisualizer;









