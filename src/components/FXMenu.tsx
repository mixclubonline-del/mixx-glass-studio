import React, { useEffect, useRef } from 'react';

interface FXMenuProps {
  fxWindows: { id: string; title: string }[];
  fxVisibility: { [key: string]: boolean };
  onToggleFxVisibility: (fxId: string) => void;
  onClose: () => void;
}

const FXMenu: React.FC<FXMenuProps> = ({ fxWindows, fxVisibility, onToggleFxVisibility, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 rounded-lg bg-black/50 border border-gray-100/20 backdrop-filter backdrop-blur-lg shadow-lg p-2"
    >
      <ul>
        {fxWindows.map((fx) => (
          <li key={fx.id}>
            <button
              onClick={() => onToggleFxVisibility(fx.id)}
              className="w-full text-left px-3 py-2 text-sm rounded-md flex justify-between items-center hover:bg-white/10 transition-colors"
            >
              <span className={fxVisibility[fx.id] ? 'text-cyan-300' : 'text-gray-300'}>
                {fx.title}
              </span>
              {fxVisibility[fx.id] && (
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_#06b6d4]"></div>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FXMenu;