/**
 * SelectionManager - Handles multi-select logic for regions
 */

export class SelectionManager {
  private selectedIds: Set<string> = new Set();

  /**
   * Select a single item (clears previous selection)
   */
  select(id: string): void {
    this.selectedIds.clear();
    this.selectedIds.add(id);
  }

  /**
   * Toggle selection of an item
   */
  toggle(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  /**
   * Add to selection (Cmd/Ctrl+click)
   */
  add(id: string): void {
    this.selectedIds.add(id);
  }

  /**
   * Remove from selection
   */
  remove(id: string): void {
    this.selectedIds.delete(id);
  }

  /**
   * Select range (Shift+click)
   */
  selectRange(startId: string, endId: string, allIds: string[]): void {
    const startIdx = allIds.indexOf(startId);
    const endIdx = allIds.indexOf(endId);

    if (startIdx === -1 || endIdx === -1) return;

    const [min, max] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

    this.selectedIds.clear();
    for (let i = min; i <= max; i++) {
      this.selectedIds.add(allIds[i]);
    }
  }

  /**
   * Select all
   */
  selectAll(ids: string[]): void {
    this.selectedIds = new Set(ids);
  }

  /**
   * Clear selection
   */
  clear(): void {
    this.selectedIds.clear();
  }

  /**
   * Get selected IDs
   */
  getSelected(): string[] {
    return Array.from(this.selectedIds);
  }

  /**
   * Check if item is selected
   */
  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  /**
   * Get count
   */
  count(): number {
    return this.selectedIds.size;
  }
}
