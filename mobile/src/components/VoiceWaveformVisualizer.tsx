import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../theme/tokens';
import { Mic } from 'lucide-react-native';

interface Props {
  isActive: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  audioLevels?: number[];
  languageLabel: string;
}

export const VoiceWaveformVisualizer: React.FC<Props> = ({
  isActive,
  onPressIn,
  onPressOut,
  languageLabel,
}) => {
  // Animated bar values for wave effect
  const barAnim1 = useRef(new Animated.Value(15)).current;
  const barAnim2 = useRef(new Animated.Value(25)).current;
  const barAnim3 = useRef(new Animated.Value(45)).current;
  const barAnim4 = useRef(new Animated.Value(30)).current;
  const barAnim5 = useRef(new Animated.Value(55)).current;
  const barAnim6 = useRef(new Animated.Value(20)).current;
  const barAnim7 = useRef(new Animated.Value(35)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isActive) {
      const createWave = (anim: Animated.Value, minH: number, maxH: number, speed: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: maxH,
              duration: speed,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: minH,
              duration: speed,
              useNativeDriver: false,
            }),
          ])
        );
      };

      animLoop = Animated.parallel([
        createWave(barAnim1, 12, 42, 220),
        createWave(barAnim2, 18, 55, 260),
        createWave(barAnim3, 24, 65, 300),
        createWave(barAnim4, 15, 50, 240),
        createWave(barAnim5, 20, 60, 280),
        createWave(barAnim6, 14, 45, 230),
        createWave(barAnim7, 10, 38, 250),
      ]);
      animLoop.start();
    } else {
      Animated.parallel([
        Animated.timing(barAnim1, { toValue: 12, duration: 200, useNativeDriver: false }),
        Animated.timing(barAnim2, { toValue: 16, duration: 200, useNativeDriver: false }),
        Animated.timing(barAnim3, { toValue: 20, duration: 200, useNativeDriver: false }),
        Animated.timing(barAnim4, { toValue: 16, duration: 200, useNativeDriver: false }),
        Animated.timing(barAnim5, { toValue: 22, duration: 200, useNativeDriver: false }),
        Animated.timing(barAnim6, { toValue: 14, duration: 200, useNativeDriver: false }),
        Animated.timing(barAnim7, { toValue: 10, duration: 200, useNativeDriver: false }),
      ]).start();
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isActive]);

  return (
    <View style={styles.container}>
      {/* Waveform Bars Container */}
      <View style={styles.waveContainer}>
        {[barAnim1, barAnim2, barAnim3, barAnim4, barAnim5, barAnim6, barAnim7].map((anim, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.waveBar,
              {
                height: anim,
                backgroundColor: isActive ? Colors.accentTeal : '#CBD5E1',
              },
            ]}
          />
        ))}
      </View>

      {/* Push-to-Talk Big Kid-Friendly Mic Button */}
      <TouchableOpacity
        style={[
          styles.micButton,
          {
            backgroundColor: isActive ? Colors.listening : Colors.primary,
            transform: [{ scale: isActive ? 1.08 : 1 }],
          },
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.85}
      >
        <Mic size={34} color="#FFF" />
      </TouchableOpacity>

      {/* Instruction Badge */}
      <View style={styles.hintWrapper}>
        <Text style={styles.hintTitle}>
          {isActive ? '🔴 Listening... Bolte rahiye' : 'Daba kar rakhein aur bole'}
        </Text>
        <Text style={styles.hintSub}>Language: {languageLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 65,
    marginBottom: 10,
  },
  waveBar: {
    width: 6,
    borderRadius: 4,
  },
  micButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  hintWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hintSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
});
