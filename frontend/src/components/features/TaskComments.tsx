import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/taskUtils';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { getErrorMessage } from '../../utils/errorUtils';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskCommentsProps {
  taskId: string;
  comments?: Comment[];
  currentUserId?: string;
}

// Comment character limit - not too strict
const MAX_COMMENT_LENGTH = 5000;

export default function TaskComments({ taskId, comments, currentUserId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/comments/task/${taskId}`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      setNewComment('');
      toast.success('Thêm bình luận thành công!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Thêm bình luận thất bại'));
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      toast.success('Xóa bình luận thành công!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Xóa bình luận thất bại'));
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newComment]);

  const handleCommentChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_COMMENT_LENGTH) {
      setNewComment(value);
    } else {
      toast.error(`Bình luận không được vượt quá ${MAX_COMMENT_LENGTH} ký tự`);
    }
  }, []);

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) {
      toast.error('Vui lòng nhập nội dung bình luận');
      return;
    }
    if (newComment.length > MAX_COMMENT_LENGTH) {
      toast.error(`Bình luận không được vượt quá ${MAX_COMMENT_LENGTH} ký tự`);
      return;
    }
    addCommentMutation.mutate(newComment.trim());
  }, [newComment, addCommentMutation]);

  const handleDeleteComment = useCallback((commentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      deleteCommentMutation.mutate(commentId);
    }
  }, [deleteCommentMutation]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddComment();
    }
  }, [handleAddComment]);

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
        <MessageSquare className="w-4 h-4 mr-2" />
        Bình luận ({comments?.length || 0})
      </h3>
      
      {/* Add Comment */}
      <div className="mb-6">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleCommentChange}
              onKeyDown={handleKeyDown}
              placeholder="Thêm bình luận... (Ctrl+Enter để gửi)"
              rows={3}
              className="input resize-none"
              maxLength={MAX_COMMENT_LENGTH}
            />
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${newComment.length > MAX_COMMENT_LENGTH * 0.9 ? 'text-yellow-600' : 'text-gray-500'}`}>
                {newComment.length} / {MAX_COMMENT_LENGTH} ký tự
              </span>
              {newComment.length > MAX_COMMENT_LENGTH * 0.9 && (
                <span className="text-xs text-yellow-600">
                  Sắp đạt giới hạn
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || addCommentMutation.isPending || newComment.length > MAX_COMMENT_LENGTH}
            className="btn-primary self-start"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments?.map((comment) => (
          <div key={comment.id} className="border-l-4 border-gray-200 pl-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {comment.author.fullName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
              {/* Show delete button only for own comments */}
              {comment.author.id === currentUserId && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={deleteCommentMutation.isPending}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Xóa bình luận"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        
        {(!comments || comments.length === 0) && (
          <p className="text-gray-500 text-center py-4">
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </p>
        )}
      </div>
    </div>
  );
}

