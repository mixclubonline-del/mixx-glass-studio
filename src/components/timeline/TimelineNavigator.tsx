import React, { useEffect, useMemo, useRef, useState } from "react";
import { AuraColors, AuraEffects, AuraGradients, auraAlpha } from "../../theme/aura-tokens";

type TimelineNavigatorProps = {
  contentWidth: number;
  viewportWidth: number;
  scrollX: number;
  onScroll: (nextScrollX: number) => void;
  onZoomToRegion?: (startRatio: number, endRatio: number) => void;
  followPlayhead?: boolean;
};

type DragState =
  | {
      mode: "thumb";
      startClientX: number;
      startThumbLeft: number;
    }
  | {
      mode: "region";
      startClientX: number;
      startRatio: number;
    };

const MIN_THUMB_WIDTH = 42;
const MIN_REGION_RATIO = 0.005;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const TimelineNavigator: React.FC<TimelineNavigatorProps> = ({
  contentWidth,
  viewportWidth,
  scrollX,
  onScroll,
  onZoomToRegion,
  followPlayhead,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [selectionRatios, setSelectionRatios] = useState<{ start: number; end: number } | null>(
    null
  );

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const measure = () => {
      setTrackWidth(node.clientWidth);
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const shouldRender = contentWidth > viewportWidth && trackWidth > 0 && viewportWidth > 0;

  const { thumbWidth, thumbLeft, availableTrack } = useMemo(() => {
    if (!shouldRender) {
      return { thumbWidth: trackWidth, thumbLeft: 0, availableTrack: 0 };
    }
    const ratio = clamp(viewportWidth / contentWidth, 0, 1);
    const width = Math.max(MIN_THUMB_WIDTH, ratio * trackWidth);
    const available = Math.max(0, trackWidth - width);
    const maxScroll = Math.max(0, contentWidth - viewportWidth);
    const left =
      maxScroll > 0 ? clamp((scrollX / maxScroll) * available, 0, available) : 0;
    return { thumbWidth: width, thumbLeft: left, availableTrack: available };
  }, [shouldRender, trackWidth, viewportWidth, contentWidth, scrollX]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const trackNode = trackRef.current;
      if (!trackNode) return;
      const rect = trackNode.getBoundingClientRect();
      if (rect.width <= 0) return;

      if (drag.mode === "thumb") {
        if (availableTrack <= 0) return;
        const deltaPx = event.clientX - drag.startClientX;
        const nextLeft = clamp(drag.startThumbLeft + deltaPx, 0, availableTrack);
        const maxScroll = Math.max(0, contentWidth - viewportWidth);
        const ratio = availableTrack > 0 ? nextLeft / availableTrack : 0;
        const nextScroll = ratio * maxScroll;
        onScroll(nextScroll);
      } else if (drag.mode === "region") {
        const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        setSelectionRatios({
          start: drag.startRatio,
          end: ratio,
        });
      }
    };

    const handleUp = () => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag) return;

      if (drag.mode === "region") {
        const region = selectionRatios;
        setSelectionRatios(null);
        if (!region) return;
        const start = clamp(Math.min(region.start, region.end), 0, 1);
        const end = clamp(Math.max(region.start, region.end), 0, 1);
        const span = end - start;
        if (span < MIN_REGION_RATIO) {
          const center = (start + end) / 2;
          const target = center * contentWidth - viewportWidth / 2;
          onScroll(target);
          return;
        }
        if (onZoomToRegion) {
          onZoomToRegion(start, end);
        }
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [
    availableTrack,
    contentWidth,
    onScroll,
    onZoomToRegion,
    selectionRatios,
    viewportWidth,
  ]);

  if (!shouldRender) {
    return null;
  }

  const handleThumbMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragRef.current = {
      mode: "thumb",
      startClientX: event.clientX,
      startThumbLeft: thumbLeft,
    };
  };

  const handleTrackMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.dataset.nav === "thumb") {
      return;
    }
    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    if (rect.width <= 0) return;

    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);

    if (!event.shiftKey && !event.altKey && !event.metaKey) {
      dragRef.current = {
        mode: "region",
        startClientX: event.clientX,
        startRatio: ratio,
      };
      setSelectionRatios({ start: ratio, end: ratio });
      return;
    }

    const targetScroll = ratio * contentWidth - viewportWidth / 2;
    onScroll(targetScroll);
  };

  const selectionStyle = selectionRatios
    ? {
        left: `${clamp(Math.min(selectionRatios.start, selectionRatios.end), 0, 1) * 100}%`,
        width: `${Math.abs(selectionRatios.end - selectionRatios.start) * 100}%`,
      }
    : undefined;

  return (
    <div className="h-full px-6 py-3">
      <div
        ref={trackRef}
        className="relative h-full w-full cursor-pointer select-none rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-lg transition-colors duration-150"
        onMouseDown={handleTrackMouseDown}
      >
        <div className="absolute inset-0">
          <div
            className="absolute inset-y-0 rounded-lg bg-cyan-400/10"
            style={{
              left: `${(scrollX / contentWidth) * 100}%`,
              width: `${(viewportWidth / contentWidth) * 100}%`,
              opacity: followPlayhead ? 0.45 : 0.7,
              transition: "opacity 160ms ease",
            }}
          />
        </div>
        {selectionRatios && (
          <div
            className="absolute inset-y-1 rounded-md bg-fuchsia-500/30 border border-fuchsia-400/40"
            style={selectionStyle}
          />
        )}
        <div
          data-nav="thumb"
          className="absolute inset-y-[3px] rounded-lg border border-white/20 bg-white/20 backdrop-blur-md shadow-2xl hover:bg-white/30 active:bg-white/40 transition-all duration-150 cursor-grab active:cursor-grabbing"
          style={{
            width: thumbWidth,
            left: thumbLeft,
            boxShadow: `0 6px 18px ${auraAlpha(AuraColors.cyan, 0.2)}`,
            border: `1px solid ${auraAlpha('#ffffff', 0.15)}`,
          }}
          onMouseDown={handleThumbMouseDown}
        />
        <div className="absolute left-4 top-2 text-[10px] uppercase tracking-[0.32em] text-white/50">
          {followPlayhead ? "Follow On" : "Follow Off"}
        </div>
      </div>
    </div>
  );
};

export default TimelineNavigator;

