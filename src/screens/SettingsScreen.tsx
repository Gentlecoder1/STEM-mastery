import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import BottomNav from '../components/BottomNav';
import BottomSheetDrawer from '../components/BottomSheetDrawer';
import Toggle from '../components/Toggle';
import { ArrowLeftIcon, ChevronRightIcon } from '../components/icons';
import {
  BellIcon,
  DownloadIcon,
  HelpCircleIcon,
  LanguagesIcon,
  MoonIcon,
  TargetIcon,
  UserIcon,
} from '../components/glyphs';
import { colors, fonts, type ColorToken } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { navigateToTab } from '../navigation/tabs';
import type { RootScreenProps } from '../navigation/types';
import {
  CLASS_OPTIONS,
  SUBJECT_OPTIONS,
  usePreferences,
  type ClassLevel,
} from '../preferencesContext';
import type { SubjectId } from '../theme';

type Row = {
  key: string;
  title: string;
  subtitle: string;
  Icon: (props: { size?: number; color?: string; strokeWidth?: number }) => React.JSX.Element;
  tint: ColorToken;
  soft: ColorToken;
  trailing: 'change' | 'toggle' | 'chevron';
  toggleKey?: 'reminders' | 'wifi';
};

const SOFT = {
  orange: 'orangeSoft' as ColorToken,
  blue: 'blueSoft' as ColorToken,
  violet: 'violetSoft' as ColorToken,
  teal: 'greenSoft' as ColorToken,
  success: 'greenSoft' as ColorToken,
};

const GROUPS: { label: string; rows: Row[] }[] = [
  {
    label: 'LEARNING',
    rows: [
      {
        key: 'goal',
        title: 'Daily goal',
        subtitle: '20 minutes',
        Icon: TargetIcon,
        tint: 'orange',
        soft: SOFT.orange,
        trailing: 'change',
      },
      {
        key: 'reminders',
        title: 'Study reminders',
        subtitle: 'Weekdays at 6:00 PM',
        Icon: BellIcon,
        tint: 'blue',
        soft: SOFT.blue,
        trailing: 'toggle',
        toggleKey: 'reminders',
      },
    ],
  },
  {
    label: 'ACCESSIBILITY & DATA',
    rows: [
      {
        key: 'wifi',
        title: 'Download on Wi-Fi',
        subtitle: 'Save lessons for offline use',
        Icon: DownloadIcon,
        tint: 'blue',
        soft: SOFT.blue,
        trailing: 'toggle',
        toggleKey: 'wifi',
      },
      {
        key: 'language',
        title: 'Language',
        subtitle: 'English',
        Icon: LanguagesIcon,
        tint: 'violet',
        soft: SOFT.violet,
        trailing: 'chevron',
      },
    ],
  },
  {
    label: 'ACCOUNT & SUPPORT',
    rows: [
      {
        key: 'help',
        title: 'Help and feedback',
        subtitle: 'Contact support or share ideas',
        Icon: HelpCircleIcon,
        tint: 'orange',
        soft: SOFT.orange,
        trailing: 'chevron',
      },
      {
        key: 'profile',
        title: 'Edit profile',
        subtitle: 'Name and location',
        Icon: UserIcon,
        tint: 'blue',
        soft: SOFT.blue,
        trailing: 'chevron',
      },
    ],
  },
];

