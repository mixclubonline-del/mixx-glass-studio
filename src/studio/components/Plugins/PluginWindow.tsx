/**
 * PluginWindow - Draggable/resizable modal container for plugins
 */

import { useState, useRef, useEffect } from 'react';
import { X, Minus, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PluginWindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function PluginWindow({
  title,
  onClose,
  children,
  defaultWidth = 600,
  defaultHeight = 400,
  minWidth = 400,
  minHeight = 300,
  maxWidth = 1200,
  maxHeight = 800,
}: PluginWindowProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        
        setSize({
          width: Math.max(minWidth, Math.min(maxWidth, resizeStart.current.width + deltaX)),
          height: Math.max(minHeight, Math.min(maxHeight, resizeStart.current.height + deltaY)),
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, minWidth, minHeight, maxWidth, maxHeight]);
  
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };
  
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  };
  
  return (
    <div
      className={cn(
        "fixed glass-glow rounded-lg overflow-hidden shadow-2xl z-50 flex flex-col",
        "border border-[hsl(var(--glass-border))]"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
      }}
    >
      {/* Title bar */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 cursor-move select-none",
          "bg-gradient-to-r from-secondary/80 to-secondary/60 border-b border-border"
        )}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          {/* Mixxclub branding */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[hsl(var(--prime-500))] to-[hsl(var(--neon-pink))] flex items-center justify-center">
            <span className="text-[10px] font-bold">∞</span>
          </div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={onClose}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto p-4 bg-background/95">
          {children}
        </div>
      )}
      
      {/* Resize handle */}
      {!isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <Maximize2 className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
