export const lightColors = {
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

  orange: '#FF9F1C',
  orangeSoft: '#FFF0D8',
  success: '#21A365',
  danger: '#EF5B5B',
  pinkSoft: '#FFE9E9',
  pinkBorder: '#FFCACA',
  yellowSoft: '#FFF8D6',
  lavender: '#DDD9FF',
  blueBorder: '#C8DDFF',
  orangeBorder: '#FFD49A',

  scrim: 'rgba(32, 41, 74, 0.08)',
} as const;

export const darkColors = {
  primary: '#7B6CF7',
  primaryDark: '#9A8FFF',
  primarySoft: '#27214F',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#E9E6FF',

  ink: '#EBEFF7',
  slate: '#9DA9BD',
  border: '#27313F',
  surface: '#182033',
  canvas: '#0D1322',

  yellow: '#FFD84D',
  inkDeep: '#1C2752',
  teal: '#14C4AE',
  green: '#17C99E',
  greenSoft: '#0F2E27',
  blue: '#6B9EFF',
  blueSoft: '#132945',
  violet: '#C08FF2',
  violetSoft: '#271C3A',

  orange: '#FFB052',
  orangeSoft: '#3B2B15',
  success: '#2ED18A',
  danger: '#FF7A7A',
  pinkSoft: '#3D2224',
  pinkBorder: '#6A3A3D',
  yellowSoft: '#3A3217',
  lavender: '#C5BFF6',
  blueBorder: '#1E3D6B',
  orangeBorder: '#5F471A',

  scrim: 'rgba(0, 0, 0, 0.35)',
} as const;

export type ThemeColors = { [K in keyof typeof lightColors]: string };

export type ColorToken = keyof typeof lightColors;

export type ThemeMode = 'light' | 'dark';

const PALETTES: Record<ThemeMode, ThemeColors> = {
  light: { ...lightColors },
  dark: { ...darkColors },
};

export const colors: ThemeColors = { ...PALETTES.light };

export function applyColors(mode: ThemeMode) {
  Object.assign(colors, PALETTES[mode]);
}

export const FONT_KEYS = ['regular', 'medium', 'semibold', 'bold', 'extrabold'] as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export type FontToken = keyof typeof fonts;

export const radius = {
  sm: 10,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  frame: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
} as const;

export type SubjectId = 'mathematics' | 'physics' | 'chemistry';

export type Subject = {
  id: SubjectId;
  name: string;
  accent: string;
  soft: string;
};

export function getSubjects(c: ThemeColors = colors): readonly Subject[] {
  return [
    { id: 'mathematics', name: 'Mathematics', accent: c.green, soft: c.greenSoft },
    { id: 'physics', name: 'Physics', accent: c.blue, soft: c.blueSoft },
    { id: 'chemistry', name: 'Chemistry', accent: c.violet, soft: c.violetSoft },
  ];
}

export const SUBJECTS: readonly Subject[] = getSubjects();

export const CLASSES = ['JSS3', 'SS1', 'SS2', 'SS3'] as const;

export type ClassLevel = (typeof CLASSES)[number];

export const HOUR_OPTIONS = [0.5, 1, 1.5, 2, 3] as const;