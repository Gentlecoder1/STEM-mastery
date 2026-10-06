import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { navigateToTab } from '../navigation/tabs';
import {
  ArrowUpRightIcon,
  InfoIcon,
  PlayIcon,
  ScanSearchIcon,
  TrendingUpIcon,
} from '../components/glyphs';
import { ArrowLeftIcon } from '../components/icons';
import { ActionButton, Pill, SectionHeading } from '../components/PracticeUI';
import { colors, fonts, lightColors, shadow } from '../theme';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles, useTheme } from '../themeContext';

const EVIDENCE = [
  { value: '2', text: 'quiz answers mixed up velocity and acceleration' },
  { value: '1', text: 'written explanation missed the final link' },
  { value: '43%', text: 'current mastery on displacement-time graphs' },
] as const;

export default function PracticeRecommendationScreen({
  navigation,
}: RootScreenProps<'PracticeRecommendation'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();

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
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
            <ArrowLeftIcon size={23} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Your next best step</Text>
            <Text style={styles.headerSubtitle}>Based on today’s quiz</Text>
          </View>
          <Pressable style={styles.iconButton} accessibilityLabel="How recommendations work">
            <InfoIcon size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.diagnosticCard}>
          <View style={styles.diagnosticTop}>
            <View style={styles.diagnosticIcon}>
              <ScanSearchIcon size={29} color={lightColors.surface} />
            </View>
            <View style={styles.diagnosticCopy}>
              <Pill bg={colors.surface} tint={colors.orange} style={styles.diagnosticPill}>
                DIAGNOSTIC
              </Pill>
              <Text style={styles.diagnosticTitle}>One concept is holding you back</Text>
            </View>
          </View>
          <Text style={styles.diagnosticBody}>
            You read graph slopes well, but need a clearer link between changing velocity and
            acceleration.
          </Text>
        </View>

        <SectionHeading title="Recommended for you" />

        <View style={styles.lessonCard}>
          <View style={styles.lessonTop}>
            <View style={styles.lessonIcon}>
              <TrendingUpIcon size={30} color={colors.blue} />
            </View>
            <View style={styles.lessonCopy}>
              <Pill bg={colors.blueSoft} tint={colors.blue} style={styles.lessonPill}>
                6 MIN • MINI LESSON
              </Pill>
              <Text style={styles.lessonTitle}>From slope to acceleration</Text>
              <Text style={styles.lessonSubtitle}>A visual explanation with 3 checks.</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.gainRow}>
            <View style={styles.gainCopy}>
              <Text style={styles.gainLabel}>EXPECTED MASTERY</Text>
              <Text style={styles.gainValue}>41% → about 60%</Text>
            </View>
            <ArrowUpRightIcon size={22} color={colors.ink} />
          </View>
          <ActionButton
            onPress={() => navigation.navigate('PracticeLesson')}
            leading={<PlayIcon size={18} color={colors.onPrimary} />}
          >
            Start mini lesson
          </ActionButton>
        </View>

        <SectionHeading title="Why this recommendation?" />

        <View style={styles.evidenceCard}>
          {EVIDENCE.map((row) => (
            <View key={row.text} style={styles.evidenceRow}>
              <View style={styles.evidenceBadge}>
                <Text style={styles.evidenceValue}>{row.value}</Text>
              </View>
              <Text style={styles.evidenceText}>{row.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.linkWrap}
          onPress={() => navigation.navigate('Practice')}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Choose a different activity</Text>
        </Pressable>
      </ScrollView>

      <BottomNav active="Practice" onSelect={navigateToTab(navigation, 'Practice')} />
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 18, gap: 13 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 2 },
  headerTitle: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 25, color: colors.ink },
  headerSubtitle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.slate },

  diagnosticCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    backgroundColor: colors.orangeSoft,
    gap: 12,
    ...shadow.frame,
  },
  diagnosticTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  diagnosticIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosticCopy: { flex: 1, gap: 6 },
  diagnosticPill: { paddingHorizontal: 10, paddingVertical: 4 },
  diagnosticTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: colors.ink },
  diagnosticBody: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.ink },

  lessonCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 12,
    ...shadow.frame,
  },
  lessonTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lessonIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonCopy: { flex: 1, gap: 4 },
  lessonPill: { paddingHorizontal: 10, paddingVertical: 4 },
  lessonTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: colors.ink },
  lessonSubtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.slate },
  divider: { height: 1, backgroundColor: colors.border },
  gainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  gainCopy: { gap: 3 },
  gainLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    color: colors.slate,
  },
  gainValue: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.success },

  evidenceCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
    ...shadow.frame,
  },
  evidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  evidenceBadge: {
    minWidth: 42,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceValue: { fontFamily: fonts.extrabold, fontSize: 12, lineHeight: 15, color: colors.primary },
  evidenceText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.slate,
  },

  linkWrap: { alignItems: 'center', paddingVertical: 4 },
  linkText: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15, color: colors.primary },
});