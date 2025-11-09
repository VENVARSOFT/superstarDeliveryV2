# Delivery Agent - Socket Integration Guide

## Overview

This guide explains how to integrate WebSocket functionality for **Delivery Agents** to receive order assignments, send responses, and track orders in real-time using `on` (listen) and `emit` (send) methods.

---

## Prerequisites

1. **WSProvider Setup**: Ensure your app is wrapped with `WSProvider` in the root component (typically `App.tsx`)

```typescript
import {WSProvider} from '@service/WSProvider';

function App() {
  return <WSProvider>{/* Your app components */}</WSProvider>;
}
```

2. **User Authentication**: Delivery agent must be authenticated and have a valid access token
3. **User Type**: Delivery agent must be identified as `USER_TYPES.DELIVERY_PARTNER`

---

## Understanding `on` and `emit`

### `on` - Listen for Events (Receive)

Use `on` to listen for incoming socket events from the server:

```typescript
// Method 1: Using helper methods (recommended)
socketService.onOrderAssignmentRequest(data => {
  // Handle incoming order assignment request
});

// Method 2: Using direct `on` method
socketService.on('order_assignment_request', data => {
  // Handle incoming order assignment request
});
```

### `emit` - Send Events (Transmit)

Use `emit` to send events to the server:

```typescript
// Method 1: Using helper methods (recommended)
socketService.sendOrderAssignmentResponse({
  orderId: 12345,
  deliveryAgentId: 10,
  response: 'ACCEPT',
  message: 'I will deliver this order',
});

// Method 2: Using direct `emit` method
socketService.emit('order_assignment_response', {
  orderId: 12345,
  deliveryAgentId: 10,
  response: 'ACCEPT',
  message: 'I will deliver this order',
});
```

---

## Step-by-Step Integration

### Step 1: Import Required Dependencies

```typescript
import React, {useEffect, useState, useRef} from 'react';
import {useWS} from '@service/WSProvider';
import {USER_TYPES} from '@service/config';
import {useAuthStore} from '@state/authStore';
import {getOrderDetails, Order} from '@service/orderService';
import Geolocation from '@react-native-community/geolocation';
```

### Step 2: Initialize Socket Connection

Connect to the socket when the component mounts:

```typescript
const DeliveryAgentDashboard: FC = () => {
  const {user} = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  const socketService = useWS();

  // Connect socket on component mount
  useEffect(() => {
    const connectSocket = async () => {
      try {
        await socketService.connect(undefined, {
          userId: user?.idUser as number,
          userType: USER_TYPES.DELIVERY_PARTNER, // Important: Use DELIVERY_PARTNER
          storeId: user?.fkStoreId as number,
        });
        console.log('✅ Socket connected successfully');
      } catch (error) {
        console.error('❌ Failed to connect socket:', error);
      }
    };

    if (user?.idUser && user?.fkStoreId) {
      connectSocket();
    }

    // Monitor connection status
    const unsubscribe = socketService.onConnectionChange(connected => {
      setIsConnected(connected);
      console.log(
        'Connection status:',
        connected ? '🟢 Connected' : '🔴 Disconnected',
      );
    });

    return () => {
      unsubscribe();
    };
  }, [user?.idUser, user?.fkStoreId]);
```

### Step 3: Listen for Order Assignment Requests (`on`)

Listen for incoming order assignment requests from the server:

```typescript
useEffect(() => {
  // Method 1: Using helper method (recommended)
  socketService.onOrderAssignmentRequest(data => {
    console.log('📦 Received order assignment request:', data);

    // Add to pending orders list
    setPendingOrders(prev => [...prev, data]);

    // Show notification to delivery agent
    // Display order details
    // Show accept/reject buttons
  });

  // Cleanup
  return () => {
    socketService.offOrderAssignmentRequest();
  };
}, []);
```

**Alternative: Using direct `on` method:**

```typescript
useEffect(() => {
  // Method 2: Using direct `on` method
  const handler = (data: any) => {
    console.log('📦 Received order assignment request:', data);
    setPendingOrders(prev => [...prev, data]);
  };

  socketService.on('order_assignment_request', handler);

  // Cleanup
  return () => {
    socketService.off('order_assignment_request', handler);
  };
}, []);
```

### Step 4: Send Order Assignment Response (`emit`)

