/**
 * CLaRa Vector Storage Prototype
 * 
 * Prototype implementation for storing and retrieving compressed embeddings
 * in the Prime Database using pgvector extension.
 * 
 * This module provides:
 * - Storage of embeddings in PostgreSQL with pgvector
 * - Similarity search across stored embeddings
 * - Integration with existing Prime Database schema
 * - Fallback to localStorage for development/testing
 */

import { getClaraEmbedding, EmbeddingResult } from './ClaraEmbedding';

export interface VectorStorageConfig {
  useDatabase?: boolean; // Use PostgreSQL with pgvector (requires DB connection)
  useLocalStorage?: boolean; // Fallback to localStorage for development
  embeddingDimensions?: number;
}

export interface StoredEmbedding {
  id: string;
  embedding: number[];
  metadata: {
    type: 'mixx_recall' | 'project_snapshot' | 'musical_context' | 'cache';
    originalText?: string;
    compressionRatio?: number;
    model?: string;
    [key: string]: any;
  };
  createdAt: number;
  lastAccessedAt?: number;
}

/**
 * CLaRa Vector Storage
 * 
 * Manages storage and retrieval of compressed embeddings.
 * Supports both PostgreSQL (with pgvector) and localStorage (for development).
 */
export class ClaraVectorStorage {
  private config: VectorStorageConfig;
  private localStoragePrefix = 'clara:embeddings:';

  constructor(config: VectorStorageConfig = {}) {
    this.config = {
      useDatabase: config.useDatabase ?? false,
      useLocalStorage: config.useLocalStorage ?? true, // Default to localStorage for prototyping
      embeddingDimensions: config.embeddingDimensions ?? 1536,
    };
  }

  /**
   * Store an embedding
   */
  async storeEmbedding(
    embedding: EmbeddingResult,
    metadata: StoredEmbedding['metadata']
  ): Promise<string> {
    const id = this.generateId();
    const stored: StoredEmbedding = {
      id,
      embedding: embedding.embedding,
      metadata: {
        ...metadata,
        compressionRatio: embedding.compressionRatio,
        model: embedding.model,
        originalText: metadata.originalText || embedding.originalText,
      },
      createdAt: Date.now(),
    };

    if (this.config.useDatabase) {
      // TODO: Store in PostgreSQL with pgvector
      // await this.storeInDatabase(stored);
      console.warn('Database storage not yet implemented, using localStorage');
    }

    if (this.config.useLocalStorage) {
      await this.storeInLocalStorage(stored);
    }

    return id;
  }

  /**
   * Find similar embeddings
   */
  async findSimilar(
    queryEmbedding: number[],
    type?: StoredEmbedding['metadata']['type'],
    threshold: number = 0.7,
    limit: number = 10
  ): Promise<StoredEmbedding[]> {
    const allEmbeddings = await this.getAllEmbeddings(type);
    const claraEmbedding = getClaraEmbedding();
    
    const results = claraEmbedding.findSimilar(
      queryEmbedding,
      allEmbeddings.map(e => ({ embedding: e.embedding, data: e })),
      threshold,
      limit
    );

    // Update last accessed time
    for (const result of results) {
      await this.updateLastAccessed(result.item.id);
    }

    return results.map(r => r.item);
  }

  /**
   * Get embedding by ID
   */
  async getEmbedding(id: string): Promise<StoredEmbedding | null> {
    if (this.config.useLocalStorage) {
      return this.getFromLocalStorage(id);
    }
    
    // TODO: Get from database
    return null;
  }

  /**
   * Delete embedding
   */
  async deleteEmbedding(id: string): Promise<void> {
    if (this.config.useLocalStorage) {
      this.deleteFromLocalStorage(id);
    }
    
    // TODO: Delete from database
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalEmbeddings: number;
    totalSizeBytes: number;
    averageCompressionRatio: number;
    byType: Record<string, number>;
  }> {
    const allEmbeddings = await this.getAllEmbeddings();
    
    let totalSizeBytes = 0;
    let totalCompressionRatio = 0;
    const byType: Record<string, number> = {};

    for (const embedding of allEmbeddings) {
      const embeddingSize = embedding.embedding.length * 4; // float32 = 4 bytes
      totalSizeBytes += embeddingSize;
      
      if (embedding.metadata.compressionRatio) {
        totalCompressionRatio += embedding.metadata.compressionRatio;
      }
      
      const type = embedding.metadata.type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      totalEmbeddings: allEmbeddings.length,
      totalSizeBytes,
      averageCompressionRatio: allEmbeddings.length > 0
        ? totalCompressionRatio / allEmbeddings.length
        : 0,
      byType,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getAllEmbeddings(
    type?: StoredEmbedding['metadata']['type']
  ): Promise<StoredEmbedding[]> {
    if (this.config.useLocalStorage) {
      return this.getAllFromLocalStorage(type);
    }
    
    // TODO: Get from database
    return [];
  }

  private async storeInLocalStorage(embedding: StoredEmbedding): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const key = `${this.localStoragePrefix}${embedding.id}`;
      localStorage.setItem(key, JSON.stringify(embedding));
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.warn('localStorage quota exceeded, consider using database storage');
        // Could implement LRU eviction here
      } else {
        console.error('Failed to store embedding:', error);
      }
    }
  }

  private async getFromLocalStorage(id: string): Promise<StoredEmbedding | null> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const key = `${this.localStoragePrefix}${id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as StoredEmbedding;
      }
    } catch (error) {
      console.error('Failed to get embedding:', error);
    }

    return null;
  }

  private async getAllFromLocalStorage(
    type?: StoredEmbedding['metadata']['type']
  ): Promise<StoredEmbedding[]> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const embeddings: StoredEmbedding[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.localStoragePrefix)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const embedding = JSON.parse(stored) as StoredEmbedding;
            if (!type || embedding.metadata.type === type) {
              embeddings.push(embedding);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to get all embeddings:', error);
    }

    return embeddings;
  }

  private deleteFromLocalStorage(id: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const key = `${this.localStoragePrefix}${id}`;
    localStorage.removeItem(key);
  }

  private async updateLastAccessed(id: string): Promise<void> {
    const embedding = await this.getEmbedding(id);
    if (embedding) {
      embedding.lastAccessedAt = Date.now();
      if (this.config.useLocalStorage) {
        await this.storeInLocalStorage(embedding);
      }
    }
  }
}

/**
 * Singleton instance
 */
let claraVectorStorageInstance: ClaraVectorStorage | null = null;

/**
 * Get ClaraVectorStorage instance (singleton)
 */
export function getClaraVectorStorage(
  config?: VectorStorageConfig
): ClaraVectorStorage {
  if (!claraVectorStorageInstance) {
    claraVectorStorageInstance = new ClaraVectorStorage(config);
  }
  return claraVectorStorageInstance;
}
