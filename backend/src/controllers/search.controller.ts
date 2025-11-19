import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import embeddingService from '../services/embedding.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const SEMANTIC_WEIGHT = 0.6;
const KEYWORD_WEIGHT = 0.4;

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'document';
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  relevanceScore?: number;
  keywordScore?: number;
  semanticScore?: number;
  [key: string]: any;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate keyword match score
 */
function calculateKeywordScore(text: string, query: string): number {
  if (!text || !query) return 0;
  
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  
  let score = 0;
  
  // Exact match
  if (textLower.includes(queryLower)) {
    score += 1.0;
  }
  
  // Word matches
  const matchedWords = queryWords.filter(word => textLower.includes(word));
  score += matchedWords.length / queryWords.length;
  
  return Math.min(score, 1.0);
}

/**
 * Global search with hybrid (semantic + keyword) ranking
 */
export const globalSearch = async (req: Request, res: Response) => {
  try {
    const { q, types, status, priority, dateRange } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;
    const keywordRequested = req.query.keyword === 'true';

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    const searchQuery = q.trim();
    const searchTypes = types ? (types as string).split(',') : ['project', 'task', 'document'];
    
    // Generate query embedding for semantic search
    let queryEmbedding: number[] | null = null;
    if (embeddingService.isAvailable()) {
      try {
        queryEmbedding = await embeddingService.generateEmbedding(searchQuery);
      } catch (error) {
        logger.warn('Failed to generate query embedding, falling back to keyword-only search:', error);
      }
    }

    const keywordEnabled = keywordRequested || !queryEmbedding;

    const results: SearchResult[] = [];

    // Build base filters
    const dateFilter = buildDateFilter(dateRange as string);

    // Search Projects
    if (searchTypes.includes('project')) {
      const projectResults = await searchProjects(
        searchQuery,
        queryEmbedding,
        currentUserId,
        currentUserRole,
        status as string,
        dateFilter,
        keywordEnabled
      );
      results.push(...projectResults);
    }

    // Search Tasks
    if (searchTypes.includes('task')) {
      const taskResults = await searchTasks(
        searchQuery,
        queryEmbedding,
        currentUserId,
        currentUserRole,
        status as string,
        priority as string,
        dateFilter,
        keywordEnabled
      );
      results.push(...taskResults);
    }

    // Search Documents
    if (searchTypes.includes('document')) {
      const documentResults = await searchDocuments(
        searchQuery,
        queryEmbedding,
        currentUserId,
        currentUserRole,
        status as string,
        dateFilter,
        keywordEnabled
      );
      results.push(...documentResults);
    }

    // Sort by relevance score
    results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Debug logging
    logger.info('Search completed', {
      query: searchQuery,
      totalResults: results.length,
      semanticSearchEnabled: queryEmbedding !== null,
      keywordSearchEnabled: keywordEnabled,
      userRole: currentUserRole,
      topResults: results.slice(0, 3).map(r => ({
        type: r.type,
        title: r.title,
        relevanceScore: r.relevanceScore,
        keywordScore: r.keywordScore,
        semanticScore: r.semanticScore
      }))
    });

    res.json({
      message: 'Search completed successfully',
      query: searchQuery,
      results: results.slice(0, 20),
      total: results.length,
      semanticSearchEnabled: queryEmbedding !== null,
      keywordSearchEnabled: keywordEnabled
    });

  } catch (error) {
    logger.error('Global search error:', error);
    res.status(500).json({
      error: 'Search failed. Please try again.'
    });
  }
};

/**
 * Search projects with hybrid ranking
 */
