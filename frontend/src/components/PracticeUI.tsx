import { Animated, Easing, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, shadow } from '../theme';
import { useThemedStyles } from '../themeContext';
import type { ThemeColors } from '../theme';
import { useEffect, useRef, type ReactNode } from 'react';
import { Children } from 'react';

type PillProps = {
  children: ReactNode;
  bg: string;
  tint: string;
  size?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

export function Pill({ children, bg, tint, size = 10, gap = 5, style }: PillProps) {
  const styles = useThemedStyles(createStyles);
  const parts = Children.toArray(children);
  const isText = parts.length > 0 && parts.every((part) => typeof part === 'string' || typeof part === 'number');
  return (
    <View style={[styles.pill, { backgroundColor: bg, gap, paddingHorizontal: 10, paddingVertical: 6 }, style]}>
      {isText ? (
        <Text style={[styles.pillText, { color: tint, fontSize: size }]}>{parts}</Text>
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
  const styles = useThemedStyles(createStyles);
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
  const styles = useThemedStyles(createStyles);
  const value = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    Animated.timing(value, {
      toValue: clamped,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, value]);

  const width = value.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[styles.track, { backgroundColor: track }, style]}>
      <Animated.View style={[styles.fill, { backgroundColor: fill, width }]} />
    </Animated.View>
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
  const styles = useThemedStyles(createStyles);
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
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
    color: c.ink,
  },
  sectionAction: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 17,
    color: c.primary,
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
    color: c.onPrimary,
  },
});