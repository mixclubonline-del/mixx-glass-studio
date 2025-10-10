/**
 * Cursor Tools - Professional editing tools for timeline
 */

import { Region } from '@/types/timeline';

export type CursorTool = 'select' | 'range' | 'split' | 'trim' | 'fade' | 'pencil' | 'zoom' | 'multi';

export interface ToolHandlers {
  onRegionClick: (regionId: string, e: React.MouseEvent) => void;
  onRegionDragStart: (regionId: string, startX: number) => void;
  onRegionDrag: (deltaX: number) => void;
  onRegionDragEnd: () => void;
  onTrimStart: (regionId: string, edge: 'left' | 'right', startX: number) => void;
  onTrimDrag: (deltaX: number) => void;
  onTrimEnd: () => void;
  onFadeStart: (regionId: string, type: 'in' | 'out', startX: number) => void;
  onFadeDrag: (deltaX: number) => void;
  onFadeEnd: () => void;
  onSplit: (regionId: string, splitTime: number) => void;
}

export class CursorToolManager {
  private currentTool: CursorTool = 'select';
  private isDragging = false;
  private dragType: 'move' | 'trim-left' | 'trim-right' | 'fade-in' | 'fade-out' | null = null;
  private dragStartX = 0;
  private selectedRegionId: string | null = null;
  
  setTool(tool: CursorTool) {
    this.currentTool = tool;
  }
  
  getTool(): CursorTool {
    return this.currentTool;
  }
  
  getCursor(isNearEdge: boolean, isNearFade: boolean): string {
    switch (this.currentTool) {
      case 'select':
        if (isNearEdge) return 'ew-resize';
        if (isNearFade) return 'col-resize';
        return 'move';
      case 'split':
        return 'text';
      case 'trim':
        return 'ew-resize';
      case 'fade':
        return 'col-resize';
      case 'zoom':
        return 'zoom-in';
      default:
        return 'default';
    }
  }
  
  handleMouseDown(
    regionId: string,
    clickX: number,
    region: Region,
    zoom: number,
    handlers: ToolHandlers
  ) {
    this.selectedRegionId = regionId;
    this.dragStartX = clickX;
    
    const regionLeft = region.startTime * zoom;
    const regionRight = regionLeft + (region.duration * zoom);
    const fadeInEnd = regionLeft + (region.fadeIn * zoom);
    const fadeOutStart = regionRight - (region.fadeOut * zoom);
    
    const edgeTolerance = 8; // pixels
    
    switch (this.currentTool) {
      case 'select':
      case 'multi':
        // Check if near edges for trimming
        if (Math.abs(clickX - regionLeft) < edgeTolerance) {
          this.dragType = 'trim-left';
          handlers.onTrimStart(regionId, 'left', clickX);
        } else if (Math.abs(clickX - regionRight) < edgeTolerance) {
          this.dragType = 'trim-right';
          handlers.onTrimStart(regionId, 'right', clickX);
        } else if (Math.abs(clickX - fadeInEnd) < edgeTolerance && region.fadeIn > 0) {
          this.dragType = 'fade-in';
          handlers.onFadeStart(regionId, 'in', clickX);
        } else if (Math.abs(clickX - fadeOutStart) < edgeTolerance && region.fadeOut > 0) {
          this.dragType = 'fade-out';
          handlers.onFadeStart(regionId, 'out', clickX);
        } else {
          this.dragType = 'move';
          handlers.onRegionDragStart(regionId, clickX);
        }
        this.isDragging = true;
        break;
        
      case 'split':
        // Calculate split time relative to region
        const relativeX = clickX - regionLeft;
        const splitTime = region.startTime + (relativeX / zoom);
        handlers.onSplit(regionId, splitTime);
        break;
        
      case 'trim':
        // Force trim mode
        if (Math.abs(clickX - regionLeft) < Math.abs(clickX - regionRight)) {
          this.dragType = 'trim-left';
          handlers.onTrimStart(regionId, 'left', clickX);
        } else {
          this.dragType = 'trim-right';
          handlers.onTrimStart(regionId, 'right', clickX);
        }
        this.isDragging = true;
        break;
        
      case 'fade':
        // Force fade mode
        const regionCenter = (regionLeft + regionRight) / 2;
        if (clickX < regionCenter) {
          this.dragType = 'fade-in';
          handlers.onFadeStart(regionId, 'in', clickX);
        } else {
          this.dragType = 'fade-out';
          handlers.onFadeStart(regionId, 'out', clickX);
        }
        this.isDragging = true;
        break;
    }
  }
  
  handleMouseMove(currentX: number, handlers: ToolHandlers) {
    if (!this.isDragging || !this.selectedRegionId) return;
    
    const deltaX = currentX - this.dragStartX;
    
    switch (this.dragType) {
      case 'move':
        handlers.onRegionDrag(deltaX);
        break;
      case 'trim-left':
      case 'trim-right':
        handlers.onTrimDrag(deltaX);
        break;
      case 'fade-in':
      case 'fade-out':
        handlers.onFadeDrag(deltaX);
        break;
    }
    
    this.dragStartX = currentX;
  }
  
  handleMouseUp(handlers: ToolHandlers) {
    if (!this.isDragging) return;
    
    switch (this.dragType) {
      case 'move':
        handlers.onRegionDragEnd();
        break;
      case 'trim-left':
      case 'trim-right':
        handlers.onTrimEnd();
        break;
      case 'fade-in':
      case 'fade-out':
        handlers.onFadeEnd();
        break;
    }
    
    this.isDragging = false;
    this.dragType = null;
  }
  
  splitRegion(region: Region, splitTime: number): [Region, Region] {
    const splitDuration = splitTime - region.startTime;
    
    const region1: Region = {
      ...region,
      id: `${region.id}-1`,
      duration: splitDuration,
      bufferDuration: splitDuration,
      fadeOut: 0 // Remove fade out from first region
    };
    
    const region2: Region = {
      ...region,
      id: `${region.id}-2`,
      startTime: splitTime,
      duration: region.duration - splitDuration,
      bufferOffset: region.bufferOffset + splitDuration,
      bufferDuration: region.bufferDuration - splitDuration,
      fadeIn: 0 // Remove fade in from second region
    };
    
    return [region1, region2];
  }
}

export const cursorToolManager = new CursorToolManager();
