import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { navigateToTab } from '../navigation/tabs';
import { ArrowRightIcon } from '../components/icons';
import { AtomIcon, FlaskIcon, FlameIcon, SearchIcon, SigmaIcon } from '../components/glyphs';
import { colors, fonts, shadow } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { useProfile } from '../profileContext';
import { useDisplayName } from '../displayName';
import { useCatalog } from '../catalogContext';
import type { RootScreenProps } from '../navigation/types';

const SUBJECT_ICONS = {
  mathematics: SigmaIcon,
  physics: AtomIcon,
  chemistry: FlaskIcon,
};

export default function HomeDashboardScreen({ navigation }: RootScreenProps<'Home'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { profile } = useProfile();
  const displayName = useDisplayName();
  const { subjects, topics } = useCatalog();
  const [searchQuery, setSearchQuery] = useState('');
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);
  const featuredTopics = topics.slice(0, 3);

  const openKnowledgeMap = (topicId?: string) => {
    navigation.navigate('KnowledgeMap', topicId ? { topicId } : undefined);
  };

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 18 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text style={styles.eyebrow}>{greeting},</Text>
            <Text style={styles.name}>{displayName || 'Learner'}</Text>
          </View>
          <View style={styles.streak}>
            <FlameIcon size={16} color={colors.orange} />
            <Text style={styles.streakText}>{profile?.streak ?? 0} day streak</Text>
          </View>
        </View>

        <Text style={styles.prompt}>Where would you like to explore?</Text>
        <View style={styles.searchField}>
          <SearchIcon size={18} color={colors.slate} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search concepts"
            placeholderTextColor={colors.slate}
            returnKeyType="search"
            accessibilityLabel="Search curriculum concepts"
            onSubmitEditing={() => navigation.navigate('Search', { query: searchQuery.trim() })}
          />
          <Pressable
            onPress={() => navigation.navigate('Search', { query: searchQuery.trim() })}
            accessibilityRole="button"
            accessibilityLabel="Search concepts"
          >
            <ArrowRightIcon size={18} color={colors.primary} />
          </Pressable>
        </View>

        <Pressable
          style={styles.mapCard}
          onPress={() => openKnowledgeMap()}
          accessibilityRole="button"
          accessibilityLabel="Open the Knowledge Map"
        >
          <View style={styles.mapDecor}>
            <View style={styles.mapNodeCenter} />
            <View style={styles.mapNodeOne} />
            <View style={styles.mapNodeTwo} />
            <View style={styles.mapLineOne} />
            <View style={styles.mapLineTwo} />
          </View>
          <Text style={styles.mapEyebrow}>YOUR CURRICULUM, CONNECTED</Text>
          <Text style={styles.mapTitle}>Knowledge Map</Text>
          <Text style={styles.mapDescription}>
            Explore how concepts fit together and find your next place to learn.
          </Text>
          <View style={styles.mapAction}>
            <Text style={styles.mapActionText}>Explore the map</Text>
            <ArrowRightIcon size={16} color={colors.onPrimary} />
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore by subject</Text>
          <Pressable onPress={() => navigation.navigate('Subjects')}>
            <Text style={styles.seeAll}>All subjects</Text>
          </Pressable>
        </View>
        <View style={styles.subjectGrid}>
          {subjects.map((subject) => {
            const Icon = SUBJECT_ICONS[subject.id as keyof typeof SUBJECT_ICONS] ?? AtomIcon;
            return (
              <Pressable
                key={String(subject.id)}
                style={styles.subjectCard}
                onPress={() => navigation.navigate('Subjects')}
              >
                <View style={[styles.subjectIcon, { backgroundColor: subject.soft }]}>
                  <Icon size={21} color={subject.accent} />
                </View>
                <Text style={styles.subjectName} numberOfLines={1}>{subject.name}</Text>
                <Text style={styles.subjectMeta}>Browse concepts</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Start with a topic</Text>
          <Pressable onPress={() => navigation.navigate('Subjects')}>
            <Text style={styles.seeAll}>Browse</Text>
          </Pressable>
        </View>
        <View style={styles.topicList}>
          {featuredTopics.map((topic) => {
            const subject = subjects.find((item) => String(item.id) === String(topic.subjectId));
            return (
              <Pressable
                key={topic.id}
                style={styles.topicRow}
                onPress={() => openKnowledgeMap(topic.id)}
                accessibilityRole="button"
              >
                <View style={styles.topicCopy}>
                  <Text style={styles.topicTitle} numberOfLines={1}>{topic.name}</Text>
                  <Text style={styles.topicSubject}>{subject?.name ?? 'Curriculum'}</Text>
                </View>
                <ArrowRightIcon size={17} color={colors.primary} />
              </Pressable>
            );
          })}
          {featuredTopics.length === 0 ? (
            <Text style={styles.emptyTopics}>Topics will appear here when the curriculum is available.</Text>
          ) : null}
        </View>
      </ScrollView>
      <BottomNav active="Home" onSelect={navigateToTab(navigation, 'Home')} />
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 18, gap: 16 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingCopy: { gap: 2 },
  eyebrow: { fontFamily: fonts.medium, fontSize: 12, color: colors.slate },
  name: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 27, color: colors.ink },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 32, borderRadius: 999, backgroundColor: colors.orangeSoft },
  streakText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.orange },
  prompt: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.ink },
  searchField: { height: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  searchInput: { flex: 1, paddingVertical: 0, fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
  mapCard: { minHeight: 210, position: 'relative', overflow: 'hidden', padding: 18, borderRadius: 20, backgroundColor: colors.inkDeep, ...shadow.frame },
  mapDecor: { position: 'absolute', width: 140, height: 120, right: -9, top: 12 },
  mapLineOne: { position: 'absolute', width: 60, height: 2, right: 34, top: 43, backgroundColor: '#6874B8', transform: [{ rotate: '29deg' }] },
  mapLineTwo: { position: 'absolute', width: 54, height: 2, right: 37, top: 70, backgroundColor: '#6874B8', transform: [{ rotate: '-31deg' }] },
  mapNodeCenter: { position: 'absolute', width: 20, height: 20, right: 58, top: 48, borderRadius: 10, backgroundColor: colors.yellow, borderWidth: 3, borderColor: '#3B4478' },
  mapNodeOne: { position: 'absolute', width: 13, height: 13, right: 24, top: 24, borderRadius: 7, backgroundColor: '#8FB8FF', borderWidth: 2, borderColor: '#3B4478' },
  mapNodeTwo: { position: 'absolute', width: 13, height: 13, right: 22, top: 80, borderRadius: 7, backgroundColor: '#9CE8D8', borderWidth: 2, borderColor: '#3B4478' },
  mapEyebrow: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.9, color: colors.yellow },
  mapTitle: { marginTop: 40, fontFamily: fonts.extrabold, fontSize: 23, lineHeight: 28, color: colors.surface },
  mapDescription: { maxWidth: 280, marginTop: 5, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: '#D5DBF3' },
  mapAction: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.primary },
  mapActionText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.onPrimary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  seeAll: { fontFamily: fonts.semibold, fontSize: 11, color: colors.primary },
  subjectGrid: { flexDirection: 'row', gap: 9 },
  subjectCard: { flex: 1, minWidth: 0, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  subjectIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, marginBottom: 8 },
  subjectName: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink },
  subjectMeta: { marginTop: 3, fontFamily: fonts.regular, fontSize: 9, color: colors.slate },
  topicList: { gap: 7 },
  topicRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  topicCopy: { flex: 1, gap: 3 },
  topicTitle: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
  topicSubject: { fontFamily: fonts.regular, fontSize: 10, color: colors.slate },
  emptyTopics: { padding: 14, fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: colors.slate },
});
