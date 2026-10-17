import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { navigateToTab } from '../navigation/tabs';
import { BookOpenIcon, DownloadIcon, GaugeIcon } from '../components/glyphs';
import { ProgressBar } from '../components/PracticeUI';
import { ArrowLeftIcon, ArrowRightIcon } from '../components/icons';
import { colors, fonts, lightColors, shadow } from '../theme';
import { useThemedStyles, useTheme } from '../themeContext';
import { useProgress } from '../progressContext';
import { useCatalog } from '../catalogContext';
import type { RootScreenProps } from '../navigation/types';
import { usePreferences } from '../preferencesContext';

export default function TopicOverviewScreen({ navigation, route }: RootScreenProps<'TopicOverview'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { downloadedLessons, downloadsEnabled, toggleTopicDownload } = usePreferences();
  const { topicAssessments } = useProgress();
  const { topics, subjects, getConcept, getTopicConceptIds } = useCatalog();
  const requestedTopicId = route.params?.topicId;
  const topic =
    (requestedTopicId ? topics.find((item) => item.id === requestedTopicId) : undefined) ??
    topics[0];
  const topicId = topic?.id ?? '';
  const topicTitle = topic?.name ?? 'Topic';
  const subjectName =
    subjects.find((item) => String(item.id) === String(topic?.subjectId))?.name ?? 'Subject';
  const conceptIds = getTopicConceptIds(topicId);
  const assessment = topicAssessments[topicId];
  const quizScore = assessment?.scorePct ?? 0;
  const isDownloaded =
    conceptIds.length > 0 && conceptIds.every((id) => downloadedLessons.includes(id));

  const concepts = conceptIds
    .map((id) => getConcept(id))
    .filter((concept): concept is NonNullable<typeof concept> => Boolean(concept));

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <ArrowLeftIcon size={23} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>{subjectName}</Text>
        {downloadsEnabled ? (
          <Pressable
            style={[styles.iconButton, isDownloaded && styles.downloadedButton]}
            onPress={() => toggleTopicDownload(topicId)}
            accessibilityRole="button"
            accessibilityLabel={isDownloaded ? 'Remove download' : 'Download topic'}
          >
            <DownloadIcon size={21} color={isDownloaded ? colors.onPrimary : colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.iconButtonPlaceholder} />
        )}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 18 }]}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <GaugeIcon size={34} color={lightColors.surface} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{subjectName.toUpperCase()}</Text>
            <Text style={styles.heroTitle}>{topicTitle}</Text>
            <Text style={styles.meta}>
              {assessment ? `${quizScore}% topic quiz score` : 'Topic quiz not taken'}
            </Text>
          </View>
          <ProgressBar progress={quizScore} track={colors.surface} fill={colors.blue} style={styles.heroBar} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Concepts</Text>
        </View>
        <View style={styles.conceptList}>
          {concepts.map((concept, index) => (
            <Pressable
              key={concept.id}
              style={styles.conceptRow}
              onPress={() => navigation.navigate('ConceptDetails', { conceptId: concept.id })}
              accessibilityRole="button"
            >
              <View style={[styles.orderBadge, { backgroundColor: colors[concept.soft] }]}>
                <Text style={[styles.orderText, { color: colors[concept.tint] }]}>{index + 1}</Text>
              </View>
              <View style={styles.conceptCopy}>
                <Text style={styles.conceptTitle}>{concept.title}</Text>
                <Text style={styles.conceptSubtitle}>Open concept</Text>
              </View>
              <ArrowRightIcon size={18} color={colors.primary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.quizRow}
          onPress={() => navigation.navigate('TopicQuiz', { topicId, topicTitle })}
          accessibilityRole="button"
        >
          <View style={styles.quizIcon}>
            <BookOpenIcon size={22} color={colors.primary} />
          </View>
          <View style={styles.conceptCopy}>
            <Text style={styles.conceptTitle}>Topic quiz</Text>
            <Text style={styles.conceptSubtitle}>
              {assessment
                ? `Latest result: ${quizScore}% · ${assessment.passed ? 'Passed' : 'Try again'}`
                : 'Answer all questions from this topic'}
            </Text>
          </View>
          <ArrowRightIcon size={18} color={colors.primary} />
        </Pressable>
      </ScrollView>
      <BottomNav active="Subjects" onSelect={navigateToTab(navigation, 'Subjects')} />
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.canvas },
    content: { paddingHorizontal: 18, gap: 14 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 18,
      paddingBottom: 14,
    },
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
    downloadedButton: { backgroundColor: colors.primary, borderColor: colors.primary },
    iconButtonPlaceholder: { width: 42, height: 42 },
    headerTitle: { flex: 1, fontFamily: fonts.regular, fontSize: 18, color: colors.ink },
    hero: {
      minHeight: 154,
      padding: 17,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.blueBorder,
      backgroundColor: colors.blueSoft,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 14,
      ...shadow.frame,
    },
    heroIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.blue,
    },
    heroCopy: { flex: 1, gap: 6 },
    eyebrow: { fontFamily: fonts.bold, fontSize: 12, color: colors.blue },
    heroTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: colors.ink },
    meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.slate },
    heroBar: { width: '100%', height: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: colors.ink },
    conceptList: { gap: 9 },
    conceptRow: {
      minHeight: 70,
      padding: 11,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    orderBadge: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    orderText: { fontFamily: fonts.bold, fontSize: 14 },
    conceptCopy: { flex: 1, gap: 3 },
    conceptTitle: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 18, color: colors.ink },
    conceptSubtitle: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.slate },
    quizRow: {
      minHeight: 76,
      padding: 13,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    quizIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
  });
