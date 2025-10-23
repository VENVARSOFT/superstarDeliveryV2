import React, {useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  StatusBar,
} from 'react-native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts, Colors} from '@utils/Constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import ScratchCard from './ScratchCard';

const {width: screenWidth} = Dimensions.get('window');

interface RewardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  status: 'active' | 'expired' | 'scratchable';
  expiryText: string;
  backgroundColor?: string;
  isScratchable?: boolean;
}

const mockRewards: RewardCard[] = [
  {
    id: '1',
    title: 'Astrotalk',
    description: 'First Chat Free & 100% Cashback on your first Rechar...',
    icon: 'star-circle',
    iconColor: '#FFD700',
    status: 'active',
    expiryText: 'Expires in 19 days',
  },
  {
    id: '2',
    title: 'New Airtel Prepaid SIM',
    description: 'With 1 year of Perplexity Pro free (worth ₹17,000)',
    icon: 'wifi',
    iconColor: '#FF0000',
    status: 'expired',
    expiryText: 'Offer has expired',
  },
  {
    id: '3',
    title: 'OTTplay',
    description: 'JioHotstar, SonyLIV, Zee5 & 30+ OTTs at ₹149',
    icon: 'play-circle',
    iconColor: '#8A2BE2',
    status: 'expired',
    expiryText: 'Offer has expired',
  },
  {
    id: '4',
    title: 'Scratch Card',
    description: 'Tap to scratch!',
    icon: 'gift',
    iconColor: '#FFFFFF',
    status: 'scratchable',
    expiryText: '',
    backgroundColor: '#FF8C00',
    isScratchable: true,
  },
  {
    id: '5',
    title: 'Astrotalk',
    description: 'First chat free & 100% cashback on your first recharge',
    icon: 'star-circle',
    iconColor: '#FFD700',
    status: 'expired',
    expiryText: 'Offer has expired',
  },
  {
    id: '6',
    title: 'ixigo',
    description: '₹300 - ₹5000 off on ixigo flight booking',
    icon: 'airplane',
    iconColor: '#FF8C00',
    status: 'expired',
    expiryText: 'Offer has expired',
  },
];

const RewardsScreen = () => {
  const [selectedCard, setSelectedCard] = useState<RewardCard | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const handleCardPress = (card: RewardCard) => {
    if (card.isScratchable) {
      setSelectedCard(card);
      setModalVisible(true);
    }
  };

  const handleScratchComplete = () => {
    // Add any logic for when scratch is completed
    console.log('Scratch completed!');
  };

  const closeModal = () => {
    Animated.timing(scaleAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedCard(null);
      scaleAnimation.setValue(1);
    });
  };

  const renderRewardCard = ({item}: {item: RewardCard}) => {
    const isScratchable = item.isScratchable;
    const isExpired = item.status === 'expired';

    return (
      <TouchableOpacity
        style={[
          styles.rewardCard,
          isScratchable && styles.scratchableCard,
          isExpired && styles.expiredCard,
          {backgroundColor: item.backgroundColor || '#FFFFFF'},
        ]}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.8}>
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Icon name={item.icon} size={RFValue(24)} color={item.iconColor} />
          </View>

          <View style={styles.textContainer}>
            <CustomText
              variant="h6"
              fontFamily={Fonts.Medium}
              style={[
                styles.cardTitle,
                isScratchable && styles.scratchableText,
                isExpired && styles.expiredText,
              ]}>
              {item.title}
            </CustomText>

            <CustomText
              variant="h8"
              fontFamily={Fonts.Medium}
              style={[
                styles.cardDescription,
                isScratchable && styles.scratchableText,
                isExpired && styles.expiredText,
              ]}
              numberOfLines={2}>
              {item.description}
            </CustomText>

            {item.expiryText && (
              <View style={styles.expiryContainer}>
                <Icon
                  name="clock-outline"
                  size={RFValue(12)}
                  color={isExpired ? '#999' : '#666'}
                />
                <CustomText
                  variant="h9"
                  fontFamily={Fonts.Regular}
                  style={[styles.expiryText, isExpired && styles.expiredText]}>
                  {item.expiryText}
                </CustomText>
              </View>
            )}
          </View>
        </View>

        {isScratchable && (
          <View style={styles.scratchOverlay}>
            <View style={styles.giftBoxContainer}>
              <Icon name="gift" size={RFValue(32)} color="#8B4513" />
            </View>
            <CustomText
              variant="h7"
              fontFamily={Fonts.Bold}
              style={styles.tapToScratchText}>
              Tap to scratch!
            </CustomText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <CustomHeader title="Your collected rewards" />

      <View style={styles.content}>
        <CustomText
          variant="h6"
          fontFamily={Fonts.Bold}
          style={styles.sectionTitle}>
          Collected Scratch Cards
        </CustomText>

        <FlatList
          data={mockRewards}
          renderItem={renderRewardCard}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {transform: [{scale: scaleAnimation}]},
            ]}>
            {selectedCard && (
              <ScratchCard
                card={selectedCard}
                onScratchComplete={handleScratchComplete}
                onClose={closeModal}
              />
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: '#000',
    marginBottom: 16,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rewardCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  scratchableCard: {
    backgroundColor: '#FF8C00',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  expiredCard: {
    opacity: 0.6,
  },
  cardContent: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  scratchableText: {
    color: '#FFFFFF',
  },
  expiredText: {
    color: '#999',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  expiryText: {
    color: '#666',
    marginLeft: 4,
  },
  scratchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  giftBoxContainer: {
    marginBottom: 8,
  },
  tapToScratchText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxHeight: '80%',
  },
});

export default RewardsScreen;
