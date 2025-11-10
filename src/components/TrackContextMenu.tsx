import React from 'react';

interface TrackContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onRename: () => void;
  onChangeColor: () => void;
}

const TrackContextMenu: React.FC<TrackContextMenuProps> = ({ x, y, onDelete, onRename, onChangeColor }) => {
  const menuItemStyle = "px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-md transition-colors w-full text-left";

  return (
    <div
      className="absolute z-50 w-40 rounded-lg bg-black/50 border border-gray-100/20 backdrop-filter backdrop-blur-lg shadow-lg p-2"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="flex flex-col">
        <li><button onClick={onRename} className={menuItemStyle}>Rename</button></li>
        <li><button onClick={onChangeColor} className={menuItemStyle}>Change Color</button></li>
        <li><div className="h-px bg-gray-100/20 my-1"></div></li>
        <li><button onClick={onDelete} className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-md transition-colors w-full text-left">Delete Track</button></li>
      </ul>
    </div>
  );
};

export default TrackContextMenu;