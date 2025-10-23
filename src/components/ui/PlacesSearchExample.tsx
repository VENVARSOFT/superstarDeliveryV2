import React, {FC, useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from './CustomText';
import PlacesAutocompleteResults, {
  PlacePrediction,
  PlacesAutocompleteResponse,
} from './PlacesAutocompleteResults';
import {Colors, Fonts} from '@utils/Constants';

interface PlacesSearchExampleProps {
  onPlaceSelect?: (place: PlacePrediction) => void;
  placeholder?: string;
  initialValue?: string;
}

const PlacesSearchExample: FC<PlacesSearchExampleProps> = ({
  onPlaceSelect,
  placeholder = 'Search for area, street name...',
  initialValue = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [searchResults, setSearchResults] =
    useState<PlacesAutocompleteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock API call - replace with actual Google Places API call
  const searchPlaces = async (
    query: string,
  ): Promise<PlacesAutocompleteResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock response based on your provided data
    if (query.toLowerCase().includes('jnet')) {
      return {
        predictions: [
          {
            description:
              'JNET Technologies Pvt Ltd, Hitech City Road, Phase 2, Kavuri Hills, Madhapur, Hyderabad, Telangana, India',
            matched_substrings: [{length: 4, offset: 0}],
            place_id: 'ChIJ2UJzLsWRyzsRdwohNja4xYA',
            reference: 'ChIJ2UJzLsWRyzsRdwohNja4xYA',
            structured_formatting: {
              main_text: 'JNET Technologies Pvt Ltd',
              main_text_matched_substrings: [{length: 4, offset: 0}],
              secondary_text:
                'Hitech City Road, Phase 2, Kavuri Hills, Madhapur, Hyderabad, Telangana, India',
            },
            terms: [
              {offset: 0, value: 'JNET Technologies Pvt Ltd'},
              {offset: 27, value: 'Hitech City Road'},
              {offset: 45, value: 'Phase 2'},
              {offset: 54, value: 'Kavuri Hills'},
              {offset: 68, value: 'Madhapur'},
              {offset: 78, value: 'Hyderabad'},
              {offset: 89, value: 'Telangana'},
              {offset: 100, value: 'India'},
            ],
            types: ['establishment', 'point_of_interest'],
          },
          {
            description:
              'JNET INTERNET SERVICES, Malad, Gokuldham Colony, Goregaon, Mumbai, Maharashtra, India',
            matched_substrings: [{length: 4, offset: 0}],
            place_id: 'ChIJ4XGFjDy35zsRF9lt5MmP6qI',
            reference: 'ChIJ4XGFjDy35zsRF9lt5MmP6qI',
            structured_formatting: {
              main_text: 'JNET INTERNET SERVICES',
              main_text_matched_substrings: [{length: 4, offset: 0}],
              secondary_text:
                'Malad, Gokuldham Colony, Goregaon, Mumbai, Maharashtra, India',
            },
            terms: [
              {offset: 0, value: 'JNET INTERNET SERVICES'},
              {offset: 24, value: 'Malad'},
              {offset: 31, value: 'Gokuldham Colony'},
              {offset: 49, value: 'Goregaon'},
              {offset: 59, value: 'Mumbai'},
              {offset: 67, value: 'Maharashtra'},
              {offset: 80, value: 'India'},
            ],
            types: ['establishment', 'point_of_interest'],
          },
        ],
        status: 'OK',
      };
    }

    return {predictions: [], status: 'ZERO_RESULTS'};
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setIsLoading(true);
      setShowResults(true);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchPlaces(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults({predictions: [], status: 'ERROR'});
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSearchResults(null);
      setShowResults(false);
      setIsLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handlePlaceSelect = (place: PlacePrediction) => {
    setSearchQuery(place.structured_formatting.main_text);
    setShowResults(false);
    onPlaceSelect?.(place);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow for touch events
    setTimeout(() => setShowResults(false), 200);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setShowResults(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={RFValue(18)} color="#999" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          placeholderTextColor="#8e8e93"
          returnKeyType="search"
          autoFocus={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Icon name="close-circle" size={RFValue(18)} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {showResults && (
        <PlacesAutocompleteResults
          data={searchResults}
          isLoading={isLoading}
          onPlaceSelect={handlePlaceSelect}
          onClose={() => setShowResults(false)}
          maxHeight={300}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RFValue(12),
    backgroundColor: '#fff',
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(10),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: RFValue(8),
    fontFamily: Fonts.Regular,
    color: Colors.text,
    padding: 0,
    fontSize: RFValue(14),
    ...Platform.select({
      ios: {
        paddingVertical: 0,
      },
      android: {
        paddingVertical: 0,
      },
    }),
  },
  clearButton: {
    marginLeft: RFValue(8),
    padding: RFValue(4),
  },
});

export default PlacesSearchExample;