Send accept or reject response when delivery agent responds:

```typescript
// Accept order
const acceptOrder = (orderId: number) => {
  // Method 1: Using helper method (recommended)
  const success = socketService.sendOrderAssignmentResponse({
    orderId: orderId,
    deliveryAgentId: user?.idUser as number,
    response: 'ACCEPT',
    message: 'I will deliver this order',
  });

  if (success) {
    console.log('✅ Order acceptance sent');
    // Remove from pending orders
    setPendingOrders(prev => prev.filter(o => o.orderId !== orderId));
  } else {
    console.error('❌ Failed to send order acceptance');
  }
};

// Reject order
const rejectOrder = (orderId: number) => {
  // Method 1: Using helper method (recommended)
  const success = socketService.sendOrderAssignmentResponse({
    orderId: orderId,
    deliveryAgentId: user?.idUser as number,
    response: 'REJECT',
    message: 'Currently unavailable',
  });

  if (success) {
    console.log('✅ Order rejection sent');
    // Remove from pending orders
    setPendingOrders(prev => prev.filter(o => o.orderId !== orderId));
  } else {
    console.error('❌ Failed to send order rejection');
  }
};
```

**Alternative: Using direct `emit` method:**

```typescript
// Accept order using direct emit
const acceptOrder = (orderId: number) => {
  // Method 2: Using direct `emit` method
  if (!socketService.getConnectionStatus()) {
    console.error('❌ Socket not connected');
    return;
  }

  socketService.emit('order_assignment_response', {
    orderId: orderId,
    deliveryAgentId: user?.idUser as number,
    response: 'ACCEPT',
    message: 'I will deliver this order',
  });

  // Remove from pending orders
  setPendingOrders(prev => prev.filter(o => o.orderId !== orderId));
};
```

### Step 5: Listen for Order Assignment Response Confirmation (`on`)

Listen for server confirmation after sending accept/reject:

```typescript
useEffect(() => {
  // Listen for order assignment response confirmation
  socketService.onOrderAssignmentResponse(data => {
    console.log('📥 Order assignment response:', data);

    if (data.type === 'ASSIGNED') {
      // Order assigned successfully
      console.log('✅ Order assigned successfully');
      setCurrentOrder(data.orderInfo);
      // Fetch full order details
      fetchOrderDetails(data.orderId);
    } else if (data.type === 'DECLINED') {
      // Order was declined
      console.log('❌ Order was declined');
    } else if (data.type === 'ALREADY_ASSIGNED') {
      // Order already assigned to another agent
      console.log('⚠️ Order already assigned to another agent');
    }
  });
}, []);
```

**Alternative: Using direct `on` method:**

```typescript
useEffect(() => {
  const handler = (data: any) => {
    console.log('📥 Order assignment response:', data);
    if (data.type === 'ASSIGNED') {
      setCurrentOrder(data.orderInfo);
      fetchOrderDetails(data.orderId);
    }
  };

  socketService.on('order_assignment_response', handler);

  return () => {
    socketService.off('order_assignment_response', handler);
  };
}, []);
```

### Step 6: Listen for Order Status Updates (`on`)

Listen for order status changes:

```typescript
useEffect(() => {
  // Listen for order status updates
  socketService.onOrderStatusUpdate(data => {
    console.log('📊 Order status updated:', data);

    // Refresh order details when status changes
    if (data.orderId && currentOrder?.idOrder === data.orderId) {
      fetchOrderDetails(data.orderId);
    }
  });
}, [currentOrder?.idOrder]);
```

**Alternative: Using direct `on` method:**

```typescript
useEffect(() => {
  const handler = (data: any) => {
    console.log('📊 Order status updated:', data);
    if (data.orderId && currentOrder?.idOrder === data.orderId) {
      fetchOrderDetails(data.orderId);
    }
  };

  socketService.on('order_status_update', handler);

  return () => {
    socketService.off('order_status_update', handler);
  };
}, [currentOrder?.idOrder]);
```

### Step 7: Send Location Updates (`emit`)

Send real-time location updates to the server (for customer tracking):

