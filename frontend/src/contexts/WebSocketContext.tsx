import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectedUsers: string[];
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const isInitialized = useRef(false);

  // Initialize socket only once
  useEffect(() => {
    // Guard against multiple initialization
    if (isInitialized.current) {
      console.log('🔌 WebSocket already initialized, skipping...');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('🔌 No token found, skipping WebSocket initialization');
      return;
    }

    console.log('🔌 Initializing WebSocket connection...');
    isInitialized.current = true;
    
    const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
      auth: {
        token: token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    // User presence events
    newSocket.on('user-online', (data) => {
      console.log('👤 User online:', data.userId);
      setConnectedUsers(prev => {
        if (!prev.includes(data.userId)) {
          return [...prev, data.userId];
        }
        return prev;
      });
    });

    newSocket.on('user-offline', (data) => {
      console.log('👤 User offline:', data.userId);
      setConnectedUsers(prev => prev.filter(id => id !== data.userId));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up WebSocket connection...');
      isInitialized.current = false;
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
      setConnectedUsers([]);
    };
  }, []); // Empty dependency array - only run once

  const joinProject = useCallback((projectId: string) => {
    if (socket && isConnected) {
      socket.emit('join-project', projectId);
      console.log(`📁 Joined project room: ${projectId}`);
    }
  }, [socket, isConnected]);

  const leaveProject = useCallback((projectId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-project', projectId);
      console.log(`📁 Left project room: ${projectId}`);
    }
  }, [socket, isConnected]);

  const value: WebSocketContextType = useMemo(() => ({
    socket,
    isConnected,
    connectedUsers,
    joinProject,
    leaveProject
  }), [socket, isConnected, connectedUsers, joinProject, leaveProject]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;