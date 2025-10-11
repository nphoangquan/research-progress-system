import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Save a filter preset
 */
export const saveFilterPreset = async (req: Request, res: Response) => {
  try {
    const { name, description, filters, entityType } = req.body;
    const currentUserId = req.user!.userId;

    if (!name || !filters || !entityType) {
      return res.status(400).json({
        error: 'Name, filters, and entityType are required'
      });
    }

    // Check if preset name already exists for this user
    const existingPreset = await prisma.filterPreset.findFirst({
      where: {
        userId: currentUserId,
        name: name,
        entityType: entityType
      }
    });

    if (existingPreset) {
      return res.status(400).json({
        error: 'A filter preset with this name already exists'
      });
    }

    const preset = await prisma.filterPreset.create({
      data: {
        name,
        description: description || '',
        filters: JSON.stringify(filters),
        entityType,
        userId: currentUserId,
        isPublic: false // Default to private
      }
    });

    res.json({
      message: 'Filter preset saved successfully',
      preset: {
        id: preset.id,
        name: preset.name,
        description: preset.description,
        entityType: preset.entityType,
        filters: JSON.parse(preset.filters),
        createdAt: preset.createdAt
      }
    });

  } catch (error) {
    console.error('Save filter preset error:', error);
    res.status(500).json({ 
      error: 'Failed to save filter preset' 
    });
  }
};

/**
 * Get user's filter presets
 */
export const getFilterPresets = async (req: Request, res: Response) => {
  try {
    const { entityType } = req.query;
    const currentUserId = req.user!.userId;

    let whereClause: any = {
      OR: [
        { userId: currentUserId },
        { isPublic: true }
      ]
    };

    if (entityType) {
      whereClause.entityType = entityType;
    }

    const presets = await prisma.filterPreset.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: [
        { isPublic: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const formattedPresets = presets.map(preset => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      entityType: preset.entityType,
      filters: JSON.parse(preset.filters),
      isPublic: preset.isPublic,
      isOwner: preset.userId === currentUserId,
      createdBy: preset.user.fullName,
      createdAt: preset.createdAt
    }));

    res.json({
      message: 'Filter presets retrieved successfully',
      presets: formattedPresets
    });

  } catch (error) {
    console.error('Get filter presets error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve filter presets' 
    });
  }
};

/**
 * Update a filter preset
 */
export const updateFilterPreset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, filters } = req.body;
    const currentUserId = req.user!.userId;

    // Check if preset exists and user owns it
    const existingPreset = await prisma.filterPreset.findFirst({
      where: {
        id: id,
        userId: currentUserId
      }
    });

    if (!existingPreset) {
      return res.status(404).json({
        error: 'Filter preset not found or you do not have permission to edit it'
      });
    }

    const updatedPreset = await prisma.filterPreset.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(filters && { filters: JSON.stringify(filters) })
      }
    });

    res.json({
      message: 'Filter preset updated successfully',
      preset: {
        id: updatedPreset.id,
        name: updatedPreset.name,
        description: updatedPreset.description,
        entityType: updatedPreset.entityType,
        filters: JSON.parse(updatedPreset.filters),
        createdAt: updatedPreset.createdAt
      }
    });

  } catch (error) {
    console.error('Update filter preset error:', error);
    res.status(500).json({ 
      error: 'Failed to update filter preset' 
    });
  }
};

/**
 * Delete a filter preset
 */
export const deleteFilterPreset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;

    // Check if preset exists and user owns it
    const existingPreset = await prisma.filterPreset.findFirst({
      where: {
        id: id,
        userId: currentUserId
      }
    });

    if (!existingPreset) {
      return res.status(404).json({
        error: 'Filter preset not found or you do not have permission to delete it'
      });
    }

    await prisma.filterPreset.delete({
      where: { id: id }
    });

    res.json({
      message: 'Filter preset deleted successfully'
    });

  } catch (error) {
    console.error('Delete filter preset error:', error);
    res.status(500).json({ 
      error: 'Failed to delete filter preset' 
    });
  }
};

/**
 * Apply a filter preset to get filtered results
 */
