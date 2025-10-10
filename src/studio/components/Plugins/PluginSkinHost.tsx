/**
 * Plugin Skin Host - Renders plugin UI with custom skin background and mapped controls
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface PluginParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  x: number; // Position on skin (percentage)
  y: number;
  size?: number; // Size of interactive area
}

interface PluginSkinHostProps {
  pluginId: string;
  skinImageUrl: string;
  parameters: PluginParameter[];
  onParameterChange: (paramName: string, value: number) => void;
  width?: number;
  height?: number;
}

export const PluginSkinHost: React.FC<PluginSkinHostProps> = ({
  pluginId,
  skinImageUrl,
  parameters,
  onParameterChange,
  width = 600,
  height = 400
}) => {
  const [draggingParam, setDraggingParam] = useState<string | null>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);

  const handleMouseDown = useCallback((param: PluginParameter, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingParam(param.name);
    setDragStartY(e.clientY);
    setDragStartValue(param.value);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingParam) return;
    
    const param = parameters.find(p => p.name === draggingParam);
    if (!param) return;

    const deltaY = dragStartY - e.clientY; // Inverted: up = increase
    const range = param.max - param.min;
    const sensitivity = 0.5; // Adjust sensitivity
    const delta = (deltaY / 100) * range * sensitivity;
    
    let newValue = dragStartValue + delta;
    newValue = Math.max(param.min, Math.min(param.max, newValue));
    
    onParameterChange(param.name, newValue);
  }, [draggingParam, dragStartY, dragStartValue, parameters, onParameterChange]);

  const handleMouseUp = useCallback(() => {
    setDraggingParam(null);
  }, []);

  React.useEffect(() => {
    if (draggingParam) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingParam, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className="relative select-none"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        backgroundImage: `url(${skinImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Interactive parameter areas */}
      {parameters.map((param) => (
        <div
          key={param.name}
          className={cn(
            "absolute cursor-ns-resize",
            draggingParam === param.name && "cursor-grabbing"
          )}
          style={{
            left: `${param.x}%`,
            top: `${param.y}%`,
            width: `${param.size || 10}%`,
            height: `${param.size || 10}%`,
            transform: 'translate(-50%, -50%)'
          }}
          onMouseDown={(e) => handleMouseDown(param, e)}
          title={`${param.name}: ${param.value.toFixed(1)}${param.unit || ''}`}
        >
          {/* Visual feedback (optional) */}
          <div className="w-full h-full rounded-full hover:bg-primary/10 transition-colors" />
        </div>
      ))}

      {/* Parameter value displays */}
      {parameters.map((param) => (
        <div
          key={`value-${param.name}`}
          className="absolute text-xs font-mono text-white/80 pointer-events-none"
          style={{
            left: `${param.x}%`,
            top: `${param.y + 8}%`,
            transform: 'translate(-50%, 0)'
          }}
        >
          {param.value.toFixed(0)}{param.unit}
        </div>
      ))}
    </div>
  );
};
