import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '../components/icons';
import { ProgressBar } from '../components/PracticeUI';
import { useCatalog } from '../catalogContext';
import { useOffline } from '../offlineContext';
import { useProgress } from '../progressContext';
import { checkAnswer, submitConceptQuiz, type CheckResult, type ConceptQuizSubmitResult } from '../lib/assessmentApi';
import { colors, fonts } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { type QuizQuestion } from '../types/catalog';
import type { RootScreenProps } from '../navigation/types';

export default function ConceptQuizScreen({ navigation, route }: RootScreenProps<'ConceptQuiz'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  const { getConcept } = useCatalog();
  const { refresh: refreshProgress } = useProgress();
  const offline = useOffline();
  const { conceptId, returnToConceptId } = route.params;
  const concept = getConcept(conceptId);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<CheckResult | null>(null);
  const [result, setResult] = useState<ConceptQuizSubmitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const advance = async () => {
    if (!question || !response.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!checked) {
        const outcome = await checkAnswer(conceptId, question.id, response.trim());
        setChecked(outcome);
        return;
      }
      if (!isLast) {
        setIndex((current) => current + 1);
        setChecked(null);
        return;
      }
      const submission = await submitConceptQuiz(
        conceptId,
        questions.map((item) => ({
          questionId: item.id,
          response: responses[item.id]?.trim() || null,
        })),
      );
      setResult(submission);
      if (submission.passed) await refreshProgress();
    } catch {
      setError('Connect to the curriculum service to check or submit this assessment. Your answers remain on this screen.');
    } finally {
      setBusy(false);
    }
  };

  const openConcept = (id: string) => {
    navigation.push('ConceptDetails', {
      conceptId: id,
      returnToConceptId: result?.passed ? returnToConceptId : conceptId,
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
        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryText}>Back to concept</Text>
        </Pressable>
      </View>
    );
  }

  if (result) {
    const recommendations = result.passed ? result.relatedConcepts : result.prerequisites;
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
          {recommendations.map((item) => (
            <Pressable key={item.id} style={styles.recommendation} onPress={() => openConcept(item.id)}>
              <View style={styles.recommendationCopy}>
                <Text style={styles.recommendationLabel}>{result.passed ? 'RELATED CONCEPT' : 'PREREQUISITE'}</Text>
                <Text style={styles.recommendationTitle}>{item.name ?? item.id}</Text>
              </View>
              <ArrowRightIcon size={18} color={colors.primary} />
            </Pressable>
          ))}
          {returnToConceptId && result.passed ? (
            <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('ConceptDetails', { conceptId: returnToConceptId })}>
              <Text style={styles.primaryText}>Return to original concept</Text>
            </Pressable>
          ) : null}
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
        <Text style={styles.question}>{question.prompt}</Text>
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
                  <Text style={styles.optionText}>{option.text}</Text>
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
            {checked.correct === true ? 'Correct' : checked.correct === false ? 'Not quite. The correct option is highlighted.' : 'Response recorded.'}
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