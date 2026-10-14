import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '../components/icons';
import { ProgressBar } from '../components/PracticeUI';
import { CONCEPTS, type QuizQuestion } from '../data/learning';
import { colors, fonts } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import type { RootScreenProps } from '../navigation/types';

type ChallengeQuestion = QuizQuestion & { id: string };

function getQuestions(): ChallengeQuestion[] {
  const pool = CONCEPTS.flatMap((concept) =>
    concept.quiz
      .filter((question) => question.type === 'mcq')
      .map((question, index) => ({ ...question, id: `${concept.id}-${index}` })),
  );
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
}

export default function ChallengeQuizScreen({ navigation, route }: RootScreenProps<'ChallengeQuiz'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  const questions = useMemo(() => getQuestions(), [route.params.topicId]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = questions[index];

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

  const isCorrect = question?.answerId === selected;
  const submit = () => {
    if (!selected) return;
    if (!submitted) {
      if (isCorrect) setCorrect((value) => value + 1);
      setSubmitted(true);
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

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <ArrowLeftIcon size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>CHALLENGE</Text>
          <Text style={styles.headerTitle}>{route.params.topicTitle}</Text>
        </View>
        <Text style={styles.counter}>{index + 1} / {questions.length}</Text>
      </View>
      <ProgressBar progress={((index + 1) / questions.length) * 100} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.questionType}>MULTIPLE CHOICE</Text>
        <Text style={styles.question}>{question?.prompt}</Text>
        <View style={styles.options}>
          {question?.options?.map((option) => {
            const active = selected === option.id;
            const right = submitted && option.id === question.answerId;
            return (
              <Pressable
                key={option.id}
                style={[styles.option, active && styles.optionActive, right && styles.optionCorrect]}
                onPress={() => !submitted && setSelected(option.id)}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionText}>{option.text}</Text>
              </Pressable>
            );
          })}
        </View>
        {submitted ? <Text style={[styles.feedback, isCorrect ? styles.correct : styles.incorrect]}>{isCorrect ? 'Correct!' : 'Review the answer and keep going.'}</Text> : null}
        <Pressable style={[styles.primaryButton, !selected && styles.disabled]} onPress={submit} disabled={!selected}>
          <Text style={styles.primaryText}>{submitted ? (index === questions.length - 1 ? 'See result' : 'Next question') : 'Check answer'}</Text>
          <ArrowRightIcon size={18} color={colors.onPrimary} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
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
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.greenSoft },
  optionLabel: { fontFamily: fonts.bold, color: colors.primary },
  optionText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  feedback: { fontFamily: fonts.bold, fontSize: 14 },
  correct: { color: colors.success },
  incorrect: { color: colors.orange },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  disabled: { opacity: 0.45 },
  primaryText: { fontFamily: fonts.bold, color: colors.onPrimary },
  result: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
  resultTitle: { fontFamily: fonts.extrabold, fontSize: 25, color: colors.ink },
  resultSubtitle: { fontFamily: fonts.regular, fontSize: 16, color: colors.slate },
});
