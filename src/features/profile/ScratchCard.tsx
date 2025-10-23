import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import CustomText from '@components/ui/CustomText';
import {Fonts, Colors} from '@utils/Constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

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

interface ScratchCardProps {
  card: RewardCard;
  onScratchComplete: () => void;
  onClose: () => void;
}

const ScratchCard: React.FC<ScratchCardProps> = ({
  card,
  onScratchComplete,
  onClose,
}) => {
  const [isScratched, setIsScratched] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [showReward, setShowReward] = useState(false);

  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const rewardScaleAnimation = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;

  const scratchableArea = useRef<View>(null);
  const [scratchPoints, setScratchPoints] = useState<
    Array<{x: number; y: number}>
  >([]);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleScratch = () => {
    if (isScratched) return;

    // Simulate scratch progress
    const newPoint = {x: Math.random() * 200, y: Math.random() * 200};
    setScratchPoints(prev => [...prev, newPoint]);

    // Calculate scratch progress based on number of points
    const progress = Math.min((scratchPoints.length + 1) / 5, 1);
    setScratchProgress(progress);

    // If scratched enough, reveal the reward
    if (progress >= 0.3 && !isScratched) {
      setIsScratched(true);
      revealReward();
    }
  };

  const revealReward = () => {
    setShowReward(true);

    // Reward reveal animation
    Animated.sequence([
      Animated.spring(rewardScaleAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Sparkle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      {iterations: 3},
    ).start();

    // Call completion callback after animations
    setTimeout(() => {
      onScratchComplete();
    }, 2000);
  };

  const renderScratchableSurface = () => {
    return (
      <TouchableOpacity
        ref={scratchableArea}
        style={styles.scratchableSurface}
        onPress={handleScratch}
        activeOpacity={0.9}>
        <View style={styles.scratchPattern}>
          {Array.from({length: 20}).map((_, index) => (
            <View
              key={index}
              style={[
                styles.scratchDot,
                {
                  left: Math.random() * 200,
                  top: Math.random() * 200,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.scratchInstructions}>
          <Icon name="gesture-swipe" size={RFValue(32)} color="#FFFFFF" />
          <CustomText
            variant="h6"
            fontFamily={Fonts.Bold}
            style={styles.instructionText}>
            Tap to scratch!
          </CustomText>
        </View>
      </TouchableOpacity>
    );
  };

  const renderReward = () => {
    return (
      <Animated.View
        style={[
          styles.rewardContainer,
          {
            transform: [{scale: rewardScaleAnimation}],
          },
        ]}>
        <Animated.View
          style={[
            styles.sparkleContainer,
            {
              opacity: sparkleAnimation,
              transform: [
                {
                  rotate: sparkleAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}>
          <Icon name="star" size={RFValue(20)} color="#FFD700" />
        </Animated.View>

        <View style={styles.rewardContent}>
          <Icon name="gift" size={RFValue(48)} color="#8B4513" />
          <CustomText
            variant="h4"
            fontFamily={Fonts.Bold}
            style={styles.rewardTitle}>
            Congratulations!
          </CustomText>
          <CustomText
            variant="h6"
            fontFamily={Fonts.Medium}
            style={styles.rewardDescription}>
            You won a special discount!
          </CustomText>
          <CustomText
            variant="h5"
            fontFamily={Fonts.Bold}
            style={styles.discountText}>
            20% OFF
          </CustomText>
        </View>
      </Animated.View>
    );
  };

  const renderConfetti = () => {
    return (
      <Animated.View
        style={[
          styles.confettiContainer,
          {
            opacity: confettiAnimation,
          },
        ]}>
        {Array.from({length: 10}).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                left: Math.random() * screenWidth,
                backgroundColor: [
                  '#FF6B6B',
                  '#4ECDC4',
                  '#45B7D1',
                  '#96CEB4',
                  '#FFEAA7',
                ][Math.floor(Math.random() * 5)],
                transform: [
                  {
                    translateY: confettiAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -screenHeight],
                    }),
                  },
                  {
                    rotate: confettiAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '720deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{scale: scaleAnimation}],
          opacity: fadeAnimation,
        },
      ]}>
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={RFValue(24)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.scratchCard}>
          {!isScratched ? (
            renderScratchableSurface()
          ) : (
            <View style={styles.revealedContent}>
              {showReward && renderReward()}
            </View>
          )}
        </View>

        {isScratched && renderConfetti()}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.6,
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  scratchCard: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  scratchableSurface: {
    flex: 1,
    backgroundColor: '#D2691E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scratchPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scratchDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  scratchInstructions: {
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  revealedContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rewardContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  sparkleContainer: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  rewardContent: {
    alignItems: 'center',
  },
  rewardTitle: {
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  rewardDescription: {
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  discountText: {
    color: '#FF8C00',
    textAlign: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ScratchCard;
