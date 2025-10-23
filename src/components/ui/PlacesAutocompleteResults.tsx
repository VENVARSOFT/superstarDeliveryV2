import React, {FC} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from './CustomText';
import {Colors, Fonts} from '@utils/Constants';

// TypeScript interfaces for Google Places API response
export interface PlacePrediction {
  description: string;
  place_id: string;
  reference: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings: Array<{
      length: number;
      offset: number;
    }>;
  };
  terms: Array<{
    offset: number;
    value: string;
  }>;
  types: string[];
  matched_substrings: Array<{
    length: number;
    offset: number;
  }>;
}

export interface PlacesAutocompleteResponse {
  predictions: PlacePrediction[];
  status: string;
}

interface PlacesAutocompleteResultsProps {
  data: PlacesAutocompleteResponse | null;
  isLoading?: boolean;
  onPlaceSelect: (place: PlacePrediction) => void;
  onClose?: () => void;
  maxHeight?: number;
}

interface PlaceItemProps {
  place: PlacePrediction;
  onPress: () => void;
  index: number;
}

const PlaceItem: FC<PlaceItemProps> = ({place, onPress, index}) => {
  const {structured_formatting} = place;
  const {main_text, secondary_text} = structured_formatting;

  return (
    <TouchableOpacity
      style={[styles.placeItem, index === 0 && styles.firstItem]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.placeIcon}>
        <Icon name="map-marker" color={Colors.primary} size={RFValue(16)} />
      </View>
      <View style={styles.placeContent}>
        <CustomText
          fontFamily={Fonts.Medium}
          variant="h6"
          style={styles.placeMainText}
          numberOfLines={1}>
          {main_text}
        </CustomText>
        <CustomText
          fontFamily={Fonts.Regular}
          variant="h8"
          style={styles.placeSecondaryText}
          numberOfLines={2}>
          {secondary_text}
        </CustomText>
      </View>
      <View style={styles.placeArrow}>
        <Icon name="chevron-right" color="#999" size={RFValue(16)} />
      </View>
    </TouchableOpacity>
  );
};

const PlacesAutocompleteResults: FC<PlacesAutocompleteResultsProps> = ({
  data,
  isLoading = false,
  onPlaceSelect,
  onClose,
  maxHeight = 300,
}) => {
  if (isLoading) {
    return (
      <View style={[styles.container, {maxHeight}]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <CustomText
            fontFamily={Fonts.Medium}
            variant="h7"
            style={styles.loadingText}>
            Searching places...
          </CustomText>
        </View>
      </View>
    );
  }

  if (!data || !data.predictions || data.predictions.length === 0) {
    return (
      <View style={[styles.container, {maxHeight}]}>
        <View style={styles.emptyContainer}>
          <Icon name="map-search" color={Colors.disabled} size={RFValue(32)} />
          <CustomText
            fontFamily={Fonts.Medium}
            variant="h6"
            style={styles.emptyText}>
            No places found
          </CustomText>
          <CustomText
            fontFamily={Fonts.Regular}
            variant="h8"
            style={styles.emptySubtext}>
            Try searching with different keywords
          </CustomText>
        </View>
      </View>
    );
  }

  const renderPlaceItem = ({
    item,
    index,
  }: {
    item: PlacePrediction;
    index: number;
  }) => (
    <PlaceItem place={item} onPress={() => onPlaceSelect(item)} index={index} />
  );

  return (
    <View style={[styles.container, {maxHeight}]}>
      {onClose && (
        <View style={styles.header}>
          <CustomText
            fontFamily={Fonts.SemiBold}
            variant="h6"
            style={styles.headerTitle}>
            Select a place
          </CustomText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" color={Colors.text} size={RFValue(20)} />
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={data.predictions}
        renderItem={renderPlaceItem}
        keyExtractor={item => item.place_id}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: RFValue(12),
    marginTop: RFValue(2),
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(4),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    color: Colors.text,
  },
  closeButton: {
    width: RFValue(32),
    height: RFValue(32),
    borderRadius: RFValue(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: RFValue(250),
  },
  listContent: {
    paddingBottom: RFValue(4),
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(8),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  firstItem: {
    borderTopLeftRadius: RFValue(12),
    borderTopRightRadius: RFValue(12),
  },
  placeIcon: {
    width: RFValue(28),
    height: RFValue(28),
    borderRadius: RFValue(14),
    backgroundColor: '#eef7ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFValue(8),
  },
  placeContent: {
    flex: 1,
  },
  placeMainText: {
    color: Colors.text,
    marginBottom: RFValue(1),
  },
  placeSecondaryText: {
    color: '#666',
    lineHeight: RFValue(14),
  },
  placeArrow: {
    marginLeft: RFValue(6),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFValue(12),
    gap: RFValue(6),
  },
  loadingText: {
    color: Colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(12),
  },
  emptyText: {
    color: Colors.text,
    marginTop: RFValue(6),
    marginBottom: RFValue(2),
  },
  emptySubtext: {
    color: '#666',
    textAlign: 'center',
  },
});

export default PlacesAutocompleteResults;
