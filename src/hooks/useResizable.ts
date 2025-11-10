

import { useState, useRef, useEffect, useCallback, RefObject } from 'react';

interface UseResizableOptions {
  minWidth?: number;
  minHeight?: number;
  initialWidth?: number;
  initialHeight?: number;
}

const useResizable = (options: UseResizableOptions = {}) => {
  const { minWidth = 100, minHeight = 100, initialWidth = 300, initialHeight = 200 } = options;
  
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isResizing, setIsResizing] = useState(false);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  
  const onMouseDown = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  const onMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    setSize(prevSize => {
      const newWidth = prevSize.width + e.movementX;
      const newHeight = prevSize.height + e.movementY;
      return {
        width: Math.max(minWidth, newWidth),
        height: Math.max(minHeight, newHeight),
      };
    });
  }, [isResizing, minWidth, minHeight]);

  useEffect(() => {
    const handle = resizeHandleRef.current;
    if (handle) {
      handle.addEventListener('mousedown', onMouseDown);
    }
    
    // Add listeners to the document to handle mouse move/up even if cursor leaves the handle
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      if (handle) {
        handle.removeEventListener('mousedown', onMouseDown);
      }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseDown, onMouseUp, onMouseMove]);

  return { size, isResizing, resizeHandleRef };
};

export default useResizable;