import { PrismaClient } from '@prisma/client';
import embeddingService from './embedding.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * EmbeddingSyncService
 * Handles synchronization of embeddings for existing data
 * Generates and updates embeddings for projects, tasks, and documents
 */
class EmbeddingSyncService {
  private readonly BATCH_SIZE = 20;
  private isRunning = false;

  /**
   * Check if sync is currently running
   */
  getStatus(): { isRunning: boolean } {
    return { isRunning: this.isRunning };
  }

  /**
   * Sync embeddings for all entities (projects, tasks, documents)
   * @returns Statistics about the sync operation
   */
  async syncAll(): Promise<{
    projects: { total: number; synced: number; failed: number };
    tasks: { total: number; synced: number; failed: number };
    documents: { total: number; synced: number; failed: number };
  }> {
    if (this.isRunning) {
      logger.warn('Embedding sync already in progress');
      throw new Error('Embedding sync đã đang chạy. Vui lòng đợi hoàn tất.');
    }

    if (!embeddingService.isAvailable()) {
      logger.error('Embedding service not available');
      throw new Error('Dịch vụ embedding chưa được cấu hình. Vui lòng kiểm tra OPENAI_API_KEY.');
    }

    this.isRunning = true;
    logger.info('Starting embedding sync for all entities');

    try {
      const [projectsStats, tasksStats, documentsStats] = await Promise.all([
        this.syncProjects(),
        this.syncTasks(),
        this.syncDocuments(),
      ]);

      logger.info('Embedding sync completed successfully', {
        projects: projectsStats,
        tasks: tasksStats,
        documents: documentsStats,
      });

      return {
        projects: projectsStats,
        tasks: tasksStats,
        documents: documentsStats,
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync embeddings for projects only
   */
  async syncProjects(): Promise<{ total: number; synced: number; failed: number }> {
    logger.info('Starting project embeddings sync');

    // Use raw query to find projects without embeddings
    const projectsWithoutEmbedding = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM projects WHERE embedding IS NULL
    `;

    if (projectsWithoutEmbedding.length === 0) {
      logger.info('No projects need embedding sync');
      return { total: 0, synced: 0, failed: 0 };
    }

    const projectIds = projectsWithoutEmbedding.map(p => p.id);
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds }
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    if (projects.length === 0) {
      logger.info('No projects need embedding sync');
      return { total: 0, synced: 0, failed: 0 };
    }

    logger.info(`Found ${projects.length} projects without embeddings`);

    let synced = 0;
    let failed = 0;

    for (let i = 0; i < projects.length; i += this.BATCH_SIZE) {
      const batch = projects.slice(i, i + this.BATCH_SIZE);
      const texts = batch.map((p) => embeddingService.combineTextFields(p.title, p.description));

      try {
        const embeddings = await embeddingService.generateBatchEmbeddings(texts);

        for (let j = 0; j < batch.length; j++) {
          const project = batch[j];
          const embedding = embeddings[j];

          if (embedding) {
            try {
              await prisma.$executeRaw`
                UPDATE projects 
                SET embedding = ${JSON.stringify(embedding)}::vector 
                WHERE id = ${project.id}
              `;
              synced++;
              logger.debug(`Updated embedding for project: ${project.id}`);
            } catch (error) {
              logger.error(`Failed to update embedding for project ${project.id}:`, error);
              failed++;
            }
          } else {
            failed++;
          }
        }

        logger.info(`Processed projects batch: ${i + batch.length}/${projects.length}`);
      } catch (error) {
        logger.error(`Failed to generate embeddings for projects batch starting at ${i}:`, error);
        failed += batch.length;
      }
    }

    logger.info(`Project embeddings sync completed: ${synced} synced, ${failed} failed`);
    return { total: projects.length, synced, failed };
  }

  /**
   * Sync embeddings for tasks only
   */
  async syncTasks(): Promise<{ total: number; synced: number; failed: number }> {
    logger.info('Starting task embeddings sync');

    // Use raw query to find tasks without embeddings
    const tasksWithoutEmbedding = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM tasks WHERE embedding IS NULL
    `;

    if (tasksWithoutEmbedding.length === 0) {
      logger.info('No tasks need embedding sync');
      return { total: 0, synced: 0, failed: 0 };
    }

    const taskIds = tasksWithoutEmbedding.map(t => t.id);
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds }
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    if (tasks.length === 0) {
      logger.info('No tasks need embedding sync');
      return { total: 0, synced: 0, failed: 0 };
    }

    logger.info(`Found ${tasks.length} tasks without embeddings`);

    let synced = 0;
    let failed = 0;

    for (let i = 0; i < tasks.length; i += this.BATCH_SIZE) {
      const batch = tasks.slice(i, i + this.BATCH_SIZE);
      const texts = batch.map((t) => embeddingService.combineTextFields(t.title, t.description));

      try {
        const embeddings = await embeddingService.generateBatchEmbeddings(texts);

        for (let j = 0; j < batch.length; j++) {
          const task = batch[j];
          const embedding = embeddings[j];

          if (embedding) {
            try {
              await prisma.$executeRaw`
                UPDATE tasks 
                SET embedding = ${JSON.stringify(embedding)}::vector 
                WHERE id = ${task.id}
              `;
              synced++;
              logger.debug(`Updated embedding for task: ${task.id}`);
            } catch (error) {
              logger.error(`Failed to update embedding for task ${task.id}:`, error);
              failed++;
            }
          } else {
            failed++;
          }
        }

        logger.info(`Processed tasks batch: ${i + batch.length}/${tasks.length}`);
      } catch (error) {
        logger.error(`Failed to generate embeddings for tasks batch starting at ${i}:`, error);
        failed += batch.length;
      }
    }

    logger.info(`Task embeddings sync completed: ${synced} synced, ${failed} failed`);
    return { total: tasks.length, synced, failed };
  }

  /**
   * Sync embeddings for documents only
   */
  async syncDocuments(): Promise<{ total: number; synced: number; failed: number }> {
    logger.info('Starting document embeddings sync');

    // Use raw query to find documents without embeddings
    const documentsWithoutEmbedding = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM documents WHERE embedding IS NULL
    `;

    if (documentsWithoutEmbedding.length === 0) {
      logger.info('No documents need embedding sync');
      return { total: 0, synced: 0, failed: 0 };
    }

    const documentIds = documentsWithoutEmbedding.map(d => d.id);
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds }
      },
      select: {
        id: true,
        fileName: true,
        description: true,
      },
    });

    if (documents.length === 0) {
      logger.info('No documents need embedding sync');
      return { total: 0, synced: 0, failed: 0 };
    }

    logger.info(`Found ${documents.length} documents without embeddings`);

    let synced = 0;
    let failed = 0;

    for (let i = 0; i < documents.length; i += this.BATCH_SIZE) {
      const batch = documents.slice(i, i + this.BATCH_SIZE);
      const texts = batch.map((d) => embeddingService.combineTextFields(d.fileName, d.description));

      try {
        const embeddings = await embeddingService.generateBatchEmbeddings(texts);

        for (let j = 0; j < batch.length; j++) {
          const document = batch[j];
          const embedding = embeddings[j];

          if (embedding) {
            try {
              await prisma.$executeRaw`
                UPDATE documents 
                SET embedding = ${JSON.stringify(embedding)}::vector 
                WHERE id = ${document.id}
              `;
              synced++;
              logger.debug(`Updated embedding for document: ${document.id}`);
            } catch (error) {
              logger.error(`Failed to update embedding for document ${document.id}:`, error);
              failed++;
            }
          } else {
            failed++;
          }
        }

        logger.info(`Processed documents batch: ${i + batch.length}/${documents.length}`);
      } catch (error) {
        logger.error(`Failed to generate embeddings for documents batch starting at ${i}:`, error);
        failed += batch.length;
      }
    }

    logger.info(`Document embeddings sync completed: ${synced} synced, ${failed} failed`);
    return { total: documents.length, synced, failed };
  }
}

export default new EmbeddingSyncService();

