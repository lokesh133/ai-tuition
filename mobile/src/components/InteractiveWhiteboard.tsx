import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/tokens';
import { WhiteboardStep } from '../store/useStore';
import { Edit3, RotateCcw, Lightbulb, CheckCircle2 } from 'lucide-react-native';

interface Props {
  steps: WhiteboardStep[];
  onClear: () => void;
  onReplay?: () => void;
}

export const InteractiveWhiteboard: React.FC<Props> = ({ steps, onClear }) => {
  return (
    <View style={styles.whiteboardContainer}>
      {/* Board Top Toolbar */}
      <View style={styles.boardHeader}>
        <View style={styles.boardTitleRow}>
          <Edit3 size={16} color="#FFF" />
          <Text style={styles.boardTitle}>Live Smart Whiteboard</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>AI STEP-BY-STEP</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onClear} style={styles.iconBtn} activeOpacity={0.7}>
          <RotateCcw size={15} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Grid Canvas Body */}
      <ScrollView
        style={styles.canvasBody}
        contentContainerStyle={styles.canvasContent}
        showsVerticalScrollIndicator={false}
      >
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepNumberBadge, { backgroundColor: step.color || Colors.secondary }]}>
                <Text style={styles.stepNumberText}>Step {index + 1}</Text>
              </View>
              <CheckCircle2 size={16} color={Colors.accentTeal} />
            </View>

            {/* Formula / Content Display */}
            <View style={styles.formulaBox}>
              <Text style={styles.formulaText}>{step.content}</Text>
            </View>

            {/* Hinglish Audio/Visual Annotation note */}
            {step.annotation && (
              <View style={styles.annotationRow}>
                <Lightbulb size={14} color="#F59E0B" style={styles.annotationIcon} />
                <Text style={styles.annotationText}>{step.annotation}</Text>
              </View>
            )}
          </View>
        ))}

        {steps.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>Whiteboard Ready</Text>
            <Text style={styles.emptySubtitle}>
              Poocho koi bhi sawaal, Sharma Sir yahan solve karke dikhayenge!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  whiteboardContainer: {
    backgroundColor: '#0F172A', // Dark Slate Chalkboard tone for high contrast
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#334155',
    overflow: 'hidden',
    height: 250,
  },
  boardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  boardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boardTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
  },
  liveBadge: {
    backgroundColor: 'rgba(6, 214, 160, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#06D6A0',
  },
  liveBadgeText: {
    color: '#06D6A0',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  canvasBody: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  canvasContent: {
    padding: 14,
    gap: 12,
  },
  stepCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accentTeal,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  formulaBox: {
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginVertical: 4,
  },
  formulaText: {
    color: '#38BDF8',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  annotationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    gap: 6,
  },
  annotationIcon: {
    marginTop: 2,
  },
  annotationText: {
    color: '#CBD5E1',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});
