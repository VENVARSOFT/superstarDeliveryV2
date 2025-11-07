import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {io, Socket} from 'socket.io-client';
import {SOCKET_URL} from './config';
import {tokenManager} from '@utils/tokenManager';

// ==================== TYPES ====================
interface UserInfo {
  userId: number;
  userType: string;
  storeId: number;
}

interface OrderAssignmentRequest {
  type: string;
  orderId: number;
  orderNumber: string;
  storeId: number;
  assignedDeliveryAgentId: number | null;
  agents: Array<{
    idUser: number;
    nmFirst: string;
    nmLast: string;
    nbPhone: string;
  }>;
  orderInfo: {
    orderId: number;
    orderNumber: string;
    status: string;
    totalAmount: number;
    formattedAddress: string;
    latitude: string | null;
    longitude: string | null;
    storeId: number;
  };
}

interface OrderAssignmentResponse {
  orderId: number;
  deliveryAgentId: number;
  response: 'ACCEPT' | 'REJECT';
  message?: string;
}

interface WSservice {
  // Connection methods
  initializeSocket: (userInfo?: UserInfo) => void;
  connect: (token?: string, userInfo?: UserInfo) => Promise<boolean>;
  disconnect: () => void;
  getConnectionStatus: () => boolean;
  onConnectionChange: (callback: (connected: boolean) => void) => () => void;

  // Core socket methods
  emit: (event: string, data: any) => boolean;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  removeListener: (listenerName: string) => void;

  // Token management
  updateAccessToken: () => void;

  // Message methods (existing)
  sendMessage: (rideId: string, text: string) => boolean;

  // Order assignment methods (new)
  onOrderAssignmentRequest: (
    callback: (data: OrderAssignmentRequest) => void,
  ) => void;
  offOrderAssignmentRequest: () => void;
  sendOrderAssignmentResponse: (
    responseData: OrderAssignmentResponse,
  ) => boolean;
  onOrderAssignmentResponse: (callback: (data: any) => void) => void;
  onOrderStatusUpdate: (callback: (data: any) => void) => void;

  // Get socket instance for advanced usage
  getSocket: () => Socket | null;
}

const WSContext = createContext<WSservice | undefined>(undefined);