export default function SettingsScreen({ navigation }: RootScreenProps<'Settings'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle, isDark, startThemeReveal } = useTheme();
  const {
    classLevel,
    subjects,
    dailyGoal,
    userName,
    location,
    saveClassAndSubjects,
    setDailyGoal,
    saveProfile,
    downloadsEnabled,
    setDownloadsEnabled,
  } = usePreferences();
  const styles = useThemedStyles(createStyles);
  const [toggles, setToggles] = useState({
    reminders: true,
    wifi: true,
  });
  const [drawerKey, setDrawerKey] = useState<string | null>(null);
  const [draftClass, setDraftClass] = useState<ClassLevel>(classLevel);
  const [draftSubjects, setDraftSubjects] = useState<SubjectId[]>(subjects);
  const [draftGoal, setDraftGoal] = useState(dailyGoal);
  const [draftName, setDraftName] = useState(userName);
  const [draftLocation, setDraftLocation] = useState(location);

  const setToggle = (key: keyof typeof toggles) => (value: boolean) =>
    setToggles((prev) => ({ ...prev, [key]: value }));
  const openDrawer = (key: string) => {
    setDrawerKey(key);
    if (key === 'goal') setDraftGoal(dailyGoal);
    if (key === 'profile') {
      setDraftName(userName);
      setDraftLocation(location);
    }
    if (key === 'class') {
      setDraftClass(classLevel);
      setDraftSubjects(subjects);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.headerAction}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeftIcon size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Make Masterly work for you</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 14 },
        ]}
      >
        <View style={styles.group}>
          <Text style={styles.groupLabel}>APPEARANCE</Text>
          <View style={styles.groupList}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
                <MoonIcon size={19} color={colors.primary} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>Dark mode</Text>
                <Text style={styles.rowSubtitle}>
                  {isDark ? 'On — dark theme' : 'Off — light theme'}
                </Text>
              </View>
              <Toggle
                value={isDark}
                onValueChange={(_value, event) => {
                  const { width, height } = Dimensions.get('window');
                  const x = event?.nativeEvent.pageX ?? width / 2;
                  const y = event?.nativeEvent.pageY ?? height / 2;
                  startThemeReveal(x, y);
                }}
                label="Dark mode"
              />
            </View>
          </View>
        </View>

        {GROUPS.map(({ label, rows }) => (
          <View key={label} style={styles.group}>
            <Text style={styles.groupLabel}>{label}</Text>
            <View style={styles.groupList}>
              {rows.map(({ key, title, subtitle, Icon, tint, soft, trailing, toggleKey }) => (
                <Pressable
                  key={key}
                  style={styles.row}
                  accessibilityRole={toggleKey ? 'switch' : 'button'}
                  accessibilityState={
                    toggleKey
                      ? { checked: toggleKey === 'wifi' ? downloadsEnabled : toggles[toggleKey] }
                      : undefined
                  }
                  onPress={
                    key === 'goal' || key === 'profile' || key === 'class'
                      ? () => openDrawer(key)
                      : trailing === 'chevron'
                        ? () => openDrawer(key)
                        : undefined
                  }
                >
                  <View style={[styles.rowIcon, { backgroundColor: colors[soft] }]}>
                    <Icon size={19} color={colors[tint]} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{title}</Text>
                    <Text style={styles.rowSubtitle}>{key === 'goal' ? dailyGoal : subtitle}</Text>
                  </View>
                  {trailing === 'change' ? (
                    <Pressable accessibilityRole="button" onPress={() => openDrawer('goal')}>
                      <Text style={styles.changeText}>Change</Text>
                    </Pressable>
                  ) : trailing === 'toggle' && toggleKey ? (
                    <Toggle
                      value={toggleKey === 'wifi' ? downloadsEnabled : toggles[toggleKey]}
                      onValueChange={(value) => {
                        setToggle(toggleKey)(value);
                        if (toggleKey === 'wifi') setDownloadsEnabled(value);
                      }}
                      label={title}
                    />
                  ) : (
                    <ChevronRightIcon size={20} color={colors.slate} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <Pressable
          style={styles.logoutButton}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>

      <BottomNav active="Profile" onSelect={navigateToTab(navigation, 'Profile')} />
      <BottomSheetDrawer
        visible={drawerKey !== null}
        title={
          drawerKey === 'language'
            ? 'Language'
            : drawerKey === 'goal'
              ? 'Daily goal'
              : drawerKey === 'class'
                ? 'Class and subjects'
                : drawerKey === 'profile'
                  ? 'Edit profile'
                  : 'Help and feedback'
        }
        description={
          drawerKey === 'language'
            ? 'Choose the language used throughout your learning experience.'
            : drawerKey === 'goal'
              ? 'Choose how much focused learning you want to complete each day.'
              : drawerKey === 'class'
                ? 'Choose one class and the subjects in your learning library.'
                : drawerKey === 'profile'
                  ? 'Update the details shown on your learning profile.'
            : 'Get help with Masterly or share feedback with the team.'
        }
        items={[]}
        onClose={() => setDrawerKey(null)}
      >
        {drawerKey === 'class' ? (
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
                      selected
                        ? current.filter((id) => id !== subject.id)
                        : [...current, subject.id],
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
        ) : drawerKey === 'goal' ? (
          <ScrollView contentContainerStyle={styles.drawerContent}>
            <TextInput
              value={draftGoal}
              onChangeText={setDraftGoal}
              placeholder="e.g. 45 minutes"
              placeholderTextColor={colors.slate}
              style={styles.goalInput}
              accessibilityLabel="Daily goal"
            />
            {['20 minutes', '30 minutes', '1 hour', '2 hours', '5 hours'].map((option) => (
              <Pressable key={option} style={styles.choiceRow} onPress={() => setDraftGoal(option)}>
                <Text style={styles.choiceText}>{option}</Text>
                <View style={[styles.radio, draftGoal === option && styles.radioSelected]} />
              </Pressable>
            ))}
            <Pressable
              style={styles.saveButton}
              onPress={() => {
                setDailyGoal(draftGoal.trim() || '20 minutes');
                setDrawerKey(null);
              }}
            >
              <Text style={styles.saveButtonText}>Save changes</Text>
            </Pressable>
          </ScrollView>
        ) : drawerKey === 'profile' ? (
          <View style={styles.drawerContent}>
            <TextInput value={draftName} onChangeText={setDraftName} placeholder="Name" placeholderTextColor={colors.slate} style={styles.goalInput} />
            <TextInput value={draftLocation} onChangeText={setDraftLocation} placeholder="Location" placeholderTextColor={colors.slate} style={styles.goalInput} />
            <Pressable
              style={styles.saveButton}
              onPress={() => {
                saveProfile(draftName, draftLocation);
                setDrawerKey(null);
              }}
            >
              <Text style={styles.saveButtonText}>Save changes</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.items}>
            {(
              drawerKey === 'language'
                ? [
                    { title: 'English', body: 'Your app language is currently set to English.' },
                    { title: 'More languages', body: 'Additional language options will be added in a future update.' },
                  ]
                : [
                    { title: 'Getting help', body: 'Check your connection, restart the app, and try the action again.' },
                    { title: 'Share feedback', body: 'Tell us what worked well or what would make learning easier.' },
                    { title: 'Contact support', body: 'Support is available for account, lesson, and download questions.' },
                  ]
            ).map((item) => (
              <View key={item.title} style={styles.item}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBody}>{item.body}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </BottomSheetDrawer>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 18, gap: 14 },
  drawerContent: { gap: 10, paddingTop: 18, paddingBottom: 8 },
  drawerLabel: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, color: colors.slate, marginTop: 8 },
  choiceRow: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  radio: { width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: colors.border },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkmark: { fontFamily: fonts.bold, fontSize: 14, color: colors.onPrimary },
  goalInput: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  saveButton: { minHeight: 50, marginTop: 8, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  saveButtonText: { fontFamily: fonts.bold, fontSize: 14, color: colors.onPrimary },
  logoutButton: { minHeight: 50, marginTop: 4, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.surface },
  logoutText: { fontFamily: fonts.bold, fontSize: 14, color: colors.danger },
  items: { gap: 10, paddingTop: 18, paddingBottom: 8 },
  item: { padding: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 4 },
  itemTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18, color: colors.ink },
  itemBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.slate },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
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
  headerCopy: { flex: 1, gap: 2 },
  headerTitle: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 25, color: colors.ink },
  headerSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },
  headerSpacer: { width: 42 },

  group: { gap: 8 },
  groupLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    color: colors.slate,
  },
  groupList: { gap: 8 },
  row: {
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
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  rowSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },
  changeText: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15, color: colors.primary },
});