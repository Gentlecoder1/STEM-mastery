import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { darkColors, lightColors } from '../theme';
import { useTheme, useThemeReveal } from '../themeContext';

const EXPAND_DURATION = 420;
const FADE_DURATION = 180;

type Phase = 'idle' | 'expanding' | 'committing';

export default function ThemeRevealOverlay() {
  const { reveal, commitThemeReveal, clearThemeReveal } = useThemeReveal();
  const { mode } = useTheme();
  const { width, height } = useWindowDimensions();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState<Phase>('idle');

  const x = reveal ? reveal.x : 0;
  const y = reveal ? reveal.y : 0;
  const radius = reveal
    ? Math.hypot(Math.max(x, width - x), Math.max(y, height - y))
    : 0;

  useEffect(() => {
    if (!reveal || radius <= 0) return;
    let cancelled = false;

    scale.setValue(0);
    opacity.setValue(1);
    setPhase('expanding');

    const expand = Animated.timing(scale, {
      toValue: 1,
      duration: EXPAND_DURATION,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: true,
    });

    expand.start(({ finished }) => {
      if (!finished || cancelled) return;
      commitThemeReveal();
      setPhase('committing');
    });

    return () => {
      cancelled = true;
      expand.stop();
    };
  }, [reveal, radius, scale, opacity, commitThemeReveal]);

  useEffect(() => {
    if (phase !== 'committing' || !reveal) return;
    if (mode !== reveal.next) return;

    let cancelled = false;
    let frame2 = 0;
    let fade: Animated.CompositeAnimation | null = null;

    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        if (cancelled) return;
        fade = Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        });
        fade.start(({ finished }) => {
          if (finished && !cancelled) clearThemeReveal();
        });
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
      fade?.stop();
    };
  }, [phase, mode, reveal, opacity, clearThemeReveal]);

  if (!reveal) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-only">
      <Animated.View
        style={{
          position: 'absolute',
          left: x - radius,
          top: y - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          backgroundColor: reveal.next === 'dark' ? darkColors.canvas : lightColors.canvas,
          opacity,
          transform: [{ scale }],
        }}
      />
    </View>
  );
}