// ==================== PROVIDER ====================
export const WSProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [socketAccessToken, setSocketAccessToken] = useState<string | null>(
    null,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const socket = useRef<Socket | null>(null);
  const connectionChangeListeners = useRef<Set<(connected: boolean) => void>>(
    new Set(),
  );
  const orderRequestCallback = useRef<
    ((data: OrderAssignmentRequest) => void) | null
  >(null);
  const orderResponseCallback = useRef<((data: any) => void) | null>(null);
  const orderStatusUpdateCallback = useRef<((data: any) => void) | null>(null);

  // ==================== NOTIFY CONNECTION CHANGE ====================
  const notifyConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    connectionChangeListeners.current.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection change listener:', error);
      }
    });
  }, []);

  // ==================== INITIALIZE TOKEN ON MOUNT ====================
  useEffect(() => {
    const token = tokenManager.getAccessToken();
    if (token) {
      setSocketAccessToken(token);
    }
  }, []);

  // ==================== HANDLE SOCKET CONNECTION ====================
  useEffect(() => {
    if (!socketAccessToken) return;

    // Clean up existing socket
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }

    // Build connection URL with query parameters if userInfo exists
    let connectionUrl = SOCKET_URL;
    if (userInfo) {
      const params = new URLSearchParams({
        userId: String(userInfo.userId),
        userType: userInfo.userType,
        storeId: String(userInfo.storeId),
      });
      connectionUrl = `${SOCKET_URL}?${params.toString()}`;
    }

    // Create socket connection
    socket.current = io(connectionUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      extraHeaders: {
        access_token: socketAccessToken || '',
      },
    });

    // ===== CONNECTION EVENTS =====
    socket.current.on('connect', () => {
      console.log('✅ Socket connected successfully');
      console.log('Socket ID:', socket.current?.id);
      notifyConnectionChange(true);

      // Re-register order assignment request listener if callback exists
      if (orderRequestCallback.current && socket.current) {
        const handler = (data: OrderAssignmentRequest) => {
          console.log('📦 Received order assignment request:', data);
          orderRequestCallback.current?.(data);
        };
        socket.current.on('order_assignment_request', handler);
        console.log('🔄 Re-registered order_assignment_request listener');
      }

      // Re-register order assignment response listener if callback exists
      if (orderResponseCallback.current && socket.current) {
        const handler = (data: any) => {
          console.log('📥 Received order assignment response:', data);
          orderResponseCallback.current?.(data);
        };
        socket.current.on('order_assignment_response', handler);
        console.log('🔄 Re-registered order_assignment_response listener');
      }

      // Re-register order status update listener if callback exists
      if (orderStatusUpdateCallback.current && socket.current) {
        const handler = (data: any) => {
          console.log('📊 Received order status update:', data);
          orderStatusUpdateCallback.current?.(data);
        };
        socket.current.on('order_status_update', handler);
        console.log('🔄 Re-registered order_status_update listener');
      }
    });

    socket.current.on('connect_error', error => {
      console.error('❌ Socket connection error:', error.message);
      notifyConnectionChange(false);

      // Handle authentication errors
      if (
        error.message.includes('Authentication Error') ||
        error.message.includes('Authentication')
      ) {
        tokenManager.clearTokens();
        setSocketAccessToken(null);
      }
    });

    socket.current.on('disconnect', reason => {
      console.log('🔌 Socket disconnected:', reason);
      notifyConnectionChange(false);

      // Server disconnected, need to reconnect manually
      if (reason === 'io server disconnect') {
        socket.current?.connect();
      }
    });

    socket.current.on('error', error => {
      console.error('⚠️ Socket error:', error);
    });

    // ===== RECONNECTION EVENTS =====
    socket.current.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
    });

    socket.current.on('reconnect_attempt', () => {
      console.log('🔄 Attempting to reconnect...');
    });

    socket.current.on('reconnect_error', (error: Error) => {
      console.error('❌ Reconnection error:', error);
    });

    socket.current.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
    });

    // Cleanup on unmount
    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [socketAccessToken, userInfo, notifyConnectionChange]);

  // ==================== INITIALIZE SOCKET ====================
  const initializeSocket = useCallback((userData?: UserInfo) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      setSocketAccessToken(token);
    }
    if (userData) {
      setUserInfo(userData);
    }
  }, []);

  // ==================== CONNECT ====================
  const connect = useCallback(
    async (token?: string, userData?: UserInfo): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        const authToken = token || tokenManager.getAccessToken();
        if (!authToken) {
          reject(new Error('Token is required to connect socket'));
          return;
        }

        // Update userInfo if provided
        if (userData) {
          setUserInfo(userData);
        }

        // Check if already connected
        if (socket.current?.connected) {
          resolve(true);
          return;
        }

        // Set up timeout
        const timeout = setTimeout(() => {
          if (socket.current) {
            socket.current.off('connect', onConnect);
            socket.current.off('connect_error', onConnectError);
          }
          reject(new Error('Connection timeout'));
        }, 20000);

        const onConnect = () => {
          clearTimeout(timeout);
          if (socket.current) {
            socket.current.off('connect', onConnect);
            socket.current.off('connect_error', onConnectError);
          }
          resolve(true);
        };

        const onConnectError = (error: any) => {
          clearTimeout(timeout);
          if (socket.current) {
            socket.current.off('connect', onConnect);
            socket.current.off('connect_error', onConnectError);
          }
          reject(error);
        };

        // Set token (triggers socket creation in useEffect)
        setSocketAccessToken(authToken);

        // Wait for socket to be created and attach listeners
        const checkInterval = setInterval(() => {
          if (socket.current) {
            clearInterval(checkInterval);
            socket.current.once('connect', onConnect);
            socket.current.once('connect_error', onConnectError);

            // If already connected, resolve immediately
            if (socket.current.connected) {
              clearTimeout(timeout);
              socket.current.off('connect', onConnect);
              socket.current.off('connect_error', onConnectError);
              resolve(true);
            }
          }
        }, 50);

        // Clear interval on timeout
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 20000);
      });
    },
    [],
  );

  // ==================== EMIT ====================
  const emit = useCallback(
    (event: string, data: any): boolean => {
      if (socket.current && isConnected) {
        socket.current.emit(event, data);
        console.log(`📤 Emitted ${event}:`, data);
        return true;
      }
      console.warn(`⚠️ Cannot emit ${event}: Socket not connected`);
      return false;
    },
    [isConnected],
  );

  // ==================== ON (LISTEN) ====================
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socket.current) {
      socket.current.on(event, callback);
      console.log(`👂 Listening to ${event}`);
    } else {
      console.warn(`⚠️ Cannot listen to ${event}: Socket not initialized`);
    }
  }, []);

  // ==================== OFF (REMOVE LISTENER) ====================
  const off = useCallback((event: string, callback: (data: any) => void) => {
    if (socket.current) {
      socket.current.off(event, callback);
      console.log(`🔇 Stopped listening to ${event}`);
    }
  }, []);

  // ==================== REMOVE LISTENER ====================
  const removeListener = useCallback((listenerName: string) => {
    if (socket.current) {
      socket.current.removeListener(listenerName);
      console.log(`🔇 Removed listener: ${listenerName}`);
    }
  }, []);

  // ==================== UPDATE ACCESS TOKEN ====================
  const updateAccessToken = useCallback(() => {
    const token = tokenManager.getAccessToken();
    if (token) {
      setSocketAccessToken(token);
    }
  }, []);

  // ==================== DISCONNECT ====================
  const disconnect = useCallback(() => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
      notifyConnectionChange(false);
      console.log('🔌 Socket disconnected');
    }
  }, [notifyConnectionChange]);

  // ==================== GET CONNECTION STATUS ====================
  const getConnectionStatus = useCallback(() => {
    return isConnected;
  }, [isConnected]);

  // ==================== ON CONNECTION CHANGE ====================
  const onConnectionChange = useCallback(
    (callback: (connected: boolean) => void) => {
      connectionChangeListeners.current.add(callback);
      // Immediately call with current status
      callback(isConnected);

      // Return unsubscribe function
      return () => {
        connectionChangeListeners.current.delete(callback);
      };
    },
    [isConnected],
  );

  // ==================== SEND MESSAGE (EXISTING) ====================
  const sendMessage = useCallback(
    (rideId: string, text: string): boolean => {
      if (!rideId || !text) {
        console.warn('⚠️ Ride ID and text are required to send message');
        return false;
      }
      return emit('send_message', {
        rideId,
        text,
      });
    },
    [emit],
  );

  // ==================== ORDER ASSIGNMENT REQUEST (NEW) ====================
  const onOrderAssignmentRequest = useCallback(
    (callback: (data: OrderAssignmentRequest) => void) => {
      // Store callback even if socket is not connected yet
      orderRequestCallback.current = callback;

      if (!socket.current) {
        console.warn(
          '⚠️ Socket not connected yet. Listener will be registered when socket connects.',
        );
        return;
      }

      const handler = (data: OrderAssignmentRequest) => {
        console.log('📦 Received order assignment request:', data);
        callback(data);
      };

      socket.current.on('order_assignment_request', handler);
      console.log('👂 Registered order_assignment_request listener');
    },
    [],
  );

  // ==================== OFF ORDER ASSIGNMENT REQUEST ====================
  const offOrderAssignmentRequest = useCallback(() => {
    if (socket.current) {
      socket.current.off('order_assignment_request');
    }
    orderRequestCallback.current = null;
    console.log('🔇 Stopped listening to order_assignment_request');
  }, []);

  // ==================== SEND ORDER ASSIGNMENT RESPONSE ====================
  const sendOrderAssignmentResponse = useCallback(
    (responseData: OrderAssignmentResponse): boolean => {
      if (!socket.current || !isConnected) {
        console.error('❌ Socket not connected. Cannot send order response.');
        return false;
      }

      socket.current.emit('order_assignment_response', responseData);
      console.log('📤 Sent order assignment response:', responseData);
      return true;
    },
    [isConnected],
  );

  // ==================== ON ORDER ASSIGNMENT RESPONSE ====================
  const onOrderAssignmentResponse = useCallback(
    (callback: (data: any) => void) => {
      // Store callback even if socket is not connected yet
      orderResponseCallback.current = callback;

      if (!socket.current) {
        console.warn(
          '⚠️ Socket not connected yet. Listener will be registered when socket connects.',
        );
        return;
      }

      const handler = (data: any) => {
        console.log('📥 Received order assignment response:', data);
        callback(data);
      };

      socket.current.on('order_assignment_response', handler);
      console.log('👂 Registered order_assignment_response listener');
    },
    [],
  );

  // ==================== ON ORDER STATUS UPDATE ====================
  const onOrderStatusUpdate = useCallback((callback: (data: any) => void) => {
    // Store callback even if socket is not connected yet
    orderStatusUpdateCallback.current = callback;

    if (!socket.current) {
      console.warn(
        '⚠️ Socket not connected yet. Listener will be registered when socket connects.',
      );
      return;
    }

    const handler = (data: any) => {
      console.log('📊 Received order status update:', data);
      callback(data);
    };

    socket.current.on('order_status_update', handler);
    console.log('👂 Registered order_status_update listener');
  }, []);

  // ==================== GET SOCKET ====================
  const getSocket = useCallback((): Socket | null => {
    return socket.current;
  }, []);

  // ==================== SERVICE OBJECT ====================
  const socketService: WSservice = {
    // Connection
    initializeSocket,
    connect,
    disconnect,
    getConnectionStatus,
    onConnectionChange,

    // Core socket
    emit,
    on,
    off,
    removeListener,

    // Token
    updateAccessToken,

    // Messages
    sendMessage,

    // Order assignments
    onOrderAssignmentRequest,
    offOrderAssignmentRequest,
    sendOrderAssignmentResponse,
    onOrderAssignmentResponse,
    onOrderStatusUpdate,

    // Advanced
    getSocket,
  };

  return (
    <WSContext.Provider value={socketService}>{children}</WSContext.Provider>
  );
};

// ==================== HOOK ====================
export const useWS = () => {
  const socketService = useContext(WSContext);
  if (!socketService) {
    throw new Error('useWS must be used within a WSProvider');
  }
  return socketService;
};

// ==================== EXPORT TYPES ====================
export type {
  WSservice,
  UserInfo,
  OrderAssignmentRequest,
  OrderAssignmentResponse,
};
