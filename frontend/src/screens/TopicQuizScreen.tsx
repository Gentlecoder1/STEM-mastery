import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, SparklesIcon } from '../components/icons';
import { ProgressBar } from '../components/PracticeUI';
import { colors, fonts } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { useCatalog } from '../catalogContext';
import { useOffline } from '../offlineContext';
import { useProgress } from '../progressContext';
import {
  submitTopicQuiz,
  type TopicQuizSubmitResult,
} from '../lib/assessmentApi';
import { QUIZ_PASS_RATIO, type QuizQuestion } from '../types/catalog';
import type { RootScreenProps } from '../navigation/types';

export default function TopicQuizScreen({ navigation, route }: RootScreenProps<'TopicQuiz'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  const { getTopicConceptIds } = useCatalog();
  const offline = useOffline();
  const { recordTopicAssessment, refresh } = useProgress();
  const { topicId, topicTitle } = route.params;
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<TopicQuizSubmitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const conceptIds = getTopicConceptIds(topicId);
    if (conceptIds.length === 0) {
      setQuestions([]);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }
    void Promise.all(conceptIds.map((conceptId) => offline.ensureQuestions(conceptId)))
      .then((groups) => {
        if (!mounted) return;
        const uniqueQuestions = new Map<string, QuizQuestion>();
        groups.flatMap((group) => group ?? []).forEach((question) => {
          if (!uniqueQuestions.has(question.id)) uniqueQuestions.set(question.id, question);
        });
        setQuestions(Array.from(uniqueQuestions.values()));
      })
      .catch(() => {
        if (mounted) setError('We could not load this topic quiz. Check your connection and try again.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [getTopicConceptIds, loadAttempt, offline.ensureQuestions, topicId]);

  const question = questions[index];
  const response = question ? responses[question.id] ?? '' : '';
  const canContinue = response.trim().length > 0 && !busy;
  const isLast = index === questions.length - 1;

  const submit = async () => {
    if (!question || !canContinue) return;
    if (!isLast) {
      setIndex((current) => current + 1);
      return;
    }

    const completeResponses = questions.map((item) => ({
      questionId: item.id,
      response:
        item.id === question.id
          ? response.trim()
          : responses[item.id]?.trim() || null,
    }));
    setBusy(true);
    setError(null);
    try {
      const submission = await submitTopicQuiz(topicId, completeResponses);
      setResult(submission);
      recordTopicAssessment(topicId, submission.scorePct, submission.passed);
      await refresh();
    } catch {
      setError('We could not save your topic quiz result. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const retry = () => {
    setIndex(0);
    setResponses({});
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <StatusBar style={statusBarStyle} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error && questions.length === 0) {
    return (
      <View style={[styles.root, styles.centered, styles.messageScreen]}>
        <StatusBar style={statusBarStyle} />
        <Text style={styles.message}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={() => setLoadAttempt((value) => value + 1)}>
          <Text style={styles.primaryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.root, styles.centered, styles.messageScreen]}>
        <StatusBar style={statusBarStyle} />
        <Text style={styles.message}>There are no quiz questions for this topic yet.</Text>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryText}>Back to topic</Text>
        </Pressable>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.root}>
        <StatusBar style={statusBarStyle} />
        <View style={[styles.result, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
          {result.passed ? (
            <CheckCircleIcon size={54} color={colors.success} />
          ) : (
            <SparklesIcon size={54} color={colors.orange} />
          )}
          <Text style={styles.resultTitle}>{result.passed ? 'Topic passed!' : 'Keep learning'}</Text>
          <Text style={styles.resultSubtitle}>
            {result.passed
              ? `You scored ${result.scorePct}% on ${topicTitle}.`
              : `You scored ${result.scorePct}%. Score at least ${Math.round(QUIZ_PASS_RATIO * 100)}% to pass this topic.`}
          </Text>
          <View style={styles.resultScore}>
            <Text style={styles.resultPercent}>{result.scorePct}%</Text>
            <Text style={styles.resultCount}>
              {result.correct} of {result.total} graded questions correct
            </Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryText}>Back to topic</Text>
            <ArrowRightIcon size={18} color={colors.onPrimary} />
          </Pressable>
          {!result.passed ? (
            <Pressable style={styles.secondaryButton} onPress={retry}>
              <Text style={styles.secondaryText}>Retake quiz</Text>
            </Pressable>
          ) : null}
        </View>
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
          <Text style={styles.eyebrow}>TOPIC QUIZ</Text>
          <Text style={styles.headerTitle}>{topicTitle}</Text>
        </View>
        <Text style={styles.counter}>{index + 1} / {questions.length}</Text>
      </View>
      <ProgressBar progress={((index + 1) / questions.length) * 100} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      >
        <Text style={styles.questionType}>
          {question.type === 'mcq' ? 'MULTIPLE CHOICE' : 'WRITTEN RESPONSE'}
        </Text>
        <Text style={styles.question}>{question.prompt}</Text>
        {question.type === 'mcq' ? (
          <View style={styles.options}>
            {question.options?.map((option) => {
              const active = response === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() =>
                    setResponses((current) => ({ ...current, [question.id]: option.id }))
                  }
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
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
            onChangeText={(value) =>
              setResponses((current) => ({ ...current, [question.id]: value }))
            }
            placeholder="Write your answer"
            placeholderTextColor={colors.slate}
            multiline
            textAlignVertical="top"
          />
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.primaryButton, !canContinue && styles.disabled]}
          onPress={() => void submit()}
          disabled={!canContinue}
        >
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Text style={styles.primaryText}>
                {isLast ? 'Submit topic quiz' : 'Next question'}
              </Text>
              <ArrowRightIcon size={18} color={colors.onPrimary} />
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.canvas },
    centered: { alignItems: 'center', justifyContent: 'center' },
    messageScreen: { paddingHorizontal: 28, gap: 16 },
    message: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.slate, textAlign: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingBottom: 14 },
    headerCopy: { flex: 1, gap: 3 },
    eyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1, color: colors.primary },
    headerTitle: { fontFamily: fonts.regular, fontSize: 18, color: colors.ink },
    counter: { fontFamily: fonts.bold, color: colors.slate },
    content: { padding: 18, gap: 18 },
    questionType: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, color: colors.slate },
    question: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 29, color: colors.ink },
    options: { gap: 10 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 15,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    optionLabel: { fontFamily: fonts.bold, color: colors.primary },
    optionText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
    answerInput: {
      minHeight: 140,
      padding: 15,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.ink,
    },
    error: { fontFamily: fonts.medium, fontSize: 13, color: colors.orange },
    primaryButton: {
      minHeight: 52,
      borderRadius: 14,
      paddingHorizontal: 18,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
    },
    primaryText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onPrimary },
    secondaryButton: {
      minHeight: 48,
      paddingHorizontal: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
    disabled: { opacity: 0.5 },
    result: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 24 },
    resultTitle: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.ink, textAlign: 'center' },
    resultSubtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.slate, textAlign: 'center' },
    resultScore: { alignItems: 'center', gap: 6, padding: 20 },
    resultPercent: { fontFamily: fonts.extrabold, fontSize: 42, color: colors.primary },
    resultCount: { fontFamily: fonts.medium, fontSize: 13, color: colors.slate },
  });
