import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import CatalogNotice from '../components/CatalogNotice';
import { navigateToTab } from '../navigation/tabs';
import MasteryRing from '../components/MasteryRing';
import { GaugeIcon, ChartIcon, BookOpenIcon } from '../components/glyphs';
import { CheckCircleIcon, ChevronRightIcon, LockIcon, MoreIcon, ArrowLeftIcon, ClockIcon } from '../components/icons';
import { colors, fonts, lightColors, shadow, type ColorToken, type SubjectId } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import type { RootScreenProps } from '../navigation/types';
import { useProgress } from '../progressContext';
import { usePreferences } from '../preferencesContext';
import { useCatalog } from '../catalogContext';

const SUBJECT_DETAILS: Record<SubjectId, { name: string; mastery: number; focus: string }> = {
  physics: { name: 'Physics', mastery: 0, focus: 'motion' },
  mathematics: { name: 'Mathematics', mastery: 0, focus: 'number skills' },
  chemistry: { name: 'Chemistry', mastery: 0, focus: 'atomic structure' },
};

type TopicState = 'done' | 'current' | 'next';

const topics: readonly {
  title: string;
  subtitle: string;
  icon: string;
  tint: ColorToken;
  soft: ColorToken;
  state: TopicState;
}[] = [
  { title: 'Speed and Velocity', subtitle: 'Not started', icon: 'speed', tint: 'blue', soft: 'blueSoft', state: 'current' },
  { title: 'Motion', subtitle: 'Locked', icon: 'motion', tint: 'green', soft: 'greenSoft', state: 'next' },
  { title: 'Acceleration', subtitle: 'Recommended next', icon: 'acceleration', tint: 'orange', soft: 'orangeSoft', state: 'next' },
  { title: 'Forces', subtitle: 'Up next • key test required', icon: 'forces', tint: 'slate', soft: 'border', state: 'next' },
] as const;

function TopicIcon({ type, color }: { type: string; color: string }) {
  const styles = useThemedStyles(createStyles);
  if (type === 'motion') return <Text style={[styles.topicSymbol, { color }]}>→</Text>;
  if (type === 'speed') return <GaugeIcon size={22} color={color} />;
  if (type === 'acceleration') return <ChartIcon size={22} color={color} />;
  return <Text style={[styles.topicSymbol, { color }]}>+/-</Text>;
}

function TopicRow({ topic, onPress }: { topic: (typeof topics)[number]; onPress?: () => void }) {
  const styles = useThemedStyles(createStyles);
  const isCurrent = topic.state === 'current';
  const isLocked = topic.state === 'next';
  return (
    <Pressable onPress={onPress} style={[styles.topicRow, isCurrent && styles.topicRowCurrent]} accessibilityState={{ disabled: isLocked }}>
      <View style={[styles.topicIcon, { backgroundColor: colors[topic.soft] }]}>
        {topic.state === 'done' ? <CheckCircleIcon size={22} color={colors[topic.tint]} /> : <TopicIcon type={topic.icon} color={colors[topic.tint]} />}
      </View>
      <View style={styles.topicCopy}>
        <Text style={styles.topicTitle}>{topic.title}</Text>
        <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
      </View>
      {topic.state === 'done' ? <CheckCircleIcon size={23} color={colors.green} /> : null}
      {topic.state === 'current' ? <ChevronRightIcon size={22} color={colors.blue} /> : null}
      {isLocked ? <LockIcon size={18} color={colors.slate} /> : null}
    </Pressable>
  );
}

export default function SubjectDashboardScreen({ navigation, route }: RootScreenProps<'SubjectDashboard'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const subject = SUBJECT_DETAILS[route.params.subjectId];
  const { getSubjectMastery } = useProgress();
  const { classLevel } = usePreferences();
  const { status, error, refresh } = useCatalog();
  const subjectMastery = getSubjectMastery(route.params.subjectId);

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

        {status === 'error' ? (
          <CatalogNotice
            title={`Couldn't load ${subject.name} lessons`}
            message={error ?? 'Could not load the curriculum.'}
            onRetry={() => void refresh()}
          />
        ) : null}

        <View style={styles.hero}>
          <MasteryRing percent={subjectMastery} color={colors.yellow} size={84} labelColor={lightColors.surface} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Start your {subject.focus} learning journey</Text>
            <Text style={styles.heroSubtitle}>Explore your first lesson to begin building mastery</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Start learning</Text>
          <Pressable onPress={() => navigation.navigate('TopicOverview')}><Text style={styles.link}>View map</Text></Pressable>
        </View>
        <Pressable style={styles.continueCard} onPress={() => navigation.navigate('TopicOverview')}>
          <View style={[styles.topicIcon, styles.continueIcon]}><GaugeIcon size={22} color={colors.blue} /></View>
          <View style={styles.topicCopy}><Text style={styles.topicTitle}>Speed and Velocity</Text><Text style={styles.topicSubtitle}>Lesson 1 of 5 • Ready to begin</Text></View>
          <View style={styles.resumePill}><Text style={styles.resumeLabel}>START</Text></View>
        </Pressable>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>All topics</Text></View>
        <View style={styles.topicList}>{topics.map((topic) => <TopicRow key={topic.title} topic={topic} onPress={() => {
          if (topic.state === 'next') {
            Alert.alert('Topic locked', 'Complete the previous topic and pass its test with at least 60% to unlock this topic.');
            return;
          }
          navigation.navigate('TopicOverview');
        }} />)}</View>

        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.blueSoft }]}><BookOpenIcon size={21} color={colors.blue} /><Text style={styles.statValue}>18</Text><Text style={styles.statLabel}>Lessons</Text></View>
          <View style={[styles.stat, { backgroundColor: colors.greenSoft }]}><CheckCircleIcon size={21} color={colors.green} /><Text style={styles.statValue}>0%</Text><Text style={styles.statLabel}>Accuracy</Text></View>
          <View style={[styles.stat, { backgroundColor: colors.primarySoft }]}><ClockIcon size={21} color={colors.primary} /><Text style={styles.statValue}>0m</Text><Text style={styles.statLabel}>Learned</Text></View>
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