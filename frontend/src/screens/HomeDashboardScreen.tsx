import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo } from 'react';

import BottomNav from '../components/BottomNav';
import { ProgressBar } from '../components/PracticeUI';
import { navigateToTab } from '../navigation/tabs';
import MasteryRing from '../components/MasteryRing';
import {
  FlameIcon,
  ZapIcon,
  GaugeIcon,
  StarIcon,
  TargetIcon,
  AtomIcon,
  SigmaIcon,
  FlaskIcon,
} from '../components/glyphs';
import { colors, fonts, lightColors, shadow, type ColorToken, type SubjectId } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { useProfile } from '../profileContext';
import { useDisplayName } from '../displayName';
import { useProgress } from '../progressContext';
import { useCatalog } from '../catalogContext';
import type { RootScreenProps } from '../navigation/types';
import type { IconProps } from '../components/icons';

type SubjectIconKey = 'atom' | 'sigma' | 'flask';

type DashboardSubject = {
  id: SubjectId;
  name: string;
  icon: SubjectIconKey;
  tint: ColorToken;
  soft: ColorToken;
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
    id: 'physics',
    name: 'Physics',
    icon: 'atom',
    tint: 'blue',
    soft: 'blueSoft',
    mastery: 0,
    subtitle: '0% mastery • Start your first topic',
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: 'sigma',
    tint: 'green',
    soft: 'greenSoft',
    mastery: 0,
    subtitle: '0% mastery • Ready to begin',
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: 'flask',
    tint: 'violet',
    soft: 'violetSoft',
    mastery: 0,
    subtitle: '0% mastery • Ready to begin',
  },
];

type Stat = {
  key: string;
  bg: ColorToken;
  tint: ColorToken;
  Icon: IconComponent;
  value: string;
  label: string;
};

const STATS: readonly Stat[] = [
  { key: 'xp', bg: 'orangeSoft' as ColorToken, tint: 'orange' as ColorToken, Icon: StarIcon, value: '0 XP', label: 'Today' },
  { key: 'goal', bg: 'greenSoft' as ColorToken, tint: 'teal' as ColorToken, Icon: TargetIcon, value: '0 / 4', label: 'Daily goal' },
];

type SubjectIconProps = {
  subject: DashboardSubject;
  size?: number;
  box?: number;
  radius?: number;
};

function SubjectIcon({ subject, size = 19, box = 38, radius = 12 }: SubjectIconProps) {
  const styles = useThemedStyles(createStyles);
  const Icon = SUBJECT_ICONS[subject.icon];
  return (
    <View
      style={[
        styles.leadingIcon,
        { width: box, height: box, borderRadius: radius, backgroundColor: colors[subject.soft] },
      ]}
    >
      <Icon size={size} color={colors[subject.tint]} />
    </View>
  );
}

type StatCardProps = {
  bg: ColorToken;
  tint: ColorToken;
  Icon: IconComponent;
  value: string;
  label: string;
};

function StatCard({ bg, tint, Icon, value, label }: StatCardProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.stat, { backgroundColor: colors[bg] }]}>
      <Icon size={18} color={colors[tint]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeDashboardScreen({ navigation }: RootScreenProps<'Home'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { profile } = useProfile();
  const displayName = useDisplayName();
  const { getSubjectMastery, lastConcept } = useProgress();
  const { subjects } = useCatalog();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const hero = useMemo(() => {
    if (lastConcept) {
      const subjectName = subjects.find(
        (subject) => lastConcept.subjectIds.includes(String(subject.id)),
      )?.name;
      const subjectId = lastConcept.subjectIds[0] ?? '';
      return {
        pill: 'CONTINUE WHERE YOU LEFT OFF',
        subject: subjectName ? subjectName.toUpperCase() : '',
        title: 'Continue your lesson',
        lesson: lastConcept.title,
        progress: getSubjectMastery(subjectId),
      };
    }
    return {
      pill: 'START YOUR LEARNING PATH',
      subject: '',
      title: 'Begin your first lesson',
      lesson: '',
      progress: 0,
    };
  }, [lastConcept, subjects, getSubjectMastery]);

  const openSubjects = () => navigation.navigate('Subjects');

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
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
              <Text style={styles.eyebrow}>{greeting},</Text>
              <Text style={styles.name}>{displayName || 'User'} 👋</Text>
            </View>
            <View style={styles.streak}>
              <FlameIcon size={18} color="#FF9F1C" />
              <Text style={styles.streakValue}>{profile?.streak ?? 0} days</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroHead}>
              <View style={styles.nextUp}>
                <ZapIcon size={13} color="#FFD84D" />
                <Text style={styles.nextUpLabel}>{hero.pill}</Text>
              </View>
            </View>

            <View style={styles.lesson}>
              <View style={styles.lessonIcon}>
                <GaugeIcon size={27} color="#FFFFFF" />
              </View>
              <View style={styles.lessonCopy}>
                {hero.subject ? <Text style={styles.lessonSubject}>{hero.subject}</Text> : null}
                <Text style={styles.lessonTitle}>{hero.title}</Text>
                {hero.lesson ? <Text style={styles.lessonSub}>{hero.lesson}</Text> : null}
              </View>
            </View>

            <View style={styles.progressRow}>
              <ProgressBar
                progress={hero.progress}
                track="rgba(255,255,255,0.1451)"
                fill={colors.yellow}
                style={styles.heroBar}
              />
              <Text style={styles.progressValue}>{hero.progress}%</Text>
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
            {SUBJECTS.map((subject) => {
              const mastery = getSubjectMastery(subject.id);
              return (
              <Pressable key={subject.name} style={styles.subjectRow} onPress={openSubjects}>
                <SubjectIcon subject={{ ...subject, mastery }} />
                <View style={styles.subjectCopy}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectSubtitle}>{mastery}% mastery • {mastery === 0 ? 'Ready to begin' : 'Keep learning'}</Text>
                </View>
                <MasteryRing percent={mastery} color={colors[subject.tint]} />
              </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <BottomNav active="Home" onSelect={navigateToTab(navigation, 'Home')} />
    </View>
  );
}

const createStyles = () => StyleSheet.create({
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
    backgroundColor: colors.orangeSoft,
  },
  streakValue: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.orange,
  },

  hero: {
    backgroundColor: lightColors.inkDeep,
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
  lessonSub: {
    fontFamily: fonts.medium,
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
    backgroundColor: lightColors.blue,
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
    color: lightColors.surface,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroBar: {
    flex: 1,
  },
  progressValue: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: lightColors.surface,
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