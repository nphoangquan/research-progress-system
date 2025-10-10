import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadFile, deleteFile } from '../utils/cloudinary';
import { cleanupLocalFile } from '../middleware/upload.middleware';

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

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });

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
    const { projectId } = req.query;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

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

    const documents = await prisma.document.findMany({
      where: { projectId: projectId as string },
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
    const { description } = req.body;
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

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        description: description || null
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
