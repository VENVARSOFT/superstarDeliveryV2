import {Linking, Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {GOOGLE_MAP_API} from './config';

// Types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface RoutePoint extends Location {}

export interface RouteInfo {
  points: RoutePoint[];
  distance: string;
  duration: string;
  eta: string;
}

export interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: {text: string; value: number};
      duration: {text: string; value: number};
      steps: Array<{
        start_location: Location;
        end_location: Location;
        polyline: {points: string};
      }>;
    }>;
  }>;
}

// Google Directions API configuration
const GOOGLE_MAPS_API_KEY = GOOGLE_MAP_API || 'YOUR_GOOGLE_MAPS_API_KEY';
const DIRECTIONS_API_URL =
  'https://maps.googleapis.com/maps/api/directions/json';

/**
 * Calculate route between two points using Google Directions API
 */
export const calculateRoute = async (
  origin: Location,
  destination: Location,
): Promise<RouteInfo> => {
  try {
    // Check if API key is configured
    if (GOOGLE_MAPS_API_KEY) {
      console.warn(
        'Google Maps API key not configured, using fallback route calculation',
      );
      return calculateSimpleRoute(origin, destination);
    }

    const url = `${DIRECTIONS_API_URL}?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&traffic_model=best_guess&departure_time=now`;

    const response = await fetch(url);
    const data: DirectionsResponse = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];

      // Decode polyline points
      const points = decodePolyline(leg.steps[0]?.polyline?.points || '');

      return {
        points,
        distance: leg.distance.text,
        duration: leg.duration.text,
        eta: calculateETA(leg.duration.value),
      };
    }

    // If no routes found, use fallback
    console.warn('No routes found from Google Directions API, using fallback');
    return calculateSimpleRoute(origin, destination);
  } catch (error) {
    console.error('Directions API error:', error);
    // Fallback to simple route calculation
    return calculateSimpleRoute(origin, destination);
  }
};

/**
 * Decode Google polyline string to coordinates
 */
const decodePolyline = (encoded: string): RoutePoint[] => {
  const points: RoutePoint[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};

/**
 * Calculate ETA from duration in seconds
 */
const calculateETA = (durationSeconds: number): string => {
  const now = new Date();
  const eta = new Date(now.getTime() + durationSeconds * 1000);
  return eta.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Fallback simple route calculation
 */
const calculateSimpleRoute = (
  origin: Location,
  destination: Location,
): RouteInfo => {
  const distance = calculateDistance(origin, destination);
  const duration = Math.round(distance * 2); // Rough estimate: 2 minutes per km

  // Create simple waypoints
  const points: RoutePoint[] = [
    origin,
    {
      latitude:
        origin.latitude + (destination.latitude - origin.latitude) * 0.3,
      longitude:
        origin.longitude + (destination.longitude - origin.longitude) * 0.3,
    },
    {
      latitude:
        origin.latitude + (destination.latitude - origin.latitude) * 0.7,
      longitude:
        origin.longitude + (destination.longitude - origin.longitude) * 0.7,
    },
    destination,
  ];

  return {
    points,
    distance: `${distance.toFixed(1)} km`,
    duration: `${duration} min`,
    eta: calculateETA(duration * 60),
  };
};

/**
 * Calculate distance between two points in kilometers
 */
const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Open external navigation app
 */
export const openExternalNavigation = (
  destination: Location,
  platform: 'ios' | 'android' = Platform.OS as 'ios' | 'android',
): void => {
  const {latitude, longitude} = destination;

  const urls = {
    ios: `maps://app?daddr=${latitude},${longitude}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  };

  const url = urls[platform];
  if (url) {
    Linking.openURL(url).catch(error => {
      console.error('Failed to open navigation app:', error);
      // Fallback to Google Maps web
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(webUrl);
    });
  }
};

/**
 * Get current location with high accuracy
 */
export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
      },
    );
  });
};

/**
 * Watch location changes
 */
export const watchLocation = (
  onLocationChange: (location: Location) => void,
  onError?: (error: any) => void,
): number => {
  return Geolocation.watchPosition(
    position => {
      onLocationChange({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    error => {
      onError?.(error);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10, // Update every 10 meters
      interval: 5000, // Update every 5 seconds
    },
  );
};

/**
 * Clear location watch
 */
export const clearLocationWatch = (watchId: number): void => {
  Geolocation.clearWatch(watchId);
};
