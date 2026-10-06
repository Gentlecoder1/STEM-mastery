import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MasteryRing from '../components/MasteryRing';
import { ArrowRightIcon, CheckCircleIcon, CheckIcon } from '../components/icons';
import { LightbulbIcon, StarIcon } from '../components/glyphs';
import { ActionButton } from '../components/PracticeUI';
import { colors, fonts, lightColors, shadow } from '../theme';
import { getPracticeQuestion, PRACTICE_SET_SIZE } from '../data/practice';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles, useTheme } from '../themeContext';

export default function PracticeFeedbackScreen({
  navigation,
  route,
}: RootScreenProps<'PracticeFeedback'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  const { index, selected, writtenText } = route.params;

  const question = useMemo(() => getPracticeQuestion(index), [index]);

  if (!question) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>Feedback unavailable.</Text>
      </View>
    );
  }

  const isWritten = question.type === 'written';
  const correct = isWritten ? true : selected === question.answerId;
  const mastery = correct ? question.masteryAfter : question.masteryBefore;
  const heading = correct ? 'Exactly right!' : 'Not quite yet';
  const headingColor = correct ? colors.success : colors.orange;
  const successBg = correct ? colors.success : colors.orange;
  const finished = index === PRACTICE_SET_SIZE - 1;

  const next = () => {
    if (finished) {
      navigation.navigate('PracticeQuizResult');
    } else {
      navigation.navigate('PracticeQuestion', { index: index + 1 });
    }
  };

  const chosenOption = question.options?.find((option) => option.id === selected);

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 108 },
        ]}
      >
        <View style={styles.celebration}>
          <View style={[styles.successIcon, { backgroundColor: successBg }]}>
            <CheckIcon size={48} color={lightColors.surface} strokeWidth={1.6} />
          </View>
          <View style={styles.xpPill}>
            <StarIcon size={13} color={colors.orange} />
            <Text style={styles.xpText}>+{question.xp} XP</Text>
          </View>
          <Text style={[styles.heading, { color: headingColor }]}>{heading}</Text>
          <Text style={styles.feedback}>{question.explanation}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>YOUR ANSWER</Text>
          {isWritten ? (
            <View style={[styles.answerRow, { backgroundColor: colors.greenSoft, borderColor: colors.success }]}>
              <Text style={styles.writtenAnswer}>{writtenText}</Text>
              <CheckCircleIcon size={21} color={colors.success} />
            </View>
          ) : chosenOption ? (
            <View style={[styles.answerRow, { backgroundColor: colors.greenSoft, borderColor: colors.success }]}>
              <View style={[styles.optionBadge, { backgroundColor: successBg }]}>
                <Text style={styles.optionBadgeText}>{chosenOption.label}</Text>
              </View>
              <Text style={styles.answerText}>{chosenOption.text}</Text>
              <CheckCircleIcon size={21} color={colors.success} />
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.explanationRow}>
            <LightbulbIcon size={20} color={colors.orange} />
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.masteryRow}>
            <MasteryRing percent={mastery} color={correct ? colors.blue : colors.orange} size={62} />
            <View style={styles.masteryCopy}>
              <Text style={styles.masteryTitle}>{question.concept}</Text>
              <View style={styles.gainRow}>
                <Text style={styles.gainBefore}>{question.masteryBefore}%</Text>
                <ArrowRightIcon size={14} color={colors.slate} />
                <Text style={styles.gainAfter}>
                  {mastery}% mastery
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <ActionButton bg={colors.success} onPress={next} leading={<ArrowRightIcon size={18} color={colors.onPrimary} />}>
          {finished ? 'See your next step' : 'Next question'}
        </ActionButton>
      </View>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.greenSoft },
  missing: { alignItems: 'center', justifyContent: 'center' },
  missingText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 17, color: colors.slate },

  content: { paddingHorizontal: 20, gap: 16 },

  celebration: { alignItems: 'center', gap: 10 },
  successIcon: {
    width: 92,
    height: 92,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.orangeSoft,
  },
  xpText: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 12, color: colors.orange },
  heading: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 34, color: colors.success },
  feedback: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.slate,
    textAlign: 'center',
  },

  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 13,
    ...shadow.frame,
  },
  cardLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    color: colors.slate,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeText: { fontFamily: fonts.extrabold, fontSize: 13, lineHeight: 16, color: lightColors.surface },
  answerText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
  },
  writtenAnswer: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
  },
  divider: { height: 1, backgroundColor: colors.border },
  explanationRow: { flexDirection: 'row', gap: 9 },
  explanationText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.ink,
  },

  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  masteryCopy: { flex: 1, gap: 5 },
  masteryTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  gainRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gainBefore: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.slate },
  gainAfter: { fontFamily: fonts.extrabold, fontSize: 12, lineHeight: 15, color: colors.success },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.greenSoft,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});