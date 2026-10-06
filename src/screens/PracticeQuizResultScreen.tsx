import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MasteryRing from '../components/MasteryRing';
import { SparklesIcon } from '../components/icons';
import {
  ArrowUpIcon,
  FlagIcon,
  LineChartIcon,
  StarIcon,
  TrendingUpIcon,
  TrophyIcon,
} from '../components/glyphs';
import { Pill } from '../components/PracticeUI';
import { colors, fonts, shadow, type ColorToken } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import type { RootScreenProps } from '../navigation/types';

const STATS = [
  { value: '5', label: 'First try', tint: 'success' as ColorToken },
  { value: '04:38', label: 'Time', tint: 'blue' as ColorToken },
  { value: '3', label: 'Best streak', tint: 'orange' as ColorToken },
];

const UPDATES = [
  {
    title: 'Graph interpretation',
    subtitle: '68% → 75% • Strong improvement',
    Icon: LineChartIcon,
    tint: 'success' as ColorToken,
    soft: 'greenSoft' as ColorToken,
    trailing: ArrowUpIcon,
  },
  {
    title: 'Acceleration reasoning',
    subtitle: '41% • Needs one quick review',
    Icon: TrendingUpIcon,
    tint: 'orange' as ColorToken,
    soft: 'orangeSoft' as ColorToken,
    trailing: null,
  },
];

export default function PracticeQuizResultScreen({
  navigation,
  route,
}: RootScreenProps<'PracticeQuizResult'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const correct = route.params?.correct ?? 6;
  const xp = route.params?.xp ?? 75;

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 18 },
        ]}
      >
        <Pill bg={colors.primarySoft} tint={colors.primary}>
          <FlagIcon size={13} color={colors.primary} />
          <Text style={styles.quizPillText}>QUIZ COMPLETE</Text>
        </Pill>

        <View style={styles.trophyTile}>
          <TrophyIcon size={55} color={colors.inkDeep} />
        </View>

        <View style={styles.headingWrap}>
          <Text style={styles.heading}>Nice work, Iseoluwa!</Text>
          <Text style={styles.subheading}>You're getting stronger at reading motion graphs.</Text>
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <MasteryRing percent={75} color={colors.primary} size={92} />
            <View style={styles.scoreCopy}>
              <Text style={styles.scoreEyebrow}>YOUR SCORE</Text>
              <Text style={styles.scoreTitle}>{correct} of 8 correct</Text>
              <View style={styles.xpRow}>
                <StarIcon size={14} color={colors.orange} />
                <Text style={styles.xpText}>+{xp} XP earned</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            {STATS.map(({ value, label, tint }, index) => (
              <View key={label} style={styles.statWrap}>
                {index > 0 ? <View style={styles.statDivider} /> : null}
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors[tint] }]}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.updateTitle}>Mastery update</Text>
        <View style={styles.updateList}>
          {UPDATES.map(({ title, subtitle, Icon, tint, soft, trailing: Trailing }) => (
            <View key={title} style={styles.updateRow}>
              <View style={[styles.updateIcon, { backgroundColor: colors[soft] }]}>
                <Icon size={19} color={colors[tint]} />
              </View>
              <View style={styles.updateCopy}>
                <Text style={styles.updateName}>{title}</Text>
                <Text style={styles.updateMeta}>{subtitle}</Text>
              </View>
              {Trailing ? (
                <Trailing size={17} color={colors.success} />
              ) : (
                <Pill bg={colors.orangeSoft} tint={colors.orange}>
                  REVIEW
                </Pill>
              )}
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.reviewButton, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate('PracticeRecommendation')}
            accessibilityRole="button"
          >
            <SparklesIcon size={18} color={colors.surface} />
            <Text style={styles.reviewButtonText}>See recommended review</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.practiceButton, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate('Practice')}
            accessibilityRole="button"
          >
            <Text style={styles.practiceButtonText}>Back to practice</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 18, gap: 14, alignItems: 'center' },

  quizPillText: { fontFamily: fonts.extrabold, fontSize: 10, lineHeight: 12, color: colors.primary },

  trophyTile: {
    width: 102,
    height: 102,
    borderRadius: 24,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },

  headingWrap: { alignItems: 'center', gap: 7 },
  heading: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 33, color: colors.ink, textAlign: 'center' },
  subheading: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 19,
    color: colors.slate,
    textAlign: 'center',
    maxWidth: 320,
  },

  scoreCard: {
    alignSelf: 'stretch',
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    gap: 13,
    ...shadow.frame,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreCopy: { flex: 1, gap: 5 },
  scoreEyebrow: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    color: colors.slate,
  },
  scoreTitle: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 33, color: colors.ink },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  xpText: { fontFamily: fonts.extrabold, fontSize: 13, lineHeight: 16, color: colors.orange },
  divider: { height: 1, backgroundColor: colors.border },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 20 },
  statLabel: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 12, color: colors.slate },

  updateTitle: {
    alignSelf: 'stretch',
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 21,
    color: colors.ink,
  },
  updateList: { alignSelf: 'stretch', gap: 8 },
  updateRow: {
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
  updateIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateCopy: { flex: 1, gap: 2 },
  updateName: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  updateMeta: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },

  actions: { alignSelf: 'stretch', gap: 9, paddingTop: 4 },
  reviewButton: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.card,
  },
  reviewButtonText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 18, color: colors.surface },
  practiceButton: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceButtonText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 18, color: colors.primary },
  buttonPressed: { opacity: 0.85 },
});