import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Colors, Shadows } from '../theme/tokens';
import { useAppStore, TeacherId } from '../store/useStore';
import { Flame, Star, Mic, ChevronRight, Award } from 'lucide-react-native';

const TEACHERS: { id: TeacherId; name: string; subject: string; emoji: string; colorKey: keyof typeof Colors.teachers }[] = [
  { id: 'neha', name: 'Neha Mam', subject: 'Science', emoji: '👩‍🔬', colorKey: 'neha' },
  { id: 'sharma', name: 'Sharma Sir', subject: 'Maths', emoji: '👨‍🏫', colorKey: 'sharma' },
  { id: 'riya', name: 'Riya Didi', subject: 'English', emoji: '👩‍🏫', colorKey: 'riya' },
  { id: 'kabir', name: 'Kabir Sir', subject: 'SST', emoji: '👨‍💼', colorKey: 'kabir' },
  { id: 'pooja', name: 'Pooja Mam', subject: 'Hindi', emoji: '✍️', colorKey: 'pooja' },
];

const NCERT_TOPICS = [
  { id: 't1', title: 'Fractions & Decimals', class: 'Class 5 • Math', duration: '15 mins', icon: '📐', teacher: 'Sharma Sir' },
  { id: 't2', title: 'Photosynthesis in Plants', class: 'Class 5 • Science', duration: '20 mins', icon: '🌱', teacher: 'Neha Mam' },
  { id: 't3', title: 'Tenses & Sentences', class: 'Class 5 • English', duration: '12 mins', icon: '📖', teacher: 'Riya Didi' },
  { id: 't4', title: 'The Solar System', class: 'Class 5 • SST', duration: '18 mins', icon: '🪐', teacher: 'Kabir Sir' },
];

export const HomeScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const {
    studentName,
    studentClass,
    streakCount,
    starPoints,
    selectedTeacherId,
    setSelectedTeacher,
  } = useAppStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>Namaste, Beta! 👋</Text>
          <View style={styles.nameRow}>
            <Text style={styles.studentName}>{studentName}</Text>
            <View style={styles.classBadge}>
              <Text style={styles.classBadgeText}>{studentClass}</Text>
            </View>
          </View>
        </View>

        {/* Gamified Streak & Stars */}
        <View style={styles.statsContainer}>
          <View style={styles.statPill}>
            <Flame size={18} color="#FF6B35" />
            <Text style={styles.statPillText}>{streakCount}d</Text>
          </View>
          <View style={[styles.statPill, styles.starPill]}>
            <Star size={18} color="#EAB308" fill="#EAB308" />
            <Text style={[styles.statPillText, { color: '#B45309' }]}>{starPoints}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner: Daily Goal */}
        <View style={styles.dailyMissionCard}>
          <View style={styles.missionTextWrap}>
            <Text style={styles.missionSub}>TODAY'S MISSION</Text>
            <Text style={styles.missionTitle}>Solve 3 Math Doubts with Sharma Sir</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '66%' }]} />
            </View>
            <Text style={styles.progressLabel}>2 of 3 Completed • Earn 50 ⭐️</Text>
          </View>
          <Award size={48} color="#FBBF24" />
        </View>

        {/* My AI Teachers Carousel */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My AI Teachers 👨‍🏫</Text>
          <Text style={styles.sectionSubtitle}>Tap to chat & ask doubts</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teacherCarousel}>
          {TEACHERS.map((teacher) => {
            const isSelected = selectedTeacherId === teacher.id;
            const theme = Colors.teachers[teacher.colorKey];

            return (
              <TouchableOpacity
                key={teacher.id}
                style={[
                  styles.teacherCard,
                  { backgroundColor: theme.bg, borderColor: isSelected ? theme.badge : 'transparent' },
                  isSelected && styles.selectedTeacherCard,
                ]}
                onPress={() => {
                  setSelectedTeacher(teacher.id);
                  navigation.navigate('AI Tutor Studio');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.teacherAvatarCircle}>
                  <Text style={styles.teacherAvatarEmoji}>{teacher.emoji}</Text>
                </View>
                <Text style={styles.teacherCardName}>{teacher.name}</Text>
                <View style={[styles.subjectMiniBadge, { backgroundColor: theme.badge }]}>
                  <Text style={styles.subjectMiniBadgeText}>{teacher.subject}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* NCERT Syllabus Topics Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>NCERT Chapters For Today 📚</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AI Tutor Studio')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topicsGrid}>
          {NCERT_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={styles.topicCard}
              onPress={() => navigation.navigate('AI Tutor Studio')}
              activeOpacity={0.7}
            >
              <View style={styles.topicIconBox}>
                <Text style={{ fontSize: 22 }}>{topic.icon}</Text>
              </View>
              <View style={styles.topicDetails}>
                <Text style={styles.topicClass}>{topic.class}</Text>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicTeacher}>Taught by {topic.teacher}</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating "Quick Doubt" Mic Action Button */}
      <TouchableOpacity
        style={styles.floatingMicBtn}
        onPress={() => navigation.navigate('AI Tutor Studio')}
        activeOpacity={0.85}
      >
        <Mic size={24} color="#FFF" />
        <Text style={styles.floatingMicText}>Poocho Doubt</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  greetingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  classBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  classBadgeText: {
    color: Colors.secondary,
    fontSize: 11,
    fontWeight: '800',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    gap: 4,
  },
  starPill: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FEF08A',
  },
  statPillText: {
    fontWeight: '800',
    fontSize: 13,
    color: '#C2410C',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
  },
  dailyMissionCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    ...Shadows.card,
  },
  missionTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  missionSub: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  missionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginVertical: 6,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 4,
    marginVertical: 6,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#06D6A0',
    borderRadius: 4,
  },
  progressLabel: {
    color: '#E0E7FF',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '700',
  },
  teacherCarousel: {
    gap: 12,
    paddingBottom: 20,
  },
  teacherCard: {
    width: 110,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    ...Shadows.soft,
  },
  selectedTeacherCard: {
    transform: [{ scale: 1.04 }],
  },
  teacherAvatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teacherAvatarEmoji: {
    fontSize: 28,
  },
  teacherCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subjectMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subjectMiniBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  topicsGrid: {
    gap: 12,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.soft,
  },
  topicIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topicDetails: {
    flex: 1,
  },
  topicClass: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  topicTeacher: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  floatingMicBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    ...Shadows.glow,
  },
  floatingMicText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
