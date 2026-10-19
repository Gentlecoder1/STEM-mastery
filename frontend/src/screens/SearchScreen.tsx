import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { CloseIcon, SearchIcon } from '../components/glyphs';
import { colors, fonts } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { navigateToTab } from '../navigation/tabs';
import { ApiError } from '../lib/api';
import { searchConcepts } from '../lib/catalogApi';
import { useCatalog } from '../catalogContext';
import type { ApiConceptSearchResult } from '../types/catalog';
import type { RootScreenProps } from '../navigation/types';


export default function SearchScreen({ navigation, route }: RootScreenProps<'Search'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState(route.params?.query ?? '');
  const [results, setResults] = useState<ApiConceptSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { concepts, topics, subjects } = useCatalog();

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      void searchConcepts(normalized)
        .then((items) => {
          if (active) setResults(items);
        })
        .catch((cause: unknown) => {
          if (!active) return;
          if (cause instanceof ApiError && (cause.status === 0 || cause.status === 503)) {
            const needle = normalized.toLowerCase();
            const cached = concepts
              .filter((concept) =>
                `${concept.title} ${concept.id} ${concept.definition}`.toLowerCase().includes(needle),
              )
              .map((concept) => ({
                id: concept.id,
                name: concept.title,
                shortDescription: concept.definition || null,
                contexts: concept.topicIds.flatMap((topicId) => {
                  const topic = topics.find((item) => item.id === topicId);
                  if (!topic) return [];
                  const subject = subjects.find((item) => String(item.id) === String(topic.subjectId));
                  return [{
                    subjectId: String(topic.subjectId),
                    subjectName: subject?.name ?? String(topic.subjectId),
                    topicId: topic.id,
                    topicName: topic.name,
                  }];
                }),
              }));
            setResults(cached);
            setError(cached.length > 0 ? null : 'Connect to search the live curriculum.');
          } else {
            setResults([]);
            setError(
              cause instanceof ApiError
                ? `Concept search is unavailable (${cause.status}). Try again shortly.`
                : 'Concept search is unavailable. Try again shortly.',
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [concepts, query, subjects, topics]);

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.searchHeader, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.title}>Search concepts</Text>
        <View style={styles.field}>
          <SearchIcon size={19} color={colors.slate} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Vector, Velocity, Logarithm…"
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
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {query.trim().length < 2
              ? 'Enter at least 2 characters'
              : error
                ? 'Search unavailable'
                : `${results.length} concepts`}
          </Text>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
        {error ? <Text style={styles.message}>{error}</Text> : null}
        {results.map((result) => (
          <View key={result.id} style={styles.resultCard}>
            <Text style={styles.resultTitle}>{result.name}</Text>
            {result.shortDescription ? (
              <Text style={styles.resultDescription}>{result.shortDescription}</Text>
            ) : null}
            {result.contexts.length > 1 ? (
              <Text style={styles.contextPrompt}>Choose a learning context</Text>
            ) : null}
            {result.contexts.map((context) => (
              <Pressable
                key={`${context.subjectId}:${context.topicId}`}
                style={styles.contextRow}
                onPress={() => navigation.navigate('ConceptDetails', {
                  conceptId: result.id,
                  contextTopicId: context.topicId ?? undefined,
                })}
                accessibilityRole="button"
              >
                <View style={styles.resultCopy}>
                  <Text style={styles.resultSubtitle}>{context.subjectName ?? context.subjectId ?? 'Curriculum'}</Text>
                  {context.topicName ? <Text style={styles.contextTopic}>{context.topicName}</Text> : null}
                </View>
                <Text style={styles.openAction}>Open</Text>
              </Pressable>
            ))}
            {result.contexts.length === 0 ? (
              <Pressable
                style={styles.contextRow}
                onPress={() => navigation.navigate('ConceptDetails', { conceptId: result.id })}
                accessibilityRole="button"
              >
                <Text style={styles.contextTopic}>Open concept</Text>
                <Text style={styles.openAction}>Open</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        {!loading && query.trim().length >= 2 && !error && results.length === 0 ? (
          <Text style={styles.message}>No matching concepts were found in the curriculum.</Text>
        ) : null}
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

  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultsCount: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.slate },
  resultCard: { padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, gap: 10 },
  resultCopy: { flex: 1, gap: 3 },
  resultTitle: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20, color: colors.ink },
  resultDescription: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.slate },
  resultSubtitle: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13, color: colors.slate },
  contextPrompt: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink, marginTop: 4 },
  contextRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  contextTopic: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  openAction: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  message: { paddingVertical: 12, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.slate },
});