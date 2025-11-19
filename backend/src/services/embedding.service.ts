import OpenAI from 'openai';
import logger from '../utils/logger';
import { createError } from '../utils/errors';

/**
 * EmbeddingService
 * Handles generation of text embeddings using OpenAI API
 * Used for semantic search functionality across projects, tasks, and documents
 */
class EmbeddingService {
  private openai: OpenAI | null = null;
  private readonly MODEL = 'text-embedding-3-small';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly BATCH_SIZE = 100;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize OpenAI client with API key from environment
   */
  private initializeClient(): void {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      logger.warn('OPENAI_API_KEY not configured. Semantic search will be disabled.');
      this.openai = null;
      return;
    }

    try {
      this.openai = new OpenAI({ apiKey });
      logger.info('OpenAI Embedding service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI client:', error);
      this.openai = null;
    }
  }

  /**
   * Check if embedding service is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Generate embedding vector for a single text input
   * @param text - Text to generate embedding for
   * @returns Embedding vector (1536 dimensions) or null if service unavailable
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.isAvailable()) {
      logger.warn('Embedding service not available. Skipping embedding generation.');
      return null;
    }

    if (!text || text.trim().length === 0) {
      logger.warn('Empty text provided for embedding generation');
      return null;
    }

    const cleanText = this.cleanText(text);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.openai!.embeddings.create({
          model: this.MODEL,
          input: cleanText,
        });

        const embedding = response.data[0].embedding;
        logger.debug(`Generated embedding for text (length: ${cleanText.length})`);
        return embedding;
      } catch (error: any) {
        lastError = error;
        logger.warn(`Embedding generation attempt ${attempt} failed:`, {
          error: error.message,
          attempt,
          maxRetries: this.MAX_RETRIES,
        });

        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    logger.error('Failed to generate embedding after all retries:', {
      error: lastError?.message,
      textLength: cleanText.length,
    });

    throw createError.internal('Không thể tạo embedding. Vui lòng thử lại sau.', {
      originalError: lastError?.message,
    });
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param texts - Array of texts to generate embeddings for
   * @returns Array of embeddings (same order as input) or empty array if service unavailable
   */
  async generateBatchEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    if (!this.isAvailable()) {
      logger.warn('Embedding service not available. Skipping batch embedding generation.');
      return texts.map(() => null);
    }

    if (texts.length === 0) {
      return [];
    }

    const results: (number[] | null)[] = [];
    const cleanedTexts = texts.map((text) => this.cleanText(text));

    for (let i = 0; i < cleanedTexts.length; i += this.BATCH_SIZE) {
      const batch = cleanedTexts.slice(i, i + this.BATCH_SIZE);
      const batchResults = await this.processBatch(batch, i);
      results.push(...batchResults);

      if (i + this.BATCH_SIZE < cleanedTexts.length) {
        await this.delay(500);
      }
    }

    logger.info(`Generated ${results.filter((r) => r !== null).length}/${texts.length} embeddings successfully`);
    return results;
  }

  /**
   * Process a batch of texts and generate embeddings
   */
  private async processBatch(texts: string[], startIndex: number): Promise<(number[] | null)[]> {
    const validTexts = texts.filter((text) => text && text.trim().length > 0);

    if (validTexts.length === 0) {
      return texts.map(() => null);
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.openai!.embeddings.create({
          model: this.MODEL,
          input: validTexts,
        });

        const embeddings = response.data.map((item) => item.embedding);
        logger.debug(`Generated batch embeddings: ${embeddings.length} items (starting at index ${startIndex})`);

        const results: (number[] | null)[] = [];
        let embeddingIndex = 0;

        for (const text of texts) {
          if (text && text.trim().length > 0) {
            results.push(embeddings[embeddingIndex]);
            embeddingIndex++;
          } else {
            results.push(null);
          }
        }

        return results;
      } catch (error: any) {
        lastError = error;
        logger.warn(`Batch embedding generation attempt ${attempt} failed:`, {
          error: error.message,
          batchSize: validTexts.length,
          startIndex,
          attempt,
        });

        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    logger.error('Failed to generate batch embeddings after all retries:', {
      error: lastError?.message,
      batchSize: validTexts.length,
      startIndex,
    });

    return texts.map(() => null);
  }

  /**
   * Clean and prepare text for embedding generation
   * Removes extra whitespace, newlines, and limits length
   */
  private cleanText(text: string): string {
    if (!text) return '';

    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 8000);
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Combine title and description into a single text for embedding
   * Used for projects, tasks, and documents
   */
  combineTextFields(title: string, description?: string | null): string {
    const parts: string[] = [];

    if (title && title.trim()) {
      parts.push(title.trim());
    }

    if (description && description.trim()) {
      parts.push(description.trim());
    }

    return parts.join(' - ');
  }
}

export default new EmbeddingService();

