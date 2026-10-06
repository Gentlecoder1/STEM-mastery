import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { ChevronRightIcon, SparklesIcon } from '../components/icons';
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
import { Pill, SectionHeading } from '../components/PracticeUI';
import { colors, fonts, shadow, type ColorToken } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { navigateToTab } from '../navigation/tabs';
import type { RootScreenProps } from '../navigation/types';

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

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <UserIcon size={40} color={colors.primary} strokeWidth={1.4} />
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>12</Text>
            </View>
          </View>
          <Text style={styles.name}>Iseoluwa</Text>
          <Text style={styles.tagline}>SS1 learner • Lagos, Nigeria</Text>
          <Pill bg={colors.primarySoft} tint={colors.primary}>
            <SparklesIcon size={12} color={colors.primary} />
            <Text style={styles.roleText}>CURIOUS EXPLORER</Text>
          </Pill>
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
            <Pressable key={title} style={styles.menuRow} accessibilityRole="button">
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
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 18, gap: 13 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 2,
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
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: { fontFamily: fonts.extrabold, fontSize: 10, lineHeight: 12, color: colors.inkDeep },
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