import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '../components/icons';
import { ProgressBar } from '../components/PracticeUI';
import { colors, fonts, shadow } from '../theme';
import { getConcept } from '../data/learning';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles, useTheme } from '../themeContext';

type QuizOption = { id: string; label: string; text: string };
type QuizQuestion = {
  type: 'mcq' | 'written';
  prompt: string;
  options?: readonly QuizOption[];
  answerId?: string;
  explanation: string;
  hint?: string;
};

const QUESTIONS: readonly QuizQuestion[] = [
  {
    type: 'mcq',
    prompt: 'Which statement best describes velocity?',
    options: [
      { id: 'a', label: 'A', text: 'How far an object travels' },
      { id: 'b', label: 'B', text: 'Speed in a particular direction' },
      { id: 'c', label: 'C', text: 'The time taken to travel' },
      { id: 'd', label: 'D', text: 'The size of an object' },
    ],
    answerId: 'b',
    explanation: 'Velocity is a vector quantity: it describes how fast something moves and in which direction.',
  },
  {
    type: 'written',
    prompt: 'In your own words, explain how speed is different from velocity.',
    hint: 'Mention both magnitude and direction.',
    explanation: 'Speed tells us how fast an object moves. Velocity also includes the direction of that movement.',
  },
];

export default function ConceptQuizScreen({ navigation, route }: RootScreenProps<'ConceptQuiz'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  const concept = getConcept(route.params.conceptId);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [writtenText, setWrittenText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!concept) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>Quiz unavailable.</Text>
      </View>
    );
  }

  const question = QUESTIONS[index];
  const isWritten = question.type === 'written';
  const canSubmit = isWritten ? writtenText.trim().length > 0 : selected !== null;
  const correct = question.type === 'mcq' && selected === question.answerId;
  const isLast = index === QUESTIONS.length - 1;

  const submit = () => {
    if (!canSubmit) return;
    if (!submitted) {
      setSubmitted(true);
      return;
    }
    if (isLast) {
      navigation.pop(3);
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
          <Pressable style={styles.iconButton} onPress={() => navigation.pop(3)} accessibilityLabel="Go back">
          <ArrowLeftIcon size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>QUICK CHECK</Text>
          <Text style={styles.headerTitle}>{concept.title}</Text>
        </View>
        <Text style={styles.counter}>{index + 1} of {QUESTIONS.length}</Text>
      </View>

      <ProgressBar progress={((index + 1) / QUESTIONS.length) * 100} style={styles.headerProgress} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]} keyboardShouldPersistTaps="handled">
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
            <Text style={styles.wordCount}>{writtenText.trim() ? writtenText.trim().split(/\s+/).length : 0} words</Text>
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
        <Pressable style={[styles.primaryButton, !canSubmit && styles.primaryDisabled]} disabled={!canSubmit} onPress={submit} accessibilityRole="button">
          <Text style={styles.primaryText}>{submitted ? isLast ? 'Finish quiz' : 'Next question' : isWritten ? 'Submit answer' : 'Check answer'}</Text>
          {submitted && isLast ? <CheckCircleIcon size={18} color={colors.onPrimary} /> : <ArrowRightIcon size={18} color={colors.onPrimary} />}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  missing: { alignItems: 'center', justifyContent: 'center' },
  missingText: { fontFamily: fonts.medium, fontSize: 14, color: colors.slate },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 10 },
  iconButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, color: colors.primary },
  headerTitle: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 24, color: colors.ink },
  counter: { fontFamily: fonts.medium, fontSize: 11, color: colors.slate },
  headerProgress: { marginHorizontal: 18 },
  content: { paddingHorizontal: 18, paddingTop: 24, gap: 18 },
  questionHeader: { gap: 10 },
  questionType: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, letterSpacing: 0.4, color: colors.slate },
  prompt: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, color: colors.ink },
  options: { gap: 10 },
  option: { minHeight: 62, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadow.frame },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.greenSoft },
  optionWrong: { borderColor: colors.danger, backgroundColor: colors.pinkSoft },
  optionLabel: { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  optionLabelSelected: { backgroundColor: colors.primary },
  optionLabelText: { fontFamily: fonts.bold, fontSize: 13, color: colors.slate },
  optionLabelTextSelected: { color: colors.onPrimary },
  optionText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.ink },
  writtenWrap: { minHeight: 190, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow.frame },
  input: { flex: 1, minHeight: 145, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.ink },
  wordCount: { fontFamily: fonts.medium, fontSize: 11, color: colors.slate, textAlign: 'right' },
  feedback: { padding: 15, borderRadius: 14, gap: 5 },
  feedbackGood: { backgroundColor: colors.greenSoft },
  feedbackNeedsWork: { backgroundColor: colors.orangeSoft },
  feedbackTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  feedbackText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.ink },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 12, backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.border },
  secondaryButton: { height: 52, paddingHorizontal: 22, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  secondaryText: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 18, color: colors.ink },
  primaryButton: { flex: 1, height: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, ...shadow.card },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 18, color: colors.onPrimary },
});
