import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import BottomNav from '../components/BottomNav';
import Toggle from '../components/Toggle';
import { ArrowLeftIcon, ChevronRightIcon } from '../components/icons';
import {
  BellIcon,
  DownloadIcon,
  HelpCircleIcon,
  LanguagesIcon,
  MoonIcon,
  ShieldCheckIcon,
  SlidersIcon,
  TargetIcon,
  TypeIcon,
  VolumeIcon,
} from '../components/glyphs';
import { colors, fonts, type ColorToken } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { navigateToTab } from '../navigation/tabs';
import type { RootScreenProps } from '../navigation/types';

type Row = {
  key: string;
  title: string;
  subtitle: string;
  Icon: (props: { size?: number; color?: string; strokeWidth?: number }) => React.JSX.Element;
  tint: ColorToken;
  soft: ColorToken;
  trailing: 'change' | 'toggle' | 'chevron';
  toggleKey?: 'reminders' | 'adaptive' | 'readAloud' | 'wifi';
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
      {
        key: 'adaptive',
        title: 'Adaptive difficulty',
        subtitle: 'Adjust questions as I improve',
        Icon: SlidersIcon,
        tint: 'violet',
        soft: SOFT.violet,
        trailing: 'toggle',
        toggleKey: 'adaptive',
      },
    ],
  },
  {
    label: 'ACCESSIBILITY & DATA',
    rows: [
      {
        key: 'textSize',
        title: 'Text size',
        subtitle: 'Standard',
        Icon: TypeIcon,
        tint: 'teal',
        soft: SOFT.teal,
        trailing: 'chevron',
      },
      {
        key: 'readAloud',
        title: 'Read lessons aloud',
        subtitle: 'Audio support for lesson text',
        Icon: VolumeIcon,
        tint: 'success',
        soft: SOFT.success,
        trailing: 'toggle',
        toggleKey: 'readAloud',
      },
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
        key: 'privacy',
        title: 'Privacy and learning data',
        subtitle: 'What we store and how it is used',
        Icon: ShieldCheckIcon,
        tint: 'success',
        soft: SOFT.success,
        trailing: 'chevron',
      },
      {
        key: 'help',
        title: 'Help and feedback',
        subtitle: 'Contact support or share ideas',
        Icon: HelpCircleIcon,
        tint: 'orange',
        soft: SOFT.orange,
        trailing: 'chevron',
      },
    ],
  },
];

export default function SettingsScreen({ navigation }: RootScreenProps<'Settings'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle, isDark, startThemeReveal } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [toggles, setToggles] = useState({
    reminders: true,
    adaptive: true,
    readAloud: false,
    wifi: true,
  });

  const setToggle = (key: keyof typeof toggles) => (value: boolean) =>
    setToggles((prev) => ({ ...prev, [key]: value }));

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 14 },
        ]}
      >
        <View style={styles.header}>
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
                  accessibilityState={toggleKey ? { checked: toggles[toggleKey] } : undefined}
                >
                  <View style={[styles.rowIcon, { backgroundColor: colors[soft] }]}>
                    <Icon size={19} color={colors[tint]} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{title}</Text>
                    <Text style={styles.rowSubtitle}>{subtitle}</Text>
                  </View>
                  {trailing === 'change' ? (
                    <Pressable accessibilityRole="button">
                      <Text style={styles.changeText}>Change</Text>
                    </Pressable>
                  ) : trailing === 'toggle' && toggleKey ? (
                    <Toggle value={toggles[toggleKey]} onValueChange={setToggle(toggleKey)} label={title} />
                  ) : (
                    <ChevronRightIcon size={20} color={colors.slate} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <BottomNav active="Profile" onSelect={navigateToTab(navigation, 'Profile')} />
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 18, gap: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 2,
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