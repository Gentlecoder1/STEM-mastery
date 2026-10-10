import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import BottomNav from '../components/BottomNav';
import BottomSheetDrawer from '../components/BottomSheetDrawer';
import { ChevronRightIcon } from '../components/icons';
import {
  BrainIcon,
  DownloadIcon,
  FlameIcon,
  GraduationCapIcon,
  MedalIcon,
  SettingsIcon,
  TargetIcon,
  UserIcon,
} from '../components/glyphs';
import { SectionHeading } from '../components/PracticeUI';
import { colors, fonts, lightColors, shadow, type ColorToken } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { navigateToTab } from '../navigation/tabs';
import type { RootScreenProps } from '../navigation/types';
import { CLASS_OPTIONS, SUBJECT_OPTIONS, usePreferences, type ClassLevel } from '../preferencesContext';
import type { SubjectId } from '../theme';
import { CONCEPTS } from '../data/learning';

const STATS = [
  { value: '1,840', label: 'Total XP', tint: 'orange' as ColorToken },
  { value: '7', label: 'Best streak', tint: 'danger' as ColorToken },
  { value: '18', label: 'Badges', tint: 'primary' as ColorToken },
];

const ACHIEVEMENTS = [
  { label: 'Graph reader', Icon: MedalIcon, bg: 'blueSoft' as ColorToken, tint: 'blue' as ColorToken },
  { label: '7-day streak', Icon: FlameIcon, bg: 'orangeSoft' as ColorToken, tint: 'orange' as ColorToken },
  { label: 'Deep thinker', Icon: BrainIcon, bg: 'primarySoft' as ColorToken, tint: 'primary' as ColorToken },
];

const MENU = [
  {
    title: 'Class and subjects',
    subtitle: 'SS1 • Mathematics, Physics, Chemistry',
    Icon: GraduationCapIcon,
    bg: 'blueSoft' as ColorToken,
    tint: 'blue' as ColorToken,
  },
  {
    title: 'Learning goals',
    subtitle: '20 minutes a day • 5 days a week',
    Icon: TargetIcon,
    bg: 'orangeSoft' as ColorToken,
    tint: 'orange' as ColorToken,
  },
  {
    title: 'Offline learning',
    subtitle: '6 lessons downloaded',
    Icon: DownloadIcon,
    bg: 'violetSoft' as ColorToken,
    tint: 'violet' as ColorToken,
  },
];

