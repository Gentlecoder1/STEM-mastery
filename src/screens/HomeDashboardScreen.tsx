import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { navigateToTab } from '../navigation/tabs';
import MasteryRing from '../components/MasteryRing';
import {
  FlameIcon,
  ZapIcon,
  GaugeIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
  AtomIcon,
  SigmaIcon,
  FlaskIcon,
} from '../components/glyphs';
import { colors, fonts, shadow } from '../theme';
import type { RootScreenProps } from '../navigation/types';
import type { IconProps } from '../components/icons';

type SubjectIconKey = 'atom' | 'sigma' | 'flask';

type DashboardSubject = {
  name: string;
  icon: SubjectIconKey;
  tint: string;
  soft: string;
  mastery: number;
  subtitle: string;
};

type IconComponent = (props: IconProps) => React.JSX.Element;

const SUBJECT_ICONS: Record<SubjectIconKey, IconComponent> = {
  atom: AtomIcon,
  sigma: SigmaIcon,
  flask: FlaskIcon,
};

const SUBJECTS: readonly DashboardSubject[] = [
  {
    name: 'Physics',
    icon: 'atom',
    tint: '#2979FF',
    soft: 'rgba(41,121,255,0.0941)',
    mastery: 68,
    subtitle: '68% mastery • 2 topics in progress',
  },
  {
    name: 'Mathematics',
    icon: 'sigma',
    tint: '#00A887',
    soft: 'rgba(0,168,135,0.0941)',
    mastery: 74,
    subtitle: '74% mastery • Keep your streak alive',
  },
  {
    name: 'Chemistry',
    icon: 'flask',
    tint: '#9A54E8',
    soft: 'rgba(154,84,232,0.0941)',
    mastery: 55,
    subtitle: '55% mastery • Review atomic structure',
  },
];

type Stat = {
  key: string;
  bg: string;
  tint: string;
  Icon: IconComponent;
  value: string;
  label: string;
};

const STATS: readonly Stat[] = [
  { key: 'xp', bg: '#FFF0D8', tint: '#FF9F1C', Icon: StarIcon, value: '120 XP', label: 'Today' },
  { key: 'goal', bg: '#DDF8F3', tint: '#0FAF9A', Icon: TargetIcon, value: '3 / 4', label: 'Daily goal' },
  { key: 'league', bg: '#EEECFF', tint: '#5B4CF0', Icon: TrophyIcon, value: '#12', label: 'League' },
];

type SubjectIconProps = {
  subject: DashboardSubject;
  size?: number;
  box?: number;
  radius?: number;
};

function SubjectIcon({ subject, size = 19, box = 38, radius = 12 }: SubjectIconProps) {
  const Icon = SUBJECT_ICONS[subject.icon];
  return (
    <View
      style={[
        styles.leadingIcon,
        { width: box, height: box, borderRadius: radius, backgroundColor: subject.soft },
      ]}
    >
      <Icon size={size} color={subject.tint} />
    </View>
  );
}

type StatCardProps = {
  bg: string;
  tint: string;
  Icon: IconComponent;
  value: string;
  label: string;
};

function StatCard({ bg, tint, Icon, value, label }: StatCardProps) {
  return (
    <View style={[styles.stat, { backgroundColor: bg }]}>
      <Icon size={18} color={tint} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeDashboardScreen({ navigation }: RootScreenProps<'Home'>) {
  const insets = useSafeAreaInsets();

  const openSubjects = () => navigation.navigate('Subjects');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 14 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greeting}>
            <View style={styles.greetingCopy}>
              <Text style={styles.eyebrow}>Good afternoon,</Text>
              <Text style={styles.name}>Iseoluwa 👋</Text>
            </View>
            <View style={styles.streak}>
              <FlameIcon size={18} color="#FF9F1C" />
              <Text style={styles.streakValue}>7 days</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroHead}>
              <View style={styles.nextUp}>
                <ZapIcon size={13} color="#FFD84D" />
                <Text style={styles.nextUpLabel}>NEXT UP</Text>
              </View>
              <Text style={styles.heroTime}>8 min</Text>
            </View>

            <View style={styles.lesson}>
              <View style={styles.lessonIcon}>
                <GaugeIcon size={27} color="#FFFFFF" />
              </View>
              <View style={styles.lessonCopy}>
                <Text style={styles.lessonSubject}>PHYSICS • SPEED &amp; VELOCITY</Text>
                <Text style={styles.lessonTitle}>Reading displacement-time graphs</Text>
              </View>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.heroTrack}>
                <View style={[styles.heroFill, { width: '62%' }]} />
              </View>
              <Text style={styles.progressValue}>62%</Text>
            </View>
          </View>

          <View style={styles.stats}>
            {STATS.map(({ key, bg, tint, Icon, value, label }) => (
              <StatCard key={key} bg={bg} tint={tint} Icon={Icon} value={value} label={label} />
            ))}
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Your subjects</Text>
            <Pressable onPress={openSubjects}>
              <Text style={styles.sectionAction}>See all</Text>
            </Pressable>
          </View>

          <View style={styles.subjectList}>
            {SUBJECTS.map((subject) => (
              <Pressable key={subject.name} style={styles.subjectRow} onPress={openSubjects}>
                <SubjectIcon subject={subject} />
                <View style={styles.subjectCopy}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectSubtitle}>{subject.subtitle}</Text>
                </View>
                <MasteryRing percent={subject.mastery} color={subject.tint} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <BottomNav active="Home" onSelect={navigateToTab(navigation, 'Home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  body: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 18,
    gap: 14,
  },

  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingCopy: {
    gap: 2,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 15,
    color: colors.slate,
  },
  name: {
    fontFamily: fonts.regular,
    fontSize: 22,
    lineHeight: 27,
    color: colors.ink,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#FFF0D8',
  },
  streakValue: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    lineHeight: 16,
    color: '#FF9F1C',
  },

  hero: {
    backgroundColor: colors.inkDeep,
    borderRadius: 18,
    padding: 17,
    gap: 12,
    ...shadow.frame,
  },
  heroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 25,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,216,77,0.1333)',
  },
  nextUpLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
    color: colors.yellow,
  },
  heroTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: '#BEC6E9',
  },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lessonIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
  },
  lessonCopy: {
    flex: 1,
    gap: 4,
  },
  lessonSubject: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
    color: '#8FB8FF',
  },
  lessonTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 21,
    color: colors.surface,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1451)',
    overflow: 'hidden',
  },
  heroFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.yellow,
  },
  progressValue: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.surface,
  },

  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    height: 85,
    borderRadius: 12,
    padding: 12,
    gap: 5,
  },
  statValue: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 21,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.slate,
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 21,
    color: colors.ink,
  },
  sectionAction: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 15,
    color: colors.primary,
  },

  subjectList: {
    gap: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 62,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leadingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectCopy: {
    flex: 1,
    gap: 2,
  },
  subjectName: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: colors.ink,
  },
  subjectSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    color: colors.slate,
  },
});