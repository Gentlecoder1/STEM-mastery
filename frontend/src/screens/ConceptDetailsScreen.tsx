import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '../components/icons';
import { BookOpenIcon } from '../components/glyphs';
import { colors, fonts, shadow } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { useCatalog } from '../catalogContext';
import { useOffline } from '../offlineContext';
import { CONTENT_LABELS, QUIZ_PASS_RATIO } from '../types/catalog';
import type { RootScreenProps } from '../navigation/types';
import { useProgress } from '../progressContext';

export default function ConceptDetailsScreen({ navigation, route }: RootScreenProps<'ConceptDetails'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { getConcept, loadConcept, topics, subjects } = useCatalog();
  const { isConceptCompleted, placement } = useProgress();
  const offline = useOffline();
  const concept = getConcept(route.params.conceptId);
  const lessonContent = offline.getLessonContent(route.params.conceptId) ?? [];

  useEffect(() => {
    void loadConcept(route.params.conceptId);
    void offline.ensureLesson(route.params.conceptId);
  }, [loadConcept, offline.ensureLesson, route.params.conceptId]);

  if (!concept) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>Concept not found.</Text>
      </View>
    );
  }

  const itemCount = lessonContent.length;
  const beginLesson = (conceptId: string, returnToConceptId?: string) => {
    navigation.navigate('ConceptLearning', { conceptId, returnToConceptId });
  };
  const startLearning = () => {
    const prerequisiteIndex = concept.prerequisiteIds.findIndex((id) =>
      !isConceptCompleted(id) && (placement.conceptMastery[id] ?? 0) < QUIZ_PASS_RATIO,
    );
    if (prerequisiteIndex < 0) {
      beginLesson(concept.id, route.params.returnToConceptId);
      return;
    }
    const prerequisiteId = concept.prerequisiteIds[prerequisiteIndex];
    const prerequisiteName = concept.prerequisites[prerequisiteIndex] ?? prerequisiteId;
    Alert.alert(
      `Before learning ${concept.title}`,
      `We recommend reviewing ${prerequisiteName} first.`,
      [
        {
          text: 'Learn prerequisite first',
          onPress: () => navigation.push('ConceptDetails', {
            conceptId: prerequisiteId,
            contextTopicId: route.params.contextTopicId,
            returnToConceptId: concept.id,
          }),
        },
        {
          text: 'Continue anyway',
          onPress: () => beginLesson(concept.id, route.params.returnToConceptId),
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeftIcon size={23} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>CONCEPT</Text>
          <Text style={styles.headerTitle}>{concept.title}</Text>
        </View>

      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 96 },
        ]}
      >
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors[concept.soft] }]}>
            <BookOpenIcon size={28} color={colors[concept.tint]} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroStatus, { color: colors[concept.tint] }]}>CONCEPT</Text>
            <Text style={styles.heroTitle}>{concept.title}</Text>
            <Text style={styles.heroMeta}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} of content
            </Text>
          </View>
        </View>

        <View style={styles.contextList}>
          {concept.topicIds.map((topicId) => {
            const topic = topics.find((item) => item.id === topicId);
            if (!topic) return null;
            const subject = subjects.find((item) => String(item.id) === String(topic.subjectId));
            return (
              <Text key={topic.id} style={styles.contextLine}>
                {subject?.name ?? String(topic.subjectId)} · {topic.name}
              </Text>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Short definition</Text>
        <View style={[styles.card, { borderLeftColor: colors[concept.tint] }]}>
          <Text style={styles.cardBody}>{concept.definition}</Text>
        </View>

        <Text style={styles.sectionTitle}>Why this matters</Text>
        <View style={styles.card}>
          <Text style={styles.cardBody}>{concept.whyItMatters}</Text>
        </View>

        <Text style={styles.sectionTitle}>Prerequisites</Text>
        <View style={styles.chipRow}>
          {concept.prerequisiteIds.map((id, index) => (
            <Pressable key={id} style={styles.chip} onPress={() => navigation.push('ConceptDetails', { conceptId: id })}>
              <CheckCircleIcon size={14} color={colors.slate} />
              <Text style={styles.chipText}>{concept.prerequisites[index] ?? id}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Related concepts</Text>
        <View style={styles.chipRow}>
          {concept.relatedConceptIds.map((id, index) => (
            <Pressable key={id} style={[styles.chip, styles.chipRelated]} onPress={() => navigation.push('ConceptDetails', { conceptId: id })}>
              <Text style={[styles.chipText, styles.chipTextRelated]}>{concept.related[index] ?? id}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Learning content</Text>
          <Text style={styles.link}>{itemCount} items</Text>
        </View>
        <View style={styles.contentList}>
          {lessonContent.map((item) => (
            <View key={item.id} style={styles.contentRow}>
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{item.chapterOrder}</Text>
              </View>
              <View style={styles.contentCopy}>
                <Text style={styles.contentTitle}>{item.title}</Text>
                <Text style={styles.contentType}>
                  {CONTENT_LABELS[item.contentType]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          style={styles.primaryButton}
          onPress={startLearning}
          accessibilityRole="button"
        >
          <BookOpenIcon size={18} color={colors.onPrimary} />
          <Text style={styles.primaryText}>Start Learning</Text>
          <ArrowRightIcon size={18} color={colors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  missing: { alignItems: 'center', justifyContent: 'center' },
  missingText: { fontFamily: fonts.medium, fontSize: 14, color: colors.slate },
  content: { paddingHorizontal: 18, gap: 12 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingBottom: 14 },
  iconButton: {
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
  headerEyebrow: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, color: colors.slate },
  headerTitle: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 25, color: colors.ink },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.frame,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 4 },
  heroStatus: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12 },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: colors.ink },
  heroMeta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.slate },
  contextList: { gap: 3 },
  contextLine: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.slate },

  sectionTitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: colors.ink },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15, color: colors.primary },

  card: {
    padding: 16,
    borderRadius: 18,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.frame,
  },
  cardBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.ink },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipRelated: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.slate },
  chipTextRelated: { color: colors.primary },

  contentList: { gap: 8 },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  orderBadge: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  orderText: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15, color: colors.primary },
  contentCopy: { flex: 1, gap: 2 },
  contentTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  contentType: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 12, color: colors.slate },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 10,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryButton: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    ...shadow.card,
  },
  primaryText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 18, color: colors.onPrimary },
});