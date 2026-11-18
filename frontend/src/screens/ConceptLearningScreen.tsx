import { useConnectivity } from '../connectivityContext';
import { MIN_STUDY_SECONDS, studyBatch } from '../lib/learningPath';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon, ArrowRightIcon } from '../components/icons';
import { colors, fonts, shadow } from '../theme';
import type { ColorToken } from '../theme';
import { CONTENT_LABELS, type ContentType, type LearningContent } from '../types/catalog';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles, useTheme } from '../themeContext';
import { useProgress } from '../progressContext';
import { useCatalog } from '../catalogContext';
import { useOffline } from '../offlineContext';
import { prettyMath, splitLessonLines } from '../lib/mathText';

const TYPE_TINT: Record<ContentType, ColorToken> = {
  DEFINITION: 'blue',
  EXPLANATION: 'primary',
  FORMULA: 'ink',
  WORKED_EXAMPLE: 'teal',
  MEDIA: 'violet',
  QUESTION: 'primary',
};

function FormulaBlock({ text }: { text: string }) {
  const styles = useThemedStyles(createStyles);
  const lines = prettyMath(text).split('\n').filter((line) => line.trim());

  return (
    <View style={styles.formula}>
      {lines.map((line, index) => (
        <Text key={index} style={styles.formulaText}>{line}</Text>
      ))}
    </View>
  );
}

function LessonBody({ text }: { text: string }) {
  const styles = useThemedStyles(createStyles);
  const lines = splitLessonLines(text);

  return (
    <View style={styles.bodyBlock}>
      {lines.map((line, index) => {
        if (line.kind === 'gap') return <View key={index} style={styles.bodyGap} />;
        if (line.kind === 'bullet') {
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={[styles.lessonBody, styles.bulletText]}>{line.text}</Text>
            </View>
          );
        }
        if (line.kind === 'label') {
          return (
            <Text key={index} style={styles.lessonBody}>
              <Text style={styles.bodyLabel}>{line.label}: </Text>
              {line.text}
            </Text>
          );
        }
        return <Text key={index} style={styles.lessonBody}>{line.text}</Text>;
      })}
    </View>
  );
}