```typescript
const locationWatchId = useRef<number | null>(null);

// Start sending location updates
const startLocationTracking = (orderId: number) => {
  if (!isConnected) {
    console.error('❌ Socket not connected');
    return;
  }

  // Request location permission first
  Geolocation.requestAuthorization();

  locationWatchId.current = Geolocation.watchPosition(
    position => {
      const {latitude, longitude, accuracy, speed} = position.coords;

      // Send location update using emit
      socketService.emit('location_update', {
        orderId: orderId,
        deliveryAgentId: user?.idUser as number,
        latitude: latitude,
        longitude: longitude,
        timestamp: Date.now(),
        orderStatus: currentOrder?.status || 'IN_TRANSIT',
        accuracy: accuracy || 0,
        speed: speed || 0,
      });

      console.log('📍 Location update sent:', {latitude, longitude});
    },
    error => {
      console.error('❌ Location error:', error);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10, // Send update every 10 meters
      interval: 5000, // Send update every 5 seconds
    },
  );
};

// Stop sending location updates
const stopLocationTracking = () => {
  if (locationWatchId.current !== null) {
    Geolocation.clearWatch(locationWatchId.current);
    locationWatchId.current = null;
    console.log('🛑 Location tracking stopped');
  }
};

// Start tracking when order is assigned
useEffect(() => {
  if (currentOrder?.idOrder && isConnected) {
    startLocationTracking(currentOrder.idOrder);
  }

  return () => {
    stopLocationTracking();
  };
}, [currentOrder?.idOrder, isConnected]);
```

---

## Complete Implementation Example

Here's a complete example of a Delivery Agent Dashboard component:

