/**
 * AuraFloatingHub Component
 * 
 * Draggable floating bloom menu for in-session navigation.
 * Replaces BloomFloatingHub with the new BloomMenu component.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BloomMenu } from './BloomMenu';
import { publishBloomSignal } from '../../state/flowSignals';
import type { PulsePalette } from '../../utils/ALS';

interface AuraFloatingHubProps {
  /** Position of the hub */
  position: { x: number; y: number };
  /** Callback when position changes (for dragging) */
  onPositionChange: (position: { x: number; y: number }) => void;
  /** ALS pulse palette for visual feedback */
  alsPulseAgent?: PulsePalette | null;
  /** Callback when an action is triggered */
  onAction?: (action: string, payload?: unknown) => void;
}

export const AuraFloatingHub: React.FC<AuraFloatingHubProps> = ({
  position,
  onPositionChange,
  alsPulseAgent,
  onAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const positionRef = useRef(position);

  // Keep position ref in sync
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Handle drag start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only start drag from center core area
    const target = e.target as HTMLElement;
    if (!target.closest('.bloom-core-drag-handle')) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };

    // Capture pointer for smooth dragging
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  // Handle drag move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;

    // Clamp to viewport
    const padding = 100;
    const clampedX = Math.max(padding, Math.min(window.innerWidth - padding, newX));
    const clampedY = Math.max(padding, Math.min(window.innerHeight - padding, newY));

    onPositionChange({ x: clampedX, y: clampedY });
  }, [isDragging, onPositionChange]);

  // Handle drag end
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    dragStartRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [isDragging]);

  // Handle menu item selection
  const handleItemSelect = useCallback((id: string, action?: string) => {
    console.log(`Floating hub action: ${id} -> ${action}`);
    
    // Publish to Flow's signal system
    publishBloomSignal({
      source: 'bloom-floating',
      action: action || id,
      payload: { menuItem: id },
    });

    // Notify parent
    if (onAction && action) {
      onAction(action, { menuItem: id });
    }

    // Close menu after action
    setIsOpen(false);
  }, [onAction]);

  // Glow intensity from ALS
  const glowIntensity = alsPulseAgent?.glowStrength ?? 0.3;

  return (
    <div
      ref={containerRef}
      className="fixed z-[200] pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Drag handle overlay - invisible but captures drag events on core */}
      <div 
        className="bloom-core-drag-handle absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full pointer-events-auto z-[60]"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      />

      {/* ALS glow feedback */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(139, 92, 246, ${glowIntensity * 0.3}) 0%, transparent 70%)`,
          filter: `blur(${20 + glowIntensity * 20}px)`,
          opacity: isOpen ? 1 : 0.5,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* BloomMenu in tool variant */}
      <div className="pointer-events-auto">
        <BloomMenu
          variant="tool"
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          onItemSelect={handleItemSelect}
        />
      </div>
    </div>
  );
};

export default AuraFloatingHub;
