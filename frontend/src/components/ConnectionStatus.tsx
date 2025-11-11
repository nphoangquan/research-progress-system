import type { FC } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Wifi, WifiOff } from 'lucide-react';

const ConnectionStatus: FC = () => {
  const { isConnected } = useWebSocket();

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <Wifi className="w-4 h-4" />
        <span className="text-sm font-medium">Trực tuyến</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-red-600">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">Mất kết nối</span>
    </div>
  );
};

export default ConnectionStatus;
