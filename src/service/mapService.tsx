import axios from 'axios';
import {GOOGLE_GEOCODING_API, GOOGLE_MAP_API} from './config';
import {updateUserLocation} from './authService';

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  setUser: any,
  _currentUser?: any,
) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_GEOCODING_API}`;
    const response = await axios.get(url);

    if (response.data.status === 'OK' && response.data.results?.length) {
      const address = pickBestAddress(response.data.results);

      updateUserLocation(
        {liveLocation: {latitude, longitude}, address},
        setUser,
      );
    } else if (response.data.status === 'ZERO_RESULTS') {
      console.warn(
        'Reverse geocode ZERO_RESULTS for lat/lng',
        latitude,
        longitude,
      );
    } else {
      console.error('Reverse geocode failed', {
        status: response.data.status,
        url,
      });
    }
  } catch (error) {
    console.error('Reverse geocode error', error);
  }
};

// Returns the formatted address string for given coordinates without mutating state
export const getAddressFromCoords = async (
  latitude: number,
  longitude: number,
): Promise<string | null> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_GEOCODING_API}`;
    const response = await axios.get(url);

    if (response.data.status === 'OK' && response.data.results?.length) {
      return pickBestAddress(response.data.results);
    }
    if (response.data.status === 'ZERO_RESULTS') {
      return null;
    }
    console.error('Reverse geocode failed', {
      status: response.data.status,
      url,
    });
    return null;
  } catch (error) {
    return null;
  }
};

// Returns the postal code for given coordinates
export const getPostalCodeFromCoords = async (
  latitude: number,
  longitude: number,
): Promise<string | null> => {
  try {
    console.log('Getting postal code for coordinates:', latitude, longitude);

    // Check if coordinates are valid
    if (isNaN(latitude) || isNaN(longitude)) {
      console.error('Invalid coordinates:', {latitude, longitude});
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_GEOCODING_API}`;
    const response = await axios.get(url);

    if (response.data.status === 'OK' && response.data.results?.length) {
      const result = response.data.results[0];

      const postalCodeComponent = result.address_components?.find(
        (component: any) => component.types.includes('postal_code'),
      );

      if (postalCodeComponent) {
        return postalCodeComponent.long_name;
      } else {
        return null;
      }
    }
    if (response.data.status === 'ZERO_RESULTS') {
      return null;
    }

    return null;
  } catch (error) {
    return null;
  }
};

// Search for places using Google Places API
export const searchPlaces = async (
  query: string,
  location?: {latitude: number; longitude: number},
  radius: number = 50000,
): Promise<any[]> => {
  try {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query,
    )}&key=${GOOGLE_MAP_API}`;

    if (location) {
      url += `&location=${location.latitude},${location.longitude}&radius=${radius}`;
    }

    const response = await axios.get(url);

    if (response.data.status === 'OK') {
      return response.data.results.map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        geometry: place.geometry,
        types: place.types,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
      }));
    } else if (response.data.status === 'ZERO_RESULTS') {
      return [];
    } else {
      console.error('Places search failed', {
        status: response.data.status,
        url,
      });
      return [];
    }
  } catch (error) {
    console.error('Places search error', error);
    return [];
  }
};

// Get place details using Google Places API
export const getPlaceDetails = async (placeId: string): Promise<any | null> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry,name,place_id&key=${GOOGLE_MAP_API}`;
    const response = await axios.get(url);

    if (response.data.status === 'OK') {
      const result = response.data.result;
      return {
        place_id: result.place_id,
        name: result.name,
        formatted_address: result.formatted_address,
        geometry: result.geometry,
        location: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
      };
    } else {
      console.error('Place details failed', {
        status: response.data.status,
        placeId,
      });
      return null;
    }
  } catch (error) {
    console.error('Place details error', error);
    return null;
  }
};

// Choose the most relevant address line from Google results
function pickBestAddress(results: any[]): string {
  // Prefer street_address/premise/subpremise; else fallback to first
  const preferredTypes = new Set([
    'street_address',
    'premise',
    'subpremise',
    'route',
    'neighborhood',
  ]);
  const best =
    results.find((r: any) =>
      r.types?.some((t: string) => preferredTypes.has(t)),
    ) || results[0];
  return best.formatted_address as string;
}