```typescript
import React, {FC, useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useWS} from '@service/WSProvider';
import {USER_TYPES} from '@service/config';
import {useAuthStore} from '@state/authStore';
import {getOrderDetails, Order} from '@service/orderService';
import Geolocation from '@react-native-community/geolocation';
import CustomText from '@components/ui/CustomText';

const DeliveryAgentDashboard: FC = () => {
  const {user} = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const locationWatchId = useRef<number | null>(null);

  const socketService = useWS();

  // ==================== SOCKET CONNECTION ====================
  useEffect(() => {
    const connectSocket = async () => {
      try {
        await socketService.connect(undefined, {
          userId: user?.idUser as number,
          userType: USER_TYPES.DELIVERY_PARTNER, // Important!
          storeId: user?.fkStoreId as number,
        });
        console.log('✅ Socket connected successfully');
      } catch (error) {
        console.error('❌ Failed to connect socket:', error);
        Alert.alert('Connection Error', 'Failed to connect to server');
      }
    };

    if (user?.idUser && user?.fkStoreId) {
      connectSocket();
    }

    // Monitor connection status
    const unsubscribe = socketService.onConnectionChange(connected => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.idUser, user?.fkStoreId]);

  // ==================== LISTEN FOR ORDER ASSIGNMENT REQUESTS ====================
  useEffect(() => {
    socketService.onOrderAssignmentRequest(data => {
      console.log('📦 Received order assignment request:', data);

      // Add to pending orders
      setPendingOrders(prev => [...prev, data]);

      // Show notification
      Alert.alert(
        'New Order Assignment',
        `Order ${data.orderNumber} is available. Do you want to accept?`,
        [
          {
            text: 'Reject',
            onPress: () => rejectOrder(data.orderId),
            style: 'cancel',
          },
          {
            text: 'Accept',
            onPress: () => acceptOrder(data.orderId),
          },
        ],
      );
    });

    return () => {
      socketService.offOrderAssignmentRequest();
    };
  }, []);

  // ==================== LISTEN FOR ORDER ASSIGNMENT RESPONSE ====================
  useEffect(() => {
    socketService.onOrderAssignmentResponse(data => {
      console.log('📥 Order assignment response:', data);

      if (data.type === 'ASSIGNED') {
        Alert.alert('✅ Success', 'Order assigned successfully');
        fetchOrderDetails(data.orderId);
      } else if (data.type === 'DECLINED') {
        Alert.alert('❌ Declined', 'Order was declined');
      } else if (data.type === 'ALREADY_ASSIGNED') {
        Alert.alert(
          '⚠️ Already Assigned',
          'Order was already assigned to another agent',
        );
      }
    });
  }, []);

  // ==================== LISTEN FOR ORDER STATUS UPDATES ====================
  useEffect(() => {
    socketService.onOrderStatusUpdate(data => {
      console.log('📊 Order status updated:', data);

      if (data.orderId && currentOrder?.idOrder === data.orderId) {
        fetchOrderDetails(data.orderId);
      }
    });
  }, [currentOrder?.idOrder]);

  // ==================== FETCH ORDER DETAILS ====================
  const fetchOrderDetails = async (orderId: number) => {
    const res = await getOrderDetails(orderId, user?.idUser as number);
    if (res && res.success) {
      setCurrentOrder(res.data as any);
    }
  };

  // ==================== ACCEPT ORDER ====================
  const acceptOrder = (orderId: number) => {
    const success = socketService.sendOrderAssignmentResponse({
      orderId: orderId,
      deliveryAgentId: user?.idUser as number,
      response: 'ACCEPT',
      message: 'I will deliver this order',
    });

    if (success) {
      setPendingOrders(prev => prev.filter(o => o.orderId !== orderId));
    } else {
      Alert.alert('Error', 'Failed to send order acceptance');
    }
  };

  // ==================== REJECT ORDER ====================
  const rejectOrder = (orderId: number) => {
    const success = socketService.sendOrderAssignmentResponse({
      orderId: orderId,
      deliveryAgentId: user?.idUser as number,
      response: 'REJECT',
      message: 'Currently unavailable',
    });

    if (success) {
      setPendingOrders(prev => prev.filter(o => o.orderId !== orderId));
    } else {
      Alert.alert('Error', 'Failed to send order rejection');
    }
  };

  // ==================== SEND LOCATION UPDATES ====================
  const startLocationTracking = (orderId: number) => {
    if (!isConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    Geolocation.requestAuthorization();

    locationWatchId.current = Geolocation.watchPosition(
      position => {
        const {latitude, longitude, accuracy, speed} = position.coords;

        // Send location update using emit
        socketService.emit('location_update', {
          orderId: orderId,
          deliveryAgentId: user?.idUser as number,
          latitude: latitude,
          longitude: longitude,
          timestamp: Date.now(),
          orderStatus: currentOrder?.status || 'IN_TRANSIT',
          accuracy: accuracy || 0,
          speed: speed || 0,
        });
      },
      error => {
        console.error('❌ Location error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
      },
    );
  };

  const stopLocationTracking = () => {
    if (locationWatchId.current !== null) {
      Geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
  };

  // Start tracking when order is assigned
  useEffect(() => {
    if (currentOrder?.idOrder && isConnected) {
      startLocationTracking(currentOrder.idOrder);
    }

    return () => {
      stopLocationTracking();
    };
  }, [currentOrder?.idOrder, isConnected]);

  return (
    <View style={styles.container}>
      <CustomText>Connection: {isConnected ? '🟢' : '🔴'}</CustomText>

      {/* Pending Orders */}
      <View>
        <CustomText>Pending Orders: {pendingOrders.length}</CustomText>
        {pendingOrders.map(order => (
          <View key={order.orderId}>
            <CustomText>Order: {order.orderNumber}</CustomText>
            <TouchableOpacity onPress={() => acceptOrder(order.orderId)}>
              <CustomText>Accept</CustomText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => rejectOrder(order.orderId)}>
              <CustomText>Reject</CustomText>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Current Order */}
      {currentOrder && (
        <View>
          <CustomText>Current Order: {currentOrder.txOrderNumber}</CustomText>
          <CustomText>Status: {currentOrder.status}</CustomText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default DeliveryAgentDashboard;
```

---

## Socket Events for Delivery Agents

### 1. `order_assignment_request` (Receive - Use `on`)

**When**: Emitted when a new order is placed and needs assignment

**Data Structure**:

```json
{
  "type": "REQUEST",
  "orderId": 12345,
  "orderNumber": "ORD-20241201120000-1234",
  "storeId": 1,
  "assignedDeliveryAgentId": null,
  "agents": [
    {
      "idUser": 10,
      "nmFirst": "John",
      "nmLast": "Doe",
      "nbPhone": "+1234567890"
    }
  ],
  "orderInfo": {
    "orderId": 12345,
    "orderNumber": "ORD-20241201120000-1234",
    "status": "COMPLETED",
    "totalAmount": 150.5,
    "formattedAddress": "123 Main St, City, State 12345",
    "latitude": 40.7128,
    "longitude": -74.006,
    "storeId": 1
  }
}
```

