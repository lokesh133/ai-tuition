// Design System Tokens for AI Tuition App (Classes 1st - 8th)
export const Colors = {
  // Vibrant Brand Colors
  primary: '#FF6B35', // Warm saffron orange - high energy & friendly
  primaryDark: '#E85520',
  secondary: '#4F46E5', // Deep indigo - curiosity & learning
  accentTeal: '#06D6A0', // Fresh emerald teal - success & clarity
  accentYellow: '#FFD166', // Joyful sunshine yellow - stars & achievements
  accentPink: '#EF476F', // Playful magenta pink
  accentPurple: '#8B5CF6', // Magic violet

  // Backgrounds & Surfaces (Glassmorphic & soft)
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  glassOverlay: 'rgba(255, 255, 255, 0.88)',
  glassBorder: 'rgba(255, 255, 255, 0.4)',
  surfaceHighlight: '#F1F5F9',

  // Text Colors (High contrast for readability by young children)
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textLight: '#FFFFFF',

  // Teacher Avatar Specific Colors
  teachers: {
    neha: { bg: '#E0F2FE', border: '#38BDF8', badge: '#0284C7', name: 'Neha Mam', subject: 'Science 🔬' },
    sharma: { bg: '#FEF3C7', border: '#FBBF24', badge: '#D97706', name: 'Sharma Sir', subject: 'Math 📐' },
    riya: { bg: '#FCE7F3', border: '#F472B6', badge: '#DB2777', name: 'Riya Didi', subject: 'English 📚' },
    kabir: { bg: '#EDE9FE', border: '#A78BFA', badge: '#7C3AED', name: 'Kabir Sir', subject: 'SST 🌍' },
    pooja: { bg: '#DCFCE7', border: '#4ADE80', badge: '#16A34A', name: 'Pooja Mam', subject: 'Hindi ✍️' },
  },

  // State Colors
  listening: '#EF4444', // Active red pulse
  thinking: '#F59E0B',  // Amber
  speaking: '#10B981',  // Emerald active
  idle: '#6366F1',      // Soft Indigo
};

export const Shadows = {
  soft: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  glow: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  }
};
