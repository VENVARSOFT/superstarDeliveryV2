import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CustomText from '@components/ui/CustomText';
import {Fonts, Colors} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getSlots, DeliverySlot} from '@service/slotService';
// import {useAuthStore} from '@state/authStore';

const {height: screenHeight} = Dimensions.get('window');

interface DeliverySlotsModalProps {
  visible: boolean;
  onClose: () => void;
  onSlotSelect: (slot: DeliverySlot) => void;
}

const DeliverySlotsModal: React.FC<DeliverySlotsModalProps> = ({
  visible,
  onClose,
  onSlotSelect,
}) => {
  const [slotsData, setSlotsData] = useState<{[date: string]: DeliverySlot[]}>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSlots(1);

      if (response && response.success) {
        setSlotsData(response.data);
      } else {
        Alert.alert('Error', 'Failed to fetch delivery slots');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      Alert.alert('Error', 'Failed to fetch delivery slots');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchSlots();
    }
  }, [visible, fetchSlots]);

  // When slots load, select the earliest date by default for the date chips
  useEffect(() => {
    const dates = Object.keys(slotsData);
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [slotsData, selectedDate]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleSlotSelect = (slot: DeliverySlot) => {
    if (!slot.isAvailable) return;
    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (selectedSlot) {
      onSlotSelect(selectedSlot);
      onClose();
    }
  };

  const dates = useMemo(() => Object.keys(slotsData), [slotsData]);

  const getWeekdayAndDay = (dateString: string) => {
    const d = new Date(dateString);
    const weekday = d.toLocaleDateString('en-US', {weekday: 'short'});
    const day = d.toLocaleDateString('en-US', {day: '2-digit'});
    return {weekday, day};
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, {paddingBottom: insets.bottom}]}>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <CustomText
                variant="h7"
                fontFamily={Fonts.SemiBold}
                style={styles.sectionTitle}>
                Select Delivery Slot
              </CustomText>
              {/* <CustomText variant="h9" style={styles.sectionSubTitle}>
                Your service will take approximately 4 hours
              </CustomText> */}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={RFValue(24)} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <CustomText variant="h9" style={styles.loadingText}>
                Loading available slots...
              </CustomText>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}>
              {/* Date chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateChipsRow}>
                {dates.map(date => {
                  const {weekday, day} = getWeekdayAndDay(date);
                  const isSelected = selectedDate === date;
                  return (
                    <TouchableOpacity
                      key={date}
                      style={[
                        styles.dateChip,
                        ...(isSelected ? [styles.dateChipSelected] : []),
                      ]}
                      onPress={() => setSelectedDate(date)}>
                      <CustomText
                        variant="h9"
                        style={[
                          styles.dateChipWeekday,
                          ...(isSelected ? [styles.dateChipTextSelected] : []),
                        ]}>
                        {weekday}
                      </CustomText>
                      <CustomText
                        variant="h7"
                        fontFamily={Fonts.SemiBold}
                        style={[
                          styles.dateChipDay,
                          ...(isSelected ? [styles.dateChipTextSelected] : []),
                        ]}>
                        {day}
                      </CustomText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.separator} />

              {/* Slots grid */}
              <View style={styles.slotsGridContainer}>
                {(selectedDate ? slotsData[selectedDate] || [] : []).map(
                  slot => {
                    const isSelected = selectedSlot?.idSlot === slot.idSlot;
                    return (
                      <TouchableOpacity
                        key={slot.idSlot}
                        style={[
                          styles.slotPill,
                          ...(!slot.isAvailable
                            ? [styles.slotPillDisabled]
                            : []),
                          ...(isSelected ? [styles.slotPillSelected] : []),
                        ]}
                        onPress={() => handleSlotSelect(slot)}
                        disabled={!slot.isAvailable}>
                        <CustomText
                          variant="h9"
                          fontFamily={
                            isSelected ? Fonts.SemiBold : Fonts.Medium
                          }
                          style={[
                            styles.slotPillText,
                            ...(!slot.isAvailable
                              ? [styles.slotPillTextDisabled]
                              : []),
                            ...(isSelected
                              ? [styles.slotPillTextSelected]
                              : []),
                          ]}>
                          {formatTime(slot.tmStartTime)}
                        </CustomText>
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>
            </ScrollView>
          )}

          {selectedSlot && (
            <View style={styles.confirmContainer}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}>
                <CustomText
                  variant="h6"
                  fontFamily={Fonts.SemiBold}
                  style={styles.confirmButtonText}>
                  Proceed to checkout
                </CustomText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.secondary,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleBlock: {
    paddingVertical: 12,
  },
  sectionTitle: {
    color: Colors.text,
  },
  sectionSubTitle: {
    marginTop: 6,
    color: Colors.secondary,
  },
  dateChipsRow: {
    paddingVertical: 12,
    gap: 12,
  },
  dateChip: {
    width: 72,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 12,
    alignItems: 'center',
  },
  dateChipSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  dateChipWeekday: {
    color: Colors.secondary,
  },
  dateChipDay: {
    color: Colors.text,
    marginTop: 4,
  },
  dateChipTextSelected: {
    color: Colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  slotsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  slotPill: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#ffffff',
  },
  slotPillSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  slotPillDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  slotPillText: {
    color: Colors.text,
  },
  slotPillTextSelected: {
    color: Colors.primary,
  },
  slotPillTextDisabled: {
    color: Colors.secondary,
  },
  confirmContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
  },
});

export default DeliverySlotsModal;
