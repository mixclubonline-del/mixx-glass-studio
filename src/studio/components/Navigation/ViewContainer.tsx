/**
 * View Container - Manages view transitions and layout
 */

import { ReactNode } from 'react';
import { useViewStore } from '@/store/viewStore';
import { cn } from '@/lib/utils';

interface ViewContainerProps {
  children: ReactNode;
  className?: string;
}

export function ViewContainer({ children, className }: ViewContainerProps) {
  const { currentView } = useViewStore();
  
  return (
    <div
      className={cn(
        'relative flex-1 overflow-hidden transition-all duration-300',
        className
      )}
      data-view={currentView}
    >
      {children}
    </div>
  );
}
