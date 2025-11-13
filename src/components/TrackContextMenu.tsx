import React from 'react';

interface TrackContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onRename: () => void;
  onChangeColor: () => void;
  canDelete?: boolean;
  canRename?: boolean;
  canChangeColor?: boolean;
}

const TrackContextMenu: React.FC<TrackContextMenuProps> = ({ x, y, onDelete, onRename, onChangeColor, canDelete = true, canRename = true, canChangeColor = true }) => {
  const menuItemStyle = "px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-md transition-colors w-full text-left";
  const disabledItemStyle = "px-4 py-2 text-sm text-gray-500/60 rounded-md w-full text-left cursor-not-allowed";

  return (
    <div
      className="absolute z-50 w-40 rounded-lg bg-black/50 border border-gray-100/20 backdrop-filter backdrop-blur-lg shadow-lg p-2"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="flex flex-col">
        <li>
          <button
            onClick={canRename ? onRename : undefined}
            disabled={!canRename}
            className={canRename ? menuItemStyle : disabledItemStyle}
          >
            Rename
          </button>
        </li>
        <li>
          <button
            onClick={canChangeColor ? onChangeColor : undefined}
            disabled={!canChangeColor}
            className={canChangeColor ? menuItemStyle : disabledItemStyle}
          >
            Change Color
          </button>
        </li>
        <li><div className="h-px bg-gray-100/20 my-1"></div></li>
        <li>
          <button
            onClick={canDelete ? onDelete : undefined}
            disabled={!canDelete}
            className={canDelete ? "px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-md transition-colors w-full text-left" : "px-4 py-2 text-sm text-red-400/40 rounded-md w-full text-left cursor-not-allowed"}
          >
            Delete Track
          </button>
        </li>
      </ul>
    </div>
  );
};

export default TrackContextMenu;