import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { navigateToTab } from '../navigation/tabs';
import { DownloadIcon, GaugeIcon } from '../components/glyphs';
import { ProgressBar } from '../components/PracticeUI';
import { ArrowLeftIcon, ChevronRightIcon, LockIcon } from '../components/icons';
import { colors, fonts, lightColors, shadow, type ColorToken } from '../theme';
import { useThemedStyles, useTheme } from '../themeContext';
import { useProgress, type ConceptStatus } from '../progressContext';
import { useCatalog } from '../catalogContext';
import type { RootScreenProps } from '../navigation/types';
import { usePreferences } from '../preferencesContext';

type PathConcept = {
  id: string;
  title: string;
  status: ConceptStatus;
  tint: ColorToken;
  soft: ColorToken;
};

export default function TopicOverviewScreen({ navigation, route }: RootScreenProps<'TopicOverview'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { downloadedLessons, downloadsEnabled, toggleTopicDownload } = usePreferences();
  const { getConceptStatus, getTopicMastery, topicAssessments } = useProgress();
  const { topics, subjects, getConcept, getTopicConceptIds } = useCatalog();
  const requestedTopicId = route.params?.topicId;
  const topic = (requestedTopicId ? topics.find((item) => item.id === requestedTopicId) : undefined) ?? topics[0];
  const topicId = topic?.id ?? '';
  const topicTitle = topic?.name ?? 'Topic';
  const subjectName = subjects.find((item) => String(item.id) === String(topic?.subjectId))?.name ?? 'Subject';
  const topicLessonIds = getTopicConceptIds(topicId);
  const topicMastery = getTopicMastery(topicId);
  const latestAssessment = topicAssessments[topicId];
  const isDownloaded =
    topicLessonIds.length > 0 && topicLessonIds.every((id) => downloadedLessons.includes(id));

  const concepts: PathConcept[] = topicLessonIds
    .map((id) => getConcept(id))
    .filter((concept): concept is NonNullable<typeof concept> => Boolean(concept))
    .map((concept) => ({
      id: concept.id,
      title: concept.title,
      status: getConceptStatus(concept.id),
      tint: concept.tint,
      soft: concept.soft,
    }));

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back"><ArrowLeftIcon size={23} color={colors.ink} /></Pressable>
          <View style={styles.headerCopy}><Text style={styles.title}>{topicTitle}</Text><Text style={styles.subtitle}>{subjectName}</Text></View>
          {downloadsEnabled ? (
            <Pressable
              style={[styles.iconButton, isDownloaded && styles.downloadedButton]}
              onPress={() => toggleTopicDownload(topicId)}
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
          <View style={styles.heroCopy}><Text style={styles.eyebrow}>{subjectName.toUpperCase()}</Text><Text style={styles.heroTitle}>{topicTitle}</Text><Text style={styles.meta}>{topicLessonIds.length} {topicLessonIds.length === 1 ? 'lesson' : 'lessons'}</Text></View>
          <ProgressBar progress={topicMastery} track={colors.surface} fill={colors.blue} style={styles.heroBar} />
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your concept path</Text>
          <Text style={styles.link}>Open map</Text>
        </View>

        <View style={styles.conceptList}>
          {concepts.map((concept) => (
            <ConceptRow
              key={concept.id}
              concept={concept}
              onPress={() => {
                if (concept.status === 'open') {
                  Alert.alert('Concept locked', 'Complete and pass the previous concept quiz with at least 60% to unlock this concept.');
                  return;
                }
                navigation.navigate('ConceptDetails', { conceptId: concept.id });
              }}
            />
          ))}
        </View>
        {latestAssessment && !latestAssessment.passed ? (
          <View style={styles.retakeCard}>
            <Text style={styles.retakeTitle}>Keep building this topic</Text>
            <Text style={styles.retakeText}>
              Your latest test score was {latestAssessment.scorePct}%. Score at least 60% to record topic mastery.
            </Text>
            <Pressable
              style={styles.retakeButton}
              onPress={() => navigation.navigate('ConceptQuiz', { conceptId: topicLessonIds[topicLessonIds.length - 1] })}
            >
              <Text style={styles.retakeButtonText}>Retake questions</Text>
            </Pressable>
          </View>
        ) : null}

      </ScrollView>
      <BottomNav active="Subjects" onSelect={navigateToTab(navigation, 'Subjects')} />
    </View>
  );
}

function ConceptRow({ concept, onPress }: { concept: PathConcept; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  const isCurrent = concept.status === 'current';
  const isDone = concept.status === 'done';

  const isLocked = !isDone && !isCurrent;
  const subtitle = isDone
    ? 'Mastered • prerequisite'
    : isCurrent
      ? 'Current concept'
      : 'Locked • pass the previous quiz to unlock';

  const trailing = isDone ? 'MASTERED' : isCurrent ? 'START' : 'LOCKED';

  return (
    <Pressable onPress={onPress} style={[styles.conceptRow, isCurrent && styles.conceptCurrent]}>
      <View style={styles.conceptCopy}>
        <Text style={styles.conceptTitle}>{concept.title}</Text>
        <Text style={styles.conceptSubtitle}>{subtitle}</Text>
      </View>
      <View
        style={[
          styles.trailing,
          isCurrent && styles.continuePill,
          isDone && styles.masteryPill,
          isLocked && styles.keyPill,
        ]}
      >
        <Text
          style={[
            styles.trailingText,
            !isDone && !isCurrent && styles.nextText,
            isLocked && styles.keyText,
          ]}
        >
          {trailing}
        </Text>
      </View>
      {isCurrent ? <ChevronRightIcon size={20} color={colors.blue} /> : isLocked ? <LockIcon size={18} color={colors.slate} /> : null}
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
  retakeCard: { padding: 16, gap: 8, borderRadius: 18, backgroundColor: colors.orangeSoft, borderWidth: 1, borderColor: colors.orange },
  retakeTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  retakeText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.slate },
  retakeButton: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.orange },
  retakeButtonText: { fontFamily: fonts.bold, fontSize: 12, color: lightColors.surface },
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