function ContentCard({ item, conceptTitle }: { item: LearningContent; conceptTitle: string }) {
  const styles = useThemedStyles(createStyles);
  const tint = colors[TYPE_TINT[item.contentType]];
  const label = CONTENT_LABELS[item.contentType];
  const repeatedTitle = item.title.toLowerCase().startsWith(label.toLowerCase());
  const title = repeatedTitle
    ? item.contentType === 'DEFINITION'
      ? conceptTitle
      : item.contentType === 'FORMULA'
        ? `${conceptTitle} formula`
        : null
    : item.title;

  return (
    <View style={styles.lessonSection}>
      <Text style={[styles.lessonLabel, { color: tint }]}>
        {label.toUpperCase()}
      </Text>
      {title ? <Text style={styles.lessonTitle}>{title}</Text> : null}

      {item.contentType === 'FORMULA' ? (
        <FormulaBlock text={item.contentText} />
      ) : (
        item.contentType === 'WORKED_EXAMPLE' ? (
          <View style={styles.exampleNote}>
            <LessonBody text={item.contentText} />
          </View>
        ) : (
          <LessonBody text={item.contentText} />
        )
      )}
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
  const { recordLastConcept, isConceptCompleted } = useProgress();
  const catalog = useCatalog();
  const { getConcept, loadConcept } = catalog;
  const { isOnline } = useConnectivity();
  const offline = useOffline();
  const { conceptId, returnToConceptId } = route.params;
  const concept = getConcept(conceptId);
  const topicId = route.params.topicId ?? concept?.topicIds[0];
  const lessonIds = route.params.lessonIds ?? (returnToConceptId ? [conceptId] : studyBatch(
    catalog, conceptId, topicId, (id) => !isConceptCompleted(id) && (isOnline || offline.isDownloaded(id)),
  ));
  const nextLesson = lessonIds[lessonIds.indexOf(conceptId) + 1];
  const [studySeconds, setStudySeconds] = useState(route.params.studySeconds ?? 0);
  const ready = studySeconds >= MIN_STUDY_SECONDS;
  const remaining = Math.max(0, MIN_STUDY_SECONDS - studySeconds);
  const cachedContent = offline.getLessonContent(conceptId);
  useEffect(() => {
    void loadConcept(conceptId);
    void offline.ensureLesson(conceptId);
    recordLastConcept(conceptId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId]);

  const lessonItems = useMemo(
    () =>
      (cachedContent ?? []).filter((item) => item.contentType !== 'QUESTION'),
    [cachedContent],
  );
  const hasContent = lessonItems.length > 0;
  useEffect(() => {
    if (!hasContent || ready) return;
    const timer = setInterval(() => {
      if (AppState.currentState === 'active' && navigation.isFocused()) {
        setStudySeconds((seconds) => Math.min(MIN_STUDY_SECONDS, seconds + 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [hasContent, navigation, ready]);

  const continueStudy = () => {
    if (!nextLesson && (!ready || !hasContent)) return;
    if (hasContent) offline.markLessonComplete(conceptId);
    if (nextLesson) {
      navigation.replace('ConceptLearning', {
        ...route.params, conceptId: nextLesson, topicId, lessonIds, studySeconds,
      });
      return;
    }
    if (topicId) {
      const topicTitle = catalog.topics.find((topic) => topic.id === topicId)?.name ?? 'Topic';
      navigation.replace('TopicQuiz', { topicId, topicTitle, studiedIds: lessonIds, returnToConceptId });
      return;
    }
    const assessmentIds = route.params.assessmentIds ?? lessonIds;
    navigation.replace('ConceptQuiz', {
      conceptId: assessmentIds[0] ?? conceptId, returnToConceptId, topicId, assessmentIds,
    });
  };

  if (!concept && !cachedContent) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>Loading lesson…</Text>
      </View>
    );
  }

  if (lessonItems.length === 0) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>
          This lesson has not been loaded yet. Connect to the internet to open it.
        </Text>
        <Pressable onPress={nextLesson ? continueStudy : () => navigation.goBack()}>
          <Text style={styles.secondaryText}>{nextLesson ? 'Open next lesson' : 'Go back'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
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
        <Text style={styles.headerCounter}>
          Lesson {lessonIds.indexOf(conceptId) + 1} of {lessonIds.length}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 104 },
        ]}
      >
        <Text style={styles.missingText}>
          {ready ? 'Study time complete' : `Study time left before assessment: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}
        </Text>
        {lessonItems.map((item) => (
          <ContentCard key={item.id} item={item} conceptTitle={concept?.title ?? 'Concept'} />
        ))}
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
          style={[styles.primaryButton, !nextLesson && !ready && { opacity: 0.5 }]}
          onPress={continueStudy}
          disabled={!nextLesson && !ready}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>{nextLesson ? 'Next lesson' : 'Start assessment'}</Text>
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
  headerCounter: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 15, color: colors.slate },

  scroll: { paddingHorizontal: 18, paddingTop: 22 },

  lessonSection: {
    padding: 18,
    marginBottom: 14,
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  lessonLabel: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
  lessonTitle: { fontFamily: fonts.extrabold, fontSize: 21, lineHeight: 27, color: colors.ink },
  lessonBody: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25, color: colors.ink },
  bodyBlock: { gap: 8 },
  bodyGap: { height: 4 },
  bodyLabel: { fontFamily: fonts.bold, color: colors.ink },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulletDot: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 25, color: colors.primary },
  bulletText: { flex: 1 },

  formula: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.blueBorder,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
  },
  formulaText: {
    fontFamily: fonts.semibold,
    fontSize: 19,
    lineHeight: 27,
    color: colors.ink,
    textAlign: 'center',
  },
  exampleNote: { padding: 14, borderRadius: 12, backgroundColor: colors.greenSoft, gap: 4 },

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