/**
 * CLaRa Embedding Prototype
 * 
 * Prototype implementation for CLaRa-style continuous memory token generation.
 * This module provides embedding generation, compression, and similarity search
 * capabilities inspired by Apple's CLaRa framework.
 * 
 * Features:
 * - Text-to-embedding conversion (using available embedding models)
 * - Compression ratio tracking
 * - Similarity search utilities
 * - Integration with Prime Brain and Mixx Recall
 */

import { getPrimeBrainLLM } from './PrimeBrainLLM';

export interface EmbeddingOptions {
  model?: string;
  compressionRatio?: number; // Target compression ratio (16x, 64x, 128x)
  dimensions?: number; // Output embedding dimensions
}

export interface EmbeddingResult {
  embedding: number[];
  originalText: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio: number;
  model: string;
  dimensions: number;
}

export interface SimilarityResult<T = any> {
  item: T;
  similarity: number; // 0-1, where 1 is most similar
  distance: number; // Cosine distance
}

/**
 * CLaRa Embedding Generator
 * 
 * Generates embeddings using available models. In production, this would
 * use CLaRa models or fine-tuned audio-specific embedding models.
 */
export class ClaraEmbedding {
  private defaultDimensions = 1536; // Compatible with OpenAI-style embeddings
  private defaultModel = 'text-embedding'; // Placeholder - would use actual model

  /**
   * Generate embedding from text
   * 
   * This is a prototype that uses available embedding APIs.
   * In production, would use CLaRa models or local embedding generation.
   */
  async generateEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const originalSizeBytes = new Blob([text]).size;
    const dimensions = options.dimensions || this.defaultDimensions;
    
    // For prototype: Generate embedding using available methods
    // In production: Use CLaRa model or dedicated embedding service
    const embedding = await this.generateEmbeddingFromText(text, dimensions);
    
    // Calculate compression
    // Embedding size: dimensions * 4 bytes (float32) or 2 bytes (float16)
    const embeddingSizeBytes = dimensions * 4; // Using float32
    const compressionRatio = originalSizeBytes / embeddingSizeBytes;
    
