import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get all published help articles
 * @route GET /api/help
 */
export const getHelpArticles = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const currentUserRole = req.user?.role;

    const where: any = {};
    
    // Only show published articles for non-admin users
    if (currentUserRole !== 'ADMIN') {
      where.isPublished = true;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const selectFields: any = {
      id: true,
      title: true,
      content: true,
      category: true,
      order: true,
      createdAt: true,
      updatedAt: true,
      creator: {
        select: {
          id: true,
          fullName: true,
        },
      },
    };

    if (currentUserRole === 'ADMIN') {
      selectFields.isPublished = true;
      selectFields.updater = {
        select: {
          id: true,
          fullName: true,
        },
      };
    }

    const articles = await prisma.helpArticle.findMany({
      where,
      select: selectFields,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ articles });
  } catch (error) {
    logger.error('Error fetching help articles:', error);
    res.status(500).json({ error: 'Không thể tải bài viết trợ giúp' });
  }
};

/**
 * Get help article by ID
 * @route GET /api/help/:id
 */
export const getHelpArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserRole = req.user?.role;

    const article = await prisma.helpArticle.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        order: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        updater: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!article) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    // Only published articles for non-admin users
    if (!article.isPublished && currentUserRole !== 'ADMIN') {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    res.json({ article });
  } catch (error) {
    logger.error('Error fetching help article:', error);
    res.status(500).json({ error: 'Không thể tải bài viết' });
  }
};

/**
 * Get all categories
 * @route GET /api/help/categories
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const currentUserRole = req.user?.role;
    
    const where: any = {};
    // Only show published categories for non-admin users
    if (currentUserRole !== 'ADMIN') {
      where.isPublished = true;
    }

    const categories = await prisma.helpArticle.findMany({
      where,
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });

    const categoryList = categories.map((c) => c.category);

    res.json({ categories: categoryList });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Không thể tải danh mục' });
  }
};

/**
 * Create help article (Admin only)
 * @route POST /api/help
 */
export const createHelpArticle = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    if (currentUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền tạo bài viết' });
    }

    const { title, content, category, order, isPublished = true } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Tiêu đề, nội dung và danh mục là bắt buộc' });
    }

    if (title.length > 200) {
      return res.status(400).json({ error: 'Tiêu đề không được vượt quá 200 ký tự' });
    }

    // Auto-increment order if not provided or is 0
    let finalOrder = parseInt(order, 10) || 0;
    if (finalOrder === 0) {
      const maxOrder = await prisma.helpArticle.aggregate({
        _max: {
          order: true,
        },
      });
      finalOrder = (maxOrder._max.order || 0) + 1;
    }

    const article = await prisma.helpArticle.create({
      data: {
        title,
        content,
        category,
        order: finalOrder,
        isPublished: isPublished === true || isPublished === 'true',
        createdBy: currentUserId,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    res.status(201).json({ article });
  } catch (error) {
    logger.error('Error creating help article:', error);
    res.status(500).json({ error: 'Không thể tạo bài viết' });
  }
};

/**
 * Update help article (Admin only)
 * @route PATCH /api/help/:id
 */
export const updateHelpArticle = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;
    const { id } = req.params;

    if (currentUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền cập nhật bài viết' });
    }

    const existingArticle = await prisma.helpArticle.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    const { title, content, category, order, isPublished } = req.body;

    const updateData: any = {
      updatedBy: currentUserId,
    };

    if (title !== undefined) {
      if (title.length > 200) {
        return res.status(400).json({ error: 'Tiêu đề không được vượt quá 200 ký tự' });
      }
      updateData.title = title;
    }

    if (content !== undefined) {
      updateData.content = content;
    }

    if (category !== undefined) {
      updateData.category = category;
    }

    if (order !== undefined) {
      const parsedOrder = parseInt(order, 10);
      // Auto-increment if order is 0 or not provided
      if (parsedOrder === 0 || isNaN(parsedOrder)) {
        const maxOrder = await prisma.helpArticle.aggregate({
          _max: {
            order: true,
          },
        });
        updateData.order = (maxOrder._max.order || 0) + 1;
      } else {
        updateData.order = parsedOrder;
      }
    }

    if (isPublished !== undefined) {
      updateData.isPublished = isPublished === true || isPublished === 'true';
    }

    const article = await prisma.helpArticle.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        updater: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    res.json({ article });
  } catch (error) {
    logger.error('Error updating help article:', error);
    res.status(500).json({ error: 'Không thể cập nhật bài viết' });
  }
};

/**
 * Delete help article (Admin only)
 * @route DELETE /api/help/:id
 */
export const deleteHelpArticle = async (req: Request, res: Response) => {
  try {
    const currentUserRole = req.user!.role;
    const { id } = req.params;

    if (currentUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền xóa bài viết' });
    }

    const article = await prisma.helpArticle.findUnique({
      where: { id },
    });

    if (!article) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    await prisma.helpArticle.delete({
      where: { id },
    });

    res.json({ message: 'Đã xóa bài viết' });
  } catch (error) {
    logger.error('Error deleting help article:', error);
    res.status(500).json({ error: 'Không thể xóa bài viết' });
  }
};

