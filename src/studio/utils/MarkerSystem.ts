/**
 * Marker System - Manage timeline markers and sections
 */

export interface Marker {
  id: string;
  positionSamples: number;
  positionSeconds: number;
  label: string;
  color: string;
  type: 'marker' | 'section';
}

export class MarkerManager {
  private markers: Map<string, Marker> = new Map();
  private listeners: Set<(markers: Marker[]) => void> = new Set();

  /**
   * Add marker at position
   */
  addMarker(positionSamples: number, positionSeconds: number, label?: string, type: 'marker' | 'section' = 'marker'): Marker {
    const id = `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const marker: Marker = {
      id,
      positionSamples,
      positionSeconds,
      label: label || `Marker ${this.markers.size + 1}`,
      color: this.getMarkerColor(type),
      type
    };
    
    this.markers.set(id, marker);
    this.notifyListeners();
    console.log('[MarkerSystem] Added marker:', marker);
    return marker;
  }

  /**
   * Remove marker by ID
   */
  removeMarker(id: string): boolean {
    const deleted = this.markers.delete(id);
    if (deleted) {
      this.notifyListeners();
      console.log('[MarkerSystem] Removed marker:', id);
    }
    return deleted;
  }

  /**
   * Update marker label
   */
  updateMarker(id: string, updates: Partial<Marker>): void {
    const marker = this.markers.get(id);
    if (marker) {
      Object.assign(marker, updates);
      this.notifyListeners();
      console.log('[MarkerSystem] Updated marker:', id, updates);
    }
  }

  /**
   * Get all markers sorted by position
   */
  getMarkers(): Marker[] {
    return Array.from(this.markers.values())
      .sort((a, b) => a.positionSamples - b.positionSamples);
  }

  /**
   * Get marker at or near position (within tolerance)
   */
  getMarkerAt(positionSamples: number, toleranceSamples: number = 2205): Marker | null {
    for (const marker of this.markers.values()) {
      if (Math.abs(marker.positionSamples - positionSamples) <= toleranceSamples) {
        return marker;
      }
    }
    return null;
  }

  /**
   * Subscribe to marker changes
   */
  subscribe(listener: (markers: Marker[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear all markers
   */
  clearAll(): void {
    this.markers.clear();
    this.notifyListeners();
    console.log('[MarkerSystem] Cleared all markers');
  }

  private notifyListeners(): void {
    const markers = this.getMarkers();
    this.listeners.forEach(listener => listener(markers));
  }

  private getMarkerColor(type: 'marker' | 'section'): string {
    return type === 'marker' 
      ? 'hsl(280, 100%, 60%)' // Purple for markers
      : 'hsl(190, 100%, 50%)'; // Cyan for sections
  }
}

export const markerManager = new MarkerManager();
