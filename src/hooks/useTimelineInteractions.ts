import { useCallback, useEffect, useRef } from "react";

interface TimelineInteractionsArgs {
  scrollX: number;
  setScrollX: (value: number | ((prev: number) => number)) => void;
  getPixelsPerSecond: () => number;
  setPixelsPerSecond: (value: number) => void;
  contentWidth: number;
  viewportRef: React.RefObject<HTMLDivElement>;
  onManualScroll?: () => void;
  minPixelsPerSecond?: number;
  maxPixelsPerSecond?: number;
}

interface SmoothScrollJob {
  target: number;
  start: number;
  startTime: number;
  duration: number;
  easing: (t: number) => number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(t: number) {
  const p = t - 1;
  return p * p * p + 1;
}

export function useTimelineInteractions({
  scrollX,
  setScrollX,
  getPixelsPerSecond,
  setPixelsPerSecond,
  contentWidth,
  viewportRef,
  onManualScroll,
  minPixelsPerSecond = 10,
  maxPixelsPerSecond = 500,
}: TimelineInteractionsArgs) {
  const momentumVelocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const smoothScrollJobRef = useRef<SmoothScrollJob | null>(null);
  const lastWheelTimeRef = useRef<number>(0);

  const stopMomentum = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    momentumVelocityRef.current = 0;
  }, []);

  const applyScroll = useCallback(
    (next: number) => {
      const viewport = viewportRef.current;
      const viewportWidth = viewport?.clientWidth ?? 0;
      const maxScroll = Math.max(0, contentWidth - viewportWidth);
      setScrollX(clamp(next, 0, maxScroll));
    },
    [contentWidth, setScrollX, viewportRef]
  );

  const scheduleMomentumStep = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame((timestamp) => {
      const velocity = momentumVelocityRef.current;
      if (Math.abs(velocity) < 0.01) {
        rafRef.current = null;
        momentumVelocityRef.current = 0;
        return;
      }
      applyScroll(scrollX + velocity);
      momentumVelocityRef.current = velocity * 0.92;
      scheduleMomentumStep();
    });
  }, [applyScroll, scrollX]);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        // Zoom handled elsewhere.
        return;
      }
      event.preventDefault();
      onManualScroll?.();
      const viewport = viewportRef.current;
      const viewportWidth = viewport?.clientWidth ?? 0;
      const maxScroll = Math.max(0, contentWidth - viewportWidth);
      const delta = event.shiftKey ? event.deltaY || event.deltaX : event.deltaX || event.deltaY;
      const next = clamp(scrollX + delta, 0, maxScroll);
      applyScroll(next);

      const now = performance.now();
      const timeSinceLastWheel = now - lastWheelTimeRef.current;
      lastWheelTimeRef.current = now;
      const velocityContribution = delta / Math.max(timeSinceLastWheel, 16);
      momentumVelocityRef.current = clamp(
        momentumVelocityRef.current + velocityContribution * 6,
        -40,
        40
      );
      scheduleMomentumStep();
    },
    [applyScroll, contentWidth, onManualScroll, scheduleMomentumStep, scrollX, viewportRef]
  );

  const smoothScrollTo = useCallback(
    (target: number, duration = 320, easing = easeOutCubic) => {
      stopMomentum();
      const job: SmoothScrollJob = {
        target,
        start: scrollX,
        startTime: performance.now(),
        duration,
        easing,
      };
      smoothScrollJobRef.current = job;

      const step = () => {
        const currentJob = smoothScrollJobRef.current;
        if (!currentJob) return;
        const now = performance.now();
        const elapsed = now - currentJob.startTime;
        const ratio = clamp(elapsed / currentJob.duration, 0, 1);
        const value = currentJob.start + (currentJob.target - currentJob.start) * currentJob.easing(ratio);
        applyScroll(value);
        if (ratio < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          smoothScrollJobRef.current = null;
          rafRef.current = null;
        }
      };

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(step);
    },
    [applyScroll, scrollX, stopMomentum]
  );

  const setPixelsPerSecondClamped = useCallback(
    (value: number) => {
      const clampedValue = clamp(value, minPixelsPerSecond, maxPixelsPerSecond);
      setPixelsPerSecond(clampedValue);
    },
    [maxPixelsPerSecond, minPixelsPerSecond, setPixelsPerSecond]
  );

  const zoomAroundPoint = useCallback(
    (factor: number, anchorX: number) => {
      const viewport = viewportRef.current;
      const viewportWidth = viewport?.clientWidth ?? 0;
      if (!viewportWidth) return;

      const currentPps = getPixelsPerSecond();
      const nextPps = clamp(currentPps * factor, minPixelsPerSecond, maxPixelsPerSecond);
      const anchorRatio = (scrollX + anchorX) / currentPps;
      setPixelsPerSecondClamped(nextPps);
      const newScroll = anchorRatio * nextPps - anchorX;
      applyScroll(newScroll);
    },
    [
      applyScroll,
      getPixelsPerSecond,
      maxPixelsPerSecond,
      minPixelsPerSecond,
      scrollX,
      setPixelsPerSecondClamped,
      viewportRef,
    ]
  );

  const zoomToFit = useCallback(
    (durationSeconds: number) => {
      const viewport = viewportRef.current;
      const width = viewport?.clientWidth ?? 0;
      if (!width || durationSeconds <= 0) return;
      const paddingRatio = 0.9;
      const targetPps = clamp((width * paddingRatio) / durationSeconds, minPixelsPerSecond, maxPixelsPerSecond);
      setPixelsPerSecondClamped(targetPps);
      applyScroll(0);
    },
    [applyScroll, maxPixelsPerSecond, minPixelsPerSecond, setPixelsPerSecondClamped, viewportRef]
  );

  const zoomToRange = useCallback(
    (start: number, end: number) => {
      const viewport = viewportRef.current;
      const width = viewport?.clientWidth ?? 0;
      if (!width) return;
      const range = Math.max(0.1, end - start);
      const targetPps = clamp((width * 0.9) / range, minPixelsPerSecond, maxPixelsPerSecond);
      setPixelsPerSecondClamped(targetPps);
      applyScroll(start * targetPps - width * 0.05);
    },
    [applyScroll, maxPixelsPerSecond, minPixelsPerSecond, setPixelsPerSecondClamped, viewportRef]
  );

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const wheelHandler = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        // Zoom via ctrl+wheel
        const direction = event.deltaY < 0 ? 1 : -1;
        const anchorX = event.clientX - node.getBoundingClientRect().left;
        const factor = direction > 0 ? 1.1 : 1 / 1.1;
        zoomAroundPoint(factor, anchorX);
        return;
      }
      handleWheel(event);
    };
    node.addEventListener("wheel", wheelHandler, { passive: false });
    return () => {
      node.removeEventListener("wheel", wheelHandler);
    };
  }, [handleWheel, viewportRef, zoomAroundPoint]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    smoothScrollTo,
    zoomAroundPoint,
    zoomToFit,
    zoomToRange,
    stopMomentum,
    setPixelsPerSecondClamped,
  };
}

