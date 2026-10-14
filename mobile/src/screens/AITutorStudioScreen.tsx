import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Colors } from '../theme/tokens';
import { useAppStore, EmotionState, LanguageMode } from '../store/useStore';
import { TeacherAvatarHeader } from '../components/TeacherAvatarHeader';
import { InteractiveWhiteboard } from '../components/InteractiveWhiteboard';
import { VoiceWaveformVisualizer } from '../components/VoiceWaveformVisualizer';
import { Globe2, Send, Volume2 } from 'lucide-react-native';

const EMOTIONS: EmotionState[] = ['Greeting', 'Listening', 'Thinking', 'Speaking'];
const LANGUAGES: LanguageMode[] = ['Hinglish', 'Hindi', 'English'];

export const AITutorStudioScreen: React.FC = () => {
  const {
    selectedTeacherId,
    teacherEmotion,
    setTeacherEmotion,
    isPushToTalkActive,
    setIsPushToTalkActive,
    languageMode,
    setLanguageMode,
    studioMessages,
    addStudioMessage,
    whiteboardSteps,
    addWhiteboardStep,
    clearWhiteboard,
    incrementStars,
  } = useAppStore();

  const [inputText, setInputText] = useState('');

  const handleMicPressIn = () => {
    setIsPushToTalkActive(true);
    setTeacherEmotion('Listening');
  };

  const handleMicPressOut = () => {
    setIsPushToTalkActive(false);
    setTeacherEmotion('Thinking');

    // Simulate AI thinking and generating voice + whiteboard response
    setTimeout(() => {
      setTeacherEmotion('Speaking');
      addStudioMessage({
        sender: 'student',
        text: 'Sir, LCM aur HCF ka short trick kya hai?',
      });

      setTimeout(() => {
        addStudioMessage({
          sender: 'teacher',
          text: 'Dekho beta, Prime Factorization method se Common factor nikaalo. Whiteboard par dekhein!',
        });

        addWhiteboardStep({
          id: `step-${Date.now()}`,
          type: 'formula',
          content: 'LCM(12, 18) = 2 × 2 × 3 × 3 = 36',
          annotation: 'Highest powers of prime numbers multiply kiye gaye!',
          color: '#4F46E5',
        });

        incrementStars(10);
      }, 700);
    }, 1200);
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    const userText = inputText;
    setInputText('');

    addStudioMessage({
      sender: 'student',
      text: userText,
    });

    setTeacherEmotion('Thinking');
    setTimeout(() => {
      setTeacherEmotion('Speaking');
      addStudioMessage({
        sender: 'teacher',
        text: `Bahut badhiya sawaal! "${userText}" ka step-by-step solution whiteboard par note kar diya hai.`,
      });
      incrementStars(5);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Teacher Status Bar */}
      <TeacherAvatarHeader teacherId={selectedTeacherId} emotion={teacherEmotion} />

      {/* Language Switcher & Emotion Debug Chips */}
      <View style={styles.controlRow}>
        <View style={styles.langPillContainer}>
          <Globe2 size={13} color="#475569" />
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => setLanguageMode(lang)}
              style={[
                styles.langChip,
                languageMode === lang && styles.langChipActive,
              ]}
            >
              <Text
                style={[
                  styles.langChipText,
                  languageMode === lang && styles.langChipTextActive,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Emotion State Tester */}
        <View style={styles.emotionChips}>
          {EMOTIONS.map((emo) => (
            <TouchableOpacity
              key={emo}
              onPress={() => setTeacherEmotion(emo)}
              style={[
                styles.miniChip,
                teacherEmotion === emo && styles.miniChipActive,
              ]}
            >
              <Text
                style={[
                  styles.miniChipText,
                  teacherEmotion === emo && styles.miniChipTextActive,
                ]}
              >
                {emo[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Interactive Whiteboard Canvas */}
      <InteractiveWhiteboard
        steps={whiteboardSteps}
        onClear={clearWhiteboard}
      />

      {/* Live Conversation Transcript */}
      <ScrollView
        style={styles.transcriptScroll}
        contentContainerStyle={styles.transcriptContent}
        showsVerticalScrollIndicator={false}
      >
        {studioMessages.map((msg) => {
          const isStudent = msg.sender === 'student';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                isStudent ? styles.studentBubble : styles.teacherBubble,
              ]}
            >
              <View style={styles.messageSenderRow}>
                <Text style={styles.senderName}>
                  {isStudent ? 'You (Aarav)' : Colors.teachers[selectedTeacherId].name}
                </Text>
                {!isStudent && <Volume2 size={12} color="#059669" />}
                <Text style={styles.timestampText}>{msg.timestamp}</Text>
              </View>
              <Text
                style={[
                  styles.messageText,
                  isStudent ? styles.studentMessageText : styles.teacherMessageText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Voice Waveform & Push to Talk Section */}
      <VoiceWaveformVisualizer
        isActive={isPushToTalkActive}
        onPressIn={handleMicPressIn}
        onPressOut={handleMicPressOut}
        languageLabel={languageMode}
      />

      {/* Optional Quick Type Input for silent classrooms */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Ya yahan type karein apna sawaal..."
          placeholderTextColor="#94A3B8"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendText}>
          <Send size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  langPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  langChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  langChipActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  langChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  langChipTextActive: {
    color: Colors.secondary,
    fontWeight: '800',
  },
  emotionChips: {
    flexDirection: 'row',
    gap: 4,
  },
  miniChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniChipActive: {
    backgroundColor: Colors.secondary,
  },
  miniChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  miniChipTextActive: {
    color: '#FFFFFF',
  },
  transcriptScroll: {
    flex: 1,
    marginHorizontal: 16,
  },
  transcriptContent: {
    paddingVertical: 8,
    gap: 8,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 12,
  },
  studentBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#EEF2FF',
    borderBottomRightRadius: 4,
  },
  teacherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  timestampText: {
    fontSize: 9,
    color: '#94A3B8',
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  studentMessageText: {
    color: Colors.textPrimary,
  },
  teacherMessageText: {
    color: '#1E293B',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    height: 38,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
