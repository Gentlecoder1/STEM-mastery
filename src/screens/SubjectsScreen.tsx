import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import {
  SearchIcon,
  MedalIcon,
  AtomIcon,
  SigmaIcon,
  FlaskIcon,
  CalendarIcon,
} from '../components/glyphs';
import { colors, fonts, lightColors, shadow } from '../theme';
import type { ColorToken, SubjectId } from '../theme';
import type { RootScreenProps } from '../navigation/types';
import type { IconProps } from '../components/icons';
import { navigateToTab } from '../navigation/tabs';
import { useThemedStyles, useTheme } from '../themeContext';

type IconComponent = (props: IconProps) => React.JSX.Element;

type Subject = {
  id: SubjectId;
  name: string;
  Icon: IconComponent;
  tint: ColorToken;
  badge: ColorToken;
  card: ColorToken;
  border: ColorToken;
  borderWidth: number;
  detail: string;
  mastery: number;
  action?: string;
};

const SUBJECTS: readonly Subject[] = [
  {
    id: 'physics',
    name: 'Physics',
    Icon: AtomIcon,
    tint: 'blue',
    badge: 'blueSoft',
    card: 'surface',
    border: 'border',
    borderWidth: 1,
    detail: '4 of 8 topics active',
    mastery: 68,
    action: 'CONTINUE',
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    Icon: SigmaIcon,
    tint: 'green',
    badge: 'greenSoft',
    card: 'surface',
    border: 'border',
    borderWidth: 1,
    detail: '6 of 10 topics active',
    mastery: 74,
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    Icon: FlaskIcon,
    tint: 'violet',
    badge: 'violetSoft',
    card: 'surface',
    border: 'border',
    borderWidth: 1,
    detail: '3 of 9 topics active',
    mastery: 55,
  },
];

type SubjectCardProps = {
  subject: Subject;
  onPress: () => void;
};

function SubjectCard({ subject, onPress }: SubjectCardProps) {
  const styles = useThemedStyles(createStyles);
  const { Icon } = subject;
  const active = Boolean(subject.action);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${subject.name}`}
      style={[
        styles.card,
        {
          backgroundColor: colors[subject.card],
          borderColor: colors[subject.border],
          borderWidth: subject.borderWidth,
        },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: colors[subject.badge] }]}>
        <Icon size={25} color={colors[subject.tint]} />
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={styles.cardName}>{subject.name}</Text>
          {active && subject.action ? (
            <View style={styles.actionPill}>
              <Text style={[styles.actionLabel, { color: colors[subject.tint] }]}>
                {subject.action}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.detail}>{subject.detail}</Text>

        <View style={styles.masteryRow}>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${subject.mastery}%`, backgroundColor: colors[subject.tint] },
              ]}
            />
          </View>
          <Text style={[styles.masteryValue, { color: colors[subject.tint] }]}>
            {subject.mastery}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function SubjectsScreen({ navigation }: RootScreenProps<'Subjects'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={styles.body}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Subjects</Text>
            <Text style={styles.headerSubtitle}>SS1 • Your learning library</Text>
          </View>
          <Pressable
            style={styles.headerAction}
            onPress={() => navigation.navigate('Search')}
            accessibilityRole="button"
            accessibilityLabel="Search subjects"
          >
            <SearchIcon size={20} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summary}>
            <View style={styles.summaryIcon}>
              <MedalIcon size={26} color={lightColors.inkDeep} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryTitle}>Strong week, Iseoluwa!</Text>
              <Text style={styles.summaryText}>You improved Physics mastery by 6%.</Text>
            </View>
          </View>

          {SUBJECTS.map((s) => (
            <SubjectCard
              key={s.name}
              subject={s}
              onPress={() => navigation.navigate('SubjectDashboard', { subjectId: s.id })}
            />
          ))}

          <Pressable
            style={styles.challenge}
            onPress={() => navigation.navigate('Challenge')}
            accessibilityRole="button"
          >
            <CalendarIcon size={24} color={colors.orange} />
            <View style={styles.challengeCopy}>
              <Text style={styles.challengeTitle}>Friday STEM challenge</Text>
              <Text style={styles.challengeText}>Unlocks after one more lesson</Text>
            </View>
            <View style={styles.challengePill}>
              <Text style={styles.challengeLabel}>1 LEFT</Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>

      <BottomNav active="Subjects" onSelect={navigateToTab(navigation, 'Subjects')} />
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: fonts.regular,
    fontSize: 22,
    lineHeight: 25,
    color: colors.ink,
  },
  headerSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.slate,
  },
  headerAction: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  scroll: {
    paddingHorizontal: 18,
    gap: 14,
  },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    ...shadow.frame,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.yellow,
  },
  summaryCopy: {
    flex: 1,
    gap: 3,
  },
  summaryTitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: colors.ink,
  },
  summaryText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.slate,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    ...shadow.frame,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: colors.ink,
  },
  actionPill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  actionLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
  },
  detail: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    color: colors.slate,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  masteryValue: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 13,
  },

  challenge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengeCopy: {
    flex: 1,
    gap: 3,
  },
  challengeTitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: colors.ink,
  },
  challengeText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.slate,
  },
  challengePill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orangeSoft,
  },
  challengeLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
    color: colors.orange,
  },
});