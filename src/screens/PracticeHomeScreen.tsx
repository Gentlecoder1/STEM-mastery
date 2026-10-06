import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { navigateToTab } from '../navigation/tabs';
import {
  CalendarIcon,
  DivideIcon,
  FlameIcon,
  LineChartIcon,
  TargetIcon,
  TimerIcon,
  TrendingUpIcon,
  ZapIcon,
} from '../components/glyphs';
import { Pill, ProgressBar, SectionHeading } from '../components/PracticeUI';
import { colors, fonts, lightColors, shadow } from '../theme';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles, useTheme } from '../themeContext';

const MODES = [
  {
    id: 'weak',
    title: 'Weak concepts',
    subtitle: 'Adaptive questions from your gaps.',
    bg: 'blueSoft',
    border: 'blueBorder',
    iconBg: 'transparent',
    tint: 'blue',
    Icon: TargetIcon,
    pill: { bg: 'surface', tint: 'blue', label: '5 READY' },
  },
  {
    id: 'speed',
    title: 'Speed round',
    subtitle: '10 quick MCQs against time.',
    bg: 'orangeSoft',
    border: 'orangeBorder',
    iconBg: 'transparent',
    tint: 'orange',
    Icon: TimerIcon,
    pill: { bg: 'surface', tint: 'orange', label: '2 MIN' },
  },
] as const;

const SETS = [
  {
    id: 'graphs',
    title: 'Displacement-time graphs',
    subtitle: 'Physics • 6 questions • 43% mastery',
    bg: 'blueSoft',
    tint: 'blue',
    Icon: LineChartIcon,
    pill: { bg: 'blueSoft', tint: 'blue', label: '+60 XP' },
  },
  {
    id: 'accel',
    title: 'Acceleration basics',
    subtitle: 'Physics • 5 questions • 41% mastery',
    bg: 'orangeSoft',
    tint: 'orange',
    Icon: TrendingUpIcon,
    pill: { bg: 'orangeSoft', tint: 'orange', label: '+50 XP' },
  },
  {
    id: 'equations',
    title: 'Linear equations',
    subtitle: 'Mathematics • 8 questions • 64% mastery',
    bg: 'greenSoft',
    tint: 'green',
    Icon: DivideIcon,
    pill: { bg: 'greenSoft', tint: 'green', label: '+80 XP' },
  },
] as const;

export default function PracticeHomeScreen({ navigation }: RootScreenProps<'Practice'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();

  const startDailyMix = () => navigation.navigate('PracticeQuestion', { index: 0 });

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 14 },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Practice</Text>
            <Text style={styles.subtitle}>Train weak concepts, earn XP</Text>
          </View>
          <Pressable style={styles.headerAction} accessibilityLabel="Practice calendar">
            <CalendarIcon size={20} color={colors.ink} />
          </Pressable>
        </View>

        <Pressable style={styles.dailyCard} onPress={startDailyMix} accessibilityRole="button">
          <View style={styles.dailyRow}>
            <View style={styles.challengeIcon}>
              <ZapIcon size={33} color={lightColors.ink} strokeWidth={1} />
            </View>
            <View style={styles.challengeCopy}>
              <Pill bg="rgba(255,216,77,0.13)" tint={colors.yellow}>
                DAILY MIX
              </Pill>
              <Text style={styles.dailyTitle}>8 questions picked for you</Text>
              <Text style={styles.dailyMeta}>+80 XP • about 6 min</Text>
            </View>
          </View>
          <ProgressBar
            progress={20}
            track="rgba(255,255,255,0.15)"
            fill={colors.yellow}
            style={styles.dailyProgress}
          />
        </Pressable>

        <SectionHeading title="Focus practice" action="How it works" />
        <View style={styles.modeRow}>
          {MODES.map(({ title, subtitle, bg, border, tint, Icon, pill }) => (
            <Pressable
              key={title}
              onPress={startDailyMix}
              style={[
                styles.modeCard,
                { backgroundColor: colors[bg], borderColor: colors[border] },
              ]}
              accessibilityRole="button"
            >
              <View style={styles.modeIcon}>
                <Icon size={25} color={colors[tint]} />
              </View>
              <Text style={styles.modeTitle}>{title}</Text>
              <Text style={styles.modeSubtitle}>{subtitle}</Text>
              <View style={styles.modePillWrap}>
                <Pill bg={colors[pill.bg]} tint={colors[pill.tint]}>
                  {pill.label}
                </Pill>
              </View>
            </Pressable>
          ))}
        </View>

        <SectionHeading title="Recommended sets" action="See all" />
        <View style={styles.setList}>
          {SETS.map(({ title, subtitle, bg, tint, Icon, pill }) => (
            <Pressable key={title} style={styles.setRow} onPress={startDailyMix} accessibilityRole="button">
              <View style={[styles.setIcon, { backgroundColor: colors[bg] }]}>
                <Icon size={19} color={colors[tint]} />
              </View>
              <View style={styles.setCopy}>
                <Text style={styles.setTitle}>{title}</Text>
                <Text style={styles.setSubtitle}>{subtitle}</Text>
              </View>
              <Pill bg={colors[pill.bg]} tint={colors[pill.tint]}>
                {pill.label}
              </Pill>
            </Pressable>
          ))}
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakIcon}>
            <FlameIcon size={25} color={colors.orange} />
          </View>
          <View style={styles.streakCopy}>
            <Text style={styles.streakTitle}>4-day practice streak</Text>
            <Text style={styles.streakSubtitle}>Practice today to reach your best of 7.</Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="Practice" onSelect={navigateToTab(navigation, 'Practice')} />
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 18, gap: 13 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 2,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 25, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.slate },
  headerAction: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dailyCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: lightColors.primary,
    gap: 12,
    ...shadow.frame,
  },
  dailyRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  challengeIcon: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeCopy: { flex: 1, gap: 4 },
  dailyTitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: lightColors.surface },
  dailyMeta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: lightColors.lavender },
  dailyProgress: { marginTop: 2 },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeCard: {
    flex: 1,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    ...shadow.frame,
  },
  modeIcon: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  modeSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 13.5,
    color: colors.slate,
  },
  modePillWrap: { marginTop: 2 },

  setList: { gap: 8 },
  setRow: {
    minHeight: 62,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCopy: { flex: 1, gap: 2 },
  setTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  setSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },

  streakCard: {
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: colors.greenSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadow.frame,
  },
  streakIcon: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center' },
  streakCopy: { flex: 1, gap: 2 },
  streakTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  streakSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },
});