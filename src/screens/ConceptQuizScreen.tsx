import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MasteryRing from '../components/MasteryRing';
import { ProgressBar } from '../components/PracticeUI';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, SparklesIcon } from '../components/icons';
import { colors, fonts, shadow, type ThemeColors } from '../theme';
import { useThemedStyles, useTheme } from '../themeContext';
import { useProgress } from '../progressContext';
import {
  QUIZ_PASS_RATIO,
  getConcept,
  getConceptQuiz,
  getNextConcept,
} from '../data/learning';
import type { RootScreenProps } from '../navigation/types';

export default function ConceptQuizScreen({ navigation, route }: RootScreenProps<'ConceptQuiz'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  const { completeConcept } = useProgress();
  const { conceptId, mode = 'lesson', targetConceptId } = route.params;

  const concept = getConcept(conceptId);
  const questions = useMemo(() => getConceptQuiz(conceptId), [conceptId]);
  const target = targetConceptId ? getConcept(targetConceptId) : undefined;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [writtenText, setWrittenText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const mcqItems = useMemo(
    () => questions.map((q, i) => ({ q, i })).filter((entry) => entry.q.type === 'mcq'),
    [questions],
  );

  const score = useMemo(() => {
    if (mcqItems.length === 0) return { correct: 0, total: 0, pct: 100 };
    const correct = mcqItems.filter((entry) => answers[String(entry.i)] === entry.q.answerId).length;
    const pct = Math.round((correct / mcqItems.length) * 100);
    return { correct, total: mcqItems.length, pct };
  }, [mcqItems, answers]);

  const passed = score.total === 0 || score.pct >= QUIZ_PASS_RATIO * 100;

  if (!concept || questions.length === 0) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>Quiz unavailable.</Text>
      </View>
    );
  }

  const isKey = mode === 'key';
  const eyebrow = isKey ? 'KEY TEST' : 'QUICK CHECK';

  const finish = () => {
    completeConcept(conceptId);
    if (isKey && targetConceptId) {
      navigation.navigate('ConceptDetails', { conceptId: targetConceptId });
      return;
    }
    const next = getNextConcept(conceptId);
    if (next) navigation.navigate('ConceptDetails', { conceptId: next.id });
    else navigation.navigate('TopicOverview');
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setWrittenText('');
    setSubmitted(false);
    setAnswers({});
    setFinished(false);
  };

  if (finished) {
    return (
      <View style={styles.root}>
        <StatusBar style={statusBarStyle} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.resultContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={[styles.resultTile, passed ? styles.resultTilePass : styles.resultTileFail]}>
            {passed ? (
              <CheckCircleIcon size={44} color={colors.success} />
            ) : (
              <SparklesIcon size={44} color={colors.orange} />
            )}
          </View>

          <Text style={styles.resultTitle}>
            {passed ? (isKey ? 'Key test passed!' : 'Nicely done!') : 'Not quite there yet'}
          </Text>
          <Text style={styles.resultSubtitle}>
            {passed
              ? isKey
                ? `${concept.title} is complete, so ${target?.title ?? 'the next lesson'} is now open.`
                : `${concept.title} is marked complete. Your next lesson is ready.`
              : `You need ${Math.round(QUIZ_PASS_RATIO * 100)}% to ${isKey ? 'unlock this lesson' : 'complete this concept'}. Review and try again.`}
          </Text>

          <View style={styles.scoreCard}>
            <MasteryRing percent={score.pct} color={passed ? colors.success : colors.orange} size={86} />
            <View style={styles.scoreCopy}>
              <Text style={styles.scoreEyebrow}>YOUR SCORE</Text>
              <Text style={styles.scoreTitle}>
                {score.total > 0 ? `${score.correct} of ${score.total} correct` : 'Completed'}
              </Text>
              <Text style={styles.scorePercent}>{score.pct}%</Text>
            </View>
          </View>

          <View style={styles.actions}>
            {passed ? (
              <Pressable style={styles.primaryButton} onPress={finish} accessibilityRole="button">
                <Text style={styles.primaryText}>
                  {isKey ? 'Open unlocked lesson' : 'Continue'}
                </Text>
                <ArrowRightIcon size={18} color={colors.onPrimary} />
              </Pressable>
            ) : (
              <Pressable style={styles.primaryButton} onPress={restart} accessibilityRole="button">
                <Text style={styles.primaryText}>Try again</Text>
                <ArrowRightIcon size={18} color={colors.onPrimary} />
              </Pressable>
            )}
            <Pressable
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{passed ? 'Back to concept' : 'Review lesson'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  const question = questions[index];
  const isWritten = question.type === 'written';
  const canSubmit = isWritten ? writtenText.trim().length > 0 : selected !== null;
  const correct = question.type === 'mcq' && selected === question.answerId;
  const isLast = index === questions.length - 1;

  const submit = () => {
    if (!canSubmit) return;
    if (!submitted) {
      if (question.type === 'mcq' && selected) {
        setAnswers((prev) => ({ ...prev, [String(index)]: selected }));
      }
      setSubmitted(true);
      return;
    }
    if (isLast) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setWrittenText('');
    setSubmitted(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <ArrowLeftIcon size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.headerTitle}>
            {isKey ? `Unlock: ${target?.title ?? concept.title}` : concept.title}
          </Text>
        </View>
        <Text style={styles.counter}>{index + 1} of {questions.length}</Text>
      </View>

      <ProgressBar progress={((index + 1) / questions.length) * 100} style={styles.headerProgress} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
        keyboardShouldPersistTaps="handled"
      >
        {isKey ? (
          <View style={styles.keyBanner}>
            <Text style={styles.keyBannerText}>
              Pass {concept.title}’s test to unlock the lesson you want to jump to.
            </Text>
          </View>
        ) : null}

        <View style={styles.questionHeader}>
          <Text style={styles.questionType}>{isWritten ? 'THEORY QUESTION' : 'MULTIPLE CHOICE'}</Text>
          <Text style={styles.prompt}>{question.prompt}</Text>
        </View>

        {isWritten ? (
          <View style={styles.writtenWrap}>
            <TextInput
              multiline
              value={writtenText}
              onChangeText={setWrittenText}
              editable={!submitted}
              placeholder={question.hint}
              placeholderTextColor={colors.slate}
              textAlignVertical="top"
              style={styles.input}
            />
            <Text style={styles.wordCount}>
              {writtenText.trim() ? writtenText.trim().split(/\s+/).length : 0} words
            </Text>
          </View>
        ) : (
          <View style={styles.options}>
            {question.options?.map((option) => {
              const isSelected = selected === option.id;
              const isCorrect = submitted && option.id === question.answerId;
              const isWrong = submitted && isSelected && !correct;
              return (
                <Pressable
                  key={option.id}
                  disabled={submitted}
                  onPress={() => setSelected(option.id)}
                  style={[styles.option, isSelected && styles.optionSelected, isCorrect && styles.optionCorrect, isWrong && styles.optionWrong]}
                >
                  <View style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    <Text style={[styles.optionLabelText, isSelected && styles.optionLabelTextSelected]}>{option.label}</Text>
                  </View>
                  <Text style={styles.optionText}>{option.text}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {submitted ? (
          <View style={[styles.feedback, correct || isWritten ? styles.feedbackGood : styles.feedbackNeedsWork]}>
            <Text style={styles.feedbackTitle}>{isWritten ? 'Good thinking' : correct ? 'Correct' : 'Review this one'}</Text>
            <Text style={styles.feedbackText}>{question.explanation}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            if (submitted) {
              setSubmitted(false);
              return;
            }
            if (index === 0) {
              navigation.goBack();
              return;
            }
            setIndex((value) => value - 1);
            setSelected(null);
            setWrittenText('');
          }}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, !canSubmit && styles.primaryDisabled]}
          disabled={!canSubmit}
          onPress={submit}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>
            {submitted ? (isLast ? 'See result' : 'Next question') : isWritten ? 'Submit answer' : 'Check answer'}
          </Text>
          {submitted && isLast ? <CheckCircleIcon size={18} color={colors.onPrimary} /> : <ArrowRightIcon size={18} color={colors.onPrimary} />}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.canvas },
  missing: { alignItems: 'center', justifyContent: 'center' },
  missingText: { fontFamily: fonts.medium, fontSize: 14, color: c.slate },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 14 },
  iconButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, color: c.primary },
  headerTitle: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 24, color: c.ink },
  counter: { fontFamily: fonts.medium, fontSize: 11, color: c.slate },
  headerProgress: { marginHorizontal: 18 },
  content: { paddingHorizontal: 18, paddingTop: 24, gap: 18 },
  keyBanner: { padding: 12, borderRadius: 12, backgroundColor: c.primarySoft },
  keyBannerText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: c.primary },
  questionHeader: { gap: 10 },
  questionType: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, letterSpacing: 0.4, color: c.slate },
  prompt: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, color: c.ink },
  options: { gap: 10 },
  option: { minHeight: 62, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadow.frame },
  optionSelected: { borderColor: c.primary, backgroundColor: c.primarySoft },
  optionCorrect: { borderColor: c.success, backgroundColor: c.greenSoft },
  optionWrong: { borderColor: c.danger, backgroundColor: c.pinkSoft },
  optionLabel: { width: 32, height: 32, borderRadius: 999, backgroundColor: c.canvas, alignItems: 'center', justifyContent: 'center' },
  optionLabelSelected: { backgroundColor: c.primary },
  optionLabelText: { fontFamily: fonts.bold, fontSize: 13, color: c.slate },
  optionLabelTextSelected: { color: c.onPrimary },
  optionText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: c.ink },
  writtenWrap: { minHeight: 190, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, ...shadow.frame },
  input: { flex: 1, minHeight: 145, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.ink },
  wordCount: { fontFamily: fonts.medium, fontSize: 11, color: c.slate, textAlign: 'right' },
  feedback: { padding: 15, borderRadius: 14, gap: 5 },
  feedbackGood: { backgroundColor: c.greenSoft },
  feedbackNeedsWork: { backgroundColor: c.orangeSoft },
  feedbackTitle: { fontFamily: fonts.bold, fontSize: 13, color: c.ink },
  feedbackText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.ink },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 12, backgroundColor: c.canvas, borderTopWidth: 1, borderTopColor: c.border },
  secondaryButton: { height: 52, paddingHorizontal: 22, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  secondaryText: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 18, color: c.ink },
  primaryButton: { flex: 1, height: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.primary, ...shadow.card },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 18, color: c.onPrimary },

  resultContent: { paddingHorizontal: 18, gap: 14, alignItems: 'center' },
  resultTile: { width: 92, height: 92, borderRadius: 26, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  resultTilePass: { backgroundColor: c.greenSoft },
  resultTileFail: { backgroundColor: c.orangeSoft },
  resultTitle: { fontFamily: fonts.regular, fontSize: 26, lineHeight: 31, color: c.ink, textAlign: 'center' },
  resultSubtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.slate, textAlign: 'center', maxWidth: 330 },
  scoreCard: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 18, backgroundColor: c.surface, ...shadow.frame },
  scoreCopy: { flex: 1, gap: 4 },
  scoreEyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1, color: c.slate },
  scoreTitle: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 26, color: c.ink },
  scorePercent: { fontFamily: fonts.extrabold, fontSize: 13, color: c.primary },
  actions: { alignSelf: 'stretch', gap: 10, paddingTop: 4 },
});
