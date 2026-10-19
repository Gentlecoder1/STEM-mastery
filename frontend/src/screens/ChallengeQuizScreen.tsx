import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '../components/icons';
import { ProgressBar } from '../components/PracticeUI';
import { colors, fonts } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { useCatalog } from '../catalogContext';
import { useOffline } from '../offlineContext';
import { checkAnswer } from '../lib/assessmentApi';
import type { QuizQuestion } from '../types/catalog';
import type { RootScreenProps } from '../navigation/types';

type ChallengeQuestion = QuizQuestion & { conceptId: string };

const MAX_QUESTIONS = 10;
const MAX_CONCEPTS = 6;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ChallengeQuizScreen({ navigation, route }: RootScreenProps<'ChallengeQuiz'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  const { getTopicConceptIds } = useCatalog();
  const offline = useOffline();
  const { topicId, topicTitle } = route.params;

  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let mounted = true;
    const conceptIds = getTopicConceptIds(topicId).slice(0, MAX_CONCEPTS);
    Promise.all(
      conceptIds.map(async (conceptId) => {
        try {
          const data = await offline.ensureQuestions(conceptId);
          return (data ?? [])
            .filter((question) => question.type === 'mcq' && (question.options?.length ?? 0) > 0)
            .map((question) => ({ ...question, conceptId }));
        } catch {
          return [] as ChallengeQuestion[];
        }
      }),
    ).then((groups) => {
      if (!mounted) return;
      const pool = shuffle(groups.flat()).slice(0, MAX_QUESTIONS);
      setQuestions(pool);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [getTopicConceptIds, offline.ensureQuestions, topicId]);

  const question = questions[index];

  const submit = async () => {
    if (!question || !selected || busy) return;
    if (!submitted) {
      setBusy(true);
      try {
        const outcome = await checkAnswer(question.conceptId, question.id, selected);
        if (outcome.correct) setCorrect((value) => value + 1);
        setSubmitted(true);
      } catch {
        setSubmitted(true);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (index === questions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setSubmitted(false);
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
        <Text style={styles.missing}>No challenge questions available yet.</Text>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={styles.root}>
        <StatusBar style={statusBarStyle} />
        <View style={[styles.result, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
          <CheckCircleIcon size={54} color={colors.success} />
          <Text style={styles.resultTitle}>Challenge complete</Text>
          <Text style={styles.resultSubtitle}>You scored {correct} out of {questions.length}.</Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryText}>Back to challenges</Text>
          </Pressable>
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
          <Text style={styles.eyebrow}>CHALLENGE</Text>
          <Text style={styles.headerTitle}>{topicTitle}</Text>
        </View>
        <Text style={styles.counter}>{index + 1} / {questions.length}</Text>
      </View>
      <ProgressBar progress={((index + 1) / questions.length) * 100} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.questionType}>MULTIPLE CHOICE</Text>
        <Text style={styles.question}>{question.prompt}</Text>
        <View style={styles.options}>
          {question.options?.map((option) => {
            const active = selected === option.id;
            return (
              <Pressable
                key={option.id}
                style={[styles.option, active && styles.optionActive]}
                onPress={() => !submitted && setSelected(option.id)}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionText}>{option.text}</Text>
              </Pressable>
            );
          })}
        </View>
        {submitted ? <Text style={[styles.feedback, styles.correct]}>Answer recorded.</Text> : null}
        <Pressable
          style={[styles.primaryButton, (!selected || busy) && styles.disabled]}
          onPress={() => void submit()}
          disabled={!selected || busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Text style={styles.primaryText}>
                {submitted ? (index === questions.length - 1 ? 'See result' : 'Next question') : 'Check answer'}
              </Text>
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
  centered: { alignItems: 'center', justifyContent: 'center' },
  missing: { fontFamily: fonts.medium, fontSize: 14, color: colors.slate, textAlign: 'center', paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingBottom: 14 },
  headerCopy: { flex: 1, gap: 3 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1, color: colors.primary },
  headerTitle: { fontFamily: fonts.regular, fontSize: 18, color: colors.ink },
  counter: { fontFamily: fonts.bold, color: colors.slate },
  content: { padding: 18, gap: 18 },
  questionType: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, color: colors.slate },
  question: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 29, color: colors.ink },
  options: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionLabel: { fontFamily: fonts.bold, color: colors.primary },
  optionText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  feedback: { fontFamily: fonts.bold, fontSize: 14 },
  correct: { color: colors.success },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  disabled: { opacity: 0.45 },
  primaryText: { fontFamily: fonts.bold, color: colors.onPrimary },
  result: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontFamily: fonts.regular, fontSize: 24, lineHeight: 29, color: colors.ink, marginTop: 12 },
  resultSubtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.slate, marginTop: 6, marginBottom: 18 },
});
