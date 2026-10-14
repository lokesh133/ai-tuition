import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Colors, Shadows } from '../theme/tokens';
import { useAppStore } from '../store/useStore';
import { SubscriptionModal } from '../components/SubscriptionModal';
import {
  Shield,
  CreditCard,
  Phone,
  Volume2,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react-native';

const CLASSES = ['Class 1st', 'Class 2nd', 'Class 3rd', 'Class 4th', 'Class 5th', 'Class 6th', 'Class 7th', 'Class 8th'];

export const ProfileScreen: React.FC = () => {
  const { studentName, studentClass } = useAppStore();
  const [audioFeedback, setAudioFeedback] = React.useState(true);
  const [isSubModalOpen, setIsSubModalOpen] = React.useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Student Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeEmoji}>👦</Text>
          </View>
          <Text style={styles.profileName}>{studentName}</Text>
          <Text style={styles.profileSchool}>Kendriya Vidyalaya • {studentClass}</Text>

          {/* Interactive Subscription Status Pill */}
          <TouchableOpacity
            style={styles.subPill}
            onPress={() => setIsSubModalOpen(true)}
            activeOpacity={0.8}
          >
            <CreditCard size={14} color="#059669" />
            <Text style={styles.subPillText}>₹200/Month Plan Active</Text>
            <Sparkles size={12} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Class Selection Grid */}
        <Text style={styles.sectionTitle}>Select Your Class (NCERT Syllabus)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classChipsScroll}>
          {CLASSES.map((cls) => {
            const isSelected = studentClass.startsWith(cls);
            return (
              <TouchableOpacity
                key={cls}
                style={[
                  styles.classChip,
                  isSelected && styles.classChipActive,
                ]}
              >
                <Text style={[styles.classChipText, isSelected && styles.classChipTextActive]}>
                  {cls}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Parent Details Card */}
        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>PARENT DETAILS & SAFETY</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIconWrap}>
              <Phone size={18} color="#475569" />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Connected Parent Phone</Text>
              <Text style={styles.settingValue}>+91 98765-43210 (Rajesh Sharma)</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIconWrap}>
              <Shield size={18} color="#475569" />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Parental Safety Guardrails</Text>
              <Text style={styles.settingValue}>Strict NCERT Kid Safe Filter Active</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </View>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setIsSubModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <CreditCard size={18} color={Colors.secondary} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Manage Subscription & Billing</Text>
              <Text style={styles.settingValue}>₹200/mo Plan • UPI & Invoice Details</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Audio & App Preferences */}
        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>AUDIO & APP SETTINGS</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIconWrap}>
              <Volume2 size={18} color="#475569" />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Teacher Voice Narration</Text>
              <Text style={styles.settingValue}>Auto-speak explanations aloud</Text>
            </View>
            <Switch
              value={audioFeedback}
              onValueChange={setAudioFeedback}
              trackColor={{ false: '#CBD5E1', true: Colors.accentTeal }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Logout / Switch Profile */}
        <TouchableOpacity style={styles.logoutBtn}>
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Switch Student Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Subscription & UPI Checkout Modal */}
      <SubscriptionModal
        visible={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
      />
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.soft,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarLargeEmoji: {
    fontSize: 44,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  profileSchool: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 12,
  },
  subPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  classChipsScroll: {
    gap: 8,
    marginBottom: 24,
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  classChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  classChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  classChipTextActive: {
    color: '#FFFFFF',
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.soft,
  },
  settingsGroupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  settingValue: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 10,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
});
