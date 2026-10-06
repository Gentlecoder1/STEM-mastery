import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { navigateToTab } from '../navigation/tabs';
import MasteryRing from '../components/MasteryRing';
import { GaugeIcon, ChartIcon, BookOpenIcon } from '../components/glyphs';
import { CheckCircleIcon, ChevronRightIcon, LockIcon, MoreIcon, ArrowLeftIcon, ClockIcon, SparklesIcon } from '../components/icons';
import { colors, fonts, shadow } from '../theme';
import type { RootScreenProps } from '../navigation/types';
import type { SubjectId } from '../theme';

const SUBJECT_DETAILS: Record<SubjectId, { name: string; mastery: number; focus: string }> = {
  physics: { name: 'Physics', mastery: 68, focus: 'motion' },
  mathematics: { name: 'Mathematics', mastery: 74, focus: 'number skills' },
  chemistry: { name: 'Chemistry', mastery: 55, focus: 'atomic structure' },
};

const topics = [
  { title: 'Motion', subtitle: 'Mastered • 92%', icon: 'motion', tint: colors.green, soft: colors.greenSoft, state: 'done' },
  { title: 'Speed and Velocity', subtitle: 'In progress • 68%', icon: 'speed', tint: colors.blue, soft: colors.blueSoft, state: 'current' },
  { title: 'Acceleration', subtitle: 'Recommended next • 41%', icon: 'acceleration', tint: '#FF9F1C', soft: '#FFF4E5', state: 'next' },
  { title: 'Forces', subtitle: 'Locked • Complete Acceleration', icon: 'forces', tint: colors.slate, soft: '#F0F2F4', state: 'locked' },
] as const;

function TopicIcon({ type, color }: { type: string; color: string }) {
  if (type === 'motion') return <Text style={[styles.topicSymbol, { color }]}>→</Text>;
  if (type === 'speed') return <GaugeIcon size={22} color={color} />;
  if (type === 'acceleration') return <ChartIcon size={22} color={color} />;
  return <Text style={[styles.topicSymbol, { color }]}>+/-</Text>;
}

function TopicRow({ topic, onPress }: { topic: (typeof topics)[number]; onPress?: () => void }) {
  const isCurrent = topic.state === 'current';
  return (
    <Pressable onPress={onPress} style={[styles.topicRow, isCurrent && styles.topicRowCurrent]}>
      <View style={[styles.topicIcon, { backgroundColor: topic.soft }]}>
        {topic.state === 'done' ? <CheckCircleIcon size={22} color={topic.tint} /> : <TopicIcon type={topic.icon} color={topic.tint} />}
      </View>
      <View style={styles.topicCopy}>
        <Text style={styles.topicTitle}>{topic.title}</Text>
        <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
      </View>
      {topic.state === 'done' ? <CheckCircleIcon size={23} color={colors.green} /> : null}
      {topic.state === 'current' ? <ChevronRightIcon size={22} color={colors.blue} /> : null}
      {topic.state === 'next' ? <View style={styles.nextPill}><Text style={styles.nextLabel}>NEXT</Text></View> : null}
      {topic.state === 'locked' ? <LockIcon size={21} color={colors.slate} /> : null}
    </Pressable>
  );
}

export default function SubjectDashboardScreen({ navigation, route }: RootScreenProps<'SubjectDashboard'>) {
  const insets = useSafeAreaInsets();
  const subject = SUBJECT_DETAILS[route.params.subjectId];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
            <ArrowLeftIcon size={23} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{subject.name}</Text>
            <Text style={styles.subtitle}>SS1 • {subject.mastery}% overall mastery</Text>
          </View>
          <Pressable style={styles.iconButton} accessibilityLabel="More options">
            <MoreIcon size={22} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <MasteryRing percent={subject.mastery} color={colors.yellow} size={100} labelColor={colors.surface} />
          <View style={styles.heroCopy}>
            <View style={styles.statusPill}><SparklesIcon size={15} color={colors.ink} /><Text style={styles.statusLabel}>ON TRACK</Text></View>
            <Text style={styles.heroTitle}>Your {subject.focus} skills are growing</Text>
            <Text style={styles.heroSubtitle}>12 concepts mastered • 5 developing</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Continue learning</Text>
          <Pressable onPress={() => navigation.navigate('TopicOverview')}><Text style={styles.link}>View map</Text></Pressable>
        </View>
        <Pressable style={styles.continueCard} onPress={() => navigation.navigate('TopicOverview')}>
          <View style={[styles.topicIcon, styles.continueIcon]}><GaugeIcon size={22} color={colors.blue} /></View>
          <View style={styles.topicCopy}><Text style={styles.topicTitle}>Speed and Velocity</Text><Text style={styles.topicSubtitle}>Lesson 3 of 5 • 68% mastery</Text></View>
          <View style={styles.resumePill}><Text style={styles.resumeLabel}>RESUME</Text></View>
        </Pressable>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>All topics</Text></View>
        <View style={styles.topicList}>{topics.map((topic) => <TopicRow key={topic.title} topic={topic} onPress={topic.state === 'current' ? () => navigation.navigate('TopicOverview') : undefined} />)}</View>

        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.blueSoft }]}><BookOpenIcon size={21} color={colors.blue} /><Text style={styles.statValue}>18</Text><Text style={styles.statLabel}>Lessons</Text></View>
          <View style={[styles.stat, { backgroundColor: colors.greenSoft }]}><CheckCircleIcon size={21} color={colors.green} /><Text style={styles.statValue}>86%</Text><Text style={styles.statLabel}>Accuracy</Text></View>
          <View style={[styles.stat, { backgroundColor: colors.primarySoft }]}><ClockIcon size={21} color={colors.primary} /><Text style={styles.statValue}>4h 20m</Text><Text style={styles.statLabel}>Learned</Text></View>
        </View>
      </ScrollView>
      <BottomNav active="Subjects" onSelect={navigateToTab(navigation, 'Subjects')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 18, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 2 },
  iconButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 25, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.slate },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 154, padding: 17, borderRadius: 18, backgroundColor: colors.blue, ...shadow.card },
  heroCopy: { flex: 1, gap: 7 },
  statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 32, borderRadius: 999, backgroundColor: colors.yellow },
  statusLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: colors.surface },
  heroSubtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: '#D9E6FF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: colors.ink },
  link: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 76, padding: 12, borderRadius: 18, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  continueIcon: { backgroundColor: '#DDE7FF' },
  topicList: { gap: 9 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 75, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow.frame },
  topicRowCurrent: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  topicIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  topicSymbol: { fontFamily: fonts.medium, fontSize: 23 },
  topicCopy: { flex: 1, gap: 3 },
  topicTitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: colors.ink },
  topicSubtitle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 15, color: colors.slate },
  resumePill: { height: 30, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', backgroundColor: colors.surface },
  resumeLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.blue },
  nextPill: { height: 30, paddingHorizontal: 15, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0D8' },
  nextLabel: { fontFamily: fonts.medium, fontSize: 12, color: '#FF9F1C' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 1 },
  stat: { flex: 1, height: 85, borderRadius: 12, padding: 12, gap: 5 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: colors.ink },
  statLabel: { fontFamily: fonts.semibold, fontSize: 10, lineHeight: 12, color: colors.slate },
});