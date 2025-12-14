import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hexToRgba } from '../../utils/ALS';
import { useFlowContext } from '../../state/flowContextService';
import type { PulsePalette } from '../../utils/ALS';
import { AuraColors, AuraEffects } from '../../theme/aura-tokens';
import {
  bloomChargeFromFlow,
  getBloomScale,
  getBloomGlow,
  getBloomColor,
} from '../../core/bloom/bloomCharge';
import './BloomHUD.css';

export interface BloomFloatingMenuItem {
  name: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  subMenu?: string;
  action?: () => void;
  accentColor?: string;
  progressPercent?: number;
}

export interface BloomFloatingMenu {
  parent?: string;
  items: BloomFloatingMenuItem[];
}

interface BloomFloatingHubProps {
  menuConfig: Record<string, BloomFloatingMenu>;
  alsPulseAgent?: PulsePalette | null;
  initialMenu?: string;
  label?: string;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  menuRequest?: { menu: string; open?: boolean; timestamp: number } | null;
}

const PETAL_RADIUS = 130;
const VIEWPORT_PADDING = 32;
const DEFAULT_DOCK_SIZE = { width: 420, height: 132 };
const DEFAULT_HUB_SIZE = { width: 220, height: 220 };
const HUB_OFFSET = { x: 48, y: 24 };

const getFallbackHubPosition = () => {
  if (typeof window === 'undefined') {
    return { x: 520, y: 720 };
  }

  const dockX = VIEWPORT_PADDING;
  const dockY = Math.max(
    VIEWPORT_PADDING,
    window.innerHeight - DEFAULT_DOCK_SIZE.height - VIEWPORT_PADDING
  );
  const candidateX = dockX + DEFAULT_DOCK_SIZE.width + HUB_OFFSET.x;
  const maxX = window.innerWidth - DEFAULT_HUB_SIZE.width - VIEWPORT_PADDING;
  const x = Math.max(VIEWPORT_PADDING, Math.min(candidateX, maxX));

  const dockBottom = Math.min(
    window.innerHeight - VIEWPORT_PADDING,
    dockY + DEFAULT_DOCK_SIZE.height
  );
  const candidateY = dockBottom - DEFAULT_HUB_SIZE.height - HUB_OFFSET.y;
  const maxY = window.innerHeight - DEFAULT_HUB_SIZE.height - VIEWPORT_PADDING;
  const y = Math.max(VIEWPORT_PADDING, Math.min(candidateY, maxY));

  return { x, y };
};

const getPetalPosition = (index: number, total: number, radius: number) => {
  if (total === 0) {
    return { x: 0, y: 0 };
  }
  const angle = (360 / total) * index - 90;
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) * radius;
  const y = Math.sin(radians) * radius;
  return { x, y };
};

const buildProgressIcon = (accent: string, percent?: number) => {
  const clamped = percent !== undefined ? Math.max(0, Math.min(100, percent)) : undefined;
  return (
    <div className="relative flex h-11 w-11 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            clamped !== undefined
              ? `conic-gradient(${accent} ${clamped}%, rgba(255,255,255,0.06) ${clamped}%)`
              : `radial-gradient(circle, ${hexToRgba(accent, 0.35)} 0%, rgba(12,20,38,0.85) 70%)`,
          boxShadow: `0 0 18px ${hexToRgba(accent, 0.3)}`,
        }}
      />
      <div className="absolute inset-[18%] rounded-full bg-black/40 backdrop-blur-sm border border-white/10" />
    </div>
  );
};

