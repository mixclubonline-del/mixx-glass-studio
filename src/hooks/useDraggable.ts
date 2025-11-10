import { useState, useRef, useEffect, useCallback, RefObject } from 'react';

const useDraggable = (initialPosition = { x: 100, y: 100 }, constraintsRef?: RefObject<HTMLElement>) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });
  const dragFlag = useRef(false);

  const onMouseDown = useCallback((e: MouseEvent) => {
    if (elementRef.current && elementRef.current.contains(e.target as Node)) {
      if ((e.target as HTMLElement).style.cursor === 'move') {
        dragFlag.current = true;
        const rect = elementRef.current.getBoundingClientRect();
        offset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    }
  }, []);

  const onMouseUp = useCallback(() => {
    dragFlag.current = false;
    setIsDragging(false);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragFlag.current || !elementRef.current) return;
    e.preventDefault();
    if (!isDragging) setIsDragging(true);

    let newX = e.clientX - offset.current.x;
    let newY = e.clientY - offset.current.y;

    if (constraintsRef?.current) {
        const parentRect = constraintsRef.current.getBoundingClientRect();
        const elementRect = elementRef.current.getBoundingClientRect();
        newX = Math.max(parentRect.left, Math.min(newX, parentRect.right - elementRect.width));
        newY = Math.max(parentRect.top, Math.min(newY, parentRect.bottom - elementRect.height));
    } else {
        const elementRect = elementRef.current.getBoundingClientRect();
        newX = Math.max(0, Math.min(newX, window.innerWidth - elementRect.width));
        newY = Math.max(0, Math.min(newY, window.innerHeight - elementRect.height));
    }


    setPosition({
      x: newX,
      y: newY,
    });
  }, [isDragging, constraintsRef]);

  useEffect(() => {
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [onMouseDown, onMouseUp, onMouseMove]);

  return { elementRef, position, isDragging };
};

export default useDraggable;