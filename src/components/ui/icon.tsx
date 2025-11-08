/**
 * Icon Component - Standardized wrapper for Lucide icons
 * Provides consistent sizing, stroke width, and dynamic imports
 */

import React, { lazy, Suspense } from 'react';
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { ICON_SIZE } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';

type IconSize = keyof typeof ICON_SIZE;

interface IconProps extends Omit<LucideProps, 'ref' | 'size'> {
  name: keyof typeof dynamicIconImports;
  size?: IconSize | number;
  className?: string;
}

const fallback = <div className="inline-block" style={{ width: 16, height: 16 }} />;

export const Icon: React.FC<IconProps> = ({ name, size = 'md', className, ...props }) => {
  const LucideIcon = lazy(dynamicIconImports[name]);
  
  // Convert size to pixels
  const sizeValue = typeof size === 'number' ? size : ICON_SIZE[size];
  
  return (
    <Suspense fallback={fallback}>
      <LucideIcon 
        size={sizeValue}
        strokeWidth={2}
        className={cn(className)}
        {...props} 
      />
    </Suspense>
  );
};

Icon.displayName = 'Icon';
