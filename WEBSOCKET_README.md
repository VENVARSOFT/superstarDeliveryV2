# WebSocket Implementation in Goli Soda Delivery App

This document explains how WebSocket functionality is implemented in the Goli Soda Delivery React Native application for real-time order tracking and live updates.

## Overview

The application uses **Socket.IO** (version 4.8.1) to establish real-time communication between the mobile app and the backend server. This enables live tracking of delivery orders, real-time status updates, and seamless communication between customers and delivery partners.

## Architecture

### WebSocket Server Configuration

The WebSocket server runs on different URLs based on the platform:

```typescript
// src/service/config.tsx
export const SOCKET_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000' // Android emulator
    : 'http://localhost:3000'; // iOS simulator
```

- **Android**: `http://10.0.2.2:3000` (Android emulator localhost mapping)
- **iOS**: `http://localhost:3000` (iOS simulator localhost)

### Dependencies

The WebSocket functionality relies on:

- `socket.io-client`: ^4.8.1 - Client-side Socket.IO implementation
- `@react-native-community/geolocation`: ^3.4.0 - Location tracking for delivery partners

## Core Components

### 1. withLiveStatus HOC (Higher-Order Component)

**File**: `src/features/map/withLiveStatus.tsx`

This HOC wraps components that need real-time order status updates. It handles:

- **WebSocket Connection**: Establishes connection when a current order exists
- **Room Joining**: Joins a specific room using the order ID
- **Event Listening**: Listens for real-time updates from the server
- **Data Fetching**: Automatically fetches updated order details when events are received

```typescript
// Key WebSocket implementation
useEffect(() => {
  if (currentOrder) {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    // Join order-specific room
    socketInstance.emit('joinRoom', currentOrder?._id);

    // Listen for live tracking updates
    socketInstance?.on('liveTrackingUpdates', _updatedOrder => {
      fetchOrderDetails();
    });

    // Listen for order confirmation
    socketInstance.on('orderConfirmed', _confirmOrder => {
      fetchOrderDetails();
    });

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }
}, [currentOrder, fetchOrderDetails]);
```

### 2. withLiveOrder HOC (Delivery Partner Side)

**File**: `src/features/delivery/withLiveOrder.tsx`

This HOC handles the delivery partner's side of real-time updates:

- **Location Tracking**: Continuously tracks delivery partner's location using GPS
- **Live Updates**: Sends location and status updates to the server
- **Order Management**: Manages active orders for delivery partners

```typescript
// Location tracking and live updates
useEffect(() => {
  if (currentOrder) {
    const watchId = Geolocation.watchPosition(
      async position => {
        const {latitude, longitude} = position.coords;
        setMyLocation({latitude, longitude});
      },
      error => {},
      {enableHighAccuracy: true, distanceFilter: 200}, // Update every 200m
    );

    return () => Geolocation.clearWatch(watchId);
  }
}, [currentOrder]);

// Send live updates when location changes
useEffect(() => {
  async function sendLiveUpdates() {
    if (
      currentOrder?.deliveryPartner?._id == user?._id &&
      currentOrder?.status != 'delivered' &&
      currentOrder?.status != 'cancelled'
    ) {
      sendLiveOrderUpdates(currentOrder?._id, myLocation, currentOrder?.status);
    }
  }
  sendLiveUpdates();
}, [myLocation]);
```

## WebSocket Events

### Client-to-Server Events

| Event      | Description              | Data      | Usage                                                |
| ---------- | ------------------------ | --------- | ---------------------------------------------------- |
| `joinRoom` | Join order-specific room | `orderId` | Customer joins to receive updates for specific order |

### Server-to-Client Events

| Event                 | Description             | Trigger                                 | Action                  |
| --------------------- | ----------------------- | --------------------------------------- | ----------------------- |
| `liveTrackingUpdates` | Real-time order updates | Delivery partner location/status change | Refreshes order details |
| `orderConfirmed`      | Order confirmation      | Order accepted by delivery partner      | Refreshes order details |

## API Integration

### Live Order Updates

**File**: `src/service/orderService.tsx`

The `sendLiveOrderUpdates` function sends location and status updates to the backend:

