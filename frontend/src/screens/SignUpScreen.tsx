import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { PrimaryButton } from '../components/Form';
import Link from '../components/Link';
import { GoogleButton } from '../components/SocialButtons';
import { EyeIcon, EyeOffIcon } from '../components/icons';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { TextField } from '../components/TextField';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles } from '../themeContext';
import { useAuth } from '../auth/AuthContext';
import { emailError } from '../lib/validation';

export default function SignUpScreen({ navigation }: RootScreenProps<'SignUp'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailProblem = email.length > 0 ? emailError(email) : null;

  const handleSignUp = async () => {
    const problem = emailError(email);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    const { error: signUpError, needsVerification } = await signUp({ email, password, fullName });
    if (signUpError) {
      setError(signUpError);
      setBusy(false);
      return;
    }
    if (needsVerification) {
      setBusy(false);
      navigation.navigate('VerifyEmail', { email });
    }
    // If verification is not required the auth state changes and the guard takes over.
  };

  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 42, paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <View style={styles.top}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Tell us your name and email to get started.</Text>
        </View>

        <View style={styles.middle}>
          <GoogleButton title="Sign up with Google" onPress={() => {}} />

          <View style={styles.orWrap}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>
              <TextField
                style={styles.input}
                placeholder="e.g. Iseoluwa Adebayo"
                placeholderTextColor={colors.slate}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                editable={!busy}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <TextField
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
              <View style={styles.inputWrap}>
                <TextField
                  style={[styles.input, styles.passwordInput]}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.slate}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((current) => !current)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeOffIcon size={20} color={colors.slate} />
                  ) : (
                    <EyeIcon size={20} color={colors.slate} />
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title={busy ? 'Creating account…' : 'Create account'}
            onPress={handleSignUp}
            disabled={!fullName || !email || password.length < 6 || Boolean(emailProblem) || busy}
          />
          <View style={styles.linkWrap}>
            <Link text="Already have an account?" action="Log in" bold onPress={() => navigation.navigate('Login')} />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, paddingHorizontal: 20, justifyContent: 'space-between' },
  top: { gap: 8 },
  title: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 32.2, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21.75, color: colors.slate },
  middle: { gap: 14 },
  orWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate },
  fields: { gap: 14 },
  field: { gap: 6 },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 46 },
  eyeButton: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
