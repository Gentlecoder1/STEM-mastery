import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MotionChart from '../components/MotionChart';
import {
  CloseIcon,
  FlagIcon,
  HeartIcon,
  ImagePlusIcon,
  LightbulbIcon,
  MessageTextIcon,
  MicIcon,
  SendIcon,
  SigmaIcon,
  StarIcon,
} from '../components/glyphs';
import { SparklesIcon } from '../components/icons';
import { ActionButton, Pill, ProgressBar } from '../components/PracticeUI';
import { colors, fonts, shadow } from '../theme';
import { getPracticeQuestion, PRACTICE_SET_SIZE } from '../data/practice';
import type { PracticeOption } from '../data/practice';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles, useTheme } from '../themeContext';

export default function PracticeQuestionScreen({
  navigation,
  route,
}: RootScreenProps<'PracticeQuestion'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  const { index } = route.params;
  const question = useMemo(() => getPracticeQuestion(index), [index]);

  const [selected, setSelected] = useState<string | null>(null);
  const [writtenText, setWrittenText] = useState('');

  if (!question) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>Question not found.</Text>
      </View>
    );
  }

  const isMcq = question.type === 'mcq';
  const wordCount = writtenText.trim() ? writtenText.trim().split(/\s+/).length : 0;
  const canSubmit = isMcq ? selected !== null : writtenText.trim().length > 0;
  const lives = 3;

  const submit = () => {
    if (isMcq && selected) {
      navigation.navigate('PracticeFeedback', { index, selected });
    } else {
      navigation.navigate('PracticeFeedback', { index, writtenText });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 2 }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close practice"
        >
          <CloseIcon size={19} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ProgressBar progress={((index + 1) / PRACTICE_SET_SIZE) * 100} style={styles.headerProgress} />
          <Text style={styles.headerCounter}>
            QUESTION {index + 1} OF {PRACTICE_SET_SIZE}
          </Text>
        </View>
        {isMcq ? (
          <View style={styles.lives}>
            <HeartIcon size={18} color={colors.danger} />
            <Text style={styles.livesValue}>{lives}</Text>
          </View>
        ) : (
          <FlagIcon size={20} color={colors.ink} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 108 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.metaRow}>
          {isMcq ? (
            <Pill bg={colors.blueSoft} tint={colors.blue}>
              MULTIPLE CHOICE
            </Pill>
          ) : (
            <Pill bg={colors.primarySoft} tint={colors.primary}>
              <MessageTextIcon size={13} color={colors.primary} />
              <Text style={[styles.pillLabel, { color: colors.primary }]}>EXPLAIN IN YOUR WORDS</Text>
            </Pill>
          )}
          <Pill bg={colors.orangeSoft} tint={colors.orange}>
            {isMcq ? <StarIcon size={13} color={colors.orange} /> : null}
            <Text style={[styles.pillLabel, { color: colors.orange }]}>
              {isMcq ? `+${question.xp} XP` : `${question.marks} MARKS`}
            </Text>
          </Pill>
        </View>

        <Text style={styles.prompt}>{question.prompt}</Text>

        {isMcq && question.graph ? (
          <View style={styles.graphCard}>
            <MotionChart variant={question.graph} highlight={question.graph === 'flat'} />
          </View>
        ) : null}

        {!isMcq && question.hint ? (
          <View style={styles.hintCard}>
            <LightbulbIcon size={20} color={colors.orange} />
            <Text style={styles.hintText}>
              Think about how the <Text style={styles.hintBold}>steepness of the line</Text> changes
              over time.
            </Text>
          </View>
        ) : null}

        {isMcq && question.options ? (
          <View style={styles.options}>
            {question.options.map((option) => (
              <OptionRow
                key={option.id}
                option={option}
                selected={selected === option.id}
                onPress={() => setSelected(option.id)}
              />
            ))}
          </View>
        ) : (
          <>
            <View style={styles.answerField}>
              <TextInput
                multiline
                value={writtenText}
                onChangeText={setWrittenText}
                placeholder="Type your explanation…"
                placeholderTextColor={colors.slate}
                textAlignVertical="top"
                style={styles.answerInput}
              />
              <View style={styles.toolsRow}>
                <View style={styles.toolGroup}>
                  <MicIcon size={20} color={colors.ink} />
                  <ImagePlusIcon size={20} color={colors.ink} />
                  <SigmaIcon size={20} color={colors.ink} />
                </View>
                <Text style={styles.wordCount}>{wordCount} words</Text>
              </View>
            </View>

            <View style={styles.gradingCard}>
              <SparklesIcon size={21} color={colors.orange} />
              <View style={styles.gradingCopy}>
                <Text style={styles.gradingTitle}>Graded for meaning, not keywords</Text>
                <Text style={styles.gradingSubtitle}>
                  We’ll explain what you understood and what to improve.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <ActionButton
          onPress={submit}
          disabled={!canSubmit}
          leading={!isMcq ? <SendIcon size={18} color={colors.onPrimary} /> : undefined}
        >
          {isMcq ? 'Check answer' : 'Submit explanation'}
        </ActionButton>
      </View>
    </View>
  );
}

type OptionRowProps = {
  option: PracticeOption;
  selected: boolean;
  onPress: () => void;
};

function OptionRow({ option, selected, onPress }: OptionRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <View style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
        <Text style={[styles.optionLabelText, selected && styles.optionLabelTextSelected]}>
          {option.label}
        </Text>
      </View>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.text}</Text>
    </Pressable>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  missing: { alignItems: 'center', justifyContent: 'center' },
  missingText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 17, color: colors.slate },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 5 },
  headerProgress: { height: 10 },
  headerCounter: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.slate,
    letterSpacing: 0.5,
  },
  lives: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  livesValue: { fontFamily: fonts.extrabold, fontSize: 13, lineHeight: 16, color: colors.danger },

  scroll: { paddingHorizontal: 20, paddingTop: 8, gap: 14 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
  },
  prompt: {
    fontFamily: fonts.regular,
    fontSize: 22,
    lineHeight: 28,
    color: colors.ink,
  },

  graphCard: {
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },

  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.blueBorder,
    backgroundColor: colors.blueSoft,
    ...shadow.frame,
  },
  hintText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.ink,
  },
  hintBold: { fontFamily: fonts.extrabold },

  options: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 11,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.blueSoft,
    borderWidth: 2,
    borderColor: colors.blue,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabelSelected: { backgroundColor: colors.blue },
  optionLabelText: { fontFamily: fonts.extrabold, fontSize: 13, lineHeight: 16, color: colors.slate },
  optionLabelTextSelected: { color: colors.onPrimary },
  optionText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17.5,
    color: colors.ink,
  },
  optionTextSelected: { fontFamily: fonts.medium },

  answerField: {
    height: 250,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'space-between',
  },
  answerInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22.5,
    color: colors.ink,
  },
  toolsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toolGroup: { flexDirection: 'row', gap: 14 },
  wordCount: { fontFamily: fonts.semibold, fontSize: 10, lineHeight: 12, color: colors.slate },

  gradingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.yellowSoft,
    backgroundColor: colors.yellowSoft,
    ...shadow.frame,
  },
  gradingCopy: { flex: 1, gap: 2 },
  gradingTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  gradingSubtitle: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 13, color: colors.slate },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});