# Pickup Navigation Screen

A comprehensive delivery driver pickup navigation screen built with React Native, featuring real-time location tracking, Google Maps integration, and swipe-to-confirm functionality.

## Features

### 🗺️ Map Integration

- **Google Maps Integration**: Full-screen map with real-time driver location
- **Route Visualization**: Blue polyline showing turn-by-turn directions
- **Dynamic Updates**: Route recalculates as driver moves
- **Map Controls**: Zoom in/out and re-center buttons
- **Traffic Data**: Shows real-time traffic conditions

### 📍 Location Services

- **Real-time Tracking**: Updates every 5 seconds or 10 meters
- **High Accuracy**: Uses GPS for precise location data
- **Permission Handling**: Graceful permission request and error states
- **Background Updates**: Continues tracking when app is active

### 🎯 Pickup Details

- **Restaurant Information**: Name and full address display
- **Contact Actions**: Call restaurant or open external navigation
- **ETA & Distance**: Real-time arrival estimates
- **Visual Indicators**: Clear pickup location markers

### 👆 Interactive Elements

- **Swipe-to-Confirm**: Must swipe 70% to confirm arrival
- **Haptic Feedback**: Tactile responses for all interactions
- **Smooth Animations**: Fluid transitions and gestures
- **Bottom Sheet**: Collapsible pickup details card

### 🚨 Safety Features

- **Emergency Button**: Quick access to emergency services
- **Support Contact**: Direct line to support team
- **Error Handling**: Comprehensive error states and recovery

## Technical Implementation

### Dependencies Used

- `react-native-maps`: Google Maps integration
- `@gorhom/bottom-sheet`: Collapsible bottom sheet
- `react-native-gesture-handler`: Swipe gestures
- `react-native-reanimated`: Smooth animations
- `@react-native-community/geolocation`: Location services
- `react-native-haptic-feedback`: Tactile feedback

### Key Components

#### PickupNavigationScreen

Main screen component with:

- Header with navigation and action buttons
- Full-screen map with route visualization
- Bottom sheet with pickup details
- Swipe-to-confirm functionality

#### DirectionsService

Service for route calculation:

- Google Directions API integration
- Fallback route calculation
- Polyline decoding
- External navigation app integration

### State Management

- **Driver Location**: Real-time GPS coordinates
- **Route Points**: Calculated route waypoints
- **Loading States**: UI feedback during operations
- **Error Handling**: User-friendly error messages

## Usage

### Basic Implementation

```tsx
import PickupNavigationScreen from '@features/delivery/PickupNavigationScreen';

// In your navigation stack
<Stack.Screen
  name="PickupNavigation"
  component={PickupNavigationScreen}
  options={{headerShown: false}}
/>;
```

### Route Parameters

```tsx
navigation.navigate('PickupNavigation', {
  pickupLocation: {
    latitude: 17.4475,
    longitude: 78.385,
    name: 'Panchakattu Dosa',
    address: 'Plot 59, Guttala Begumpet, Madhapur, Hyderabad',
    phoneNumber: '+91-9876543210',
  },
  driverLocation: {
    latitude: 17.442,
    longitude: 78.391,
  },
  orderId: 'order_123',
});
```

### Google Maps API Setup

1. Get API key from Google Cloud Console
2. Enable Directions API and Maps SDK
3. Update `GOOGLE_MAPS_API_KEY` in `directionsService.tsx`
4. Add API key to your app configuration

## Customization

### Styling

- **Primary Color**: `#00A86B` (green)
- **Typography**: Uses app's font system
- **Spacing**: Consistent 16px margins
- **Shadows**: Subtle elevation effects

### Configuration

- **Swipe Threshold**: 70% of button width
- **Update Interval**: 5 seconds for location
- **Distance Filter**: 10 meters for route updates
- **Animation Duration**: 200-500ms for smooth transitions

### Error States

- **Location Permission**: Clear permission request
- **Network Errors**: Retry mechanisms
- **API Failures**: Fallback calculations
- **Loading States**: Activity indicators

## Performance Optimizations

### Location Tracking

- Efficient watch position with distance filtering
- Automatic cleanup on component unmount
- Optimized update intervals

### Map Rendering

- Conditional marker rendering
- Efficient polyline updates
- Smooth camera animations

### Memory Management

- Proper cleanup of location watchers
- Optimized re-renders with useCallback
- Efficient state updates

## Testing

### Manual Testing

1. **Location Permission**: Test permission flow
2. **Route Calculation**: Verify route accuracy
3. **Swipe Gesture**: Test 70% threshold
4. **External Apps**: Test call and navigation buttons
5. **Error States**: Test network and permission errors

### Edge Cases

- No internet connection
- Location services disabled
- Invalid coordinates
- API rate limiting
- Background/foreground transitions

## Troubleshooting

### Common Issues

#### Location Not Updating

- Check location permissions
- Verify GPS is enabled
- Check device location settings

#### Route Not Showing

- Verify Google Maps API key
- Check internet connection
- Ensure valid coordinates

#### Swipe Not Working

- Check gesture handler setup
- Verify threshold calculation
- Test on different devices

### Debug Mode

Enable console logging for:

- Location updates
- Route calculations
- API responses
- Error messages

## Future Enhancements

### Planned Features

- **Voice Navigation**: Turn-by-turn voice guidance
- **Offline Maps**: Cached map data
- **Multiple Routes**: Route options and alternatives
- **Live Tracking**: Real-time driver tracking for customers
- **ETA Updates**: Dynamic arrival time adjustments

### Performance Improvements

- **Route Caching**: Store calculated routes
- **Batch Updates**: Group location updates
- **Lazy Loading**: Load map data on demand
- **Memory Optimization**: Reduce memory footprint

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review console logs
3. Test on different devices
4. Verify API configurations

## License

This component is part of the Goli Soda Delivery app and follows the project's licensing terms.
