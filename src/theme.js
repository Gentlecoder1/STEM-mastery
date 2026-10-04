export const colors = {
  primary: '#5B4CF0',
  primaryDark: '#3329A6',
  primarySoft: '#EEECFF',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#E9E6FF',

  ink: '#17212B',
  slate: '#657383',
  border: '#E5EAF1',
  surface: '#FFFFFF',
  canvas: '#F6F8FC',

  yellow: '#FFD84D',
  inkDeep: '#16204A',
  teal: '#0FAF9A',
  green: '#00A887',
  greenSoft: '#DFF8F1',
  blue: '#2979FF',
  blueSoft: '#E8F1FF',
  violet: '#9A54E8',
  violetSoft: '#F2E9FC',

  scrim: 'rgba(32, 41, 74, 0.08)',
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

export const radius = {
  sm: 10,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#3329A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.161,
    shadowRadius: 20,
    elevation: 6,
  },
  frame: {
    shadowColor: '#20294A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.078,
    shadowRadius: 18,
    elevation: 4,
  },
};

export const SUBJECTS = [
  { id: 'mathematics', name: 'Mathematics', accent: colors.green, soft: colors.greenSoft },
  { id: 'physics', name: 'Physics', accent: colors.blue, soft: colors.blueSoft },
  { id: 'chemistry', name: 'Chemistry', accent: colors.violet, soft: colors.violetSoft },
];

export const CLASSES = ['JSS3', 'SS1', 'SS2', 'SS3'];
