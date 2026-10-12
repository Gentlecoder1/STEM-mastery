import { useState, useRef, useEffect, type Dispatch, type SetStateAction } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  fonts,
  lightColors,
  radius,
  shadow,
  CLASSES,
  HOUR_OPTIONS,
  getSubjects,
  type ClassLevel,
  type SubjectId,
} from '../theme';
import { PrimaryButton } from '../components/Form';
import { ProgressBar } from '../components/PracticeUI';
import { ArrowRightIcon, CheckIcon } from '../components/icons';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles } from '../themeContext';
import { usePreferences } from '../preferencesContext';

const TOTAL_STEPS = 2;

type OnboardingState = {
  klass: ClassLevel;
  subjects: SubjectId[];
  hours: number;
};

type StepContentProps = {
  step: number;
  state: OnboardingState;
  setState: Dispatch<SetStateAction<OnboardingState>>;
};

function StepContent({ step, state, setState }: StepContentProps) {
  const styles = useThemedStyles(createStyles);
  const subjects = getSubjects();

  if (step === 1) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Let’s personalise your path, Iseoluwa</Text>
        <Text style={styles.subtitle}>Choose your class and the subjects you want to master.</Text>

        <View style={styles.block}>
          <Text style={styles.label}>Your class</Text>
          <View style={styles.classRow}>
            {CLASSES.map((c) => (
              <Pressable
                key={c}
                accessibilityRole="radio"
                accessibilityState={{ selected: state.klass === c }}
                onPress={() => setState((s) => ({ ...s, klass: c }))}
                style={[styles.classOption, state.klass === c && styles.classOptionActive]}
              >
                <Text style={[styles.classText, state.klass === c && styles.classTextActive]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.block}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Your subjects</Text>
            <Text style={styles.hint}>{state.subjects.length} selected</Text>
          </View>
          <View style={styles.subjectList}>
            {subjects.map((s) => {
              const sel = state.subjects.includes(s.id);
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: sel }}
                  onPress={() =>
                    setState((prev) => ({
                      ...prev,
                      subjects: sel
                        ? prev.subjects.filter((x) => x !== s.id)
                        : [...prev.subjects, s.id],
                    }))
                  }
                  style={[styles.subjectOption, { borderColor: sel ? s.accent : colors.border }]}
                >
                  <View style={[styles.subjectBadge, { backgroundColor: s.soft }]}>
                    <Text style={[styles.subjectBadgeText, { color: s.accent }]}>
                      {s.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.subjectName}>{s.name}</Text>
                  <View
                    style={[
                      styles.checkDot,
                      { backgroundColor: sel ? s.accent : 'transparent' },
                      !sel && styles.checkDotEmpty,
                    ]}
                  >
                    {sel ? <CheckIcon size={15} color={lightColors.surface} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>How much time can you commit each day?</Text>
        <Text style={styles.subtitle}>
          Small, consistent sessions beat long cramming. Pick what fits your day.
        </Text>
        <View style={styles.block}>
          <Text style={styles.label}>Hours per day</Text>
          <View style={styles.hoursWrap}>
            {HOUR_OPTIONS.map((h) => {
              const sel = state.hours === h;
              return (
                <Pressable
                  key={h}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  onPress={() => setState((s) => ({ ...s, hours: h }))}
                  style={[styles.hourChip, sel && styles.hourChipActive]}
                >
                  <Text style={[styles.hourText, sel && styles.hourTextActive]}>{h}h</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  return null;
}

type StepBodyProps = StepContentProps;

function StepBody({ step, state, setState }: StepBodyProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, anim]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: anim,
        transform: [
          { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
        ],
      }}
    >
      <StepContent step={step} state={state} setState={setState} />
    </Animated.View>
  );
}

function SuccessBody({ state }: { state: OnboardingState }) {
  const styles = useThemedStyles(createStyles);
  const scale = useRef(new Animated.Value(0.8)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  return (
    <Animated.View style={[styles.success, { opacity: fade, transform: [{ scale }] }]}>
      <View style={styles.successMark}>
        <CheckIcon size={28} color={colors.onPrimary} />
      </View>
      <Text style={styles.successTitle}>You’re all set!</Text>
      <Text style={styles.subtitle}>
        You picked {state.klass} with {state.subjects.length} subject
        {state.subjects.length > 1 ? 's' : ''} and {state.hours}h a day. Next, a short placement
        check to see where you should start.
      </Text>
    </Animated.View>
  );
}

export default function OnboardingFlow({ navigation }: RootScreenProps<'Onboarding'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { saveClassAndSubjects, setDailyGoal } = usePreferences();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OnboardingState>({
    klass: 'SS1',
    subjects: getSubjects().map((s) => s.id),
    hours: 1,
  });

  const isDone = step > TOTAL_STEPS;

  const canProceed = () => {
    if (step === 1) return state.subjects.length > 0;
    return true;
  };

  const handlePrimary = () => {
    if (isDone) {
      saveClassAndSubjects(state.klass, state.subjects);
      setDailyGoal(`${state.hours} hour${state.hours === 1 ? '' : 's'} a day`);
      navigation.replace('PlacementTest');
      return;
    }
    setStep((s) => s + 1);
  };

  const primaryLabel = isDone ? 'Start placement check' : step === TOTAL_STEPS ? 'Finish' : 'Next';

  return (
    <View style={styles.screen}>
      <View
        style={[styles.body, { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        {!isDone && (
          <>
            <View style={styles.header}>
              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>
                  STEP {step} OF {TOTAL_STEPS}
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
                <Text style={styles.skip}>Skip</Text>
              </Pressable>
            </View>

            <ProgressBar progress={Math.round((step / TOTAL_STEPS) * 100)} />
          </>
        )}

        {isDone ? (
          <SuccessBody state={state} />
        ) : (
          <StepBody step={step} state={state} setState={setState} />
        )}

        <View style={styles.footer}>
          <PrimaryButton
            title={primaryLabel}
            icon={isDone ? <ArrowRightIcon size={18} color={colors.onPrimary} /> : undefined}
            onPress={handlePrimary}
            disabled={!isDone && !canProceed()}
          />
        </View>
      </View>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  body: { flex: 1, paddingHorizontal: 20, gap: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  stepPillText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12.1023,
    color: colors.primary,
  },
  skip: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 15.733, color: colors.slate },

  section: { gap: 12 },
  block: { gap: 10 },
  title: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 32.2, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21.75, color: colors.slate },
  label: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 15.733, color: colors.ink },
  hint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 14.5227, color: colors.slate },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  classRow: { flexDirection: 'row', gap: 10 },
  classOption: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  classText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 15.733, color: colors.slate },
  classTextActive: { color: colors.onPrimary },

  subjectList: { gap: 10 },
  subjectOption: {
    height: 66,
    borderRadius: radius.lg,
    borderWidth: 2,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  subjectBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectBadgeText: { fontFamily: fonts.bold, fontSize: 22 },
  subjectName: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 18.1534,
    color: colors.ink,
  },
  checkDot: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDotEmpty: { borderWidth: 1.5, borderColor: colors.border },

  hoursWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hourChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  hourChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  hourText: { fontFamily: fonts.regular, fontSize: 13, color: colors.slate },
  hourTextActive: { color: colors.onPrimary },

  quizBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  quizBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 12.1023,
    color: colors.primary,
  },

  options: { gap: 10, marginTop: 4 },
  option: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionWrong: { borderColor: colors.danger, borderWidth: 2, backgroundColor: colors.surface },
  optionText: { fontFamily: fonts.regular, fontSize: 15, color: colors.slate },
  optionTextSelected: { color: colors.onPrimary },
  optionTextWrong: { color: colors.danger, fontFamily: fonts.medium },

  success: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  successMark: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  successTitle: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 32.2, color: colors.ink },

  footer: { marginTop: 'auto' },
  pressed: { opacity: 0.85 },
});