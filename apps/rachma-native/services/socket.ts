import { io, Socket } from 'socket.io-client';

// Use the same base URL as the ApiService, but replace http/https with ws/wss if needed
const BASE_URL = 'https://api.coffeeshop.elkassa.com';

class SocketServiceClass {
  private socket: Socket | null = null;
  private currentStoreId: string | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(BASE_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        if (this.currentStoreId) {
          this.joinStore(this.currentStoreId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
  }

  joinStore(storeId: string) {
    this.currentStoreId = storeId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_store', { storeId });
    } else {
      this.connect();
    }
  }

  leaveStore(storeId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_store', { storeId });
    }
    this.currentStoreId = null;
  }

  emitRachmaAction(data: { storeId: string; action: string; productId: string; baristaId: string; timestamp: string }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('rachma_action', data);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const SocketService = new SocketServiceClass();
