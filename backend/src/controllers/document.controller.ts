import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadFile, deleteFile } from '../utils/cloudinary';
import { cleanupLocalFile } from '../middleware/upload.middleware';
import ActivityService from '../services/activity.service';

const prisma = new PrismaClient();

/**
 * Upload document
 */
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file provided' 
      });
    }

    const { projectId, description } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // File validation
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed'
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        error: 'File type not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, Images, Archives' 
      });
    }

    // File size validation (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        error: 'File size too large. Maximum size is 25MB' 
      });
    }

    // Validation
    if (!projectId) {
      return res.status(400).json({ 
        error: 'Project ID is required' 
      });
    }

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        id: true, 
        title: true,
        lecturerId: true,
        students: {
          select: {
            studentId: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    // Check permissions
    if (userRole === 'STUDENT') {
      const isStudentInProject = project.students.some(
        (ps: any) => ps.studentId === userId
      );
      if (!isStudentInProject) {
        return res.status(403).json({ 
          error: 'Access denied to this project' 
        });
      }
    }

    if (userRole === 'LECTURER' && project.lecturerId !== userId) {
      return res.status(403).json({ 
        error: 'Access denied to this project' 
      });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadFile(req.file);

    try {
      // Save to database
      const document = await prisma.document.create({
        data: {
          projectId,
          fileName: req.file.originalname,
          fileUrl: cloudinaryResult.secure_url,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadedBy: userId,
          description: description || null,
          indexStatus: 'PENDING'
        },
        include: {
          project: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      // Clean up local file
      cleanupLocalFile(req.file.path);

      // TODO: Send to Python AI service for indexing (Phase 2)
      // For now, we'll just mark it as PENDING

      // Log activity
      await ActivityService.logActivity({
        userId: userId,
        type: 'DOCUMENT_UPLOADED',
        description: `uploaded document "${req.file.originalname}"`,
        projectId: projectId,
        documentId: document.id,
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        }
      });

      res.status(201).json({
        message: 'Document uploaded successfully',
        document
      });

    } catch (dbError) {
      // If DB save failed, clean up Cloudinary file
      console.error('Database save error:', dbError);
      try {
        await deleteFile(cloudinaryResult.public_id);
      } catch (cleanupError) {
        console.error('Cloudinary cleanup error:', cleanupError);
      }
      
      // Clean up local file
      cleanupLocalFile(req.file.path);
      
      throw dbError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('Upload document error:', error);
    
    // Clean up local file if upload failed
    if (req.file) {
      cleanupLocalFile(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Upload failed. Please try again.' 
    });
  }
};

/**
 * Get documents for a project
 */
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { projectId, status, projectFilter, uploader, fileType, uploadDate, search } = req.query;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Build filter conditions
    const buildFilters = (baseWhere: any) => {
      let filters = { ...baseWhere };

      // Status filter
      if (status) {
        filters.status = status;
      }

      // Project filter - support multiple values
      if (projectFilter) {
        const projectFilters = Array.isArray(projectFilter) ? projectFilter : [projectFilter];
        if (projectFilters.length > 0) {
          filters.projectId = { in: projectFilters };
        }
      }

      // Uploader filter - support multiple values
      if (uploader) {
        const uploaderFilters = Array.isArray(uploader) ? uploader : [uploader];
        if (uploaderFilters.length > 0) {
          filters.uploadedBy = { in: uploaderFilters };
        }
      }

      // File type filter
      if (fileType) {
        const mimeTypeMap: { [key: string]: string[] } = {
          'pdf': ['application/pdf'],
          'doc': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          'xls': ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
          'ppt': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
          'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          'archive': ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
        };

        if (mimeTypeMap[fileType as string]) {
          filters.mimeType = { in: mimeTypeMap[fileType as string] };
        }
      }

      // Upload date filter
      if (uploadDate) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        switch (uploadDate) {
          case 'today':
            filters.createdAt = { gte: today, lt: tomorrow };
            break;
          case 'this_week':
            filters.createdAt = { gte: today, lt: nextWeek };
            break;
          case 'this_month':
            filters.createdAt = { gte: today, lt: nextMonth };
            break;
          case 'last_month':
            filters.createdAt = { gte: lastMonth, lt: today };
            break;
        }
      }

      // Search filter
      if (search) {
        filters.OR = [
          { fileName: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      return filters;
    };

    // If no projectId, get all documents for the user
    if (!projectId) {
      let whereClause: any = {};

      if (userRole === 'STUDENT') {
        // Students can only see documents from projects they're part of
        whereClause = {
          project: {
            students: {
              some: {
                studentId: userId
              }
            }
          }
        };
      } else if (userRole === 'LECTURER') {
        // Lecturers can see documents from their projects
        whereClause = {
          project: {
            lecturerId: userId
          }
        };
      }
      // ADMIN can see all documents (no additional where clause)

      // Apply filters
      whereClause = buildFilters(whereClause);

      const documents = await prisma.document.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      return res.json({
        message: 'Documents retrieved successfully',
        documents
      });
    }

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId as string },
      select: { 
        id: true, 
        lecturerId: true,
        students: {
          select: {
            studentId: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    // Check permissions
    if (userRole === 'STUDENT') {
      const isStudentInProject = project.students.some(
        (ps: any) => ps.studentId === userId
      );
      if (!isStudentInProject) {
        return res.status(403).json({ 
          error: 'Access denied to this project' 
        });
      }
    }

    if (userRole === 'LECTURER' && project.lecturerId !== userId) {
      return res.status(403).json({ 
        error: 'Access denied to this project' 
      });
    }

    // Apply filters for project-specific documents
    const whereClause = buildFilters({ projectId: projectId as string });

    const documents = await prisma.document.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.json({
      message: 'Documents retrieved successfully',
      documents
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve documents' 
    });
  }
};

/**
 * Get document by ID
 */
export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            lecturerId: true,
            students: {
              select: {
                studentId: true
              }
            }
          }
        },
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Check permissions
    if (userRole === 'STUDENT') {
      const isStudentInProject = document.project.students.some(
        (ps: any) => ps.studentId === userId
      );
      if (!isStudentInProject) {
        return res.status(403).json({ 
          error: 'Access denied to this document' 
        });
      }
    }

    if (userRole === 'LECTURER' && document.project.lecturerId !== userId) {
      return res.status(403).json({ 
        error: 'Access denied to this document' 
      });
    }

    res.json({
      message: 'Document retrieved successfully',
      document
    });

  } catch (error) {
    console.error('Get document by ID error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve document' 
    });
  }
};

/**
 * Update document
 */
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, status } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            lecturerId: true,
            students: {
              select: {
                studentId: true
              }
            }
          }
        }
      }
    });

    if (!existingDocument) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Check permissions
    if (userRole === 'STUDENT') {
      const isStudentInProject = existingDocument.project.students.some(
        (ps: any) => ps.studentId === userId
      );
      if (!isStudentInProject) {
        return res.status(403).json({ 
          error: 'Access denied to this document' 
        });
      }
    }

    if (userRole === 'LECTURER' && existingDocument.project.lecturerId !== userId) {
      return res.status(403).json({ 
        error: 'Access denied to this document' 
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (description !== undefined) {
      updateData.description = description || null;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Document updated successfully',
      document: updatedDocument
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ 
      error: 'Failed to update document' 
    });
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            lecturerId: true,
            students: {
              select: {
                studentId: true
              }
            }
          }
        }
      }
    });

    if (!existingDocument) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Check permissions
    if (userRole === 'STUDENT') {
      const isStudentInProject = existingDocument.project.students.some(
        (ps: any) => ps.studentId === userId
      );
      if (!isStudentInProject) {
        return res.status(403).json({ 
          error: 'Access denied to this document' 
        });
      }
    }

    if (userRole === 'LECTURER' && existingDocument.project.lecturerId !== userId) {
      return res.status(403).json({ 
        error: 'Access denied to this document' 
      });
    }

    // Delete from Cloudinary
    try {
      const publicId = existingDocument.fileUrl.split('/').pop()?.split('.')[0];
      if (publicId) {
        await deleteFile(`research-documents/${publicId}`);
      }
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id }
    });

    res.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ 
      error: 'Failed to delete document' 
    });
  }
};

/**
 * Update document index status (for AI service)
 */
export const updateIndexStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { indexStatus, chunkCount, errorMessage } = req.body;

    const document = await prisma.document.update({
      where: { id },
      data: {
        indexStatus,
        chunkCount,
        errorMessage,
        indexedAt: indexStatus === 'INDEXED' ? new Date() : null,
      },
    });

    res.json({
      message: 'Document index status updated successfully',
      document
    });

  } catch (error) {
    console.error('Update index status error:', error);
    res.status(500).json({ 
      error: 'Failed to update index status' 
    });
  }
};
