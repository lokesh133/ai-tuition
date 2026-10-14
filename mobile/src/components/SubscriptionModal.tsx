import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors, Shadows } from '../theme/tokens';
import {
  X,
  CheckCircle2,
  Zap,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PERKS = [
  'Unlimited Voice Doubts with all 5 AI Teachers',
  '24x7 Live Step-by-Step Smart Whiteboard',
  'Camera Homework Scanner with line-by-line check',
  'NCERT Syllabus for Classes 1st to 8th',
  'Parent WhatsApp Weekly Report & Analytics',
  'Zero Ad Distractions & Kid-Safe Filter',
];

export const SubscriptionModal: React.FC<Props> = ({ visible, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Subscription Activated! 🎉',
        'Aapka ₹200/month plan activate ho chuka hai. Bachha ab sabhi 5 teachers se unlimited doubts pooch sakta hai.',
        [{ text: 'Shuru Karein', onPress: onClose }]
      );
    }, 1200);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Header Badge */}
            <View style={styles.badgePill}>
              <Sparkles size={14} color="#D97706" />
              <Text style={styles.badgePillText}>3-DAY FREE TRIAL AVAILABLE</Text>
            </View>

            <Text style={styles.title}>AI Tuition Pro Pass</Text>
            <Text style={styles.subtitle}>
              Class 1st se 8th tak ka complete personal AI tutor sirf ₹200/month me!
            </Text>

            {/* Plan Selector Card */}
            <View style={styles.pricingCard}>
              <View style={styles.pricingHeader}>
                <View>
                  <Text style={styles.planName}>Monthly Unlimited</Text>
                  <Text style={styles.planBilling}>Cancel anytime • No hidden charges</Text>
                </View>
                <View style={styles.priceTagWrap}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <Text style={styles.priceAmount}>200</Text>
                  <Text style={styles.pricePeriod}>/mo</Text>
                </View>
              </View>

              {/* UPI Quick Logos */}
              <View style={styles.upiRow}>
                <Text style={styles.upiLabel}>Pay via UPI:</Text>
                <View style={styles.upiChip}><Text style={styles.upiText}>Google Pay</Text></View>
                <View style={styles.upiChip}><Text style={styles.upiText}>PhonePe</Text></View>
                <View style={styles.upiChip}><Text style={styles.upiText}>Paytm</Text></View>
              </View>
            </View>

            {/* Perks List */}
            <View style={styles.perksSection}>
              <Text style={styles.perksHeader}>WHAT'S INCLUDED:</Text>
              {PERKS.map((perk, idx) => (
                <View key={idx} style={styles.perkRow}>
                  <CheckCircle2 size={18} color="#059669" />
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </View>

            {/* Trust Badges */}
            <View style={styles.trustRow}>
              <ShieldCheck size={16} color="#475569" />
              <Text style={styles.trustText}>100% Safe • RBI & NPCI Compliant UPI Gateway</Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.payButton, isProcessing && { opacity: 0.7 }]}
              onPress={handlePayment}
              disabled={isProcessing}
            >
              <Zap size={20} color="#FFF" />
              <Text style={styles.payButtonText}>
                {isProcessing ? 'Processing UPI Gateway...' : 'Activate for ₹200 / Month'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              3 days free • Next billing on 17th Oct • Parent consent required
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 16,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgePillText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  pricingCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    marginBottom: 20,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.secondary,
  },
  planBilling: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  priceTagWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.secondary,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.secondary,
  },
  pricePeriod: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
    gap: 8,
  },
  upiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  upiChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  upiText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  perksSection: {
    marginBottom: 20,
    gap: 10,
  },
  perksHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  trustText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 10,
    ...Shadows.glow,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 12,
  },
});
