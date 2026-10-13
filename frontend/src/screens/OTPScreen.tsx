import { useState, useRef, useEffect, useCallback } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, lightColors, radius, shadow } from '../theme';
import { PrimaryButton } from '../components/Form';
import Link from '../components/Link';
import { CheckIcon } from '../components/icons';
import type { RootStackParamList } from '../navigation/types';
import { useThemedStyles } from '../themeContext';

const CODE_LENGTH = 6;

type Stage = 'input' | 'verifying' | 'verified';

function DotsLoader() {
  const styles = useThemedStyles(createStyles);
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  const opacityFor = (i: number) =>
    t.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange:
        i === 0 ? [0.25, 1, 1, 1, 0.25] : i === 1 ? [0.25, 0.25, 1, 1, 1] : [1, 1, 0.25, 0.25, 1],
    });

  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: opacityFor(i) }]} />
      ))}
    </View>
  );
}

export default function OTPScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'OTPScreen'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { email = '' } = route.params ?? {};
  const [code, setCode] = useState<string[]>(() => Array<string>(CODE_LENGTH).fill(''));
  const [stage, setStage] = useState<Stage>('input');
  const refs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (stage === 'input') refs.current[0]?.focus();
  }, [stage]);

  const handleChange = useCallback((txt: string, idx: number) => {
    const digits = txt.replace(/\D/g, '');
    if (!digits) {
      setCode((c) => {
        const next = [...c];
        next[idx] = '';
        return next;
      });
      return;
    }
    const chars = digits.split('');
    setCode((c) => {
      const next = [...c];
      for (let i = 0; i < chars.length && idx + i < CODE_LENGTH; i++) next[idx + i] = chars[i];
      return next;
    });
    const nextIdx = Math.min(idx + chars.length, CODE_LENGTH - 1);
    if (nextIdx < CODE_LENGTH) refs.current[nextIdx]?.focus();
  }, []);

  const handleVerify = () => {
    setStage('verifying');
    setTimeout(() => setStage('verified'), 2500);
  };

  const verified = stage === 'verified';

  return (
    <View style={styles.screen}>
      <View
        style={[styles.content, { paddingTop: insets.top + 42, paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        {verified ? (
          <View style={styles.verifiedWrap}>
            <View style={styles.verifiedMark}>
              <CheckIcon size={30} color={lightColors.surface} />
            </View>
            <Text style={styles.verifiedTitle}>Email verified</Text>
            <Text style={styles.subtitle}>
              {email || 'Your email'} is confirmed. You're all set to continue.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.top}>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to {email || 'your email'}. Enter it below.
              </Text>
            </View>

            <View style={styles.otpWrap}>
              {code.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  style={styles.otpBox}
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  value={d}
                  onChangeText={(t) => handleChange(t, i)}
                  selectionColor={colors.primary}
                  editable={stage === 'input'}
                />
              ))}
            </View>
          </>
        )}

        <View style={styles.actions}>
          {verified ? (
            <PrimaryButton title="Continue" onPress={() => navigation.navigate('Onboarding')} />
          ) : (
            <>
              <PrimaryButton
                title="Verify & continue"
                onPress={handleVerify}
                disabled={code.join('').length !== CODE_LENGTH || stage === 'verifying'}
              />
              <View style={styles.linkWrap}>
                <Link text="Didn’t receive code?" action="Resend" bold onPress={() => {}} />
              </View>
            </>
          )}
        </View>
      </View>

      {stage === 'verifying' && (
        <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
          <View style={styles.overlay}>
            <DotsLoader />
            <Text style={styles.overlayText}>Verifying your email…</Text>
          </View>
        </Modal>
      )}
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' },
  top: { gap: 8 },
  title: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 32.2, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21.75, color: colors.slate },
  otpWrap: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.ink,
  },
  actions: { gap: 10 },
  linkWrap: { alignItems: 'center' },

  verifiedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  verifiedMark: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  verifiedTitle: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 32.2, color: colors.ink },

  overlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(10, 14, 30, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  dots: { flexDirection: 'row', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 999, backgroundColor: colors.surface },
  overlayText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.onPrimaryMuted },
});