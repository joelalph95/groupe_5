import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connecté');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket déconnecté');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(room: string) {
    if (this.socket) {
      this.socket.emit('join-room', room);
    }
  }

  emitEmergencyAlert(data: any) {
    if (this.socket) {
      this.socket.emit('emergency-alert', data);
    }
  }

  emitBIPAlert(data: any) {
    if (this.socket) {
      this.socket.emit('bip-alert', data);
    }
  }

  emitLocationUpdate(data: any) {
    if (this.socket) {
      this.socket.emit('update-location', data);
    }
  }

  onNewEmergency(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new-emergency', callback);
    }
  }

  onNewBIP(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new-bip', callback);
    }
  }

  onLocationUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('location-updated', callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();