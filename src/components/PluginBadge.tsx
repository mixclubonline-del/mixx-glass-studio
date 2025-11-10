
// components/PluginBadge.tsx
import React from 'react';
import { TrackData, FxWindowId } from '../App';
import { XIcon, SlidersIcon } from './icons';

interface PluginBadgeProps {
  trackId: string;
  fxId: FxWindowId;
  name: string;
  trackColor: TrackData['trackColor'];
  index: number;
  onRemove: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onOpenPluginSettings: (fxId: FxWindowId) => void;
  onOpenAutomationParamMenu?: (e: React.MouseEvent) => void;
}

const colorMap = {
  cyan: 'bg-cyan-500/50 border-cyan-400/70 text-cyan-200',
  magenta: 'bg-fuchsia-500/50 border-fuchsia-400/70 text-fuchsia-200',
  blue: 'bg-blue-500/50 border-blue-400/70 text-blue-200',
  green: 'bg-green-500/50 border-green-400/70 text-green-200',
  purple: 'bg-violet-500/50 border-violet-400/70 text-violet-200',
};

const PluginBadge: React.FC<PluginBadgeProps> = ({
  trackId,
  fxId,
  name,
  trackColor,
  index,
  onRemove,
  onMove,
  onOpenPluginSettings,
  onOpenAutomationParamMenu,
}) => {

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('plugin-index', index.toString());
    e.dataTransfer.setData('track-id', trackId);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const fromIndex = parseInt(e.dataTransfer.getData('plugin-index'), 10);
    const fromTrackId = e.dataTransfer.getData('track-id');
    if (fromTrackId === trackId) {
      onMove(fromIndex, index);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`w-full h-8 px-2 flex items-center justify-between rounded-md border text-xs font-semibold cursor-grab active:cursor-grabbing
                  ${colorMap[trackColor]}`}
    >
      <span className="truncate flex-grow" onClick={(e) => { e.stopPropagation(); onOpenPluginSettings(fxId); }}>{name}</span>
      <div className="flex items-center space-x-1 flex-shrink-0">
        {onOpenAutomationParamMenu && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenAutomationParamMenu(e); }}
            className="p-1 rounded hover:bg-white/20"
            title="Show Automation Parameters"
          >
            <SlidersIcon className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 rounded hover:bg-white/20"
          title="Remove Plugin"
        >
          <XIcon className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default PluginBadge;
