import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import MasteryRing from '../components/MasteryRing';
import { AtomIcon, CheckIcon, FlaskIcon, SigmaIcon } from '../components/icons';
import { CalendarIcon, FlameIcon, MedalIcon } from '../components/glyphs';
import { Pill, SectionHeading } from '../components/PracticeUI';
import { colors, fonts, lightColors, shadow, type ColorToken } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { navigateToTab } from '../navigation/tabs';
import type { RootScreenProps } from '../navigation/types';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const DONE_DAYS = 4;

const METRICS = [
  { value: '23', label: 'Lessons', tint: 'blue' as ColorToken },
  { value: '86%', label: 'Accuracy', tint: 'success' as ColorToken },
  { value: '6h 42m', label: 'Learning', tint: 'primary' as ColorToken },
] as const;

const MASTERY = [
  { name: 'Mathematics', Icon: SigmaIcon, tint: 'green' as ColorToken, soft: 'greenSoft' as ColorToken, delta: '+4% this month', percent: 74 },
  { name: 'Physics', Icon: AtomIcon, tint: 'blue' as ColorToken, soft: 'blueSoft' as ColorToken, delta: '+6% this month', percent: 68 },
  { name: 'Chemistry', Icon: FlaskIcon, tint: 'violet' as ColorToken, soft: 'violetSoft' as ColorToken, delta: '+2% this month', percent: 55 },
] as const;

const MILESTONES = [
  {
    title: 'Graph reader',
    subtitle: '75% mastery reached',
    bg: 'yellowSoft' as ColorToken,
    Icon: MedalIcon,
    tint: 'orange' as ColorToken,
  },
  {
    title: 'Week warrior',
    subtitle: '4 days in a row',
    bg: 'primarySoft' as ColorToken,
    Icon: FlameIcon,
    tint: 'primary' as ColorToken,
  },
] as const;

export default function ProgressScreen({ navigation }: RootScreenProps<'Progress'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);

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
            <Text style={styles.title}>Your progress</Text>
            <Text style={styles.subtitle}>Keep building mastery, Iseoluwa</Text>
          </View>
          <Pressable style={styles.headerAction} accessibilityLabel="Progress calendar">
            <CalendarIcon size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.streakCard}>
          <Text style={styles.streakEyebrow}>THIS WEEK</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakTitle}>4-day streak 🔥</Text>
            <Pill bg={colors.yellow} tint={lightColors.inkDeep} size={11}>
              +340 XP
            </Pill>
          </View>
          <View style={styles.daysRow}>
            {DAYS.map((day, index) => {
              const done = index < DONE_DAYS;
              return (
                <View key={`${day}-${index}`} style={styles.dayWrap}>
                  <View style={[styles.dayDot, !done && styles.dayDotPending]}>
                    {done ? (
                      <CheckIcon size={14} color={lightColors.surface} strokeWidth={2} />
                    ) : (
                      <Text style={styles.dayLetter}>{day}</Text>
                    )}
                  </View>
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.streakCaption}>One more day to beat last week</Text>
        </View>

        <View style={styles.metricsCard}>
          {METRICS.map(({ value, label, tint }, index) => (
            <View key={label} style={styles.metricsRow}>
              {index > 0 ? <View style={styles.metricDivider} /> : null}
              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: colors[tint] }]}>{value}</Text>
                <Text style={styles.metricLabel}>{label}</Text>
              </View>
            </View>
          ))}
        </View>

        <SectionHeading title="Subject mastery" action="Details" onAction={() => navigation.navigate('ConceptProgress')} />
        <View style={styles.masteryList}>
          {MASTERY.map(({ name, Icon, tint, soft, delta, percent }) => (
            <Pressable
              key={name}
              style={styles.masteryRow}
              onPress={() => navigation.navigate('ConceptProgress')}
              accessibilityRole="button"
            >
              <View style={[styles.masteryIcon, { backgroundColor: colors[soft] }]}>
                <Icon size={19} color={colors[tint]} />
              </View>
              <View style={styles.masteryCopy}>
                <Text style={styles.masteryName}>{name}</Text>
                <Text style={[styles.masteryDelta, { color: colors.success }]}>{delta}</Text>
              </View>
              <MasteryRing percent={percent} color={colors[tint]} size={46} />
            </Pressable>
          ))}
        </View>

        <SectionHeading title="Recent milestones" />
        <View style={styles.milestoneRow}>
          {MILESTONES.map(({ title, subtitle, bg, Icon, tint }) => (
            <View key={title} style={[styles.milestoneCard, { backgroundColor: colors[bg] }]}>
              <View style={styles.milestoneIcon}>
                <Icon size={24} color={colors[tint]} />
              </View>
              <Text style={styles.milestoneTitle}>{title}</Text>
              <Text style={styles.milestoneSubtitle}>{subtitle}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav active="Progress" onSelect={navigateToTab(navigation, 'Progress')} />
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

  streakCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: lightColors.inkDeep,
    gap: 12,
    ...shadow.frame,
  },
  streakEyebrow: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1.2,
    color: lightColors.lavender,
  },
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  streakTitle: { fontFamily: fonts.regular, fontSize: 19, lineHeight: 23, color: lightColors.surface },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayWrap: { alignItems: 'center', gap: 5 },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotPending: { backgroundColor: 'rgba(255,255,255,0.09)' },
  dayLetter: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    color: lightColors.slate,
  },
  dayLabel: {
    fontFamily: fonts.medium,
    fontSize: 9,
    lineHeight: 11,
    color: '#D9DEF3',
  },
  streakCaption: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: '#D9DEF3',
    textAlign: 'center',
  },

  metricsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    ...shadow.frame,
  },
  metricsRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  metricDivider: {
    width: 1,
    height: 38,
    backgroundColor: colors.border,
  },
  metric: { flex: 1, alignItems: 'center', gap: 3 },
  metricValue: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 20 },
  metricLabel: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 12, color: colors.slate },

  masteryList: { gap: 8 },
  masteryRow: {
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
  masteryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masteryCopy: { flex: 1, gap: 2 },
  masteryName: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  masteryDelta: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13 },

  milestoneRow: { flexDirection: 'row', gap: 10 },
  milestoneCard: {
    flex: 1,
    padding: 13,
    borderRadius: 18,
    gap: 6,
    ...shadow.frame,
  },
  milestoneIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  milestoneTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  milestoneSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },
});