async function searchProjects(
  query: string,
  queryEmbedding: number[] | null,
  userId: string,
  userRole: string,
  status?: string,
  dateFilter?: any,
  keywordEnabled: boolean = false
): Promise<SearchResult[]> {
  let baseWhere: any = {};
  
  if (userRole === 'STUDENT') {
    baseWhere.students = {
      some: { studentId: userId }
    };
  } else if (userRole === 'LECTURER') {
    baseWhere.lecturerId = userId;
  }

  // Build where clause - for semantic search, we fetch ALL records (or many more)
  let where: any = { ...baseWhere };

  if (status) {
    where.status = status;
  }

  if (dateFilter) {
    where.createdAt = dateFilter;
  }

  // If semantic search is NOT enabled, filter by keyword
  if (!queryEmbedding || keywordEnabled) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      lecturer: {
        select: {
          fullName: true
        }
      }
    },
    take: queryEmbedding ? 100 : 50 // Fetch more for semantic search
  });

  // Fetch embeddings separately if semantic search is enabled
  const projectEmbeddings = new Map<string, number[]>();
  if (queryEmbedding && projects.length > 0) {
    try {
      const projectIds = projects.map(p => p.id);
      const embedResults = await prisma.$queryRaw<Array<{ id: string; embedding: string }>>`
        SELECT id, embedding::text as embedding 
        FROM projects 
        WHERE id IN (${Prisma.join(projectIds)})
        AND embedding IS NOT NULL
      `;
      
      logger.debug(`Fetched ${embedResults.length} project embeddings out of ${projects.length} projects`);
      
      for (const row of embedResults) {
        try {
          const parsed = JSON.parse(row.embedding);
          projectEmbeddings.set(row.id, parsed);
        } catch (error) {
          logger.debug(`Failed to parse embedding for project ${row.id}`);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch project embeddings:', error);
    }
  }

  const results = projects.map(project => {
    const rawKeywordScore = Math.max(
      calculateKeywordScore(project.title, query),
      calculateKeywordScore(project.description || '', query) * 0.8
    );
    const keywordScore = (keywordEnabled || !queryEmbedding) ? rawKeywordScore : 0;

    let semanticScore = 0;
    if (queryEmbedding) {
      const projEmbedding = projectEmbeddings.get(project.id);
      if (projEmbedding) {
        semanticScore = cosineSimilarity(queryEmbedding, projEmbedding);
      }
    }

    let relevanceScore = keywordScore;
    if (queryEmbedding) {
      const semanticWeight = keywordEnabled ? SEMANTIC_WEIGHT : 1;
      const keywordWeight = keywordEnabled ? KEYWORD_WEIGHT : 0;
      relevanceScore = (semanticScore * semanticWeight) + (keywordScore * keywordWeight);
    }
    return {
      id: project.id,
      type: 'project' as const,
      title: project.title,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lecturer: project.lecturer.fullName,
      relevanceScore,
      keywordScore,
      semanticScore
    };
  }).filter(r => r.relevanceScore > 0.1); // Filter out very low relevance results

  logger.debug('Project search results', {
    query,
    totalProjects: projects.length,
    projectsWithEmbeddings: projectEmbeddings.size,
    resultsCount: results.length,
    userRole
  });

  return results;
}

/**
 * Search tasks with hybrid ranking
 */
async function searchTasks(
  query: string,
  queryEmbedding: number[] | null,
  userId: string,
  userRole: string,
  status?: string,
  priority?: string,
  dateFilter?: any,
  keywordEnabled: boolean = false
): Promise<SearchResult[]> {
  let where: any = {};

  if (userRole === 'STUDENT') {
    where.project = {
      students: {
        some: { studentId: userId }
      }
    };
  } else if (userRole === 'LECTURER') {
    where.project = {
      lecturerId: userId
    };
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (dateFilter) {
    where.createdAt = dateFilter;
  }

  // If semantic search is NOT enabled, filter by keyword
  if (!queryEmbedding || keywordEnabled) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ];
  }

  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      project: {
        select: {
          id: true,
          title: true
        }
      },
      assignee: {
        select: {
          fullName: true
        }
      }
    },
    take: queryEmbedding ? 100 : 50
  });

  // Fetch embeddings separately if semantic search is enabled
  const taskEmbeddings = new Map<string, number[]>();
  if (queryEmbedding && tasks.length > 0) {
    try {
      const taskIds = tasks.map(t => t.id);
      const embedResults = await prisma.$queryRaw<Array<{ id: string; embedding: string }>>`
        SELECT id, embedding::text as embedding 
        FROM tasks 
        WHERE id IN (${Prisma.join(taskIds)})
        AND embedding IS NOT NULL
      `;
      
      logger.debug(`Fetched ${embedResults.length} task embeddings out of ${tasks.length} tasks`);
      
      for (const row of embedResults) {
        try {
          const parsed = JSON.parse(row.embedding);
          taskEmbeddings.set(row.id, parsed);
        } catch (error) {
          logger.debug(`Failed to parse embedding for task ${row.id}`);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch task embeddings:', error);
    }
  }

  return tasks.map(task => {
    const rawKeywordScore = Math.max(
      calculateKeywordScore(task.title, query),
      calculateKeywordScore(task.description || '', query) * 0.8
    );
    const keywordScore = (keywordEnabled || !queryEmbedding) ? rawKeywordScore : 0;

    let semanticScore = 0;
    if (queryEmbedding) {
      const taskEmbedding = taskEmbeddings.get(task.id);
      if (taskEmbedding) {
        semanticScore = cosineSimilarity(queryEmbedding, taskEmbedding);
      }
    }

    let relevanceScore = keywordScore;
    if (queryEmbedding) {
      const semanticWeight = keywordEnabled ? SEMANTIC_WEIGHT : 1;
      const keywordWeight = keywordEnabled ? KEYWORD_WEIGHT : 0;
      relevanceScore = (semanticScore * semanticWeight) + (keywordScore * keywordWeight);
    }

    return {
      id: task.id,
      type: 'task' as const,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      projectTitle: task.project.title,
      assignee: task.assignee?.fullName,
      relevanceScore,
      keywordScore,
      semanticScore
    };
  }).filter(r => r.relevanceScore > 0.1);
}

/**
 * Search documents with hybrid ranking
 */
async function searchDocuments(
  query: string,
  queryEmbedding: number[] | null,
  userId: string,
  userRole: string,
  status?: string,
  dateFilter?: any,
  keywordEnabled: boolean = false
): Promise<SearchResult[]> {
  let where: any = {};

  if (userRole === 'STUDENT') {
    where.project = {
      students: {
        some: { studentId: userId }
      }
    };
  } else if (userRole === 'LECTURER') {
    where.project = {
      lecturerId: userId
    };
  }

  if (status) {
    where.status = status;
  }

  if (dateFilter) {
    where.createdAt = dateFilter;
  }

  // If semantic search is NOT enabled, filter by keyword
  if (!queryEmbedding || keywordEnabled) {
    where.OR = [
      { fileName: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ];
  }

  const documents = await prisma.document.findMany({
    where,
    select: {
      id: true,
      fileName: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      project: {
        select: {
          id: true,
          title: true
        }
      },
      uploader: {
        select: {
          fullName: true
        }
      }
    },
    take: queryEmbedding ? 100 : 50
  });

  // Fetch embeddings separately if semantic search is enabled
  const documentEmbeddings = new Map<string, number[]>();
  if (queryEmbedding && documents.length > 0) {
    try {
      const documentIds = documents.map(d => d.id);
      const embedResults = await prisma.$queryRaw<Array<{ id: string; embedding: string }>>`
        SELECT id, embedding::text as embedding 
        FROM documents 
        WHERE id IN (${Prisma.join(documentIds)})
        AND embedding IS NOT NULL
      `;
      
      logger.debug(`Fetched ${embedResults.length} document embeddings out of ${documents.length} documents`);
      
      for (const row of embedResults) {
        try {
          const parsed = JSON.parse(row.embedding);
          documentEmbeddings.set(row.id, parsed);
        } catch (error) {
          logger.debug(`Failed to parse embedding for document ${row.id}`);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch document embeddings:', error);
    }
  }

  return documents.map(document => {
    const rawKeywordScore = Math.max(
      calculateKeywordScore(document.fileName, query),
      calculateKeywordScore(document.description || '', query) * 0.8
    );
    const keywordScore = (keywordEnabled || !queryEmbedding) ? rawKeywordScore : 0;

    let semanticScore = 0;
    if (queryEmbedding) {
      const docEmbedding = documentEmbeddings.get(document.id);
      if (docEmbedding) {
        semanticScore = cosineSimilarity(queryEmbedding, docEmbedding);
      }
    }

    let relevanceScore = keywordScore;
    if (queryEmbedding) {
      const semanticWeight = keywordEnabled ? SEMANTIC_WEIGHT : 1;
      const keywordWeight = keywordEnabled ? KEYWORD_WEIGHT : 0;
      relevanceScore = (semanticScore * semanticWeight) + (keywordScore * keywordWeight);
    }

    return {
      id: document.id,
      type: 'document' as const,
      title: document.fileName,
      description: document.description,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      projectTitle: document.project.title,
      uploader: document.uploader?.fullName,
      relevanceScore,
      keywordScore,
      semanticScore
    };
  }).filter(r => r.relevanceScore > 0.1);
}

/**
 * Build date filter from date range string
 */
function buildDateFilter(dateRange?: string): any {
  if (!dateRange) return undefined;

  const now = new Date();
  let startDate: Date;

  switch (dateRange) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'this_week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return undefined;
  }

  return { gte: startDate };
}

/**
 * Get search suggestions
 */
export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const suggestions: any[] = [];

    // Get recent project titles as suggestions
    let projectWhere: any = {};
    if (currentUserRole === 'STUDENT') {
      projectWhere.students = {
        some: {
          studentId: currentUserId
        }
      };
    } else if (currentUserRole === 'LECTURER') {
      projectWhere.lecturerId = currentUserId;
    }

    const recentProjects = await prisma.project.findMany({
      where: projectWhere,
      select: {
        title: true
      },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    const projectSuggestions = recentProjects.map((project, index) => ({
      id: `project-${index}`,
      text: project.title,
      type: 'suggestion'
    }));

    suggestions.push(...projectSuggestions);

    res.json({
      message: 'Search suggestions retrieved successfully',
      suggestions: suggestions.slice(0, 10)
    });

  } catch (error) {
    logger.error('Get search suggestions error:', error);
    res.status(500).json({
      error: 'Failed to retrieve search suggestions'
    });
  }
};