export default function ProfileScreen({ navigation }: RootScreenProps<'Profile'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    classLevel,
    subjects,
    downloadedTopics,
    saveClassAndSubjects,
    userName,
    location,
  } = usePreferences();
  const [drawerKey, setDrawerKey] = useState<string | null>(null);
  const [draftClass, setDraftClass] = useState<ClassLevel>(classLevel);
  const [draftSubjects, setDraftSubjects] = useState<SubjectId[]>(subjects);

  const openDrawer = (key: string) => {
    setDrawerKey(key);
    if (key === 'Class and subjects') {
      setDraftClass(classLevel);
      setDraftSubjects(subjects);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Profile</Text>
        <Pressable
          style={styles.headerAction}
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <SettingsIcon size={20} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 14 },
        ]}
      >
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <UserIcon size={40} color={colors.primary} strokeWidth={1.4} />
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>12</Text>
            </View>
          </View>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.tagline}>{classLevel} learner • {location}</Text>
        </View>

        <View style={styles.statsCard}>
          {STATS.map(({ value, label, tint }, index) => (
            <View key={label} style={styles.statRow}>
              {index > 0 ? <View style={styles.statDivider} /> : null}
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors[tint] }]}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            </View>
          ))}
        </View>

        <SectionHeading title="Achievements" action="View all 18" />
        <View style={styles.achievementRow}>
          {ACHIEVEMENTS.map(({ label, Icon, bg, tint }) => (
            <View key={label} style={styles.achievementCard}>
              <View style={[styles.badge, { backgroundColor: colors[bg] }]}>
                <Icon size={20} color={colors[tint]} />
              </View>
              <Text style={styles.achievementLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <SectionHeading title="Learning profile" />
        <View style={styles.menuList}>
          {MENU.map(({ title, subtitle, Icon, bg, tint }) => (
            <Pressable
              key={title}
              style={styles.menuRow}
              accessibilityRole={title === 'Learning goals' ? undefined : 'button'}
              onPress={title === 'Learning goals' ? undefined : () => openDrawer(title)}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors[bg] }]}>
                <Icon size={19} color={colors[tint]} />
              </View>
              <View style={styles.menuCopy}>
                <Text style={styles.menuTitle}>{title}</Text>
                <Text style={styles.menuSubtitle}>{subtitle}</Text>
              </View>
              <ChevronRightIcon size={20} color={colors.slate} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <BottomNav active="Profile" onSelect={navigateToTab(navigation, 'Profile')} />
      <BottomSheetDrawer
        visible={drawerKey !== null}
        title={drawerKey ?? ''}
        description={
          drawerKey === 'Class and subjects'
            ? 'Review the class level and subjects used to personalize your learning path.'
            : drawerKey === 'Learning goals'
              ? 'Set a pace that keeps your study routine realistic and consistent.'
              : 'Manage lesson downloads for learning when you are offline.'
        }
        items={[]}
        onClose={() => setDrawerKey(null)}
      >
        {drawerKey === 'Class and subjects' ? (
          <ScrollView contentContainerStyle={styles.drawerContent}>
            <Text style={styles.drawerLabel}>CLASS</Text>
            {CLASS_OPTIONS.map((option) => (
              <Pressable key={option} style={styles.choiceRow} onPress={() => setDraftClass(option)}>
                <Text style={styles.choiceText}>{option}</Text>
                <View style={[styles.radio, draftClass === option && styles.radioSelected]} />
              </Pressable>
            ))}
            <Text style={styles.drawerLabel}>SUBJECTS</Text>
            {SUBJECT_OPTIONS.map((subject) => {
              const selected = draftSubjects.includes(subject.id);
              return (
                <Pressable
                  key={subject.id}
                  style={styles.choiceRow}
                  onPress={() =>
                    setDraftSubjects((current) =>
                      selected ? current.filter((id) => id !== subject.id) : [...current, subject.id],
                    )
                  }
                >
                  <Text style={styles.choiceText}>{subject.label}</Text>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              style={styles.saveButton}
              onPress={() => {
                saveClassAndSubjects(draftClass, draftSubjects);
                setDrawerKey(null);
              }}
            >
              <Text style={styles.saveButtonText}>Save changes</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.drawerContent}>
            {downloadedTopics.length === 0 ? (
              <Text style={styles.itemBody}>No lessons have been downloaded yet.</Text>
            ) : (
              CONCEPTS.filter((concept) => downloadedTopics.includes(concept.topicId)).map((concept) => (
                <Pressable
                  key={concept.id}
                  style={styles.downloadedLesson}
                  onPress={() => {
                    setDrawerKey(null);
                    navigation.navigate('ConceptDetails', { conceptId: concept.id });
                  }}
                >
                  <View style={styles.menuCopy}>
                    <Text style={styles.menuTitle}>{concept.title}</Text>
                    <Text style={styles.menuSubtitle}>Physics • Speed and Velocity</Text>
                  </View>
                  <ChevronRightIcon size={20} color={colors.slate} />
                </Pressable>
              ))
            )}
          </ScrollView>
        )}
      </BottomSheetDrawer>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 18, gap: 13 },
  drawerContent: { gap: 10, paddingTop: 18, paddingBottom: 8 },
  drawerLabel: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, color: colors.slate, marginTop: 8 },
  choiceRow: { minHeight: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  choiceText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  radio: { width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: colors.border },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkmark: { fontFamily: fonts.bold, fontSize: 14, color: colors.onPrimary },
  saveButton: { minHeight: 50, marginTop: 8, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  saveButtonText: { fontFamily: fonts.bold, fontSize: 14, color: colors.onPrimary },
  downloadedLesson: { minHeight: 58, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  itemBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.slate },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  title: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 32, color: colors.ink },
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

  identity: { alignItems: 'center', gap: 7, paddingVertical: 4 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: lightColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: { fontFamily: fonts.extrabold, fontSize: 10, lineHeight: 12, color: lightColors.inkDeep },
  name: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 26, color: colors.ink },
  tagline: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.slate },
  roleText: { fontFamily: fonts.extrabold, fontSize: 10, lineHeight: 12, color: colors.primary },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    ...shadow.frame,
  },
  statRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: 1, height: 38, backgroundColor: colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 20 },
  statLabel: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 12, color: colors.slate },

  achievementRow: { flexDirection: 'row', gap: 10 },
  achievementCard: {
    flex: 1,
    padding: 10,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 7,
    ...shadow.frame,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    color: colors.ink,
    textAlign: 'center',
  },

  menuList: { gap: 8 },
  menuRow: {
    minHeight: 62,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCopy: { flex: 1, gap: 2 },
  menuTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  menuSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },
});