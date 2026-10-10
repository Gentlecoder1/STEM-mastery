import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import BottomNav from '../components/BottomNav';
import { CheckCircleIcon, LockIcon, SparklesIcon } from '../components/icons';
import {
  BookOpenIcon,
  BrainIcon,
  CloseIcon,
  GaugeIcon,
  LineChartIcon,
  PlayIcon,
  SearchIcon,
  VideoIcon,
} from '../components/glyphs';
import { Pill } from '../components/PracticeUI';
import { colors, fonts, shadow, type ColorToken } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { navigateToTab } from '../navigation/tabs';
import type { RootScreenProps } from '../navigation/types';

const FILTERS = [
  { label: 'ALL', count: 8 },
  { label: 'LESSONS', count: 3 },
  { label: 'CONCEPTS', count: 4 },
  { label: 'PRACTISE', count: 1 },
] as const;

const RESULTS = [
  {
    title: 'Speed vs velocity',
    subtitle: 'Concept • Physics • 72% mastery',
    Icon: GaugeIcon,
    tint: 'blue' as ColorToken,
    soft: 'blueSoft' as ColorToken,
    kind: 'pill',
  },
  {
    title: 'Understanding velocity',
    subtitle: 'Lesson • 7 min • completed',
    Icon: BookOpenIcon,
    tint: 'success' as ColorToken,
    soft: 'greenSoft' as ColorToken,
    kind: 'check',
  },
  {
    title: 'Velocity-time graphs',
    subtitle: 'Concept • Physics • locked',
    Icon: LineChartIcon,
    tint: 'orange' as ColorToken,
    soft: 'orangeSoft' as ColorToken,
    kind: 'lock',
  },
  {
    title: 'Velocity quick practice',
    subtitle: 'Practice • 6 questions • +60 XP',
    Icon: BrainIcon,
    tint: 'primary' as ColorToken,
    soft: 'primarySoft' as ColorToken,
    kind: 'start',
  },
  {
    title: 'Velocity in everyday motion',
    subtitle: 'Video • 4:12 • Physics',
    Icon: VideoIcon,
    tint: 'violet' as ColorToken,
    soft: 'violetSoft' as ColorToken,
    kind: 'play',
  },
];

export default function SearchScreen({ navigation }: RootScreenProps<'Search'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('velocity');
  const [activeFilter, setActiveFilter] = useState('ALL');

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.searchHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Search learning</Text>
        <View style={styles.field}>
          <SearchIcon size={19} color={colors.slate} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search lessons, concepts, videos…"
            placeholderTextColor={colors.slate}
            returnKeyType="search"
            accessibilityLabel="Search learning"
          />
          {query.length > 0 ? (
            <Pressable
              style={styles.clear}
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <CloseIcon size={13} color={colors.slate} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 14 },
        ]}
      >
        <View style={styles.filterRow}>
          {FILTERS.map(({ label, count }) => {
            const on = label === activeFilter;
            return (
              <Pressable key={label} onPress={() => setActiveFilter(label)} accessibilityRole="button">
                <Pill bg={on ? colors.primary : colors.surface} tint={on ? colors.onPrimary : colors.slate}>
                  {label} {count}
                </Pill>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>8 results</Text>
          <Text style={styles.resultsSort}>Most relevant</Text>
        </View>

        <View style={styles.resultList}>
          {RESULTS.map(({ title, subtitle, Icon, tint, soft, kind }) => (
            <Pressable
              key={title}
              style={styles.resultRow}
              onPress={() => navigation.navigate('Practice')}
              accessibilityRole="button"
            >
              <View style={[styles.resultIcon, { backgroundColor: colors[soft] }]}>
                <Icon size={19} color={colors[tint]} />
              </View>
              <View style={styles.resultCopy}>
                <Text style={styles.resultTitle}>{title}</Text>
                <Text style={styles.resultSubtitle}>{subtitle}</Text>
              </View>
              {kind === 'pill' ? (
                <Pill bg={colors.blueSoft} tint={colors.blue}>CONCEPT</Pill>
              ) : kind === 'check' ? (
                <CheckCircleIcon size={19} color={colors.success} />
              ) : kind === 'lock' ? (
                <LockIcon size={16} color={colors.slate} />
              ) : kind === 'start' ? (
                <Pill bg={colors.primarySoft} tint={colors.primary}>START</Pill>
              ) : (
                <PlayIcon size={18} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <SparklesIcon size={18} color={colors.orange} />
          </View>
          <Text style={styles.tipText}>
            Try “acceleration graph” for a more specific result.
          </Text>
        </View>
      </ScrollView>

      <BottomNav active="Subjects" onSelect={navigateToTab(navigation, 'Subjects')} />
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  searchHeader: { gap: 13, paddingHorizontal: 18, paddingBottom: 14 },
  content: { paddingHorizontal: 18, gap: 13 },

  title: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 32, color: colors.ink, paddingBottom: 2 },

  field: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 17,
    color: colors.ink,
    paddingVertical: 0,
  },
  clear: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultsCount: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.slate },
  resultsSort: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15, color: colors.primary },

  resultList: { gap: 8 },
  resultRow: {
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
  resultIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCopy: { flex: 1, gap: 2 },
  resultTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  resultSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.yellowSoft,
    ...shadow.frame,
  },
  tipIcon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.ink },
});