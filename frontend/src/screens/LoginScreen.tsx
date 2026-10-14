import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { PrimaryButton } from '../components/Form';
import Link from '../components/Link';
import { GoogleButton } from '../components/SocialButtons';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles } from '../themeContext';
import { useAuth } from '../auth/AuthContext';
import { emailError } from '../lib/validation';

export default function LoginScreen({ navigation }: RootScreenProps<'Login'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailProblem = email.length > 0 ? emailError(email) : null;

  const handleLogin = async () => {
    const problem = emailError(email);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setBusy(false);
    }
    // On success the auth state changes and the route guard takes over.
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingTop: insets.top + 42, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.top}>
          <Text style={styles.title}>Log in</Text>
          <Text style={styles.subtitle}>Enter your email and password to log in.</Text>
        </View>

        <View style={styles.middle}>
          <GoogleButton title="Sign in with Google" onPress={() => {}} />

          <View style={styles.orWrap}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.slate}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
            {emailProblem ? <Text style={styles.fieldError}>{emailProblem}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={colors.slate}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title={busy ? 'Logging in…' : 'Log in'}
            onPress={handleLogin}
            disabled={!email || !password || Boolean(emailProblem) || busy}
          />
          <View style={styles.linkWrap}>
            <Link text="New to Masterly?" action="Sign up" bold onPress={() => navigation.navigate('SignUp')} />
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' },
  top: { gap: 8 },
  title: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 32.2, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21.75, color: colors.slate },
  middle: { gap: 14 },
  orWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate },
  field: { gap: 6 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 15.733, color: colors.ink },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 18.1534,
    color: colors.ink,
  },
  error: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.danger },
  fieldError: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.danger },
  actions: { gap: 10 },
  linkWrap: { alignItems: 'center' },
});
