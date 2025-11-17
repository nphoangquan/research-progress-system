import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useWebSocket } from '../contexts/WebSocketContext';

interface UseWebSocketEventsProps {
  projectId?: string;
  taskId?: string;
  enableTaskEvents?: boolean;
  enableCommentEvents?: boolean;
  onNotification?: (notification: any) => void;
  onNotificationCount?: (count: number) => void;
}

export const useWebSocketEvents = ({
  projectId,
  taskId,
  enableTaskEvents = true,
  enableCommentEvents = true,
  onNotification,
  onNotificationCount,
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
  useEffect(() => {
    if (!socket || !enableTaskEvents || !isConnected) return;

    // Task created
    const handleTaskCreated = (data: any) => {
      console.log('Task created:', data);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      
      // Show notification
      toast.success('New task created!', {
        duration: 3000,
      });
    };

    // Task updated
    const handleTaskUpdated = (data: any) => {
      console.log('Task updated:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Show notification for significant changes
      if (data.changes?.title || data.changes?.assigneeId) {
        toast.success('Task updated!', {
          duration: 3000,
        });
      }
    };

    // Task status changed
    const handleTaskStatusChanged = (data: any) => {
      console.log('Task status changed:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Show notification
      toast.success(`Task status changed to ${data.newStatus}`, {
        duration: 3000,
      });
    };

    // Task deleted
    const handleTaskDeleted = (data: any) => {
      console.log('Task deleted:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Show notification
      toast.success('Task deleted!', {
        duration: 3000,
      });
    };

    // Register event listeners
    socket.on('task-created', handleTaskCreated);
    socket.on('task-updated', handleTaskUpdated);
    socket.on('task-status-changed', handleTaskStatusChanged);
    socket.on('task-deleted', handleTaskDeleted);

    // Cleanup function
    return () => {
      socket.off('task-created', handleTaskCreated);
      socket.off('task-updated', handleTaskUpdated);
      socket.off('task-status-changed', handleTaskStatusChanged);
      socket.off('task-deleted', handleTaskDeleted);
    };
  }, [socket, enableTaskEvents, isConnected, queryClient, taskId]);

  // Comment events handler
  useEffect(() => {
    if (!socket || !enableCommentEvents || !isConnected) return;

    // Comment added
    const handleCommentAdded = (data: any) => {
      console.log('Comment added:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      // Show notification
      toast.success('New comment added!', {
        duration: 3000,
      });
    };

    // Comment updated
    const handleCommentUpdated = (data: any) => {
      console.log('Comment updated:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    };

    // Comment deleted
    const handleCommentDeleted = (data: any) => {
      console.log('Comment deleted:', data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      // Show notification
      toast.success('Comment deleted!', {
        duration: 3000,
      });
    };

    // Register event listeners
    socket.on('comment-added', handleCommentAdded);
    socket.on('comment-updated', handleCommentUpdated);
    socket.on('comment-deleted', handleCommentDeleted);

    // Cleanup function
    return () => {
      socket.off('comment-added', handleCommentAdded);
      socket.off('comment-updated', handleCommentUpdated);
      socket.off('comment-deleted', handleCommentDeleted);
    };
  }, [socket, enableCommentEvents, isConnected, queryClient, taskId]);

  // Notification events handler
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (data: any) => {
      console.log('Notification received:', data);
      if (onNotification) {
        onNotification(data.notification);
      }
    };

    const handleNotificationCount = (data: any) => {
      console.log('Notification count updated:', data);
      if (onNotificationCount) {
        onNotificationCount(data.count);
      }
    };

    socket.on('notification', handleNotification);
    socket.on('notification-count', handleNotificationCount);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('notification-count', handleNotificationCount);
    };
  }, [socket, isConnected, onNotification, onNotificationCount]);

  return {
    socket,
    isConnected
  };
};

export default useWebSocketEvents;
