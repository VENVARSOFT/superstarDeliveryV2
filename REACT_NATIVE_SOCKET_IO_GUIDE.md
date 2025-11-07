# React Native Socket.IO Implementation Guide

## Overview
This guide shows how to implement Socket.IO client in React Native CLI to listen to `order_assignment_request` events from your delivery app backend.

**Server URL**: `http://your-server-ip:9092` (or `http://localhost:9092` for development)  
**Event Name**: `order_assignment_request`

---

## Step 1: Install Dependencies

### Install Socket.IO Client
```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

### Install TypeScript Types (if using TypeScript)
```bash
npm install --save-dev @types/socket.io-client
# or
yarn add -D @types/socket.io-client
```

---

## Step 2: Create Socket.IO Service

Create a service file to manage Socket.IO connection:

### `src/services/socketService.js` (JavaScript)

```javascript
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  /**
   * Connect to Socket.IO server
   * @param {string} serverUrl - Server URL (e.g., 'http://localhost:9092')
   * @param {object} userInfo - User information
   * @param {number} userInfo.userId - Delivery agent user ID
   * @param {string} userInfo.userType - User type (e.g., 'DELIVERY_AGENT')
   * @param {number} userInfo.storeId - Store ID
   */
  connect(serverUrl, userInfo) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    const { userId, userType, storeId } = userInfo;

    // Build connection URL with query parameters
    const connectionUrl = `${serverUrl}?userId=${userId}&userType=${userType}&storeId=${storeId}`;

    this.socket = io(connectionUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    // Connection event
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Connected to Socket.IO server');
      console.log('Socket ID:', this.socket.id);
    });

    // Disconnection event
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Disconnected from Socket.IO server:', reason);
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Reconnection events
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', () => {
      console.log('🔄 Attempting to reconnect...');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Disconnected from Socket.IO server');
    }
  }

  /**
   * Listen to order assignment request events
   * @param {function} callback - Callback function to handle order assignment requests
   */
  onOrderAssignmentRequest(callback) {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.');
      return;
    }

    this.socket.on('order_assignment_request', (data) => {
      console.log('📦 Received order assignment request:', data);
      callback(data);
    });
  }

  /**
   * Remove order assignment request listener
   */
  offOrderAssignmentRequest() {
    if (this.socket) {
      this.socket.off('order_assignment_request');
    }
  }

  /**
   * Send order assignment response (ACCEPT/REJECT)
   * @param {object} responseData - Response data
   * @param {number} responseData.orderId - Order ID
   * @param {number} responseData.deliveryAgentId - Delivery agent ID
   * @param {string} responseData.response - 'ACCEPT' or 'REJECT'
   * @param {string} responseData.message - Optional message
   */
  sendOrderAssignmentResponse(responseData) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected. Cannot send response.');
      return;
    }

    this.socket.emit('order_assignment_response', responseData);
    console.log('📤 Sent order assignment response:', responseData);
  }

  /**
   * Listen to order assignment response events
   * @param {function} callback - Callback function
   */
  onOrderAssignmentResponse(callback) {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.');
      return;
    }

    this.socket.on('order_assignment_response', (data) => {
      console.log('📥 Received order assignment response:', data);
      callback(data);
    });
  }

  /**
   * Listen to order status update events
   * @param {function} callback - Callback function
   */
  onOrderStatusUpdate(callback) {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.');
      return;
    }

    this.socket.on('order_status_update', (data) => {
      console.log('📊 Received order status update:', data);
      callback(data);
    });
  }

  /**
   * Get socket connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
export default new SocketService();
```

### `src/services/socketService.ts` (TypeScript)

```typescript
import io, { Socket } from 'socket.io-client';

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

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  connect(serverUrl: string, userInfo: UserInfo): void {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    const { userId, userType, storeId } = userInfo;
    const connectionUrl = `${serverUrl}?userId=${userId}&userType=${userType}&storeId=${storeId}`;

    this.socket = io(connectionUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Connected to Socket.IO server');
      console.log('Socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      this.isConnected = false;
      console.log('❌ Disconnected from Socket.IO server:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', () => {
      console.log('🔄 Attempting to reconnect...');
    });

    this.socket.on('reconnect_error', (error: Error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Disconnected from Socket.IO server');
    }
  }

  onOrderAssignmentRequest(callback: (data: OrderAssignmentRequest) => void): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.');
      return;
    }

    this.socket.on('order_assignment_request', (data: OrderAssignmentRequest) => {
      console.log('📦 Received order assignment request:', data);
      callback(data);
    });
  }

  offOrderAssignmentRequest(): void {
    if (this.socket) {
      this.socket.off('order_assignment_request');
    }
  }

  sendOrderAssignmentResponse(responseData: OrderAssignmentResponse): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected. Cannot send response.');
      return;
    }

    this.socket.emit('order_assignment_response', responseData);
    console.log('📤 Sent order assignment response:', responseData);
  }

  onOrderAssignmentResponse(callback: (data: any) => void): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.');
      return;
    }

    this.socket.on('order_assignment_response', (data: any) => {
      console.log('📥 Received order assignment response:', data);
      callback(data);
    });
  }

  onOrderStatusUpdate(callback: (data: any) => void): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.');
      return;
    }

    this.socket.on('order_status_update', (data: any) => {
      console.log('📊 Received order status update:', data);
      callback(data);
    });
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();
export type { OrderAssignmentRequest, OrderAssignmentResponse, UserInfo };
```

---

## Step 3: Create React Hook (Optional but Recommended)

### `src/hooks/useSocket.js` (JavaScript)

```javascript
import { useEffect, useState, useCallback } from 'react';
import socketService from '../services/socketService';

const useSocket = (serverUrl, userInfo) => {
  const [isConnected, setIsConnected] = useState(false);
  const [orderRequest, setOrderRequest] = useState(null);

  useEffect(() => {
    // Connect when component mounts
    if (serverUrl && userInfo) {
      socketService.connect(serverUrl, userInfo);
    }

    // Update connection status
    const checkConnection = setInterval(() => {
      setIsConnected(socketService.getConnectionStatus());
    }, 1000);

    // Listen to order assignment requests
    socketService.onOrderAssignmentRequest((data) => {
      setOrderRequest(data);
    });

    // Cleanup on unmount
    return () => {
      clearInterval(checkConnection);
      socketService.offOrderAssignmentRequest();
      socketService.disconnect();
    };
  }, [serverUrl, userInfo]);

  const acceptOrder = useCallback((orderId, deliveryAgentId, message = '') => {
    socketService.sendOrderAssignmentResponse({
      orderId,
      deliveryAgentId,
      response: 'ACCEPT',
      message,
    });
    setOrderRequest(null); // Clear the request after responding
  }, []);

  const rejectOrder = useCallback((orderId, deliveryAgentId, message = '') => {
    socketService.sendOrderAssignmentResponse({
      orderId,
      deliveryAgentId,
      response: 'REJECT',
      message,
    });
    setOrderRequest(null); // Clear the request after responding
  }, []);

  return {
    isConnected,
    orderRequest,
    acceptOrder,
    rejectOrder,
  };
};

export default useSocket;
```

### `src/hooks/useSocket.ts` (TypeScript)

```typescript
import { useEffect, useState, useCallback } from 'react';
import socketService, { OrderAssignmentRequest, UserInfo } from '../services/socketService';

interface UseSocketReturn {
  isConnected: boolean;
  orderRequest: OrderAssignmentRequest | null;
  acceptOrder: (orderId: number, deliveryAgentId: number, message?: string) => void;
  rejectOrder: (orderId: number, deliveryAgentId: number, message?: string) => void;
}

const useSocket = (serverUrl: string | null, userInfo: UserInfo | null): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [orderRequest, setOrderRequest] = useState<OrderAssignmentRequest | null>(null);

  useEffect(() => {
    if (!serverUrl || !userInfo) {
      return;
    }

    // Connect when component mounts
    socketService.connect(serverUrl, userInfo);

    // Update connection status
    const checkConnection = setInterval(() => {
      setIsConnected(socketService.getConnectionStatus());
    }, 1000);

    // Listen to order assignment requests
    socketService.onOrderAssignmentRequest((data: OrderAssignmentRequest) => {
      setOrderRequest(data);
    });

    // Cleanup on unmount
    return () => {
      clearInterval(checkConnection);
      socketService.offOrderAssignmentRequest();
      socketService.disconnect();
    };
  }, [serverUrl, userInfo]);

  const acceptOrder = useCallback((orderId: number, deliveryAgentId: number, message: string = '') => {
    socketService.sendOrderAssignmentResponse({
      orderId,
      deliveryAgentId,
      response: 'ACCEPT',
      message,
    });
    setOrderRequest(null);
  }, []);

  const rejectOrder = useCallback((orderId: number, deliveryAgentId: number, message: string = '') => {
    socketService.sendOrderAssignmentResponse({
      orderId,
      deliveryAgentId,
      response: 'REJECT',
      message,
    });
    setOrderRequest(null);
  }, []);

  return {
    isConnected,
    orderRequest,
    acceptOrder,
    rejectOrder,
  };
};

export default useSocket;
```

---

## Step 4: Use in Your Component

### Example Component (JavaScript)

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import socketService from '../services/socketService';

const DeliveryAgentScreen = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [orderRequest, setOrderRequest] = useState(null);

  // User information (get from your auth/context)
  const userId = 10; // Delivery agent ID
  const storeId = 1; // Store ID
  const serverUrl = 'http://your-server-ip:9092'; // Replace with your server URL

  useEffect(() => {
    // Connect to Socket.IO server
    socketService.connect(serverUrl, {
      userId,
      userType: 'DELIVERY_AGENT',
      storeId,
    });

    // Check connection status periodically
    const connectionCheck = setInterval(() => {
      setIsConnected(socketService.getConnectionStatus());
    }, 1000);

    // Listen to order assignment requests
    socketService.onOrderAssignmentRequest((data) => {
      setOrderRequest(data);
      
      // Show alert when new order arrives
      Alert.alert(
        'New Order Available!',
        `Order #${data.orderNumber}\nAmount: $${data.orderInfo.totalAmount}\nAddress: ${data.orderInfo.formattedAddress}`,
        [
          {
            text: 'Reject',
            style: 'cancel',
            onPress: () => handleRejectOrder(data),
          },
          {
            text: 'Accept',
            onPress: () => handleAcceptOrder(data),
          },
        ]
      );
    });

    // Listen to order assignment responses
    socketService.onOrderAssignmentResponse((data) => {
      if (data.type === 'ASSIGNED') {
        Alert.alert('Success', `Order ${data.orderId} has been assigned to you!`);
      } else if (data.type === 'DECLINED') {
        Alert.alert('Info', `Order ${data.orderId} was declined.`);
      }
    });

    // Cleanup
    return () => {
      clearInterval(connectionCheck);
      socketService.offOrderAssignmentRequest();
      socketService.disconnect();
    };
  }, []);

  const handleAcceptOrder = (orderData) => {
    socketService.sendOrderAssignmentResponse({
      orderId: orderData.orderId,
      deliveryAgentId: userId,
      response: 'ACCEPT',
      message: 'I will deliver this order',
    });
    setOrderRequest(null);
  };

  const handleRejectOrder = (orderData) => {
    socketService.sendOrderAssignmentResponse({
      orderId: orderData.orderId,
      deliveryAgentId: userId,
      response: 'REJECT',
      message: 'Currently unavailable',
    });
    setOrderRequest(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </Text>

      {orderRequest && (
        <View style={styles.orderCard}>
          <Text style={styles.orderTitle}>New Order Request</Text>
          <Text>Order #: {orderRequest.orderNumber}</Text>
          <Text>Amount: ${orderRequest.orderInfo.totalAmount}</Text>
          <Text>Address: {orderRequest.orderInfo.formattedAddress}</Text>
          <View style={styles.buttonRow}>
            <Button
              title="Accept"
              onPress={() => handleAcceptOrder(orderRequest)}
              color="green"
            />
            <Button
              title="Reject"
              onPress={() => handleRejectOrder(orderRequest)}
              color="red"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
});

export default DeliveryAgentScreen;
```

### Example Using Hook (Simpler)

```javascript
import React from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import useSocket from '../hooks/useSocket';

const DeliveryAgentScreen = () => {
  const userId = 10; // Get from your auth/context
  const storeId = 1; // Get from your auth/context
  const serverUrl = 'http://your-server-ip:9092';

  const { isConnected, orderRequest, acceptOrder, rejectOrder } = useSocket(
    serverUrl,
    {
      userId,
      userType: 'DELIVERY_AGENT',
      storeId,
    }
  );

  // Show alert when new order arrives
  React.useEffect(() => {
    if (orderRequest) {
      Alert.alert(
        'New Order Available!',
        `Order #${orderRequest.orderNumber}\nAmount: $${orderRequest.orderInfo.totalAmount}`,
        [
          {
            text: 'Reject',
            style: 'cancel',
            onPress: () => rejectOrder(orderRequest.orderId, userId),
          },
          {
            text: 'Accept',
            onPress: () => acceptOrder(orderRequest.orderId, userId),
          },
        ]
      );
    }
  }, [orderRequest]);

  return (
    <View style={styles.container}>
      <Text>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</Text>
      {orderRequest && (
        <View>
          <Text>Order: {orderRequest.orderNumber}</Text>
          <Button title="Accept" onPress={() => acceptOrder(orderRequest.orderId, userId)} />
          <Button title="Reject" onPress={() => rejectOrder(orderRequest.orderId, userId)} />
        </View>
      )}
    </View>
  );
};
```

---

## Step 5: Configuration

### For Development (Local)
```javascript
const SERVER_URL = 'http://localhost:9092';
```

### For Android Emulator
```javascript
// Use 10.0.2.2 to access localhost from Android emulator
const SERVER_URL = 'http://10.0.2.2:9092';
```

### For iOS Simulator
```javascript
const SERVER_URL = 'http://localhost:9092';
```

### For Physical Device
```javascript
// Use your computer's local IP address
const SERVER_URL = 'http://192.168.1.100:9092'; // Replace with your IP
```

### For Production
```javascript
const SERVER_URL = 'https://your-production-server.com:9092';
```

---

## Step 6: Handle Network Permissions (Android)

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## Step 7: Expected Event Data Structure

When you receive `order_assignment_request`, the data structure is:

```typescript
{
  type: "REQUEST",
  orderId: 12345,
  orderNumber: "ORD-20241201120000-1234",
  storeId: 1,
  assignedDeliveryAgentId: null,
  agents: [
    {
      idUser: 10,
      nmFirst: "John",
      nmLast: "Doe",
      nbPhone: "+1234567890"
    }
  ],
  orderInfo: {
    orderId: 12345,
    orderNumber: "ORD-20241201120000-1234",
    status: "COMPLETED",
    totalAmount: 150.50,
    formattedAddress: "123 Main St, City, State 12345",
    latitude: "40.7128",
    longitude: "-74.0060",
    storeId: 1
  }
}
```

---

## Troubleshooting

### Issue: Connection fails
- **Check server URL**: Ensure the server is running and accessible
- **Check network**: For physical devices, ensure device and server are on same network
- **Check firewall**: Ensure port 9092 is not blocked
- **Android Emulator**: Use `10.0.2.2` instead of `localhost`

### Issue: Not receiving events
- **Verify query parameters**: Ensure `userId`, `userType`, and `storeId` are correct
- **Check server logs**: Verify the server is emitting events
- **Check room membership**: Server automatically joins `agent_{userId}` and `store_{storeId}` rooms

### Issue: Events received but not handled
- **Check event name**: Must be exactly `order_assignment_request`
- **Check callback**: Ensure callback function is properly registered
- **Check component lifecycle**: Ensure listeners are set up in `useEffect`

---

## Best Practices

1. **Connection Management**: Always disconnect when component unmounts
2. **Error Handling**: Implement proper error handling for connection failures
3. **Reconnection**: Socket.IO handles reconnection automatically, but you can customize it
4. **State Management**: Use Context API or Redux for global socket state if needed
5. **Background Handling**: Consider using background tasks for order notifications
6. **Security**: Store server URL and credentials securely (use environment variables)

---

## Complete Example with Context API

### `src/context/SocketContext.js`

```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socketService';

const SocketContext = createContext();

export const SocketProvider = ({ children, serverUrl, userInfo }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [orderRequest, setOrderRequest] = useState(null);

  useEffect(() => {
    if (!serverUrl || !userInfo) return;

    socketService.connect(serverUrl, userInfo);

    const checkConnection = setInterval(() => {
      setIsConnected(socketService.getConnectionStatus());
    }, 1000);

    socketService.onOrderAssignmentRequest((data) => {
      setOrderRequest(data);
    });

    return () => {
      clearInterval(checkConnection);
      socketService.offOrderAssignmentRequest();
      socketService.disconnect();
    };
  }, [serverUrl, userInfo]);

  const acceptOrder = (orderId, deliveryAgentId, message = '') => {
    socketService.sendOrderAssignmentResponse({
      orderId,
      deliveryAgentId,
      response: 'ACCEPT',
      message,
    });
    setOrderRequest(null);
  };

  const rejectOrder = (orderId, deliveryAgentId, message = '') => {
    socketService.sendOrderAssignmentResponse({
      orderId,
      deliveryAgentId,
      response: 'REJECT',
      message,
    });
    setOrderRequest(null);
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        orderRequest,
        acceptOrder,
        rejectOrder,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
};
```

### Usage in App.js

```javascript
import { SocketProvider } from './src/context/SocketContext';

const App = () => {
  const userInfo = {
    userId: 10,
    userType: 'DELIVERY_AGENT',
    storeId: 1,
  };

  return (
    <SocketProvider serverUrl="http://your-server-ip:9092" userInfo={userInfo}>
      <YourAppComponents />
    </SocketProvider>
  );
};
```

---

## Summary

1. ✅ Install `socket.io-client`
2. ✅ Create Socket.IO service
3. ✅ Connect with user info (userId, userType, storeId)
4. ✅ Listen to `order_assignment_request` events
5. ✅ Send `order_assignment_response` (ACCEPT/REJECT)
6. ✅ Handle connection lifecycle properly

Your React Native app is now ready to receive real-time order assignment requests! 🚀

