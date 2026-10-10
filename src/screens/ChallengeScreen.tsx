import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { ChevronRightIcon, SparklesIcon, SigmaIcon } from '../components/icons';
import {
  BrainIcon,
  ChartSplineIcon,
  FlaskIcon,
  PlayIcon,
  SlidersIcon,
  TargetIcon,
  TrendingUpIcon,
} from '../components/glyphs';
import { Pill, ProgressBar, SectionHeading } from '../components/PracticeUI';
import { colors, fonts, lightColors, shadow, type ColorToken } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { navigateToTab } from '../navigation/tabs';
import type { RootScreenProps } from '../navigation/types';

type PathRow = {
  title: string;
  subtitle: string;
  tint: ColorToken;
  soft: ColorToken;
  Icon: (props: { size?: number; color?: string; strokeWidth?: number }) => React.JSX.Element;
  leading?: (props: { size?: number; color?: string }) => React.JSX.Element;
  active: boolean;
};

const PATH: readonly PathRow[] = [
  {
    title: 'Targeted mini lesson',
    subtitle: 'Acceleration • 6 min • +40 XP',
    tint: 'orange',
    soft: 'orangeSoft',
    Icon: TrendingUpIcon,
    leading: PlayIcon,
    active: true,
  },
  {
    title: 'Adaptive practice',
    subtitle: '5 questions • about 4 min • +50 XP',
    tint: 'blue',
    soft: 'blueSoft',
    Icon: BrainIcon,
    active: false,
  },
  {
    title: 'Linear equations refresh',
    subtitle: 'Mathematics • 8 min • +60 XP',
    tint: 'green',
    soft: 'greenSoft',
    Icon: SigmaIcon,
    active: false,
  },
];

const CURIOUS = [
  {
    title: 'Why reactions speed up',
    subtitle: 'Chemistry • 5 min',
    bg: 'violetSoft' as ColorToken,
    tint: 'violet' as ColorToken,
    Icon: FlaskIcon,
  },
  {
    title: 'Graphs in real life',
    subtitle: 'Mathematics • 7 min',
    bg: 'greenSoft' as ColorToken,
    tint: 'green' as ColorToken,
    Icon: ChartSplineIcon,
  },
];

export default function ChallengeScreen({ navigation }: RootScreenProps<'Challenge'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>For you</Text>
          <Text style={styles.subtitle}>Adaptive picks for today</Text>
        </View>
        <Pressable style={styles.headerAction} accessibilityLabel="Filter recommendations">
          <SlidersIcon size={19} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 14 },
        ]}
      >
        <Pressable
          style={styles.heroCard}
          onPress={() => navigation.navigate('Practice')}
          accessibilityRole="button"
        >
          <View style={styles.heroRow}>
            <View style={styles.heroIcon}>
              <SparklesIcon size={30} color={lightColors.inkDeep} />
            </View>
            <View style={styles.heroCopy}>
              <Pill bg="rgba(255,216,77,0.13)" tint={colors.yellow}>
                BEST NEXT STEP
              </Pill>
              <Text style={styles.heroTitle}>From slope to acceleration</Text>
              <Text style={styles.heroMeta}>6 min • Physics remediation</Text>
            </View>
          </View>
          <View style={styles.heroReason}>
            <TargetIcon size={16} color={lightColors.lavender} />
            <Text style={styles.heroReasonText}>Chosen to strengthen your 41% acceleration mastery.</Text>
          </View>
        </Pressable>

        <SectionHeading title="Today's path" action="Edit goal" />
        <View style={styles.pathList}>
          {PATH.map(({ title, subtitle, tint, soft, Icon, leading: Leading, active }) => (
            <Pressable
              key={title}
              style={[styles.pathRow, active && styles.pathRowActive]}
              onPress={() => navigation.navigate('Practice')}
              accessibilityRole="button"
            >
              <View style={[styles.pathIcon, { backgroundColor: colors[soft] }]}>
                <Icon size={19} color={colors[tint]} />
              </View>
              <View style={styles.pathCopy}>
                <Text style={styles.pathTitle}>{title}</Text>
                <Text style={styles.pathSubtitle}>{subtitle}</Text>
              </View>
              {Leading ? (
                <Leading size={18} color={colors.primary} />
              ) : (
                <ChevronRightIcon size={20} color={colors.slate} />
              )}
            </Pressable>
          ))}
        </View>

        <SectionHeading title="Because you're curious" />
        <View style={styles.curiousRow}>
          {CURIOUS.map(({ title, subtitle, bg, tint, Icon }) => (
            <Pressable
              key={title}
              style={[styles.curiousCard, { backgroundColor: colors[bg] }]}
              onPress={() => navigation.navigate('Practice')}
              accessibilityRole="button"
            >
              <View style={styles.curiousIcon}>
<Icon size={20} color={colors[tint]} />
                  </View>
                  <Text style={styles.curiousTitle}>{title}</Text>
              <Text style={styles.curiousSubtitle}>{subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalLabel}>Daily learning goal</Text>
            <Text style={styles.goalValue}>12 / 20 min</Text>
          </View>
          <ProgressBar progress={60} track={colors.border} fill={colors.surface} />
        </View>
      </ScrollView>

      <BottomNav active="Subjects" onSelect={navigateToTab(navigation, 'Subjects')} />
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
    paddingBottom: 14,
    paddingHorizontal: 18,
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

  heroCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: lightColors.primary,
    gap: 12,
    ...shadow.frame,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 24,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: lightColors.surface },
  heroMeta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: lightColors.lavender },
  heroReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroReasonText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: lightColors.onPrimaryMuted,
  },

  pathList: { gap: 8 },
  pathRow: {
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
  pathRowActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  pathIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathCopy: { flex: 1, gap: 2 },
  pathTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  pathSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },

  curiousRow: { flexDirection: 'row', gap: 10 },
  curiousCard: {
    flex: 1,
    padding: 13,
    borderRadius: 18,
    gap: 6,
    ...shadow.frame,
  },
  curiousIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  curiousTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  curiousSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },

  goalCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.greenSoft,
    gap: 9,
    ...shadow.frame,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalLabel: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  goalValue: { fontFamily: fonts.extrabold, fontSize: 12, lineHeight: 15, color: colors.success },
});