```typescript
export const sendLiveOrderUpdates = async (
  id: string,
  location: any,
  status: string,
) => {
  try {
    const response = await appAxios.patch(`/order/${id}/status`, {
      deliveryPersonLocation: location,
      status,
    });
    return response.data;
  } catch (error) {
    return null;
  }
};
```

### Order Confirmation

```typescript
export const confirmOrder = async (id: string, location: any) => {
  try {
    const response = await appAxios.post(`/order/${id}/confirm`, {
      deliveryPersonLocation: location,
    });
    return response.data;
  } catch (error) {
    return null;
  }
};
```

## State Management

The WebSocket implementation integrates with the application's state management:

- **Auth Store**: Manages current order and user information
- **Real-time Updates**: Automatically updates the current order when WebSocket events are received
- **Data Sanitization**: Prevents serialization issues by sanitizing order data

```typescript
// Data sanitization to prevent serialization issues
const sanitizedData = JSON.parse(JSON.stringify(data));
setCurrentOrder(sanitizedData);
```

## Usage Examples

### Customer Side (Live Tracking)

```typescript
// Components wrapped with withLiveStatus automatically receive updates
const LiveTracking = withLiveStatus(() => {
  const {currentOrder} = useAuthStore();

  return (
    <View>
      <LiveMap
        deliveryLocation={currentOrder?.deliveryLocation}
        pickupLocation={currentOrder?.pickupLocation}
        deliveryPersonLocation={currentOrder?.deliveryPersonLocation}
        hasAccepted={currentOrder?.status == 'confirmed'}
        hasPickedUp={currentOrder?.status == 'arriving'}
      />
    </View>
  );
});
```

### Delivery Partner Side (Live Order Management)

```typescript
// Components wrapped with withLiveOrder automatically send location updates
const DeliveryDashboard = withLiveOrder(() => {
  const {currentOrder} = useAuthStore();

  return <View>{/* Delivery partner interface */}</View>;
});
```

## Order Status Flow

The WebSocket system supports the following order statuses:

1. **Order Created**: Customer places order
2. **Order Confirmed**: Delivery partner accepts order (`orderConfirmed` event)
3. **Order Picked Up**: Delivery partner picks up order (`liveTrackingUpdates` event)
4. **Order Arriving**: Order is on the way (`liveTrackingUpdates` event)
5. **Order Delivered**: Order completed (`liveTrackingUpdates` event)

## Configuration

### Development Setup

1. **Backend Server**: Ensure WebSocket server is running on port 3000
2. **Platform Configuration**: Update `SOCKET_URL` in `config.tsx` for your environment
3. **Network Access**: For physical devices, use your computer's IP address instead of localhost

### Production Considerations

- Update `SOCKET_URL` to point to production WebSocket server
- Implement proper error handling and reconnection logic
- Consider implementing connection status indicators
- Add authentication for WebSocket connections

## Error Handling

The current implementation includes basic error handling:

- **Connection Errors**: WebSocket disconnects are handled in cleanup functions
- **API Errors**: Failed API calls return null and are logged
- **Location Errors**: GPS errors are caught but not displayed to users

## Performance Considerations

- **Location Updates**: Limited to every 200 meters to reduce battery drain
- **Data Sanitization**: Prevents memory leaks from circular references
- **Connection Cleanup**: Properly disconnects WebSocket when components unmount
- **Selective Updates**: Only sends updates for active orders

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check if WebSocket server is running and accessible
2. **No Updates Received**: Verify order ID and room joining
3. **Location Not Updating**: Check GPS permissions and device location services
4. **Memory Leaks**: Ensure proper cleanup in useEffect return functions

### Debug Tips

- Monitor WebSocket connection status in browser dev tools
- Check console logs for API errors
- Verify order IDs match between client and server
- Test with different network conditions

## Future Enhancements

Potential improvements to consider:

1. **Reconnection Logic**: Automatic reconnection on connection loss
2. **Connection Status**: Visual indicators for connection state
3. **Message Queuing**: Queue messages when offline
4. **Authentication**: Secure WebSocket connections
5. **Compression**: Reduce data transfer for location updates
6. **Battery Optimization**: Smarter location update intervals

---

This WebSocket implementation provides a robust foundation for real-time order tracking in the Goli Soda Delivery application, enabling seamless communication between customers and delivery partners.
