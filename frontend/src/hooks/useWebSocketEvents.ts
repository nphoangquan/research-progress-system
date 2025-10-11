import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useWebSocket } from '../contexts/WebSocketContext';

interface UseWebSocketEventsProps {
  projectId?: string;
  taskId?: string;
  enableTaskEvents?: boolean;
  enableCommentEvents?: boolean;
}

export const useWebSocketEvents = ({
  projectId,
  taskId,
  enableTaskEvents = true,
  enableCommentEvents = true
}: UseWebSocketEventsProps) => {
  const { socket, isConnected, joinProject, leaveProject } = useWebSocket();
  const queryClient = useQueryClient();

  // Join/leave project room when projectId changes
  useEffect(() => {
    if (projectId && isConnected) {
      joinProject(projectId);
      
      return () => {
        leaveProject(projectId);
      };
    }
  }, [projectId, isConnected, joinProject, leaveProject]);

  // Task events handler
  const handleTaskEvents = useCallback(() => {
    if (!socket || !enableTaskEvents) return;

    // Task created
    socket.on('task-created', (data) => {
      console.log('📝 Task created:', data);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      
      // Show notification
      toast.success('New task created!', {
        duration: 3000,
        icon: '📝'
      });
    });

    // Task updated
    socket.on('task-updated', (data) => {
      console.log('📝 Task updated:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Show notification for significant changes
      if (data.changes.title || data.changes.assigneeId) {
        toast.success('Task updated!', {
          duration: 3000,
          icon: '📝'
        });
      }
    });

    // Task status changed
    socket.on('task-status-changed', (data) => {
      console.log('📝 Task status changed:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Show notification
      toast.success(`Task status changed to ${data.newStatus}`, {
        duration: 3000,
        icon: '🔄'
      });
    });

    // Task deleted
    socket.on('task-deleted', (data) => {
      console.log('📝 Task deleted:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Show notification
      toast.success('Task deleted!', {
        duration: 3000,
        icon: '🗑️'
      });
    });

    // Cleanup function
    return () => {
      socket.off('task-created');
      socket.off('task-updated');
      socket.off('task-status-changed');
      socket.off('task-deleted');
    };
  }, [socket, enableTaskEvents, queryClient, taskId]);

  // Comment events handler
  const handleCommentEvents = useCallback(() => {
    if (!socket || !enableCommentEvents) return;

    // Comment added
    socket.on('comment-added', (data) => {
      console.log('💬 Comment added:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      // Show notification
      toast.success('New comment added!', {
        duration: 3000,
        icon: '💬'
      });
    });

    // Comment updated
    socket.on('comment-updated', (data) => {
      console.log('💬 Comment updated:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    });

    // Comment deleted
    socket.on('comment-deleted', (data) => {
      console.log('💬 Comment deleted:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      // Show notification
      toast.success('Comment deleted!', {
        duration: 3000,
        icon: '🗑️'
      });
    });

    // Cleanup function
    return () => {
      socket.off('comment-added');
      socket.off('comment-updated');
      socket.off('comment-deleted');
    };
  }, [socket, enableCommentEvents, queryClient, taskId]);

  // Setup event listeners
  useEffect(() => {
    const cleanupTaskEvents = handleTaskEvents();
    const cleanupCommentEvents = handleCommentEvents();

    return () => {
      cleanupTaskEvents?.();
      cleanupCommentEvents?.();
    };
  }, [handleTaskEvents, handleCommentEvents]);

  return {
    socket,
    isConnected
  };
};

export default useWebSocketEvents;
