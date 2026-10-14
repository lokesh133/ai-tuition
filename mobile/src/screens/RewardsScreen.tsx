import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Shadows } from '../theme/tokens';
import { useAppStore } from '../store/useStore';
import { Trophy, Award, Star, Flame, ShieldCheck, Gift } from 'lucide-react-native';

const BADGES = [
  { id: 'b1', title: 'Math Wizard', desc: 'Solved 25 Fraction Problems', emoji: '🧙‍♂️', unlocked: true, color: '#FEF3C7' },
  { id: 'b2', title: 'Science Explorer', desc: 'Completed 10 Plant Biology Doubts', emoji: '🔬', unlocked: true, color: '#E0F2FE' },
  { id: 'b3', title: 'Streak Champion', desc: '7 Days Continuous Tuition', emoji: '🔥', unlocked: true, color: '#FFEDD5' },
  { id: 'b4', title: 'Speed Solver', desc: 'Answered in under 1 minute', emoji: '⚡️', unlocked: false, color: '#F1F5F9' },
  { id: 'b5', title: 'Grammar Guru', desc: 'Mastered Past & Present Tenses', emoji: '📖', unlocked: false, color: '#F1F5F9' },
  { id: 'b6', title: 'Super Kid of the Week', desc: 'Top 5 in Class 5th B', emoji: '👑', unlocked: false, color: '#F1F5F9' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Ananya Verma', stars: 620, badge: '🥇' },
  { rank: 2, name: 'Aarav Sharma (You)', stars: 480, badge: '🥈', isSelf: true },
  { rank: 3, name: 'Rohan Gupta', stars: 450, badge: '🥉' },
  { rank: 4, name: 'Meera Patel', stars: 410, badge: '⭐️' },
  { rank: 5, name: 'Kabir Singh', stars: 390, badge: '⭐️' },
];

export const RewardsScreen: React.FC = () => {
  const { starPoints, streakCount } = useAppStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Trophy Banner */}
        <View style={styles.trophyHero}>
          <View style={styles.trophyIconWrap}>
            <Trophy size={42} color="#FBBF24" />
          </View>
          <Text style={styles.trophyTitle}>Achievements & Star Shop</Text>
          <Text style={styles.trophySub}>Har sawaal poochne par milenge Stars & Badges!</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Star size={20} color="#EAB308" fill="#EAB308" />
              <Text style={styles.heroStatValue}>{starPoints}</Text>
              <Text style={styles.heroStatLabel}>Total Stars</Text>
            </View>

            <View style={styles.heroStatCard}>
              <Flame size={20} color="#FF6B35" />
              <Text style={styles.heroStatValue}>{streakCount} Days</Text>
              <Text style={styles.heroStatLabel}>Active Streak</Text>
            </View>
          </View>
        </View>

        {/* Badges Collection Grid */}
        <View style={styles.sectionHeader}>
          <Award size={18} color={Colors.secondary} />
          <Text style={styles.sectionTitle}>My Badges (3 / 6 Unlocked)</Text>
        </View>

        <View style={styles.badgesGrid}>
          {BADGES.map((b) => (
            <View
              key={b.id}
              style={[
                styles.badgeCard,
                { backgroundColor: b.color, opacity: b.unlocked ? 1 : 0.6 },
              ]}
            >
              <Text style={styles.badgeEmoji}>{b.emoji}</Text>
              <Text style={styles.badgeTitle}>{b.title}</Text>
              <Text style={styles.badgeDesc}>{b.desc}</Text>
              {b.unlocked ? (
                <View style={styles.unlockedTag}>
                  <ShieldCheck size={12} color="#059669" />
                  <Text style={styles.unlockedText}>Unlocked</Text>
                </View>
              ) : (
                <Text style={styles.lockedText}>🔒 Locked</Text>
              )}
            </View>
          ))}
        </View>

        {/* Friendly Class Leaderboard */}
        <View style={styles.sectionHeader}>
          <Trophy size={18} color="#D97706" />
          <Text style={styles.sectionTitle}>Class 5th B Leaderboard</Text>
        </View>

        <View style={styles.leaderboardBox}>
          {LEADERBOARD.map((item) => (
            <View
              key={item.rank}
              style={[
                styles.leaderRow,
                item.isSelf && styles.leaderRowSelf,
              ]}
            >
              <Text style={styles.leaderRankBadge}>{item.badge}</Text>
              <Text style={[styles.leaderName, item.isSelf && styles.leaderNameSelf]}>
                {item.name}
              </Text>
              <View style={styles.leaderStarsWrap}>
                <Star size={14} color="#EAB308" fill="#EAB308" />
                <Text style={styles.leaderStarsText}>{item.stars}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Star Redeem Shop Banner */}
        <TouchableOpacity style={styles.redeemBanner} activeOpacity={0.85}>
          <Gift size={28} color="#FFF" />
          <View style={styles.redeemTextWrap}>
            <Text style={styles.redeemTitle}>Redeem Custom Teacher Avatars</Text>
            <Text style={styles.redeemSub}>Spend 500 Stars to unlock "Astronaut Sharma Sir"!</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  trophyHero: {
    backgroundColor: '#4338CA',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    ...Shadows.card,
  },
  trophyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  trophyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trophySub: {
    fontSize: 12,
    color: '#C7D2FE',
    textAlign: 'center',
    marginTop: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  heroStatLabel: {
    color: '#E0E7FF',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  badgeCard: {
    width: '48%',
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  unlockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  unlockedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  lockedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  leaderboardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
    ...Shadows.soft,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  leaderRowSelf: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  leaderRankBadge: {
    fontSize: 18,
    marginRight: 12,
  },
  leaderName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  leaderNameSelf: {
    color: Colors.secondary,
    fontWeight: '800',
  },
  leaderStarsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leaderStarsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  redeemBanner: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...Shadows.glow,
  },
  redeemTextWrap: {
    flex: 1,
  },
  redeemTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  redeemSub: {
    color: '#FED7AA',
    fontSize: 11,
    marginTop: 2,
  },
});