export const BloomFloatingHub: React.FC<BloomFloatingHubProps> = ({
  menuConfig,
  alsPulseAgent,
  initialMenu = 'main',
  label = 'AURA',
  position,
  onPositionChange,
  menuRequest,
}) => {
  const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
  const flowContext = useFlowContext();
  const fallbackPosition = useMemo(getFallbackHubPosition, []);
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<BloomFloatingMenuItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [renderPosition, setRenderPosition] = useState(
    position ?? fallbackPosition
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetPositionRef = useRef(position ?? fallbackPosition);
  const animationFrameRef = useRef<number | null>(null);
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const currentMenu = menuConfig[activeMenu];
  const items = currentMenu?.items ?? [];

  const glowColor = alsPulseAgent?.glow ?? AuraColors.violet;
  const haloColor = alsPulseAgent?.halo ?? AuraColors.blue;
  const basePulseStrength = alsPulseAgent?.pulseStrength ?? (isOpen ? 0.65 : 0.4);
  const intensityBoost =
    flowContext.intensity === 'immersed'
      ? 0.22
      : flowContext.intensity === 'charged'
      ? 0.12
      : 0.02;
  const pulseStrength = clamp01(
    basePulseStrength + intensityBoost + flowContext.momentum * 0.18 + flowContext.momentumTrend * 0.35
  );

  const flowGlowColor = useMemo(
    () => hexToRgba(glowColor, (isOpen || isDragging ? 0.6 : 0.38) + pulseStrength * 0.2),
    [glowColor, isDragging, isOpen, pulseStrength]
  );

  const flowHaloColor = useMemo(
    () => hexToRgba(haloColor, 0.24 + pulseStrength * 0.2),
    [haloColor, pulseStrength]
  );

  // Dynamic Bloom Charge (Part D)
  const bloomCharge = useMemo(() => {
    if (typeof window === 'undefined' || !window.__als) {
      return 0.5; // Default charge
    }
    const flow = window.__als.flow || 0;
    const temp = (window.__als.temperature || 'cold') as any;
    return bloomChargeFromFlow(flow, temp);
  }, [flowContext, isOpen]);
  
  const bloomScale = useMemo(() => getBloomScale(bloomCharge), [bloomCharge]);
  const bloomGlowRadius = useMemo(() => getBloomGlow(bloomCharge), [bloomCharge]);
  const bloomChargeColor = useMemo(() => {
    if (typeof window === 'undefined' || !window.__als) {
      return flowGlowColor;
    }
    const temp = (window.__als.temperature || 'cold') as any;
    return getBloomColor(bloomCharge, temp);
  }, [bloomCharge, flowGlowColor]);
  
  const containerGlow = useMemo(
    () => ({
      boxShadow: `0 0 ${bloomGlowRadius}px ${bloomChargeColor}, inset 0 0 ${
        24 + pulseStrength * 26
      }px ${hexToRgba(AuraColors.violet, 0.28)}, 0 0 ${110 + pulseStrength * 70}px ${flowHaloColor}`,
      transform: `scale(${bloomScale})`,
      transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
    }),
    [bloomChargeColor, flowHaloColor, pulseStrength, bloomGlowRadius, bloomScale]
  );

  const scheduleAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      setRenderPosition((previous) => {
        const target = targetPositionRef.current;
        const stiffness = isDraggingRef.current ? 0.32 : 0.18;
        const damping = isDraggingRef.current ? 0.68 : 0.78;
        const velocity = velocityRef.current;
        const accelerationX = (target.x - previous.x) * stiffness;
        const accelerationY = (target.y - previous.y) * stiffness;
        const nextVelocity = {
          x: (velocity.x + accelerationX) * damping,
          y: (velocity.y + accelerationY) * damping,
        };
        const next = {
          x: previous.x + nextVelocity.x,
          y: previous.y + nextVelocity.y,
        };
        velocityRef.current = nextVelocity;
        const remaining = Math.hypot(target.x - next.x, target.y - next.y);
        const velocityMagnitude = Math.hypot(nextVelocity.x, nextVelocity.y);
        if (remaining > 0.3 || velocityMagnitude > 0.25) {
          scheduleAnimation();
          return next;
        }
        velocityRef.current = { x: 0, y: 0 };
        return target;
      });
    });
  }, []);

  useEffect(() => {
    targetPositionRef.current = position;
    scheduleAnimation();
  }, [position, scheduleAnimation]);

  useEffect(() => {
    if (!menuRequest) {
      return;
    }
    const { menu, open = true } = menuRequest;
    if (!menu || !menuConfig[menu]) {
      return;
    }
    setActiveMenu(menu);
    if (open) {
      setIsOpen(true);
    }
    setHoveredItem(null);
  }, [menuConfig, menuRequest]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  const clampPosition = useCallback((rawPosition: { x: number; y: number }) => {
    if (typeof window === 'undefined') {
      return rawPosition;
    }
    const padding = 24;
    const node = containerRef.current;
    const width = node?.offsetWidth ?? 220;
    const height = node?.offsetHeight ?? 220;
    const maxX = Math.max(padding, window.innerWidth - width - padding);
    const maxY = Math.max(padding, window.innerHeight - height - padding);
    return {
      x: Math.min(Math.max(padding, rawPosition.x), maxX),
      y: Math.min(Math.max(padding, rawPosition.y), maxY),
    };
  }, []);

const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
const hasDraggedRef = useRef(false);
const cleanupDragListenersRef = useRef<(() => void) | null>(null);

  const lastDragFinishedRef = useRef(false);

const handleDragPointerDown = useCallback(
  (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (cleanupDragListenersRef.current) {
      cleanupDragListenersRef.current();
      cleanupDragListenersRef.current = null;
    }

    hasDraggedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    lastDragFinishedRef.current = false;

    const rect = containerRef.current?.getBoundingClientRect();
    const basePosition = targetPositionRef.current;
    dragOffsetRef.current = {
      x: event.clientX - (rect?.left ?? basePosition.x),
      y: event.clientY - (rect?.top ?? basePosition.y),
    };

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();

      if (!hasDraggedRef.current && pointerStartRef.current) {
        const deltaX = Math.abs(event.clientX - pointerStartRef.current.x);
        const deltaY = Math.abs(event.clientY - pointerStartRef.current.y);
        if (deltaX >= 6 || deltaY >= 6) {
          hasDraggedRef.current = true;
          setIsDragging(true);
        } else {
          return;
        }
      }

      if (!hasDraggedRef.current) {
        return;
      }

      const nextX = event.clientX - dragOffsetRef.current.x;
      const nextY = event.clientY - dragOffsetRef.current.y;
      const clamped = clampPosition({ x: nextX, y: nextY });
      targetPositionRef.current = clamped;
      scheduleAnimation();
    };

    const handlePointerUp = (event: PointerEvent) => {
      event.preventDefault();

      if (hasDraggedRef.current) {
        const target = targetPositionRef.current;
        requestAnimationFrame(() => onPositionChange(target));
        lastDragFinishedRef.current = true;
      } else {
        targetPositionRef.current = position;
        scheduleAnimation();
        lastDragFinishedRef.current = false;
      }

      pointerStartRef.current = null;
      hasDraggedRef.current = false;
      setIsDragging(false);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      cleanupDragListenersRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    cleanupDragListenersRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  },
  [clampPosition, onPositionChange, position, scheduleAnimation]
);

useEffect(() => {
  return () => {
    if (cleanupDragListenersRef.current) {
      cleanupDragListenersRef.current();
    }
  };
}, []);

  const handlePetalClick = (item: BloomFloatingMenuItem) => {
    if (item.disabled) return;
    if (item.subMenu && menuConfig[item.subMenu]) {
      setActiveMenu(item.subMenu);
    } else if (item.action) {
      item.action();
      setIsOpen(false);
    }
  };

  const handleBack = () => {
    if (currentMenu?.parent && menuConfig[currentMenu.parent]) {
      setActiveMenu(currentMenu.parent);
    }
  };

  const dynamicRadius = useMemo(
    () => PETAL_RADIUS * (0.88 + flowContext.momentum * 0.28),
    [flowContext.momentum]
  );

  const petals = items.map((item, index) => {
    const radius = isOpen ? dynamicRadius : 0;
    const { x, y } = getPetalPosition(index, items.length, radius);
    const accent = item.accentColor ?? glowColor;
    const progress = item.progressPercent;
    const energy = progress !== undefined ? Math.max(0.35, progress / 100) : isOpen ? 1 : 0.6;
    const isHovered = hoveredItem?.name === item.name;

    // AURA Petal Style: Soft curved organic shapes with glass effect
    return (
      <button
        key={`${item.name}-${index}`}
        className={`absolute flex h-24 w-24 flex-col items-center justify-center border text-xs text-slate-100 transition-[transform,box-shadow,background,opacity] duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)] backdrop-blur-3xl ${
          item.disabled
            ? 'cursor-not-allowed opacity-40'
            : 'hover:scale-[1.1] focus-visible:scale-[1.1]'
        }`}
        style={{
          transform: `translate(${x}px, ${y}px) scale(${isOpen ? 1 : 0.4 + energy * 0.2})`,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transitionDelay: `${index * 40}ms`,
          // Petal Shape from AURA Visualization (Leaf/Petal)
          borderRadius: '50% 0 50% 50%',
          transformOrigin: '50% 50%',
          rotate: `${(360 / items.length) * index}deg`,
          
          background: `linear-gradient(135deg, ${hexToRgba(AuraColors.violet, 0.15)} 0%, ${hexToRgba(AuraColors.space, 0.9)} 100%)`,
          borderColor: isHovered ? hexToRgba(accent, 0.5) : 'rgba(255,255,255,0.1)',
          boxShadow: `${
            isHovered
              ? `0 0 ${24 + energy * 32}px ${hexToRgba(AuraColors.violet, 0.46)}`
              : `0 0 ${14 + energy * 22}px ${hexToRgba(AuraColors.violet, 0.2)}`
          }, inset 0 0 ${6 + energy * 18}px ${hexToRgba(accent, 0.2)}`,
        }}
        onClick={() => handlePetalClick(item)}
        onMouseEnter={() => setHoveredItem(item)}
        onFocus={() => setHoveredItem(item)}
        onMouseLeave={() => setHoveredItem(null)}
        onBlur={() => setHoveredItem(null)}
      >
        <div className="flex flex-col items-center justify-center -rotate-[var(--rotation)]" style={{ '--rotation': `${(360 / items.length) * index}deg` } as React.CSSProperties}>
          <div className="mb-1 text-[18px] text-white/90">
            {item.progressPercent !== undefined
              ? buildProgressIcon(accent, item.progressPercent)
              : item.icon ?? <span className="text-lg">•</span>}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70">
            {item.name}
          </span>
        </div>
      </button>
    );
  });

  return (
    <div
      ref={containerRef}
      className="bloom-hud-fixed select-none pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="relative flex flex-col items-end space-y-3 pointer-events-auto">
        {hoveredItem && (
          <div className="absolute top-[-80px] left-1/2 transform -translate-x-1/2 max-w-xs rounded-2xl border px-5 py-4 text-xs text-white/80 shadow-2xl backdrop-blur-2xl z-50 text-center pointer-events-none"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              background: 'rgba(5,5,10,0.9)',
              boxShadow: `0 0 40px ${hexToRgba(AuraColors.violet, 0.3)}`,
              minWidth: '200px'
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="uppercase tracking-[0.2em] text-[12px] font-bold text-white">
                {hoveredItem.name}
              </span>
              {hoveredItem.description && (
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {hoveredItem.description}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-full"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${hexToRgba(
                AuraColors.violet,
                0.2
              )}, transparent 70%)`,
              filter: 'blur(48px)',
            }}
          />
          {petals}
          <button
            type="button"
            className={`relative flex h-32 w-32 items-center justify-center rounded-full border border-white/20 text-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] backdrop-blur-3xl ${
              isOpen ? 'scale-[1.05]' : 'scale-100'
            }`}
            style={containerGlow}
            onClick={() => {
              if (lastDragFinishedRef.current) {
                lastDragFinishedRef.current = false;
                return;
              }
              if (isOpen && currentMenu?.parent) {
                setActiveMenu(currentMenu.parent);
              }
              setIsOpen((prev) => !prev);
              setHoveredItem(null);
            }}
            onPointerDown={handleDragPointerDown}
          >
            <div
              className="flex flex-col items-center text-center z-10"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${hexToRgba(
                  AuraColors.violet,
                  0.3
                )}, transparent 80%)`,
                padding: '20px',
                borderRadius: '9999px',
              }}
            >
              <span className="text-[14px] font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]">
                {label}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/50">
                {isOpen ? 'Close' : 'Menu'}
              </span>
              {activeMenu !== 'main' && targetPositionRef.current && (
                 <span className="absolute -bottom-8 rounded-full bg-black/60 px-3 py-1 text-[9px] uppercase tracking-[0.15em] text-white/80 border border-white/10 backdrop-blur-md">
                   {activeMenu}
                 </span>
              )}
            </div>
            {/* Inner ring */}
            <div className="absolute inset-2 rounded-full border border-white/10" />
            <div
              className="absolute inset-0 -z-10 rounded-full"
              style={{
                boxShadow: `0 0 60px ${hexToRgba(AuraColors.violet, 0.4)}, inset 0 0 40px ${hexToRgba(
                  glowColor,
                  0.2
                )}`,
                opacity: isOpen || isDragging ? 1 : 0.8,
                transition: 'opacity 0.35s ease, box-shadow 0.45s ease',
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
