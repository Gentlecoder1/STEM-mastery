import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useProgress } from '../progressContext';
import {
  checkAnswer,
  fetchPlacementQuestions,
  submitPlacement,
  type PlacementQuestion,
  type PlacementSubmitResult,
} from '../lib/assessmentApi';
import { resolveSubjectId } from '../types/catalog';
import type { RootScreenProps } from '../navigation/types';

type Phase = 'intro' | 'question' | 'result';

export default function PlacementTestScreen({ navigation }: RootScreenProps<'PlacementTest'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { subjects: selectedSubjects } = usePreferences();
  const { refresh } = useProgress();
  const subjectMeta = useMemo(() => getSubjects(), []);

  const subjects = useMemo<readonly SubjectId[]>(
    () => (selectedSubjects.length > 0 ? selectedSubjects : subjectMeta.map((s) => s.id)),
    [selectedSubjects, subjectMeta],
  );

  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean | null>>({});
  const [result, setResult] = useState<PlacementSubmitResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchPlacementQuestions([...subjects], Math.max(3, subjects.length * 3))
      .then((data) => {
        if (!mounted) return;
        setQuestions(data);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setError('We could not load the placement check. Please try again.');
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [subjects]);

  const subjectForName = (id: string) => subjectMeta.find((s) => s.id === resolveSubjectId(id));
  const current = questions[index];
  const isLast = index === questions.length - 1;

  const overallPct = result
    ? result.results.length > 0
      ? Math.round(
          result.results.reduce((sum, r) => sum + r.scorePct, 0) / result.results.length,
        )
      : 0
    : 0;
  const overallCorrect = result ? result.results.reduce((sum, r) => sum + r.correct, 0) : 0;
  const overallTotal = result ? result.results.reduce((sum, r) => sum + r.total, 0) : 0;
  const anyPassed = result ? result.results.some((r) => r.passed) : false;

  const finish = async () => {
    await refresh();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const handlePrimary = async () => {
    if (!current) return;
    const answer = responses[current.id];
    if (!(current.id in checked)) {
      if (!answer) return;
      setBusy(true);
      try {
        const outcome = await checkAnswer(current.conceptId ?? '', current.id, answer);
        setChecked((prev) => ({ ...prev, [current.id]: outcome.correct }));
      } catch {
        setChecked((prev) => ({ ...prev, [current.id]: null }));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (isLast) {
      setBusy(true);
      setError(null);
      try {
        const answers = questions.map((item) => ({
          questionId: item.id,
          response: responses[item.id] ?? null,
        }));
        const submission = await submitPlacement(answers);
        setResult(submission);
        setPhase('result');
      } catch {
        setError('We could not save your placement. Please try again.');
      } finally {
        setBusy(false);
      }
      return;
    }
    setIndex((value) => value + 1);
  };

  const handleBack = () => {
    if (index === 0) {
      navigation.goBack();
      return;
    }
    setIndex((value) => value - 1);
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
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              subjects.map((id) => {
                const meta = subjectForName(id);
                return (
                  <View key={id} style={styles.introRow}>
                    <View style={[styles.introBadge, { backgroundColor: meta?.soft }]}>
                      <Text style={[styles.introBadgeText, { color: meta?.accent }]}>
                        {meta?.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.introRowText}>{meta?.name}</Text>
                  </View>
                );
              })
            )}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.introFooter}>
            <PrimaryButton
              title={loading ? 'Loading…' : `${questions.length} questions`}
              onPress={() => (questions.length > 0 ? setPhase('question') : undefined)}
              disabled={loading || questions.length === 0}
            />
          </View>
        </View>
      </View>
    );
  }

  if (phase === 'result' && result) {
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
            {result.results.map((subjectResult) => {
              const meta = subjectForName(subjectResult.subjectId);
              return (
                <View key={subjectResult.subjectId} style={styles.subjectRow}>
                  <View style={[styles.subjectIcon, { backgroundColor: meta?.soft }]}>
                    <Text style={[styles.subjectIconText, { color: meta?.accent }]}>
                      {meta?.name?.charAt(0) ?? '?'}
                    </Text>
                  </View>
                  <View style={styles.subjectCopy}>
                    <Text style={styles.subjectName}>{meta?.name ?? subjectResult.subjectId}</Text>
                    <Text style={styles.subjectMeta}>
                      {subjectResult.correct} of {subjectResult.total} correct · {subjectResult.scorePct}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.resultBadge,
                      subjectResult.passed ? styles.resultBadgePass : styles.resultBadgeFail,
                    ]}
                  >
                    <Text
                      style={[
                        styles.resultBadgeText,
                        { color: subjectResult.passed ? colors.success : colors.orange },
                      ]}
                    >
                      {subjectResult.passed ? 'PASSED' : 'REVIEW'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Recommendation</Text>
          <View style={styles.recommendCard}>
            {result.results.map((subjectResult) => {
              const meta = subjectForName(subjectResult.subjectId);
              return (
                <View key={subjectResult.subjectId} style={styles.recommendRow}>
                  <View style={styles.recommendIcon}>
                    <CheckCircleIcon
                      size={18}
                      color={subjectResult.passed ? colors.success : colors.slate}
                    />
                  </View>
                  <Text style={styles.recommendText}>
                    {subjectResult.passed
                      ? `Skip the basics in ${meta?.name ?? subjectResult.subjectId} and start at the recommended lesson.`
                      : `Start ${meta?.name ?? subjectResult.subjectId} from the very beginning.`}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              title="Start learning"
              icon={<ArrowRightIcon size={18} color={colors.onPrimary} />}
              onPress={() => void finish()}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const isChecked = current.id in checked;
  const feedbackValue = checked[current.id];
  const selected = responses[current.id];
  const meta = subjectForName(current.subjectId ?? '');

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.iconButton} onPress={handleBack} accessibilityLabel="Go back">
          <ArrowLeftIcon size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>PLACEMENT · {(meta?.name ?? '').toUpperCase()}</Text>
          <Text style={styles.headerTitle}>Question {index + 1} of {questions.length}</Text>
        </View>
      </View>

      <ProgressBar progress={questions.length > 0 ? ((index + 1) / questions.length) * 100 : 0} style={styles.headerProgress} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
      >
        <Text style={styles.prompt}>{current.prompt}</Text>

        <View style={styles.options}>
          {current.options.map((option) => {
            const isSelected = selected === option.id;
            return (
              <Pressable
                key={option.id}
                disabled={isChecked}
                onPress={() => setResponses((prev) => ({ ...prev, [current.id]: option.id }))}
                style={[styles.option, isSelected && styles.optionSelected]}
              >
                <View style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  <Text style={[styles.optionLabelText, isSelected && styles.optionLabelTextSelected]}>
                    {option.label ?? option.id.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
              </Pressable>
            );
          })}
        </View>

        {isChecked ? (
          <View style={[styles.feedback, feedbackValue ? styles.feedbackGood : styles.feedbackNeedsWork]}>
            <Text style={styles.feedbackTitle}>
              {feedbackValue === true ? 'Correct' : feedbackValue === false ? 'Review this one' : 'Answer recorded'}
            </Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <PrimaryButton
          title={isChecked ? (isLast ? 'See result' : 'Next question') : 'Check answer'}
          icon={isChecked ? <ArrowRightIcon size={18} color={colors.onPrimary} /> : undefined}
          onPress={() => void handlePrimary()}
          disabled={!selected || busy}
        />
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.canvas },
  centered: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: fonts.medium, fontSize: 12, color: c.danger, textAlign: 'center' },

  introWrap: { flex: 1, paddingHorizontal: 18, alignItems: 'center', gap: 12 },
  introIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  introTitle: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 31, color: c.ink, textAlign: 'center' },
  introBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.slate, textAlign: 'center', maxWidth: 340 },
  introCard: { alignSelf: 'stretch', padding: 14, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, gap: 12, ...shadow.frame },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  introBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  introBadgeText: { fontFamily: fonts.bold, fontSize: 18 },
  introRowText: { fontFamily: fonts.regular, fontSize: 14, color: c.ink },
  introFooter: { alignSelf: 'stretch', marginTop: 'auto' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 14 },
  iconButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, color: c.primary },
  headerTitle: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 24, color: c.ink },
  headerProgress: { marginHorizontal: 18 },

  content: { paddingHorizontal: 18, paddingTop: 24, gap: 18 },
  prompt: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, color: c.ink },
  options: { gap: 10 },
  option: { minHeight: 62, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadow.frame },
  optionSelected: { borderColor: c.primary, backgroundColor: c.primarySoft },
  optionLabel: { width: 32, height: 32, borderRadius: 999, backgroundColor: c.canvas, alignItems: 'center', justifyContent: 'center' },
  optionLabelSelected: { backgroundColor: c.primary },
  optionLabelText: { fontFamily: fonts.bold, fontSize: 13, color: c.slate },
  optionLabelTextSelected: { color: c.onPrimary },
  optionText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: c.ink },
  feedback: { padding: 15, borderRadius: 14, gap: 5 },
  feedbackGood: { backgroundColor: c.greenSoft },
  feedbackNeedsWork: { backgroundColor: c.orangeSoft },
  feedbackTitle: { fontFamily: fonts.bold, fontSize: 13, color: c.ink },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, backgroundColor: c.canvas, borderTopWidth: 1, borderTopColor: c.border },

  resultContent: { paddingHorizontal: 18, gap: 14, alignItems: 'center' },
  resultPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.primarySoft, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  resultPillText: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.5, color: c.primary },
  resultTitle: { fontFamily: fonts.regular, fontSize: 26, lineHeight: 31, color: c.ink, textAlign: 'center' },
  resultSubtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.slate, textAlign: 'center', maxWidth: 340 },
  scoreCard: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 18, backgroundColor: c.surface, ...shadow.frame },
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

  recommendCard: { alignSelf: 'stretch', padding: 14, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, gap: 12, ...shadow.frame },
  recommendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recommendIcon: { width: 26, alignItems: 'center' },
  recommendText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.ink },

  actions: { alignSelf: 'stretch', gap: 10, paddingTop: 4 },
});
