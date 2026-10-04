import React from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme';
import { ArrowRightIcon } from './icons';

export function PrimaryButton({ title, onPress, disabled, icon }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon || <ArrowRightIcon size={18} color={colors.surface} />}
      <Text style={styles.buttonLabel}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
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
    color: colors.surface,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
