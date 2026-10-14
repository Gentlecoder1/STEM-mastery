import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { PrimaryButton } from '../components/Form';
import Link from '../components/Link';
import { MailIcon } from '../components/icons';
import type { RootStackParamList } from '../navigation/types';
import { useThemedStyles } from '../themeContext';
import { useAuth } from '../auth/AuthContext';

export default function VerifyEmailScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { resendSignupOtp } = useAuth();
  const { email = '' } = route.params ?? {};
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleResend = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: resendError } = await resendSignupOtp(email);
    setBusy(false);
    if (resendError) {
      setError(resendError);
      return;
    }
    setNotice(`We sent a new confirmation link to ${email}.`);
  };

  return (
    <View style={styles.screen}>
      <View
        style={[
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
            We sent a confirmation link to {email || 'your email'}. Open it to activate your account,
            then come back and log in.
          </Text>
        </View>

        <View style={styles.feedback}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title={busy ? 'Sending…' : 'Resend link'}
            onPress={handleResend}
            disabled={busy || !email}
          />
          <View style={styles.linkWrap}>
            <Link
              text="Already confirmed?"
              action="Log in"
              bold
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </View>
      </View>
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
  feedback: { gap: 6, alignItems: 'center' },
  error: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.danger, textAlign: 'center' },
  notice: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.green, textAlign: 'center' },
  actions: { gap: 10 },
  linkWrap: { alignItems: 'center' },
});
