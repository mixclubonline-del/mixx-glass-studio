/**
 * MixxGlass Dialog Component
 * 
 * Proprietary dialog/modal component with glass aesthetic.
 * Replaces Radix UI Dialog components.
 */

import React, { useEffect, useRef } from 'react';
import { getGlassSurface } from '../utils/glassStyles';
import { useFlowMotion } from '../hooks/useFlowMotion';
import { MixxGlassButton, type MixxGlassButtonProps } from '../primitives/Button';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../../design-system';

export interface MixxGlassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export interface MixxGlassDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface MixxGlassDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface MixxGlassDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export interface MixxGlassDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export interface MixxGlassDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * MixxGlass Dialog
 * 
 * Glass aesthetic dialog with backdrop and smooth animations.
 */
export const MixxGlassDialog: React.FC<MixxGlassDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Animated open state
  const animatedOpen = useFlowMotion(
    { opacity: open ? 1 : 0, scale: open ? 1 : 0.95 },
    { duration: 200, easing: 'ease-out' }
  );

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  const sizeStyles = {
    sm: { maxWidth: '384px' },
    md: { maxWidth: '448px' },
    lg: { maxWidth: '512px' },
    xl: { maxWidth: '576px' },
  };

  const glassSurface = getGlassSurface({
    intensity: 'strong',
    border: true,
    glow: true,
  });

  const backdropStyle: React.CSSProperties = composeStyles(
    layout.position.fixed,
    layout.zIndex[9998],
    transitions.transition.opacity(200),
    {
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      opacity: animatedOpen.opacity,
    }
  );

  const dialogStyle: React.CSSProperties = composeStyles(
    glassSurface,
    layout.position.fixed,
    layout.zIndex[9999],
    layout.overflow.auto,
    spacing.p(6),
    effects.border.radius.xl,
    {
      top: '50%',
      left: '50%',
      transform: `translate(-50%, -50%) scale(${animatedOpen.scale})`,
      opacity: animatedOpen.opacity,
      width: '90%',
      maxHeight: '90vh',
      ...sizeStyles[size],
    }
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="mixxglass-dialog-backdrop"
        style={backdropStyle}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="mixxglass-dialog"
        style={dialogStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-description' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.start,
            layout.flex.justify.between,
            spacing.mb(4)
          )}>
            {title && (
              <h2 id="dialog-title" style={composeStyles(
                typography.size('xl'),
                typography.weight('semibold'),
                typography.color.ink.DEFAULT
              )}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <MixxGlassButton
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                aria-label="Close dialog"
              >
                ×
              </MixxGlassButton>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p id="dialog-description" style={composeStyles(
            typography.size('sm'),
            typography.color.ink.muted,
            spacing.mb(4)
          )}>
            {description}
          </p>
        )}

        {/* Content */}
        <div className="mixxglass-dialog-content">{children}</div>
      </div>
    </>
  );
};

/**
 * Dialog Content (for composition)
 */
export const MixxGlassDialogContent: React.FC<MixxGlassDialogContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={`mixxglass-dialog-content ${className}`}>{children}</div>;
};

/**
 * Dialog Header (for composition)
 */
export const MixxGlassDialogHeader: React.FC<MixxGlassDialogHeaderProps> = ({
  children,
  className = '',
}) => {
  return <div style={spacing.mb(4)} className={`mixxglass-dialog-header ${className}`}>{children}</div>;
};

/**
 * Dialog Title (for composition)
 */
export const MixxGlassDialogTitle: React.FC<MixxGlassDialogTitleProps> = ({
  children,
  className = '',
}) => {
  return (
    <h2 style={composeStyles(
      typography.size('xl'),
      typography.weight('semibold'),
      typography.color.ink.DEFAULT
    )} className={`mixxglass-dialog-title ${className}`}>
      {children}
    </h2>
  );
};

/**
 * Dialog Description (for composition)
 */
export const MixxGlassDialogDescription: React.FC<MixxGlassDialogDescriptionProps> = ({
  children,
  className = '',
}) => {
  return (
    <p style={composeStyles(
      typography.size('sm'),
      typography.color.ink.muted
    )} className={`mixxglass-dialog-description ${className}`}>
      {children}
    </p>
  );
};

/**
 * Dialog Footer (for composition)
 */
export const MixxGlassDialogFooter: React.FC<MixxGlassDialogFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div style={composeStyles(
      layout.flex.container('row'),
      layout.flex.justify.end,
      spacing.gap(2),
      spacing.mt(6)
    )} className={`mixxglass-dialog-footer ${className}`}>
      {children}
    </div>
  );
};

export default MixxGlassDialog;


