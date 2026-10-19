import { useEffect, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon, ArrowRightIcon } from '../components/icons';
import { colors, fonts, shadow } from '../theme';
import type { LessonValue } from '../types/catalog';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles, useTheme } from '../themeContext';
import { useProgress } from '../progressContext';
import { useCatalog } from '../catalogContext';
import { useOffline } from '../offlineContext';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.lessonSection}>
      <Text style={styles.lessonLabel}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function formatLessonValue(value: LessonValue): string {
  if (value === null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(formatLessonValue).filter(Boolean).join(', ');
  return Object.entries(value)
    .filter(([key]) => !['image_prompt', 'imagePrompt'].includes(key))
    .map(([key, child]) => `${key}: ${formatLessonValue(child)}`)
    .filter((item) => !item.endsWith(': '))
    .join('; ');
}

function LessonTextList({ items }: { items: string[] }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.lessonItems}>
      {items.map((item, index) => (
        <Text key={`${index}:${item}`} style={styles.lessonBody}>{item}</Text>
      ))}
    </View>
  );
}

function LessonTable({ value }: { value: LessonValue }) {
  const styles = useThemedStyles(createStyles);
  if (!value || typeof value !== 'object') return null;

  const tableObject = Array.isArray(value) ? null : value;
  const rows = Array.isArray(value)
    ? value
    : tableObject?.rows ?? tableObject?.data;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const rawHeaders = tableObject?.headers ?? tableObject?.columns;
  const headers = Array.isArray(rawHeaders)
    ? rawHeaders
    : rows[0] && typeof rows[0] === 'object' && !Array.isArray(rows[0])
      ? Object.keys(rows[0])
      : [];
  if (headers.length === 0) return null;

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        {headers.map((cell, index) => (
          <Text key={`${index}:${formatLessonValue(cell)}`} style={styles.tableHeaderText}>
            {formatLessonValue(cell)}
          </Text>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          {(Array.isArray(row)
            ? row
            : row && typeof row === 'object'
              ? headers.map((header) => row[formatLessonValue(header)])
              : [row]
          ).map((cell, cellIndex) => (
            <Text key={`${rowIndex}:${cellIndex}`} style={styles.tableCell}>
              {formatLessonValue(cell)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function ConceptLearningScreen({
  navigation,
  route,
}: RootScreenProps<'ConceptLearning'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  const { recordLastConcept } = useProgress();
  const { getConcept, loadConcept } = useCatalog();
  const offline = useOffline();
  const { conceptId, returnToConceptId } = route.params;
  const concept = getConcept(conceptId);
  const lesson = offline.getLesson(conceptId);
  useEffect(() => {
    void loadConcept(conceptId);
    void offline.ensureLesson(conceptId);
    recordLastConcept(conceptId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId]);

  if (!concept && !lesson) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>Loading lesson…</Text>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>
          This lesson has not been loaded yet. Connect to the internet to open it.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.pop(2)}
          accessibilityRole="button"
          accessibilityLabel="Close lesson"
        >
          <ArrowLeftIcon size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{concept?.title ?? 'Lesson'}</Text>
          <Text style={styles.headerSubtitle}>
            {offline.isDownloaded(conceptId) ? 'Available offline' : 'Online lesson'}
          </Text>
        </View>
        {lesson?.concept.estimatedMinutes ? (
          <Text style={styles.headerCounter}>{lesson.concept.estimatedMinutes} min</Text>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 104 },
        ]}
      >
        {lesson.prerequisiteNotes.length > 0 ? (
          <Section title="Background knowledge">
            <LessonTextList items={lesson.prerequisiteNotes} />
          </Section>
        ) : null}
        {lesson.learningObjectives.length > 0 ? (
          <Section title="What you will learn">
            <LessonTextList items={lesson.learningObjectives} />
          </Section>
        ) : null}
        {lesson.definition ? (
          <Section title="Definition">
            <Text style={styles.lessonBody}>{lesson.definition}</Text>
          </Section>
        ) : null}
        {lesson.explanation.length > 0 ? (
          <Section title="Explanation">
            <LessonTextList items={lesson.explanation} />
          </Section>
        ) : null}
        {lesson.keyTerms.length > 0 ? (
          <Section title="Key terms">
            {lesson.keyTerms.map(({ term, definition }) => (
              <View key={term} style={styles.term}>
                <Text style={styles.termTitle}>{term}</Text>
                <Text style={styles.lessonBody}>{definition}</Text>
              </View>
            ))}
          </Section>
        ) : null}
        {lesson.illustrations.length > 0 ? (
          <Section title="Illustrations">
            {lesson.illustrations.map((illustration, index) => (
              <View key={`${illustration.caption ?? illustration.type ?? 'illustration'}:${index}`} style={styles.lessonItems}>
                {illustration.caption ? <Text style={styles.termTitle}>{illustration.caption}</Text> : null}
                {illustration.description ? <Text style={styles.lessonBody}>{illustration.description}</Text> : null}
                {illustration.mediaURI ? (
                  <Image source={{ uri: illustration.mediaURI }} style={styles.illustration} resizeMode="contain" />
                ) : null}
                {illustration.table !== null ? <LessonTable value={illustration.table} /> : null}
              </View>
            ))}
          </Section>
        ) : null}
        {lesson.workedExamples.length > 0 ? (
          <Section title="Worked examples">
            {lesson.workedExamples.map((example, index) => (
              <View key={`${example.problem}:${index}`} style={styles.example}>
                <Text style={styles.termTitle}>{example.problem}</Text>
                {example.steps.map((step, stepIndex) => (
                  <Text key={`${stepIndex}:${step}`} style={styles.lessonBody}>
                    {stepIndex + 1}. {step}
                  </Text>
                ))}
                {example.answer ? (
                  <Text style={styles.exampleAnswer}>Answer: {example.answer}</Text>
                ) : null}
              </View>
            ))}
          </Section>
        ) : null}
        {lesson.realWorldApplications.length > 0 ? (
          <Section title="Real-world applications">
            <LessonTextList items={lesson.realWorldApplications} />
          </Section>
        ) : null}
        {lesson.commonMistakes.length > 0 ? (
          <Section title="Common mistakes">
            <LessonTextList items={lesson.commonMistakes} />
          </Section>
        ) : null}
        {lesson.summary.length > 0 ? (
          <Section title="Summary">
            <LessonTextList items={lesson.summary} />
          </Section>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>Exit lesson</Text>
        </Pressable>
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            offline.markLessonComplete(conceptId);
            if (lesson.practiceAvailable) {
              navigation.navigate('ConceptQuiz', { conceptId, returnToConceptId });
            } else {
              navigation.goBack();
            }
          }}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>
            {lesson.practiceAvailable ? `Practice (${lesson.questionCount})` : 'Finish lesson'}
          </Text>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  closeButton: {
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
  headerTitle: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 24, color: colors.ink },
  headerSubtitle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 15, color: colors.slate },
  headerCounter: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 12, color: colors.slate },

  scroll: { paddingHorizontal: 18, paddingTop: 22 },

  lessonSection: { paddingBottom: 22, marginBottom: 22, gap: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  lessonLabel: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
  lessonBody: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25, color: colors.ink },
  lessonItems: { gap: 12 },
  term: { gap: 4 },
  termTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21, color: colors.ink },
  example: { padding: 14, borderRadius: 12, backgroundColor: colors.greenSoft, gap: 10 },
  exampleAnswer: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 21, color: colors.teal },
  illustration: { width: '100%', height: 220 },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeader: { backgroundColor: colors.blueSoft },
  tableHeaderText: { flex: 1, padding: 10, fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  tableCell: { flex: 1, padding: 10, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.ink },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryButton: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 18, color: colors.ink },
  primaryButton: {
    flex: 1,
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