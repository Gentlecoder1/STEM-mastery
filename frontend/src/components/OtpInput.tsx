import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, radius } from '../theme';
import { useThemedStyles } from '../themeContext';

type OtpInputProps = {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
};

/**
 * Segmented one-time-code input: a row of boxes backed by a single hidden
 * TextInput (so OS autofill and paste work), with the active box highlighted.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const styles = useThemedStyles(createStyles);
  const digits = value.split('');

  return (
    <Pressable
      style={styles.row}
      onPress={() => inputRef.current?.focus()}
      accessibilityRole="button"
      accessibilityLabel="Verification code"
    >
      {Array.from({ length }).map((_, index) => {
        const filled = index < digits.length;
        const active = !disabled && index === digits.length;
        return (
          <View
            key={index}
            style={[styles.box, active && styles.boxActive, filled && styles.boxFilled]}
          >
            {filled ? <Text style={styles.digit}>{digits[index]}</Text> : null}
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        style={styles.hidden}
        value={value}
        onChangeText={(next) => onChange(next.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        editable={!disabled}
        autoFocus={autoFocus}
        caretHidden
        selectionColor="transparent"
      />
    </Pressable>
  );
}

const createStyles = () => StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'space-between',
  },
  box: {
    flex: 1,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: colors.primary,
  },
  boxFilled: {
    borderColor: colors.primary,
  },
  digit: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.ink,
  },
  hidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
  },
});
