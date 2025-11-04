import io, {Socket as SocketIOClient} from 'socket.io-client';
import {Platform} from 'react-native';

// For localhost on Android emulator use: 'http://10.0.2.2:5001'
// For localhost on iOS simulator use: 'http://localhost:5001'
const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';

let socket: SocketIOClient | null = null;
let isConnected = false;

// Connect to socket
export function connectSocket() {
  if (socket?.connected) {
    console.log('Socket already connected');
    return;
  }

  console.log('Connecting to socket...');
  socket = io(BASE_URL);

  socket.on('connect', () => {
    console.log('✅ Socket connected');
    isConnected = true;
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
    isConnected = false;
  });

  socket.on('connect_error', error => {
    console.error('Socket connection error:', error);
    isConnected = false;
  });
}

// Disconnect socket
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    console.log('Socket disconnected');
  }
}

// Check if socket is connected
export function isSocketConnected(): boolean {
  return isConnected && socket?.connected === true;
}
