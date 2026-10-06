import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme';
import { useThemedStyles } from '../themeContext';
import type { ThemeColors } from '../theme';
import { ArrowRightIcon } from './icons';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  icon,
  style,
}: PrimaryButtonProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon ?? <ArrowRightIcon size={18} color={colors.surface} />}
      <Text style={styles.buttonLabel}>{title}</Text>
    </Pressable>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.primary,
    backgroundColor: c.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
    ...shadow.card,
  },
  buttonLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 18.1534,
    color: c.surface,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});