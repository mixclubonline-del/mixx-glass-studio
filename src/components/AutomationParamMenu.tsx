
// components/AutomationParamMenu.tsx
import React, { useRef, useEffect } from 'react';
import { FxWindowConfig, FxWindowId } from '../App';

interface AutomationParamMenuProps {
  x: number;
  y: number;
  trackId: string;
  fxWindows: FxWindowConfig[]; // All available plugin configs
  inserts: Record<string, FxWindowId[]>; // Current inserts for the track
  onToggleAutomationLane: (trackId: string, fxId: string, paramName: string) => void;
  onClose: () => void;
}

const AutomationParamMenu: React.FC<AutomationParamMenuProps> = ({
  x, y, trackId, fxWindows, inserts, onToggleAutomationLane, onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const trackInserts = inserts[trackId] || [];

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

  const allAutomatableParams: { fxId: string; fxName: string; paramName: string; }[] = [];

  // Add track volume and pan as automatable parameters
  allAutomatableParams.push(
    { fxId: 'track', fxName: 'Track', paramName: 'volume' },
    { fxId: 'track', fxName: 'Track', paramName: 'pan' }
  );

  trackInserts.forEach(fxId => {
    const fxConfig = fxWindows.find(f => f.id === fxId);
    if (fxConfig) {
      const engine = fxConfig.engineInstance;
      if (engine && typeof engine.getParameterNames === 'function') {
        engine.getParameterNames().forEach(paramName => {
          allAutomatableParams.push({
            fxId: fxId,
            fxName: fxConfig.name,
            paramName: paramName,
          });
        });
      }
    }
  });

  return (
    <div
      ref={menuRef}
      className="absolute w-56 rounded-lg bg-black/70 border border-gray-100/20 backdrop-filter backdrop-blur-lg shadow-lg p-2 z-50"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-sm font-bold text-gray-300 px-3 py-1 mb-1 border-b border-gray-700/50">Automation Params</h3>
      <ul className="max-h-60 overflow-y-auto custom-scrollbar">
        {allAutomatableParams.map((param, index) => (
          <li key={`${param.fxId}-${param.paramName}-${index}`}>
            <button
              onClick={() => {
                onToggleAutomationLane(trackId, param.fxId, param.paramName);
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-md flex flex-col hover:bg-white/10 transition-colors"
            >
              <span className="text-cyan-300 font-semibold">{param.fxName}</span>
              <span className="text-gray-400 text-xs pl-2">{param.paramName}</span>
            </button>
          </li>
        ))}
        {allAutomatableParams.length === 0 && (
          <li><span className="text-gray-500 px-3 py-2 text-sm block">No automatable parameters.</span></li>
        )}
      </ul>
    </div>
  );
};

export default AutomationParamMenu;
