import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, shadow } from '../theme';
import type { ReactNode } from 'react';

type PillProps = {
  children: ReactNode;
  bg: string;
  tint: string;
  size?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

export function Pill({ children, bg, tint, size = 10, gap = 5, style }: PillProps) {
  const isText = typeof children === 'string';
  return (
    <View style={[styles.pill, { backgroundColor: bg, gap, paddingHorizontal: 10, paddingVertical: 6 }, style]}>
      {isText ? (
        <Text style={[styles.pillText, { color: tint, fontSize: size }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

type SectionHeadingProps = {
  title: string;
  action?: string;
  onAction?: () => void;
};

export function SectionHeading({ title, action, onAction }: SectionHeadingProps) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type ProgressBarProps = {
  progress: number;
  track?: string;
  fill?: string;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({ progress, track = colors.border, fill = colors.primary, style }: ProgressBarProps) {
  return (
    <View style={[styles.track, { backgroundColor: track }, style]}>
      <View
        style={[
          styles.fill,
          { backgroundColor: fill, width: `${Math.max(0, Math.min(100, progress))}%` },
        ]}
      />
    </View>
  );
}

type ButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  bg?: string;
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ActionButton({
  children,
  onPress,
  disabled,
  bg = colors.primary,
  leading,
  style,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        disabled && styles.buttonDisabled,
        style,
        pressed && styles.buttonPressed,
      ]}
    >
      {leading ? <View style={styles.buttonLeading}>{leading}</View> : null}
      <Text style={styles.buttonText}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 21,
    color: colors.ink,
  },
  sectionAction: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 17,
    color: colors.primary,
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  button: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.card,
  },
  buttonLeading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 18,
    color: colors.surface,
  },
});