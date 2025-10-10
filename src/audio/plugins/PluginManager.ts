/**
 * Plugin Manager - Registry and lifecycle management for audio plugins
 */

export interface PluginMetadata {
  id: string;
  name: string;
  category: 'dynamics' | 'effects' | 'ai' | 'mastering' | 'creative';
  description: string;
  manufacturer: string;
  version: string;
  tags: string[];
  presetCount: number;
  thumbnail?: string;
}

export interface PluginInstance {
  id: string;
  pluginId: string;
  instanceId: string;
  parameters: Record<string, number>;
  bypass: boolean;
  preset?: string;
}

export interface PluginDefinition {
  metadata: PluginMetadata;
  component: React.ComponentType<any>;
  defaultParameters: Record<string, number>;
  process?: (input: Float32Array, parameters: Record<string, number>) => Float32Array;
}

class PluginManagerClass {
  private registry: Map<string, PluginDefinition> = new Map();
  private instances: Map<string, PluginInstance> = new Map();
  private listeners: Set<() => void> = new Set();
  
  /**
   * Register a plugin definition
   */
  register(definition: PluginDefinition): void {
    this.registry.set(definition.metadata.id, definition);
    this.notifyListeners();
  }
  
  /**
   * Get all registered plugins
   */
  getPlugins(): PluginDefinition[] {
    return Array.from(this.registry.values());
  }
  
  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: string): PluginDefinition[] {
    return this.getPlugins().filter(p => p.metadata.category === category);
  }
  
  /**
   * Get all plugin metadata (convenience method)
   */
  getAllMetadata(): PluginMetadata[] {
    return this.getPlugins().map(p => p.metadata);
  }
  
  /**
   * Get specific plugin metadata
   */
  getMetadata(pluginId: string): PluginMetadata | undefined {
    const plugin = this.registry.get(pluginId);
    return plugin?.metadata;
  }
  
  /**
   * Search plugins by name or tags
   */
  searchPlugins(query: string): PluginDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getPlugins().filter(p => 
      p.metadata.name.toLowerCase().includes(lowerQuery) ||
      p.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
  
  /**
   * Create a plugin instance
   */
  instantiate(pluginId: string, insertSlot: string): PluginInstance | null {
    const definition = this.registry.get(pluginId);
    if (!definition) return null;
    
    const instanceId = `${pluginId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const instance: PluginInstance = {
      id: instanceId,
      pluginId,
      instanceId: insertSlot,
      parameters: { ...definition.defaultParameters },
      bypass: false,
    };
    
    this.instances.set(instanceId, instance);
    this.notifyListeners();
    return instance;
  }
  
  /**
   * Get a plugin instance
   */
  getInstance(instanceId: string): PluginInstance | undefined {
    return this.instances.get(instanceId);
  }
  
  /**
   * Get all instances
   */
  getInstances(): PluginInstance[] {
    return Array.from(this.instances.values());
  }
  
  /**
   * Update plugin parameters
   */
  updateParameters(instanceId: string, parameters: Partial<Record<string, number>>): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.parameters = { ...instance.parameters, ...parameters };
      this.notifyListeners();
    }
  }
  
  /**
   * Toggle bypass
   */
  toggleBypass(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.bypass = !instance.bypass;
      this.notifyListeners();
    }
  }
  
  /**
   * Destroy a plugin instance
   */
  destroy(instanceId: string): void {
    this.instances.delete(instanceId);
    this.notifyListeners();
  }
  
  /**
   * Subscribe to changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const PluginManager = new PluginManagerClass();
