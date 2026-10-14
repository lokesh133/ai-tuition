import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Shadows } from '../theme/tokens';
import { useAppStore } from '../store/useStore';
import { HomeworkAnnotationOverlay } from '../components/HomeworkAnnotationOverlay';
import { Image as ImageIcon, Sparkles, RefreshCw, Zap } from 'lucide-react-native';

export const HomeworkScannerScreen: React.FC = () => {
  const {
    selectedTeacherId,
    homeworkAnnotations,
    isAnalyzingHomework,
    setIsAnalyzingHomework,
    incrementStars,
  } = useAppStore();

  const [hasScanned, setHasScanned] = useState(false);
  const teacher = Colors.teachers[selectedTeacherId];

  const handleCapture = () => {
    setIsAnalyzingHomework(true);
    setTimeout(() => {
      setIsAnalyzingHomework(false);
      setHasScanned(true);
      incrementStars(25);
    }, 1500);
  };

  const handleReset = () => {
    setHasScanned(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Controls Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Homework Scanner 📸</Text>
          <Text style={styles.screenSub}>Notebook page frame ke andar rakhein</Text>
        </View>

        <TouchableOpacity style={styles.flashBtn}>
          <Zap size={18} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Main Viewfinder Area */}
      <View style={styles.cameraBox}>
        {/* Simulated notebook paper background */}
        <View style={styles.notebookPage}>
          <View style={styles.notebookMarginLine} />
          <View style={styles.mathEquationRow}>
            <Text style={styles.notebookHandwriting}>Q3. 12 × 4 = 48</Text>
          </View>
          <View style={[styles.mathEquationRow, { marginTop: 40 }]}>
            <Text style={styles.notebookHandwriting}>Q4. (3/7) × (-14) = 6</Text>
          </View>
          <View style={[styles.mathEquationRow, { marginTop: 40 }]}>
            <Text style={styles.notebookHandwriting}>Q5. Perimeter = 2 × (L + B) = 30cm</Text>
          </View>
        </View>

        {/* AI Annotation Overlay or Loading Indicator */}
        {hasScanned && (
          <HomeworkAnnotationOverlay
            annotations={homeworkAnnotations}
            selectedTeacherName={teacher.name}
          />
        )}

        {isAnalyzingHomework && (
          <View style={styles.analyzingOverlay}>
            <ActivityIndicator size="large" color={Colors.accentTeal} />
            <Text style={styles.analyzingText}>{teacher.name} notebook check kar rahe hain...</Text>
            <Text style={styles.analyzingSub}>Checking steps, signs & formulas</Text>
          </View>
        )}
      </View>

      {/* Bottom Action Tray */}
      <View style={styles.bottomTray}>
        {!hasScanned ? (
          <View style={styles.captureControlsRow}>
            <TouchableOpacity style={styles.galleryBtn}>
              <ImageIcon size={22} color="#475569" />
              <Text style={styles.btnLabel}>Gallery</Text>
            </TouchableOpacity>

            {/* Shutter Button */}
            <TouchableOpacity
              style={styles.shutterButton}
              onPress={handleCapture}
              disabled={isAnalyzingHomework}
              activeOpacity={0.8}
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.askTeacherBtn, { backgroundColor: teacher.badge }]}
              onPress={handleCapture}
            >
              <Sparkles size={18} color="#FFF" />
              <Text style={styles.askTeacherBtnText}>Auto Solve</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultsActionRow}>
            <TouchableOpacity style={styles.rescanBtn} onPress={handleReset}>
              <RefreshCw size={18} color="#475569" />
              <Text style={styles.rescanBtnText}>Dusra Page Scan Karein</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.explainStepBtn}>
              <Sparkles size={18} color="#FFF" />
              <Text style={styles.explainStepBtnText}>{teacher.name} se samjhein</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  screenSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  flashBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBox: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  notebookPage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  notebookMarginLine: {
    position: 'absolute',
    left: 45,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FDA4AF',
  },
  mathEquationRow: {
    marginLeft: 35,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  notebookHandwriting: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'monospace',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  analyzingText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
  },
  analyzingSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  bottomTray: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#0F172A',
  },
  captureControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  galleryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  btnLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  shutterButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#FFFFFF',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
  },
  askTeacherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  askTeacherBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  resultsActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rescanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  rescanBtnText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
  },
  explainStepBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    ...Shadows.soft,
  },
  explainStepBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
