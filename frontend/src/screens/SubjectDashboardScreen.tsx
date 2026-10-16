import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { navigateToTab } from '../navigation/tabs';
import MasteryRing from '../components/MasteryRing';
import { GaugeIcon, ChartIcon, BookOpenIcon } from '../components/glyphs';
import { CheckCircleIcon, ChevronRightIcon, MoreIcon, ArrowLeftIcon } from '../components/icons';
import { colors, fonts, lightColors, shadow } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import type { RootScreenProps } from '../navigation/types';
import { useProgress } from '../progressContext';
import { usePreferences } from '../preferencesContext';
import { useCatalog } from '../catalogContext';
import { subjectTheme, type CatalogTopic } from '../types/catalog';
import type { SubjectId } from '../theme';

const SUBJECT_NAMES: Record<SubjectId, { name: string; focus: string }> = {
  physics: { name: 'Physics', focus: 'motion' },
  mathematics: { name: 'Mathematics', focus: 'number skills' },
  chemistry: { name: 'Chemistry', focus: 'atomic structure' },
};

function TopicRow({
  topic,
  mastery,
  onPress,
}: {
  topic: CatalogTopic;
  mastery: number;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const theme = subjectTheme(String(topic.subjectId));
  const subtitle =
    mastery >= 100 ? 'Mastered' : mastery > 0 ? `${mastery}% complete` : 'Not started';

  return (
    <Pressable style={styles.topicRow} onPress={onPress} accessibilityRole="button">
      <View style={[styles.topicIcon, { backgroundColor: colors[theme.soft] }]}>
        {mastery >= 100 ? (
          <CheckCircleIcon size={22} color={colors[theme.tint]} />
        ) : (
          <GaugeIcon size={22} color={colors[theme.tint]} />
        )}
      </View>
      <View style={styles.topicCopy}>
        <Text style={styles.topicTitle}>{topic.name}</Text>
        <Text style={styles.topicSubtitle}>{subtitle}</Text>
      </View>
      {mastery >= 100 ? (
        <CheckCircleIcon size={23} color={colors.green} />
      ) : (
        <ChevronRightIcon size={22} color={colors[theme.tint]} />
      )}
    </Pressable>
  );
}

export default function SubjectDashboardScreen({ navigation, route }: RootScreenProps<'SubjectDashboard'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const subject = SUBJECT_NAMES[route.params.subjectId];
  const { getSubjectMastery, getTopicMastery, topicAssessments } = useProgress();
  const { classLevel } = usePreferences();
  const { getTopicsForSubject, getTopicConceptIds } = useCatalog();
  const subjectMastery = getSubjectMastery(route.params.subjectId);

  const topics = getTopicsForSubject(route.params.subjectId);
  const conceptCount = topics.reduce(
    (total, topic) => total + getTopicConceptIds(topic.id).length,
    0,
  );

  const assessments = Object.values(topicAssessments);
  const accuracy = assessments.length
    ? Math.round(assessments.reduce((sum, item) => sum + item.scorePct, 0) / assessments.length)
    : 0;

  const continueTopic =
    topics.find((topic) => getTopicMastery(topic.id) < 100) ?? topics[0];

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
            <ArrowLeftIcon size={23} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{subject.name}</Text>
            <Text style={styles.subtitle}>{classLevel} • {subjectMastery}% overall mastery</Text>
          </View>
          <Pressable style={styles.iconButton} accessibilityLabel="More options">
            <MoreIcon size={22} color={colors.primary} />
          </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 18 }]}>

        <View style={styles.hero}>
          <MasteryRing percent={subjectMastery} color={colors.yellow} size={84} labelColor={lightColors.surface} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Start your {subject.focus} learning journey</Text>
            <Text style={styles.heroSubtitle}>Explore your first lesson to begin building mastery</Text>
          </View>
        </View>

        {continueTopic ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Start learning</Text>
            </View>
            <Pressable
              style={styles.continueCard}
              onPress={() => navigation.navigate('TopicOverview', { topicId: continueTopic.id })}
            >
              <View style={[styles.topicIcon, styles.continueIcon]}>
                <GaugeIcon size={22} color={colors.blue} />
              </View>
              <View style={styles.topicCopy}>
                <Text style={styles.topicTitle}>{continueTopic.name}</Text>
                <Text style={styles.topicSubtitle}>
                  {getTopicMastery(continueTopic.id) > 0 ? 'Continue where you left off' : 'Ready to begin'}
                </Text>
              </View>
              <View style={styles.resumePill}><Text style={styles.resumeLabel}>START</Text></View>
            </Pressable>
          </>
        ) : null}

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>All topics</Text></View>
        <View style={styles.topicList}>
          {topics.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              mastery={getTopicMastery(topic.id)}
              onPress={() => navigation.navigate('TopicOverview', { topicId: topic.id })}
            />
          ))}
        </View>

        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.blueSoft }]}><BookOpenIcon size={21} color={colors.blue} /><Text style={styles.statValue}>{conceptCount}</Text><Text style={styles.statLabel}>Lessons</Text></View>
          <View style={[styles.stat, { backgroundColor: colors.greenSoft }]}><ChartIcon size={21} color={colors.green} /><Text style={styles.statValue}>{topics.length}</Text><Text style={styles.statLabel}>Topics</Text></View>
          <View style={[styles.stat, { backgroundColor: colors.primarySoft }]}><CheckCircleIcon size={21} color={colors.primary} /><Text style={styles.statValue}>{accuracy}%</Text><Text style={styles.statLabel}>Accuracy</Text></View>
        </View>
      </ScrollView>
      <BottomNav active="Subjects" onSelect={navigateToTab(navigation, 'Subjects')} />
    </View>
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
  headerCopy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 25, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.slate },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 154, padding: 17, borderRadius: 18, backgroundColor: lightColors.blue, ...shadow.card },
  heroCopy: { flex: 1, gap: 7 },
  statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 32, borderRadius: 999, backgroundColor: colors.yellow },
  statusLabel: { fontFamily: fonts.medium, fontSize: 12, color: lightColors.ink },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: lightColors.surface },
  heroSubtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: lightColors.surface },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: colors.ink },
  link: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 76, padding: 12, borderRadius: 18, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  continueIcon: { backgroundColor: colors.blueSoft },
  topicList: { gap: 9 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 75, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow.frame },
  topicRowCurrent: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  topicIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  topicSymbol: { fontFamily: fonts.medium, fontSize: 23 },
  topicCopy: { flex: 1, gap: 3 },
  topicTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  topicSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },
  resumePill: { height: 30, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', backgroundColor: colors.surface },
  resumeLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.blue },
  nextPill: { height: 30, paddingHorizontal: 15, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orangeSoft },
  nextLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.orange },
  stats: { flexDirection: 'row', gap: 10, marginTop: 1 },
  stat: { flex: 1, height: 85, borderRadius: 12, padding: 12, gap: 5 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: colors.ink },
  statLabel: { fontFamily: fonts.semibold, fontSize: 10, lineHeight: 12, color: colors.slate },
});