**Usage with `on`**:

```typescript
// Method 1: Helper method (recommended)
socketService.onOrderAssignmentRequest(data => {
  console.log('New order:', data.orderNumber);
});

// Method 2: Direct on method
socketService.on('order_assignment_request', data => {
  console.log('New order:', data.orderNumber);
});
```

### 2. `order_assignment_response` (Send - Use `emit`)

**When**: Send when delivery agent accepts or rejects an order

**Data Structure** (Send):

```json
{
  "orderId": 12345,
  "deliveryAgentId": 10,
  "response": "ACCEPT" | "REJECT",
  "message": "I will deliver this order"
}
```

**Usage with `emit`**:

```typescript
// Method 1: Helper method (recommended)
socketService.sendOrderAssignmentResponse({
  orderId: 12345,
  deliveryAgentId: 10,
  response: 'ACCEPT',
  message: 'I will deliver this order',
});

// Method 2: Direct emit method
socketService.emit('order_assignment_response', {
  orderId: 12345,
  deliveryAgentId: 10,
  response: 'ACCEPT',
  message: 'I will deliver this order',
});
```

**Server Response** (Receive):

```json
{
  "type": "ASSIGNED" | "DECLINED" | "ALREADY_ASSIGNED",
  "orderId": 12345,
  "orderNumber": "ORD-20241201120000-1234",
  "storeId": 1,
  "assignedDeliveryAgentId": 10,
  "agents": null,
  "orderInfo": null
}
```

**Listen for Response** (Use `on`):

```typescript
socketService.onOrderAssignmentResponse(data => {
  if (data.type === 'ASSIGNED') {
    console.log('Order assigned successfully');
  }
});
```

### 3. `location_update` (Send - Use `emit`)

**When**: Send periodic location updates while delivering an order

**Data Structure** (Send):

```json
{
  "orderId": 12345,
  "deliveryAgentId": 10,
  "latitude": 40.7128,
  "longitude": -74.006,
  "timestamp": 1701432000000,
  "orderStatus": "IN_TRANSIT",
  "accuracy": 10.5,
  "speed": 25.0
}
```

**Usage with `emit`**:

```typescript
socketService.emit('location_update', {
  orderId: 12345,
  deliveryAgentId: 10,
  latitude: latitude,
  longitude: longitude,
  timestamp: Date.now(),
  orderStatus: 'IN_TRANSIT',
  accuracy: accuracy || 0,
  speed: speed || 0,
});
```

### 4. `order_status_update` (Receive - Use `on`)

**When**: Emitted when order status changes

**Data Structure**:

```json
{
  "type": "STATUS_UPDATE",
  "orderId": 12345,
  "orderNumber": null,
  "storeId": 1,
  "assignedDeliveryAgentId": null,
  "agents": null,
  "orderInfo": null
}
```

**Usage with `on`**:

```typescript
// Method 1: Helper method (recommended)
socketService.onOrderStatusUpdate(data => {
  console.log('Order status updated:', data);
});

// Method 2: Direct on method
socketService.on('order_status_update', data => {
  console.log('Order status updated:', data);
});
```

---

## Helper Methods vs Direct `on`/`emit`

### When to Use Helper Methods

**Use helper methods** (`onOrderAssignmentRequest`, `sendOrderAssignmentResponse`, etc.) when:

- You want automatic cleanup handling
- You want type safety
- You want consistent error handling
- The event is commonly used

**Example**:

```typescript
// Helper method - automatic cleanup
socketService.onOrderAssignmentRequest(data => {
  // Handle event
});
```

### When to Use Direct `on`/`emit`

**Use direct `on`/`emit`** when:

- You need custom event names
- You want more control over listener management
- You're implementing new features not yet in helper methods

**Example**:

```typescript
// Direct on - manual cleanup required
const handler = (data: any) => {
  // Handle event
};

socketService.on('location_update', handler);

// Don't forget to cleanup!
return () => {
  socketService.off('location_update', handler);
};
```

---

## Best Practices

### 1. Always Check Connection Status

Before emitting events, check if socket is connected:

```typescript
if (socketService.getConnectionStatus()) {
  socketService.emit('location_update', data);
} else {
  console.error('Socket not connected');
  // Retry connection or show error to user
}
```

### 2. Clean Up Listeners

