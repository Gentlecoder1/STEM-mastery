import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { PrimaryButton } from '../components/Form';
import Link from '../components/Link';
import { GoogleButton } from '../components/SocialButtons';

export default function SignUpScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingTop: insets.top + 42, paddingBottom: Math.max(insets.bottom, 24) }]}>
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
              <TextInput
                style={styles.input}
                placeholder="e.g. Iseoluwa Adebayo"
                placeholderTextColor={colors.slate}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
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
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title="Create account"
            onPress={() => navigation.navigate('Home')}
            disabled={!fullName || !email}
          />
          <View style={styles.linkWrap}>
            <Link text="Already have an account?" action="Log in" bold onPress={() => navigation.navigate('Login')} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' },
  top: { gap: 8 },
  title: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 32.2, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21.75, color: colors.slate },
  middle: { gap: 14 },
  orWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate },
  fields: { gap: 14 },
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
  actions: { gap: 10 },
  linkWrap: { alignItems: 'center' },
});