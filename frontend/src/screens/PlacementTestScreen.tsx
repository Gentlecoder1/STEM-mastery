import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MasteryRing from '../components/MasteryRing';
import { PrimaryButton } from '../components/Form';
import { ProgressBar } from '../components/PracticeUI';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, SparklesIcon } from '../components/icons';
import { GraduationCapIcon } from '../components/glyphs';
import { colors, fonts, getSubjects, shadow, type SubjectId, type ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { usePreferences } from '../preferencesContext';
import { useProgress, type PlacementResult } from '../progressContext';
import {
  PLACEMENT_PASS_RATIO,
  getPlacementQuestions,
  type PlacementQuestion,
} from '../data/placement';
import type { RootScreenProps } from '../navigation/types';

type ScheduledQuestion = {
  subjectId: SubjectId;
  question: PlacementQuestion;
};

type Phase = 'intro' | 'question' | 'result';

export default function PlacementTestScreen({ navigation }: RootScreenProps<'PlacementTest'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { subjects: selectedSubjects } = usePreferences();
  const { recordPlacement } = useProgress();
  const subjectMeta = useMemo(() => getSubjects(), []);

  const subjects = useMemo<readonly SubjectId[]>(
    () => (selectedSubjects.length > 0 ? selectedSubjects : subjectMeta.map((s) => s.id)),
    [selectedSubjects, subjectMeta],
  );

  const scheduled = useMemo<ScheduledQuestion[]>(
    () =>
      subjects.flatMap((subjectId) =>
        getPlacementQuestions(subjectId).map((question) => ({ subjectId, question })),
      ),
    [subjects],
  );

  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const current = scheduled[index];
  const subjectForName = (id: SubjectId) => subjectMeta.find((s) => s.id === id);

  const results = useMemo<PlacementResult[]>(
    () =>
      subjects.map((subjectId) => {
        const questions = getPlacementQuestions(subjectId);
        const correct = questions.filter((q) => responses[q.id] === q.answerId).length;
        const total = questions.length;
        const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { subjectId, correct, total, scorePct, passed: scorePct >= PLACEMENT_PASS_RATIO * 100 };
      }),
    [subjects, responses],
  );

  const overallCorrect = results.reduce((sum, r) => sum + r.correct, 0);
  const overallTotal = results.reduce((sum, r) => sum + r.total, 0);
  const overallPct = overallTotal > 0 ? Math.round((overallCorrect / overallTotal) * 100) : 0;
  const anyPassed = results.some((r) => r.passed);

  const finish = (startFromBeginning: boolean) => {
    recordPlacement(results, { startFromBeginning });
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  if (phase === 'intro') {
    return (
      <View style={styles.root}>
        <StatusBar style={statusBarStyle} />
        <View style={[styles.introWrap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.introIcon}>
            <GraduationCapIcon size={34} color={colors.onPrimary} />
          </View>
          <Text style={styles.introTitle}>Placement check</Text>
          <Text style={styles.introBody}>
            A few quick questions on the basics of each subject you picked. Your score decides
            whether you can skip ahead or should start from the beginning.
          </Text>
          <View style={styles.introCard}>
            {subjects.map((id) => {
              const meta = subjectForName(id);
              return (
                <View key={id} style={styles.introRow}>
                  <View style={[styles.introBadge, { backgroundColor: meta?.soft }]}>
                    <Text style={[styles.introBadgeText, { color: meta?.accent }]}>
                      {meta?.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.introRowText}>
                    {meta?.name} · {getPlacementQuestions(id).length} questions
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.introFooter}>
            <PrimaryButton title="Start placement check" onPress={() => setPhase('question')} />
          </View>
        </View>
      </View>
    );
  }

  if (phase === 'result') {
    return (
      <View style={styles.root}>
        <StatusBar style={statusBarStyle} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.resultContent,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={styles.resultPill}>
            <SparklesIcon size={13} color={colors.primary} />
            <Text style={styles.resultPillText}>PLACEMENT COMPLETE</Text>
          </View>

          <Text style={styles.resultTitle}>
            {anyPassed ? 'You can skip the basics!' : 'Let’s build from the basics'}
          </Text>
          <Text style={styles.resultSubtitle}>
            {anyPassed
              ? 'You showed strong foundations. Start at your recommended lesson, or begin from the top if you prefer.'
              : 'We recommend starting from the very beginning so the foundations are solid.'}
          </Text>

          <View style={styles.scoreCard}>
            <MasteryRing percent={overallPct} color={anyPassed ? colors.success : colors.orange} size={92} />
            <View style={styles.scoreCopy}>
              <Text style={styles.scoreEyebrow}>YOUR SCORE</Text>
              <Text style={styles.scoreTitle}>
                {overallCorrect} of {overallTotal} correct
              </Text>
              <Text style={styles.scorePercent}>{overallPct}%</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>By subject</Text>
          <View style={styles.subjectCard}>
            {results.map((result) => {
              const meta = subjectForName(result.subjectId);
              return (
                <View key={result.subjectId} style={styles.subjectRow}>
                  <View style={[styles.subjectIcon, { backgroundColor: meta?.soft }]}>
                    <Text style={[styles.subjectIconText, { color: meta?.accent }]}>
                      {meta?.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.subjectCopy}>
                    <Text style={styles.subjectName}>{meta?.name}</Text>
                    <Text style={styles.subjectMeta}>
                      {result.correct} of {result.total} correct · {result.scorePct}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.resultBadge,
                      result.passed ? styles.resultBadgePass : styles.resultBadgeFail,
                    ]}
                  >
                    <Text
                      style={[
                        styles.resultBadgeText,
                        { color: result.passed ? colors.success : colors.orange },
                      ]}
                    >
                      {result.passed ? 'PASSED' : 'REVIEW'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Recommendation</Text>
          <View style={styles.recommendCard}>
            {results.map((result) => {
              const meta = subjectForName(result.subjectId);
              return (
                <View key={result.subjectId} style={styles.recommendRow}>
                  <View style={styles.recommendIcon}>
                    <CheckCircleIcon
                      size={18}
                      color={result.passed ? colors.success : colors.slate}
                    />
                  </View>
                  <Text style={styles.recommendText}>
                    {result.passed
                      ? `Skip the basics in ${meta?.name} and start at the recommended lesson.`
                      : `Start ${meta?.name} from the very beginning.`}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.actions}>
            {anyPassed ? (
              <>
                <PrimaryButton
                  title="Start at recommended lessons"
                  icon={<ArrowRightIcon size={18} color={colors.onPrimary} />}
                  onPress={() => finish(false)}
                />
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => finish(true)}
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryText}>Start from the beginning anyway</Text>
                </Pressable>
              </>
            ) : (
              <PrimaryButton
                title="Start from the beginning"
                icon={<ArrowRightIcon size={18} color={colors.onPrimary} />}
                onPress={() => finish(true)}
              />
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  const isChecked = current ? Boolean(checked[current.question.id]) : false;
  const selected = current ? responses[current.question.id] : undefined;
  const isCorrect = current ? selected === current.question.answerId : false;
  const isLast = index === scheduled.length - 1;
  const meta = current ? subjectForName(current.subjectId) : undefined;

  const handleBack = () => {
    if (index === 0) {
      navigation.goBack();
      return;
    }
    setIndex((value) => value - 1);
  };

  const handlePrimary = () => {
    if (!current) return;
    if (!isChecked) {
      if (!selected) return;
      setChecked((prev) => ({ ...prev, [current.question.id]: true }));
      return;
    }
    if (isLast) {
      setPhase('result');
      return;
    }
    setIndex((value) => value + 1);
  };

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.iconButton} onPress={handleBack} accessibilityLabel="Go back">
          <ArrowLeftIcon size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>PLACEMENT · {(meta?.name ?? '').toUpperCase()}</Text>
          <Text style={styles.headerTitle}>Question {index + 1} of {scheduled.length}</Text>
        </View>
      </View>

      <ProgressBar
        progress={scheduled.length > 0 ? ((index + 1) / scheduled.length) * 100 : 0}
        style={styles.headerProgress}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
      >
        <Text style={styles.prompt}>{current?.question.prompt}</Text>

        <View style={styles.options}>
          {current?.question.options.map((option) => {
            const isSelected = selected === option.id;
            const showCorrect = isChecked && option.id === current.question.answerId;
            const showWrong = isChecked && isSelected && !isCorrect;
            return (
              <Pressable
                key={option.id}
                disabled={isChecked}
                onPress={() =>
                  current &&
                  setResponses((prev) => ({ ...prev, [current.question.id]: option.id }))
                }
                style={[
                  styles.option,
                  isSelected && styles.optionSelected,
                  showCorrect && styles.optionCorrect,
                  showWrong && styles.optionWrong,
                ]}
              >
                <View style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  <Text style={[styles.optionLabelText, isSelected && styles.optionLabelTextSelected]}>
                    {option.label}
                  </Text>
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
              </Pressable>
            );
          })}
        </View>

        {isChecked ? (
          <View style={[styles.feedback, isCorrect ? styles.feedbackGood : styles.feedbackNeedsWork]}>
            <Text style={styles.feedbackTitle}>{isCorrect ? 'Correct' : 'Review this one'}</Text>
            <Text style={styles.feedbackText}>{current?.question.explanation}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <PrimaryButton
          title={
            isChecked
              ? isLast
                ? 'See my results'
                : 'Next question'
              : 'Check answer'
          }
          disabled={!isChecked && !selected}
          onPress={handlePrimary}
        />
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.canvas },

  introWrap: { flex: 1, paddingHorizontal: 20, alignItems: 'center', gap: 16 },
  introIcon: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  introTitle: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 32, color: c.ink, textAlign: 'center' },
  introBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: c.slate,
    textAlign: 'center',
    maxWidth: 340,
  },
  introCard: {
    alignSelf: 'stretch',
    padding: 14,
    borderRadius: 18,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
    ...shadow.frame,
  },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  introBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  introBadgeText: { fontFamily: fonts.bold, fontSize: 18 },
  introRowText: { fontFamily: fonts.regular, fontSize: 14, color: c.ink },
  introFooter: { alignSelf: 'stretch', marginTop: 'auto' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 14 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, color: c.primary },
  headerTitle: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 24, color: c.ink },
  headerProgress: { marginHorizontal: 18 },

  content: { paddingHorizontal: 18, paddingTop: 24, gap: 18 },
  prompt: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, color: c.ink },
  options: { gap: 10 },
  option: {
    minHeight: 62,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.frame,
  },
  optionSelected: { borderColor: c.primary, backgroundColor: c.primarySoft },
  optionCorrect: { borderColor: c.success, backgroundColor: c.greenSoft },
  optionWrong: { borderColor: c.danger, backgroundColor: c.pinkSoft },
  optionLabel: { width: 32, height: 32, borderRadius: 999, backgroundColor: c.canvas, alignItems: 'center', justifyContent: 'center' },
  optionLabelSelected: { backgroundColor: c.primary },
  optionLabelText: { fontFamily: fonts.bold, fontSize: 13, color: c.slate },
  optionLabelTextSelected: { color: c.onPrimary },
  optionText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: c.ink },
  feedback: { padding: 15, borderRadius: 14, gap: 5 },
  feedbackGood: { backgroundColor: c.greenSoft },
  feedbackNeedsWork: { backgroundColor: c.orangeSoft },
  feedbackTitle: { fontFamily: fonts.bold, fontSize: 13, color: c.ink },
  feedbackText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.ink },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: c.canvas,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },

  resultContent: { paddingHorizontal: 18, gap: 14, alignItems: 'center' },
  resultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: c.primarySoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resultPillText: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.5, color: c.primary },
  resultTitle: { fontFamily: fonts.regular, fontSize: 26, lineHeight: 31, color: c.ink, textAlign: 'center' },
  resultSubtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.slate, textAlign: 'center', maxWidth: 340 },
  scoreCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: c.surface,
    ...shadow.frame,
  },
  scoreCopy: { flex: 1, gap: 4 },
  scoreEyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1, color: c.slate },
  scoreTitle: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 26, color: c.ink },
  scorePercent: { fontFamily: fonts.extrabold, fontSize: 13, color: c.primary },

  sectionTitle: { alignSelf: 'stretch', fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: c.ink },
  subjectCard: { alignSelf: 'stretch', padding: 12, borderRadius: 18, backgroundColor: c.surface, gap: 12, ...shadow.frame },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subjectIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectIconText: { fontFamily: fonts.bold, fontSize: 19 },
  subjectCopy: { flex: 1, gap: 2 },
  subjectName: { fontFamily: fonts.regular, fontSize: 14, color: c.ink },
  subjectMeta: { fontFamily: fonts.medium, fontSize: 11, color: c.slate },
  resultBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  resultBadgePass: { backgroundColor: c.greenSoft },
  resultBadgeFail: { backgroundColor: c.orangeSoft },
  resultBadgeText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.4 },

  recommendCard: {
    alignSelf: 'stretch',
    padding: 14,
    borderRadius: 18,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
    ...shadow.frame,
  },
  recommendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recommendIcon: { width: 26, alignItems: 'center' },
  recommendText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.ink },

  actions: { alignSelf: 'stretch', gap: 10, paddingTop: 4 },
  secondaryButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontFamily: fonts.medium, fontSize: 15, color: c.ink },
});
