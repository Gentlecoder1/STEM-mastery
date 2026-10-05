import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme';
import { GoogleIcon } from './GoogleIcon';

type GoogleButtonProps = {
  title?: string;
  onPress?: () => void;
};

export function GoogleButton({ title = 'Sign up with Google', onPress }: GoogleButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
    >
      <GoogleIcon size={18} />
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadow.card,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 18.1534,
    color: colors.ink,
  },
  pressed: { opacity: 0.85 },
});