export const applyFilterPreset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.user!.userId;

    // Get the preset
    const preset = await prisma.filterPreset.findFirst({
      where: {
        id: id,
        OR: [
          { userId: currentUserId },
          { isPublic: true }
        ]
      }
    });

    if (!preset) {
      return res.status(404).json({
        error: 'Filter preset not found'
      });
    }

    const filters = JSON.parse(preset.filters);
    const entityType = preset.entityType;
    const skip = (Number(page) - 1) * Number(limit);

    let results: any[] = [];
    let totalCount = 0;

    // Apply filters based on entity type
    switch (entityType) {
      case 'project':
        const projectWhere = buildProjectFilters(filters, currentUserId, req.user!.role);
        const projects = await prisma.project.findMany({
          where: projectWhere,
          include: {
            lecturer: { select: { id: true, fullName: true } },
            students: {
              include: {
                student: { select: { id: true, fullName: true } }
              }
            },
            _count: {
              select: {
                tasks: true,
                documents: true
              }
            }
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        });
        results = projects;
        totalCount = await prisma.project.count({ where: projectWhere });
        break;

      case 'task':
        const taskWhere = buildTaskFilters(filters, currentUserId, req.user!.role);
        const tasks = await prisma.task.findMany({
          where: taskWhere,
          include: {
            project: { select: { id: true, title: true } },
            assignee: { select: { id: true, fullName: true } }
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        });
        results = tasks;
        totalCount = await prisma.task.count({ where: taskWhere });
        break;

      case 'document':
        const documentWhere = buildDocumentFilters(filters, currentUserId, req.user!.role);
        const documents = await prisma.document.findMany({
          where: documentWhere,
          include: {
            project: { select: { id: true, title: true } },
            uploader: { select: { id: true, fullName: true } }
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        });
        results = documents;
        totalCount = await prisma.document.count({ where: documentWhere });
        break;

      default:
        return res.status(400).json({
          error: 'Invalid entity type'
        });
    }

    res.json({
      message: 'Filter preset applied successfully',
      preset: {
        id: preset.id,
        name: preset.name,
        description: preset.description,
        entityType: preset.entityType
      },
      results,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    });

  } catch (error) {
    console.error('Apply filter preset error:', error);
    res.status(500).json({ 
      error: 'Failed to apply filter preset' 
    });
  }
};

// Helper functions to build filters
function buildProjectFilters(filters: any, userId: string, role: string) {
  let whereClause: any = {};

  // Role-based access
  if (role === 'STUDENT') {
    whereClause.students = {
      some: { studentId: userId }
    };
  } else if (role === 'LECTURER') {
    whereClause.lecturerId = userId;
  }

  // Apply filters
  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.progress) {
    whereClause.progress = filters.progress;
  }

  if (filters.lecturer) {
    whereClause.lecturerId = filters.lecturer;
  }

  if (filters.createdDate) {
    const now = new Date();
    let startDate: Date;
    
    switch (filters.createdDate) {
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
        startDate = new Date(0);
    }
    
    whereClause.createdAt = { gte: startDate };
  }

  if (filters.search) {
    whereClause.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return whereClause;
}

function buildTaskFilters(filters: any, userId: string, role: string) {
  let whereClause: any = {};

  // Role-based access
  if (role === 'STUDENT') {
    whereClause.project = {
      students: {
        some: { studentId: userId }
      }
    };
  } else if (role === 'LECTURER') {
    whereClause.project = {
      lecturerId: userId
    };
  }

  // Apply filters
  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.priority) {
    whereClause.priority = filters.priority;
  }

  if (filters.assignee) {
    whereClause.assigneeId = filters.assignee;
  }

  if (filters.project) {
    whereClause.projectId = filters.project;
  }

  if (filters.dueDate) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (filters.dueDate) {
      case 'overdue':
        whereClause.dueDate = { lt: today };
        break;
      case 'today':
        whereClause.dueDate = { gte: today, lt: tomorrow };
        break;
      case 'this_week':
        whereClause.dueDate = { gte: today, lt: nextWeek };
        break;
      case 'no_due_date':
        whereClause.dueDate = null;
        break;
    }
  }

  if (filters.search) {
    whereClause.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return whereClause;
}

function buildDocumentFilters(filters: any, userId: string, role: string) {
  let whereClause: any = {};

  // Role-based access
  if (role === 'STUDENT') {
    whereClause.project = {
      students: {
        some: { studentId: userId }
      }
    };
  } else if (role === 'LECTURER') {
    whereClause.project = {
      lecturerId: userId
    };
  }

  // Apply filters
  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.project) {
    whereClause.projectId = filters.project;
  }

  if (filters.uploader) {
    whereClause.uploadedBy = filters.uploader;
  }

  if (filters.fileType) {
    const mimeTypeMap: { [key: string]: string[] } = {
      'pdf': ['application/pdf'],
      'doc': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'xls': ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      'ppt': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      'archive': ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
    };

    if (mimeTypeMap[filters.fileType]) {
      whereClause.mimeType = { in: mimeTypeMap[filters.fileType] };
    }
  }

  if (filters.uploadDate) {
    const now = new Date();
    let startDate: Date;
    
    switch (filters.uploadDate) {
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
        startDate = new Date(0);
    }
    
    whereClause.createdAt = { gte: startDate };
  }

  if (filters.search) {
    whereClause.OR = [
      { fileName: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return whereClause;
}
