import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '../components/icons';
import { ProgressBar } from '../components/PracticeUI';
import { useCatalog } from '../catalogContext';
import { useOffline } from '../offlineContext';
import { answerHash, coverageFeedback, markOffline, summariseOffline, type OfflineMark } from '../lib/offlineGrading';
import { useConnectivity } from '../connectivityContext';
import { useProgress } from '../progressContext';
import { checkAnswer, submitConceptQuiz, type CheckResult, type ConceptQuizSubmitResult } from '../lib/assessmentApi';
import { nextTopicLesson } from '../lib/learningPath';
import { prettyMath } from '../lib/mathText';
import { colors, fonts } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { type QuizQuestion } from '../types/catalog';
import type { RootScreenProps } from '../navigation/types';

export default function ConceptQuizScreen({ navigation, route }: RootScreenProps<'ConceptQuiz'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  const catalog = useCatalog();
  const { getConcept } = catalog;
  const { refresh: refreshProgress, isConceptCompleted } = useProgress();
  const offline = useOffline();
  const { isOnline } = useConnectivity();
  const { conceptId, returnToConceptId, topicId: routeTopicId } = route.params;
  const concept = getConcept(conceptId);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<CheckResult | null>(null);
  const [result, setResult] = useState<ConceptQuizSubmitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markedOffline, setMarkedOffline] = useState(false);
  const marks = useRef<Record<string, OfflineMark>>({});

  useEffect(() => {
    let active = true;
    void offline.ensureQuestions(conceptId).then((items) => {
      if (!active) return;
      setQuestions(items ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [conceptId, offline.ensureQuestions]);

  const question = questions[index];
  const response = question ? responses[question.id] ?? '' : '';
  const isLast = index === questions.length - 1;

  const graphLinks = (ids: readonly string[] | undefined, names: readonly string[] | undefined) =>
    (ids ?? []).map((id, i) => ({ id, name: names?.[i] ?? null }));

  /** Mark one answer on the phone from its hashed key (no network needed). */
  const checkLocally = (item: QuizQuestion, value: string): CheckResult => {
    const mark = markOffline(item, value);
    marks.current[item.id] = mark;
    const key = item.offlineKey?.answerHash;
    const correctOptionId = key
      ? item.options?.find((option) => answerHash(item.id, option.id) === key)?.id ?? null
      : null;
    return {
      questionId: item.id,
      conceptId,
      correct: mark.correct,
      correctOptionId,
      explanation: coverageFeedback(mark.coverage),
      prerequisites: [],
      relatedConcepts: [],
    };
  };

  const finishLocally = (payload: { questionId: string; response: string | null }[]) => {
    const all = questions.map((item) => marks.current[item.id] ?? markOffline(item, responses[item.id] ?? null));
    const summary = summariseOffline(questions, all);
    offline.queueQuizAttempt({
      kind: 'concept',
      targetId: conceptId,
      responses: payload,
      offlineScorePct: summary.scorePct,
      offlinePassed: summary.passed,
      markingMs: all.reduce((sum, mark) => sum + mark.ms, 0),
    });
    setMarkedOffline(true);
    setResult({
      conceptId,
      correct: summary.correct,
      total: summary.total,
      scorePct: summary.scorePct,
      passed: summary.passed,
      // Recommendations come from the cached knowledge graph, so they work offline too.
      prerequisites: graphLinks(concept?.prerequisiteIds, concept?.prerequisites),
      relatedConcepts: graphLinks(concept?.relatedConceptIds, concept?.related),
    });
  };

  const advance = async () => {
    if (!question || !response.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!checked) {
        if (!isOnline) {
          setChecked(checkLocally(question, response.trim()));
          return;
        }
        try {
          setChecked(await checkAnswer(conceptId, question.id, response.trim()));
        } catch {
          setChecked(checkLocally(question, response.trim()));
        }
        return;
      }
      if (!isLast) {
        setIndex((current) => current + 1);
        setChecked(null);
        return;
      }
      const payload = questions.map((item) => ({
        questionId: item.id,
        response: responses[item.id]?.trim() || null,
      }));
      if (!isOnline) {
        finishLocally(payload);
        return;
      }
      try {
        const submission = await submitConceptQuiz(conceptId, payload);
        setResult(submission);
        if (submission.passed) await refreshProgress();
      } catch {
        finishLocally(payload);
      }
    } finally {
      setBusy(false);
    }
  };

  const topicId = routeTopicId ?? concept?.topicIds[0];
  const canContinue = (id: string) =>
    id !== conceptId && !isConceptCompleted(id) && (isOnline || offline.isDownloaded(id));
  const assessmentIds = route.params.assessmentIds ?? [conceptId];
  const remainingAssessments = assessmentIds.slice(assessmentIds.indexOf(conceptId) + 1);
  const nextAssessment = remainingAssessments[0];
  const continueAssessment = () => {
    if (nextAssessment) navigation.replace('ConceptQuiz', {
      conceptId: nextAssessment, topicId, assessmentIds, returnToConceptId,
    });
  };
  const order = topicId ? catalog.getTopicConceptIds(topicId) : [];
  const position = order.indexOf(assessmentIds[assessmentIds.length - 1] ?? conceptId);
  const following = position < 0 ? undefined : order.slice(position + 1)
    .find((id) => canContinue(id) && getConcept(id)?.hasLesson);
  const next = following ? { conceptId: following, topicId } :
    nextTopicLesson(catalog, catalog.topics, topicId, canContinue);
  const openConcept = (id: string, reviewTarget?: string, contextTopicId?: string) => {
    navigation.replace('ConceptLearning', {
      conceptId: id, topicId: contextTopicId, returnToConceptId: reviewTarget,
      lessonIds: reviewTarget ? [id] : undefined,
    });
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <StatusBar style={statusBarStyle} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.root, styles.centered]}>
        <StatusBar style={statusBarStyle} />
        <Text style={styles.message}>No assessment questions are cached for this concept.</Text>
        <Pressable style={styles.secondaryButton} onPress={() => nextAssessment ? continueAssessment() : next ? openConcept(next.conceptId, undefined, next.topicId) : navigation.goBack()}>
          <Text style={styles.secondaryText}>{nextAssessment ? "Next assessment" : next ? "Continue studying" : "Back to topic"}</Text>
        </Pressable>
      </View>
    );
  }

  if (result) {
    const recommendations = (result.passed ? result.relatedConcepts : result.prerequisites)
      .filter((item) => canContinue(item.id) && getConcept(item.id)?.hasLesson);
    const target = result.passed
      ? (returnToConceptId ? { conceptId: returnToConceptId, topicId: undefined } :
        next ?? (recommendations[0] ? { conceptId: recommendations[0].id, topicId: undefined } : undefined))
      : { conceptId: recommendations[0]?.id ?? conceptId, topicId };
    const targetTitle = target && getConcept(target.conceptId)?.title;
    return (
      <View style={styles.root}>
        <StatusBar style={statusBarStyle} />
        <ScrollView contentContainerStyle={[styles.result, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}>
          <CheckCircleIcon size={48} color={result.passed ? colors.success : colors.orange} />
          <Text style={styles.resultTitle}>{result.passed ? 'Concept mastered' : 'Review a prerequisite'}</Text>
          <Text style={styles.message}>
            {result.passed
              ? `You scored ${result.scorePct}% on ${concept?.title ?? 'this concept'}.`
              : result.prerequisites.length > 0
                ? `You may be struggling with ${concept?.title ?? 'this concept'} because ${result.prerequisites[0].name ?? 'a prerequisite'} is connected in the knowledge graph.`
                : `You scored ${result.scorePct}%. Review the lesson and try again.`}
          </Text>
          <Text style={styles.score}>{result.correct} / {result.total}</Text>
          <Text style={styles.message}>graded questions correct</Text>
          {markedOffline ? (
            <Text style={styles.offlineNote}>
              Marked on this phone. Your result will be confirmed and saved when you are back online.
            </Text>
          ) : null}
          {result.passed && nextAssessment ? (
            <Pressable style={styles.primaryButton} onPress={continueAssessment}>
              <Text style={styles.primaryText}>Next concept check: {getConcept(nextAssessment)?.title ?? 'Continue'}</Text>
            </Pressable>
          ) : target ? (
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (!result.passed && target.conceptId === conceptId) {
                  navigation.replace('ConceptLearning', {
                    conceptId, topicId, lessonIds: [conceptId],
                    assessmentIds: [conceptId, ...remainingAssessments], returnToConceptId,
                  });
                } else {
                  openConcept(target.conceptId, result.passed ? undefined : conceptId, target.topicId);
                }
              }}
            >
              <Text style={styles.primaryText}>
                {result.passed ? 'Continue' : 'Review'}{targetTitle ? `: ${targetTitle}` : ''}
              </Text>
            </Pressable>
          ) : null}
          {recommendations.filter((item) => item.id !== target?.conceptId).map((item) => (
            <Pressable key={item.id} style={styles.recommendation} onPress={() => openConcept(item.id, result.passed ? undefined : conceptId)}>
              <Text style={styles.recommendationTitle}>{item.name ?? getConcept(item.id)?.title ?? item.id}</Text>
              <ArrowRightIcon size={18} color={colors.primary} />
            </Pressable>
          ))}
          <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryText}>Back to learning</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <ArrowLeftIcon size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>CONCEPT CHECK</Text>
          <Text style={styles.headerTitle}>{concept?.title ?? 'Assessment'}</Text>
        </View>
        <Text style={styles.counter}>{index + 1} / {questions.length}</Text>
      </View>
      <ProgressBar progress={((index + 1) / questions.length) * 100} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.questionType}>{question.type === 'mcq' ? 'MULTIPLE CHOICE' : 'WRITTEN RESPONSE'}</Text>
        <Text style={styles.question}>{prettyMath(question.prompt)}</Text>
        {question.type === 'mcq' ? (
          <View style={styles.options}>
            {question.options?.map((option) => {
              const active = response === option.id;
              const correctOption = checked?.correctOptionId === option.id;
              const wrongSelection = checked?.correct === false && active;
              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.option,
                    active && !checked && styles.optionActive,
                    correctOption && styles.optionCorrect,
                    wrongSelection && styles.optionWrong,
                  ]}
                  onPress={() => {
                    if (!checked) setResponses((current) => ({ ...current, [question.id]: option.id }));
                  }}
                  disabled={Boolean(checked)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active, disabled: Boolean(checked) }}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionText}>{prettyMath(option.text)}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <TextInput
            style={styles.answerInput}
            value={response}
            onChangeText={(value) => {
              if (!checked) setResponses((current) => ({ ...current, [question.id]: value }));
            }}
            placeholder="Write your response"
            placeholderTextColor={colors.slate}
            multiline
            editable={!checked}
            textAlignVertical="top"
          />
        )}
        {checked ? (
          <Text style={[styles.feedback, checked.correct ? styles.correct : styles.incorrect]}>
            {checked.correct === true
              ? 'Correct'
              : checked.correct === false
                ? checked.correctOptionId
                  ? 'Not quite. The correct option is highlighted.'
                  : checked.explanation ?? 'Not quite.'
                : checked.explanation ?? 'Response recorded.'}
          </Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.primaryButton, (!response.trim() || busy) && styles.disabled]} onPress={() => void advance()} disabled={!response.trim() || busy}>
          {busy ? <ActivityIndicator color={colors.onPrimary} /> : (
            <>
              <Text style={styles.primaryText}>{!checked ? 'Check answer' : isLast ? 'Finish assessment' : 'Next question'}</Text>
              <ArrowRightIcon size={18} color={colors.onPrimary} />
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingBottom: 14 },
  headerCopy: { flex: 1, gap: 3 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, color: colors.primary },
  headerTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  counter: { fontFamily: fonts.bold, color: colors.slate },
  content: { padding: 18, gap: 18 },
  questionType: { fontFamily: fonts.bold, fontSize: 11, color: colors.slate },
  question: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 29, color: colors.ink },
  options: { gap: 10 },
  option: { minHeight: 54, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.greenSoft },
  optionWrong: { borderColor: colors.orange, backgroundColor: colors.orangeSoft },
  optionLabel: { fontFamily: fonts.bold, color: colors.primary },
  optionText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 19, color: colors.ink },
  answerInput: { minHeight: 120, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.ink },
  feedback: { fontFamily: fonts.bold, fontSize: 14 },
  correct: { color: colors.success },
  incorrect: { color: colors.orange },
  offlineNote: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.slate, textAlign: 'center' },
  error: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.orange },
  primaryButton: { minHeight: 52, borderRadius: 12, paddingHorizontal: 18, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { fontFamily: fonts.bold, color: colors.onPrimary },
  disabled: { opacity: 0.45 },
  secondaryButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  message: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.slate, textAlign: 'center' },
  result: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 14 },
  resultTitle: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.ink, textAlign: 'center' },
  score: { fontFamily: fonts.extrabold, fontSize: 38, color: colors.primary },
  recommendation: { width: '100%', minHeight: 66, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  recommendationCopy: { flex: 1, gap: 4 },
  recommendationLabel: { fontFamily: fonts.bold, fontSize: 10, color: colors.slate },
  recommendationTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
});