import {
  PlacePrediction,
  PlacesAutocompleteResponse,
} from '@components/ui/PlacesAutocompleteResults';
import {GOOGLE_MAP_API} from './config';

/**
 * Search for places using Google Places Autocomplete API
 * @param query - The search query string
 * @param sessionToken - Optional session token for billing optimization
 * @returns Promise<PlacesAutocompleteResponse>
 */
export const searchPlaces = async (
  query: string,
  sessionToken?: string,
): Promise<PlacesAutocompleteResponse> => {
  try {
    const baseUrl =
      'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_MAP_API,
      language: 'en',
      components: 'country:in', // Restrict to India
      types: 'establishment|geocode', // Include both places and addresses
    });

    if (sessionToken) {
      params.append('sessiontoken', sessionToken);
    }

    const response = await fetch(`${baseUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as PlacesAutocompleteResponse;
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
};

/**
 * Get place details using Google Places Details API
 * @param placeId - The place ID from autocomplete results
 * @param sessionToken - Optional session token for billing optimization
 * @returns Promise<any> - Place details object
 */
export const getPlaceDetails = async (
  placeId: string,
  sessionToken?: string,
): Promise<any> => {
  try {
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAP_API,
      fields: 'formatted_address,geometry,name,place_id,types',
    });

    if (sessionToken) {
      params.append('sessiontoken', sessionToken);
    }

    const response = await fetch(`${baseUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
};

/**
 * Generate a session token for billing optimization
 * @returns string - A random session token
 */
export const generateSessionToken = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * Debounced search function with session token management
 */
export class PlacesSearchManager {
  private sessionToken: string;
  private searchTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionToken = generateSessionToken();
  }

  /**
   * Search places with debouncing
   * @param query - Search query
   * @param onResults - Callback for results
   * @param onError - Callback for errors
   * @param delay - Debounce delay in ms (default: 300)
   */
  search = (
    query: string,
    onResults: (results: PlacesAutocompleteResponse) => void,
    onError: (error: Error) => void,
    delay: number = 300,
  ) => {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (query.trim().length < 2) {
      onResults({predictions: [], status: 'ZERO_RESULTS'});
      return;
    }

    this.searchTimeout = setTimeout(async () => {
      try {
        const results = await searchPlaces(query, this.sessionToken);
        onResults(results);
      } catch (error) {
        onError(error as Error);
      }
    }, delay);
  };

  /**
   * Get place details
   * @param placeId - Place ID
   * @returns Promise with place details
   */
  getPlaceDetails = async (placeId: string) => {
    return getPlaceDetails(placeId, this.sessionToken);
  };

  /**
   * Generate new session token (call when starting a new search session)
   */
  newSession = () => {
    this.sessionToken = generateSessionToken();
  };

  /**
   * Cleanup timers
   */
  cleanup = () => {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
  };
}