Always clean up listeners in `useEffect` return:

```typescript
useEffect(() => {
  const handler = (data: any) => {
    // Handle event
  };

  socketService.on('custom_event', handler);

  return () => {
    socketService.off('custom_event', handler);
  };
}, []);
```

### 3. Handle Errors

Always handle errors when emitting:

```typescript
const sendLocationUpdate = (data: any) => {
  if (!socketService.getConnectionStatus()) {
    console.error('Socket not connected');
    return false;
  }

  try {
    socketService.emit('location_update', data);
    return true;
  } catch (error) {
    console.error('Failed to send location update:', error);
    return false;
  }
};
```

### 4. Debounce Location Updates

To avoid excessive server load, debounce location updates:

```typescript
import {debounce} from 'lodash';

const sendLocationUpdate = debounce((data: any) => {
  socketService.emit('location_update', data);
}, 5000); // Send at most once every 5 seconds
```

### 5. Validate Data Before Emitting

Always validate data before sending:

```typescript
const acceptOrder = (orderId: number) => {
  if (!orderId || !user?.idUser) {
    console.error('Invalid order ID or user ID');
    return;
  }

  socketService.sendOrderAssignmentResponse({
    orderId: orderId,
    deliveryAgentId: user.idUser,
    response: 'ACCEPT',
    message: 'I will deliver this order',
  });
};
```

---

## Error Handling

### Connection Errors

```typescript
useEffect(() => {
  const connectSocket = async () => {
    try {
      await socketService.connect(undefined, {
        userId: user?.idUser as number,
        userType: USER_TYPES.DELIVERY_PARTNER,
        storeId: user?.fkStoreId as number,
      });
    } catch (error) {
      console.error('Connection failed:', error);
      // Show error to user
      Alert.alert('Connection Error', 'Failed to connect to server');
    }
  };

  connectSocket();
}, []);
```

### Event Emission Errors

```typescript
const acceptOrder = (orderId: number) => {
  if (!socketService.getConnectionStatus()) {
    Alert.alert('Error', 'Not connected to server');
    return;
  }

  const success = socketService.sendOrderAssignmentResponse({
    orderId: orderId,
    deliveryAgentId: user?.idUser as number,
    response: 'ACCEPT',
    message: 'I will deliver this order',
  });

  if (!success) {
    Alert.alert('Error', 'Failed to send response');
  }
};
```

---

## Troubleshooting

### Socket Not Connecting

1. **Check User Type**: Ensure `USER_TYPES.DELIVERY_PARTNER` is used
2. **Check User Info**: Verify `user?.idUser` and `user?.fkStoreId` are available
3. **Check Token**: Verify access token is valid
4. **Check Network**: Ensure device has internet connection

### Events Not Received

1. **Verify Connection**: Check `isConnected` state
2. **Check User Type**: Ensure connected as `DELIVERY_PARTNER`
3. **Check Store ID**: Ensure correct store ID is used
4. **Check Event Names**: Verify event names match server

### Events Not Sent

1. **Check Connection**: Verify socket is connected before emitting
2. **Check Data**: Validate data structure before sending
3. **Check Permissions**: For location updates, ensure location permissions are granted

---

## Testing

### Test Order Assignment Request

1. Place an order via REST API
2. Verify delivery agent receives `order_assignment_request` event
3. Check pending orders list is updated

### Test Order Acceptance

1. Receive order assignment request
2. Click accept button
3. Verify `order_assignment_response` is sent
4. Verify server responds with `ASSIGNED` type
5. Check current order is updated

### Test Location Updates

1. Accept an order
2. Start location tracking
3. Verify `location_update` events are sent periodically
4. Check location data is correct

---

## Summary

To integrate sockets for delivery agents:

1. ✅ Connect with `USER_TYPES.DELIVERY_PARTNER`
2. ✅ Use `on` to listen for `order_assignment_request`
3. ✅ Use `emit` to send `order_assignment_response` (ACCEPT/REJECT)
4. ✅ Use `on` to listen for `order_assignment_response` confirmation
5. ✅ Use `on` to listen for `order_status_update`
6. ✅ Use `emit` to send `location_update` events
7. ✅ Always check connection status before emitting
8. ✅ Always clean up listeners

This integration enables real-time order assignment, tracking, and communication for delivery agents.
