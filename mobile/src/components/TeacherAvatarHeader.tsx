import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../theme/tokens';
import { EmotionState, TeacherId } from '../store/useStore';
import { Sparkles, Mic, Brain, Volume2 } from 'lucide-react-native';

interface Props {
  teacherId: TeacherId;
  emotion: EmotionState;
}

export const TeacherAvatarHeader: React.FC<Props> = ({ teacherId, emotion }) => {
  const teacher = Colors.teachers[teacherId];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (emotion === 'Listening' || emotion === 'Speaking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [emotion]);

  const getStatusColor = () => {
    switch (emotion) {
      case 'Listening':
        return Colors.listening;
      case 'Thinking':
        return Colors.thinking;
      case 'Speaking':
        return Colors.speaking;
      case 'Greeting':
      default:
        return Colors.secondary;
    }
  };

  const getStatusIcon = () => {
    switch (emotion) {
      case 'Listening':
        return <Mic size={14} color="#FFF" />;
      case 'Thinking':
        return <Brain size={14} color="#FFF" />;
      case 'Speaking':
        return <Volume2 size={14} color="#FFF" />;
      default:
        return <Sparkles size={14} color="#FFF" />;
    }
  };

  const getStatusLabel = () => {
    switch (emotion) {
      case 'Listening':
        return 'Suno dhyan se (Listening)...';
      case 'Thinking':
        return 'Sharma Sir soch rahe hain...';
      case 'Speaking':
        return 'Explaining Step-by-Step...';
      case 'Greeting':
        return 'Ready to help! Poocho doubt.';
      default:
        return 'Online';
    }
  };

  return (
    <View style={styles.container}>
      {/* Avatar with Halo Pulse */}
      <View style={styles.avatarWrapper}>
        <Animated.View
          style={[
            styles.halo,
            {
              borderColor: getStatusColor(),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <View style={[styles.avatarCircle, { backgroundColor: teacher.bg, borderColor: teacher.border }]}>
          <Text style={styles.avatarEmoji}>
            {teacherId === 'neha' ? '👩‍🔬' : teacherId === 'sharma' ? '👨‍🏫' : teacherId === 'riya' ? '👩‍🏫' : teacherId === 'kabir' ? '👨‍💼' : '👩‍🎓'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          {getStatusIcon()}
        </View>
      </View>

      {/* Teacher Meta Info */}
      <View style={styles.metaInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.teacherName}>{teacher.name}</Text>
          <View style={[styles.subjectTag, { backgroundColor: teacher.bg }]}>
            <Text style={[styles.subjectTagText, { color: teacher.badge }]}>{teacher.subject}</Text>
          </View>
        </View>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusLabel()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    opacity: 0.7,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  metaInfo: {
    marginLeft: 14,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teacherName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subjectTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  subjectTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