    return {
      embedding,
      originalText: text,
      originalSizeBytes,
      compressedSizeBytes: embeddingSizeBytes,
      compressionRatio,
      model: options.model || this.defaultModel,
      dimensions,
    };
  }

  /**
   * Generate embedding from text (prototype implementation)
   * 
   * This uses a simple hash-based approach for prototyping.
   * In production, would use actual embedding model API or local model.
   */
  private async generateEmbeddingFromText(
    text: string,
    dimensions: number
  ): Promise<number[]> {
    // Prototype: Generate deterministic embedding-like vector
    // In production: Call embedding API or local model
    
    // For now, use a simple approach that creates a deterministic vector
    // This is just for testing - real embeddings would come from a model
    const embedding = new Array(dimensions).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    
    // Simple hash-based embedding (prototype only)
    words.forEach((word, wordIndex) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      // Distribute hash across dimensions
      for (let d = 0; d < dimensions; d++) {
        const seed = hash + d + wordIndex;
        const value = Math.sin(seed) * 10000;
        embedding[d] = (embedding[d] || 0) + (value - Math.floor(value));
      }
    });
    
    // Normalize to unit vector (for cosine similarity)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }
    
    return embedding;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Calculate cosine distance (1 - similarity)
   */
  cosineDistance(embedding1: number[], embedding2: number[]): number {
    return 1 - this.cosineSimilarity(embedding1, embedding2);
  }

  /**
   * Find most similar items using cosine similarity
   */
  findSimilar<T>(
    queryEmbedding: number[],
    items: Array<{ embedding: number[]; data: T }>,
    threshold: number = 0.7,
    limit: number = 10
  ): SimilarityResult<T>[] {
    const results: SimilarityResult<T>[] = [];

    for (const item of items) {
      const similarity = this.cosineSimilarity(queryEmbedding, item.embedding);
      const distance = this.cosineDistance(queryEmbedding, item.embedding);

      if (similarity >= threshold) {
        results.push({
          item: item.data,
          similarity,
          distance,
        });
      }
    }

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, limit);
  }

  /**
   * Compress Mixx Recall data into embedding
   */
  async compressMixxRecall(data: {
    category: string;
    genre?: string;
    bpm?: number;
    key?: string;
    plugins?: string[];
    presets?: Array<{ name: string; plugin: string }>;
  }): Promise<EmbeddingResult> {
    // Convert Mixx Recall data to text representation
    const textParts: string[] = [];
    
    if (data.category) textParts.push(`Category: ${data.category}`);
    if (data.genre) textParts.push(`Genre: ${data.genre}`);
    if (data.bpm) textParts.push(`BPM: ${data.bpm}`);
    if (data.key) textParts.push(`Key: ${data.key}`);
    if (data.plugins && data.plugins.length > 0) {
      textParts.push(`Plugins: ${data.plugins.join(', ')}`);
    }
    if (data.presets && data.presets.length > 0) {
      const presetStr = data.presets
        .map(p => `${p.name} (${p.plugin})`)
        .join(', ');
      textParts.push(`Presets: ${presetStr}`);
    }

    const text = textParts.join('\n');
    return this.generateEmbedding(text, {
      compressionRatio: 64, // Target 64x compression
    });
  }

  /**
   * Compress project snapshot into embedding
   */
  async compressProjectSnapshot(data: {
    name: string;
    bpm?: number;
    key?: string;
    genre?: string;
    projectData?: any; // Can be large JSONB
  }): Promise<EmbeddingResult> {
    // Extract key information for compression
    const textParts: string[] = [];
    
    textParts.push(`Project: ${data.name}`);
    if (data.bpm) textParts.push(`BPM: ${data.bpm}`);
    if (data.key) textParts.push(`Key: ${data.key}`);
    if (data.genre) textParts.push(`Genre: ${data.genre}`);
    
    // For large project data, extract summary
    if (data.projectData) {
      const summary = this.extractProjectSummary(data.projectData);
      textParts.push(`Summary: ${summary}`);
    }

    const text = textParts.join('\n');
    return this.generateEmbedding(text, {
      compressionRatio: 128, // Target 128x compression for large snapshots
    });
  }

  /**
   * Extract summary from project data for compression
   */
  private extractProjectSummary(projectData: any): string {
    const parts: string[] = [];
    
    if (projectData.tracks) {
      parts.push(`${projectData.tracks.length} tracks`);
    }
    if (projectData.regions) {
      parts.push(`${projectData.regions.length} regions`);
    }
    if (projectData.plugins) {
      parts.push(`${Object.keys(projectData.plugins).length} plugins`);
    }
    
    return parts.join(', ') || 'Empty project';
  }

  /**
   * Compress musical context into embedding
   */
  async compressMusicalContext(data: {
    key?: string;
    scale?: string;
    chord?: string;
    bpm?: number;
    chromagram?: number[];
    harmonicTension?: number;
  }): Promise<EmbeddingResult> {
    const textParts: string[] = [];
    
    if (data.key) textParts.push(`Key: ${data.key}`);
    if (data.scale) textParts.push(`Scale: ${data.scale}`);
    if (data.chord) textParts.push(`Chord: ${data.chord}`);
    if (data.bpm) textParts.push(`BPM: ${data.bpm}`);
    if (data.harmonicTension !== undefined) {
      textParts.push(`Tension: ${data.harmonicTension.toFixed(2)}`);
    }
    if (data.chromagram && data.chromagram.length > 0) {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const chromaStr = data.chromagram
        .map((val, i) => `${notes[i]}:${val.toFixed(2)}`)
        .join(' ');
      textParts.push(`Chroma: ${chromaStr}`);
    }

    const text = textParts.join('\n');
    return this.generateEmbedding(text, {
      compressionRatio: 32, // Target 32x compression
    });
  }
}

/**
 * Singleton instance
 */
let claraEmbeddingInstance: ClaraEmbedding | null = null;

/**
 * Get ClaraEmbedding instance (singleton)
 */
export function getClaraEmbedding(): ClaraEmbedding {
  if (!claraEmbeddingInstance) {
    claraEmbeddingInstance = new ClaraEmbedding();
  }
  return claraEmbeddingInstance;
}
