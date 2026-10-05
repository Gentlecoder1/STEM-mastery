import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '../theme';
import { AtomIcon, TelescopeIcon, MailIcon } from '../components/icons';
import type { RootScreenProps } from '../navigation/types';

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.mark}>
        <AtomIcon size={27} color={colors.inkDeep} />
      </View>
      <Text style={styles.brandName}>Masterly</Text>
    </View>
  );
}

function LearningIllustration() {
  return (
    <View style={styles.illustration}>
      <View style={styles.orbit} />
      <View style={styles.planet} />
      <View style={styles.spark} />
      <View style={styles.mascot}>
        <TelescopeIcon size={63} color={colors.blue} />
        <Text style={styles.mascotCaption}>Let’s explore!</Text>
      </View>
    </View>
  );
}

function Hero() {
  return (
    <View style={styles.hero}>
      <LearningIllustration />
      <Text style={styles.headline}>STEM mastery,{'\n'}one win at a time.</Text>
      <Text style={styles.description}>
        Adaptive lessons, practice and feedback built for Nigerian secondary school.
      </Text>
    </View>
  );
}

export default function SplashScreen({ navigation }: RootScreenProps<'Splash'>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingTop: insets.top + 42, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Brand />

        <View style={styles.middle}>
          <Hero />
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <MailIcon size={19} color={colors.primary} />
            <Text style={styles.continueLabel}>Continue to sign up</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.accountPrompt, pressed && styles.pressedText]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.accountPromptText, { fontFamily: fonts.bold }]}>Already learning? Log in</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  mark: {
    width: 45.5,
    height: 45.5,
    borderRadius: radius.md,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: fonts.regular,
    fontSize: 22,
    lineHeight: 26.625,
    color: colors.onPrimary,
  },

  middle: {
    width: '100%',
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    gap: 18,
  },

  illustration: {
    width: 230,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbit: {
    position: 'absolute',
    left: 15,
    top: 5,
    width: 200,
    height: 178,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.33)',
  },
  planet: {
    position: 'absolute',
    left: 26,
    top: 34,
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: colors.teal,
  },
  spark: {
    position: 'absolute',
    right: 34,
    top: 30,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.yellow,
  },
  mascot: {
    width: 138.73,
    height: 138.73,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...shadow.card,
  },
  mascotCaption: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    lineHeight: 14.5227,
    color: colors.primary,
  },

  headline: {
    width: '100%',
    fontFamily: fonts.regular,
    fontSize: 34,
    lineHeight: 36.72,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  description: {
    width: '86%',
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 21.75,
    color: colors.onPrimaryMuted,
    textAlign: 'center',
  },

  actions: {
    width: '100%',
    gap: 10,
  },
  continueBtn: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadow.card,
  },
  continueLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 18.1534,
    color: colors.primary,
  },
  accountPrompt: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  accountPromptText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 14.5227,
    color: colors.onPrimaryMuted,
  },
  pressed: { opacity: 0.85 },
  pressedText: { opacity: 0.6 },
});
