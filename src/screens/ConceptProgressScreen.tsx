import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import MasteryRing from '../components/MasteryRing';
import { ArrowLeftIcon, CheckCircleIcon, SparklesIcon } from '../components/icons';
import { MessageTextIcon, RotateCcwIcon, ShareIcon } from '../components/glyphs';
import { Pill, ProgressBar, SectionHeading } from '../components/PracticeUI';
import { colors, fonts, shadow, type ColorToken } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { navigateToTab } from '../navigation/tabs';
import type { RootScreenProps } from '../navigation/types';

const CONCEPTS = [
  {
    name: 'Distance & displacement',
    status: 'Secure',
    pct: 92,
    tint: 'success' as ColorToken,
  },
  {
    name: 'Speed vs velocity',
    status: 'Developing',
    pct: 72,
    tint: 'blue' as ColorToken,
  },
  {
    name: 'Displacement-time graphs',
    status: 'Practise',
    pct: 58,
    tint: 'orange' as ColorToken,
  },
  {
    name: 'Acceleration',
    status: 'Needs support',
    pct: 41,
    tint: 'danger' as ColorToken,
  },
];

const SIGNALS = [
  {
    value: '82%',
    label: 'MCQ accuracy',
    tint: 'success' as ColorToken,
    Icon: CheckCircleIcon,
  },
  {
    value: '71%',
    label: 'Explanations',
    tint: 'blue' as ColorToken,
    Icon: MessageTextIcon,
  },
  {
    value: '3',
    label: 'Reviews',
    tint: 'primary' as ColorToken,
    Icon: RotateCcwIcon,
  },
];

export default function ConceptProgressScreen({ navigation }: RootScreenProps<'ConceptProgress'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.headerAction}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeftIcon size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Speed and Velocity</Text>
          <Text style={styles.headerSubtitle}>Detailed mastery • Physics</Text>
        </View>
        <Pressable style={styles.headerAction} accessibilityRole="button" accessibilityLabel="Share">
          <ShareIcon size={19} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 14 },
        ]}
      >
        <View style={styles.summaryCard}>
          <MasteryRing percent={68} color={colors.blue} size={82} labelColor={colors.ink} />
          <Pill bg={colors.surface} tint={colors.blue} size={10}>
            DEVELOPING
          </Pill>
          <Text style={styles.summaryTitle}>12 of 18 skills secure</Text>
          <Text style={styles.summaryDelta}>↑ 7% in the last 14 days</Text>
        </View>

        <SectionHeading title="Concept mastery" action="How we calculate" />
        <View style={styles.conceptCard}>
          {CONCEPTS.map(({ name, status, pct, tint }) => (
            <View key={name} style={styles.conceptRow}>
              <View style={styles.conceptHeader}>
                <Text style={styles.conceptName}>{name}</Text>
                <Text style={[styles.conceptStatus, { color: colors[tint] }]}>
                  {status} {pct}%
                </Text>
              </View>
              <ProgressBar progress={pct} track={colors.border} fill={colors[tint]} style={styles.conceptBar} />
            </View>
          ))}
        </View>

        <SectionHeading title="Learning signals" />
        <View style={styles.signalsRow}>
          {SIGNALS.map(({ value, label, tint, Icon }) => (
            <View key={label} style={styles.signalCard}>
              <View style={[styles.signalIcon, { backgroundColor: 'transparent' }]}>
                <Icon size={22} color={colors[tint]} />
              </View>
              <Text style={styles.signalValue}>{value}</Text>
              <Text style={styles.signalLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <SparklesIcon size={20} color={colors.orange} />
          </View>
          <Text style={styles.insightText}>
            Practising acceleration twice could move this topic to secure.
          </Text>
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
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
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
  headerCopy: { flex: 1, gap: 2 },
  headerTitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: colors.ink },
  headerSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },

  summaryCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: colors.blueSoft,
    borderWidth: 1,
    borderColor: colors.blueBorder,
    ...shadow.frame,
  },
  summaryTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: colors.ink },
  summaryDelta: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, color: colors.success },

  conceptCard: {
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.surface,
    gap: 13,
    ...shadow.frame,
  },
  conceptRow: { gap: 6 },
  conceptHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  conceptName: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.ink },
  conceptStatus: { fontFamily: fonts.semibold, fontSize: 10, lineHeight: 13 },
  conceptBar: { height: 8 },

  signalsRow: { flexDirection: 'row', gap: 10 },
  signalCard: {
    flex: 1,
    padding: 10,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 4,
    ...shadow.frame,
  },
  signalIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  signalValue: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 20, color: colors.ink },
  signalLabel: { fontFamily: fonts.regular, fontSize: 9, lineHeight: 12, color: colors.slate, textAlign: 'center' },

  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.orangeSoft,
    ...shadow.frame,
  },
  insightIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  insightText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.ink },
});