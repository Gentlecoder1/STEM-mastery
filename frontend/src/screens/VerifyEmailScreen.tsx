import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { PrimaryButton } from '../components/Form';
import Link from '../components/Link';
import { MailIcon } from '../components/icons';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { OtpInput } from '../components/OtpInput';
import type { RootStackParamList } from '../navigation/types';
import { useThemedStyles } from '../themeContext';
import { useAuth } from '../auth/AuthContext';

const CODE_LENGTH = 8;

export default function VerifyEmailScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { verifySignupOtp, resendSignupOtp } = useAuth();
  const { email = '' } = route.params ?? {};
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (code.trim().length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code from your email.`);
      return;
    }
    setVerifying(true);
    setError(null);
    setNotice(null);
    const { error: verifyError } = await verifySignupOtp(email, code);
    if (verifyError) {
      setError(verifyError);
      setVerifying(false);
    }
    // On success the session is set and the route guard takes over.
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setNotice(null);
    const { error: resendError } = await resendSignupOtp(email);
    setResending(false);
    if (resendError) {
      setError(resendError);
      return;
    }
    setNotice(`We sent a new code to ${email}.`);
  };

  const busy = verifying || resending;

  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 42, paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <View style={styles.top}>
          <View style={styles.mailMark}>
            <MailIcon size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            Enter the {CODE_LENGTH}-digit code we sent to {email || 'your email'} to activate your
            account.
          </Text>
        </View>

        <View style={styles.middle}>
          <View style={styles.field}>
            <Text style={styles.label}>Verification code</Text>
            <OtpInput value={code} onChange={setCode} length={CODE_LENGTH} disabled={busy} />
          </View>

          <View style={styles.feedback}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title={verifying ? 'Verifying…' : 'Verify email'}
            onPress={handleVerify}
            disabled={busy || code.length !== CODE_LENGTH}
          />
          <View style={styles.linkWrap}>
            <Pressable onPress={handleResend} disabled={busy || !email} hitSlop={8}>
              <Text style={styles.resend}>
                {resending ? 'Sending…' : "Didn't get a code? Resend"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.linkWrap}>
            <Link
              text="Already confirmed?"
              action="Log in"
              bold
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' },
  top: { gap: 14, paddingTop: 24, alignItems: 'center' },
  mailMark: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 32.2, color: colors.ink },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 21.75,
    color: colors.slate,
    textAlign: 'center',
  },
  middle: { gap: 12 },
  field: { gap: 6 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 15.733, color: colors.ink },
  feedback: { gap: 6, alignItems: 'center', minHeight: 18 },
  error: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.danger, textAlign: 'center' },
  notice: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.green, textAlign: 'center' },
  actions: { gap: 10 },
  linkWrap: { alignItems: 'center' },
  resend: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 17, color: colors.primary },
});
