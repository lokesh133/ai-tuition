import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/tokens';
import { AnnotationItem } from '../store/useStore';
import { CheckCircle, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react-native';

interface Props {
  annotations: AnnotationItem[];
  selectedTeacherName: string;
}

export const HomeworkAnnotationOverlay: React.FC<Props> = ({
  annotations,
  selectedTeacherName,
}) => {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Scanner Alignment Frame */}
      <View style={styles.viewfinderFrame}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      {/* Render AI Feedback Pins & Callouts */}
      {annotations.map((ann) => {
        const isCorrect = ann.type === 'correct';
        const isMistake = ann.type === 'mistake';
        const color = isCorrect ? Colors.accentTeal : isMistake ? Colors.accentPink : '#F59E0B';

        return (
          <View
            key={ann.id}
            style={[
              styles.annotationBubble,
              {
                top: `${ann.yPercent}%`,
                borderColor: color,
              },
            ]}
          >
            <View style={styles.bubbleHeader}>
              <View style={[styles.statusIconCircle, { backgroundColor: color }]}>
                {isCorrect ? (
                  <CheckCircle size={14} color="#FFF" />
                ) : isMistake ? (
                  <AlertTriangle size={14} color="#FFF" />
                ) : (
                  <Lightbulb size={14} color="#FFF" />
                )}
              </View>
              <Text style={[styles.annotationTag, { color }]}>
                {isCorrect ? 'Bilkul Sahi ✅' : isMistake ? 'Dhyan dein ⚠️' : 'Teacher Tip 💡'}
              </Text>
            </View>

            <Text style={styles.feedbackText}>{ann.feedbackText}</Text>

            {ann.hintFormula && (
              <View style={styles.formulaPill}>
                <Sparkles size={12} color="#4F46E5" />
                <Text style={styles.formulaPillText}>{ann.hintFormula}</Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Bottom Floating Teacher Badge */}
      <View style={styles.bottomTeacherBadge}>
        <Text style={styles.teacherBadgeAvatar}>👨‍🏫</Text>
        <View style={styles.teacherBadgeTextWrap}>
          <Text style={styles.teacherBadgeTitle}>{selectedTeacherName} ki Feedback</Text>
          <Text style={styles.teacherBadgeSub}>3 points checked • 1 correction needed</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  viewfinderFrame: {
    margin: 24,
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.accentTeal,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  annotationBubble: {
    position: 'absolute',
    left: 28,
    right: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  annotationTag: {
    fontSize: 12,
    fontWeight: '800',
  },
  feedbackText: {
    color: '#F8FAFC',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  formulaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  formulaPillText: {
    color: '#4F46E5',
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 12,
  },
  bottomTeacherBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  teacherBadgeAvatar: {
    fontSize: 26,
    marginRight: 10,
  },
  teacherBadgeTextWrap: {
    flex: 1,
  },
  teacherBadgeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  teacherBadgeSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
