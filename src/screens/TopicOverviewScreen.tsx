import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { navigateToTab } from '../navigation/tabs';
import { DownloadIcon, GaugeIcon } from '../components/glyphs';
import { ProgressBar } from '../components/PracticeUI';
import { ArrowLeftIcon, CheckCircleIcon, ChevronRightIcon, SparklesIcon } from '../components/icons';
import { colors, fonts, lightColors, shadow, type ColorToken } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { useProgress, type ConceptStatus } from '../progressContext';
import { CONCEPTS } from '../data/learning';
import type { RootScreenProps } from '../navigation/types';
import { usePreferences } from '../preferencesContext';

type PathConcept = {
  id: string;
  title: string;
  status: ConceptStatus;
  needsKey: boolean;
  mastery: number;
  tint: ColorToken;
  soft: ColorToken;
};

export default function TopicOverviewScreen({ navigation }: RootScreenProps<'TopicOverview'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { downloadedTopics, downloadsEnabled, toggleTopicDownload } = usePreferences();
  const { getConceptStatus, isConceptCompleted, isConceptOpen } = useProgress();
  const isDownloaded = downloadedTopics.includes('topic-speed-velocity');

  const concepts: PathConcept[] = CONCEPTS.map((concept) => ({
    id: concept.id,
    title: concept.title,
    status: getConceptStatus(concept.id),
    needsKey: !isConceptCompleted(concept.id) && !isConceptOpen(concept.id),
    mastery: concept.mastery,
    tint: concept.tint,
    soft: concept.soft,
  }));

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back"><ArrowLeftIcon size={23} color={colors.ink} /></Pressable>
          <View style={styles.headerCopy}><Text style={styles.title}>Speed and Velocity</Text><Text style={styles.subtitle}>Physics • Motion</Text></View>
          {downloadsEnabled ? (
            <Pressable
              style={[styles.iconButton, isDownloaded && styles.downloadedButton]}
              onPress={() => toggleTopicDownload('topic-speed-velocity')}
              accessibilityRole="button"
              accessibilityLabel={isDownloaded ? 'Remove download' : 'Download topic'}
            >
              <DownloadIcon size={21} color={isDownloaded ? colors.onPrimary : colors.primary} />
            </Pressable>
          ) : <View style={styles.iconButtonPlaceholder} />}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><GaugeIcon size={34} color={lightColors.surface} /></View>
          <View style={styles.heroCopy}><Text style={styles.eyebrow}>IN PROGRESS</Text><Text style={styles.heroTitle}>Understand how motion changes over time.</Text><Text style={styles.meta}>5 lessons <Text style={styles.dot}>•</Text> 42 min</Text></View>
          <ProgressBar progress={68} track={colors.surface} fill={colors.blue} style={styles.heroBar} />
        </View>
        <Text style={styles.sectionTitle}>What you'll master</Text>
        <View style={styles.masterCard}>{['Distinguish speed from velocity', 'Read displacement-time graphs', 'Calculate acceleration from motion data'].map((item) => <View key={item} style={styles.masterRow}><View style={styles.check}><CheckCircleIcon size={18} color={colors.green} /></View><Text style={styles.masterText}>{item}</Text></View>)}</View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your concept path</Text>
          <Text style={styles.link}>Open map</Text>
        </View>

        <View style={styles.conceptList}>
          {concepts.map((concept) => (
            <ConceptRow
              key={concept.id}
              concept={concept}
              onPress={() => navigation.navigate('ConceptDetails', { conceptId: concept.id })}
            />
          ))}
        </View>

      </ScrollView>
      <BottomNav active="Subjects" onSelect={navigateToTab(navigation, 'Subjects')} />
    </View>
  );
}

function ConceptRow({ concept, onPress }: { concept: PathConcept; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  const isCurrent = concept.status === 'current';
  const isDone = concept.status === 'done';

  const subtitle = isDone
    ? 'Mastered • prerequisite'
    : isCurrent
      ? 'Current concept'
      : concept.needsKey
        ? 'Jump ahead • key test required'
        : 'Recommended next';

  const trailing = isDone ? `${concept.mastery}%` : isCurrent ? 'CONTINUE' : concept.needsKey ? 'KEY TEST' : 'OPEN';

  return (
    <Pressable onPress={onPress} style={[styles.conceptRow, isCurrent && styles.conceptCurrent]}>
      <View style={[styles.conceptIcon, { backgroundColor: colors[concept.soft] }]}>
        {isDone ? (
          <CheckCircleIcon size={22} color={colors[concept.tint]} />
        ) : isCurrent ? (
          <Text style={styles.play}>▷</Text>
        ) : (
          <SparklesIcon size={22} color={colors[concept.tint]} />
        )}
      </View>
      <View style={styles.conceptCopy}>
        <Text style={styles.conceptTitle}>{concept.title}</Text>
        <Text style={styles.conceptSubtitle}>{subtitle}</Text>
      </View>
      <View
        style={[
          styles.trailing,
          isCurrent && styles.continuePill,
          isDone && styles.masteryPill,
          !isDone && !isCurrent && concept.needsKey && styles.keyPill,
        ]}
      >
        <Text
          style={[
            styles.trailingText,
            !isDone && !isCurrent && styles.nextText,
            !isDone && !isCurrent && concept.needsKey && styles.keyText,
          ]}
        >
          {trailing}
        </Text>
      </View>
      {isCurrent ? <ChevronRightIcon size={20} color={colors.blue} /> : null}
    </Pressable>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 18, gap: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  iconButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  downloadedButton: { backgroundColor: colors.primary, borderColor: colors.primary },
  iconButtonPlaceholder: { width: 42, height: 42 },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 25, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.slate },
  hero: { minHeight: 154, padding: 17, borderRadius: 18, borderWidth: 1, borderColor: colors.blueBorder, backgroundColor: colors.blueSoft, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, ...shadow.frame },
  heroIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue },
  heroCopy: { flex: 1, gap: 6 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, color: colors.blue },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.slate },
  dot: { fontFamily: fonts.bold, color: colors.slate },
  heroBar: { width: '100%', height: 12 },
  sectionTitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: colors.ink },
  masterCard: { padding: 16, borderRadius: 22, backgroundColor: colors.surface, gap: 12, ...shadow.frame },
  masterRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  check: { width: 29, height: 29, borderRadius: 999, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  masterText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 19, color: colors.ink },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  conceptList: { gap: 9 },
  conceptRow: { minHeight: 76, padding: 11, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 13 },
  conceptCurrent: { borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface },
  conceptIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  conceptCopy: { flex: 1, gap: 3 },
  conceptTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  conceptSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },
  play: { fontFamily: fonts.regular, fontSize: 27, color: colors.blue },
  trailing: { minWidth: 48, height: 30, paddingHorizontal: 11, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  masteryPill: { backgroundColor: colors.greenSoft },
  continuePill: { backgroundColor: colors.surface },
  keyPill: { backgroundColor: colors.primarySoft },
  trailingText: { fontFamily: fonts.medium, fontSize: 12, color: colors.green },
  nextText: { color: colors.orange, fontSize: 25, lineHeight: 25 },
  keyText: { color: colors.primary, fontSize: 10, letterSpacing: 0.4 },
  primaryButton: { height: 68, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, ...shadow.card },
  primaryArrow: { fontFamily: fonts.regular, fontSize: 25, color: colors.onPrimary },
  primaryText: { fontFamily: fonts.regular, fontSize: 19, color: colors.onPrimary },
});
