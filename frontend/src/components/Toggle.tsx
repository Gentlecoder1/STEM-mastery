import { useEffect, useRef } from 'react';
import { Animated, Pressable, type GestureResponderEvent } from 'react-native';
import { useThemedStyles } from '../themeContext';

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean, event?: GestureResponderEvent) => void;
  label?: string;
};

const KNOB_TRAVEL = 18;

export default function Toggle({ value, onValueChange, label }: ToggleProps) {
  const styles = useThemedStyles((c) => ({
    track: {
      width: 46,
      height: 28,
      borderRadius: 999,
      backgroundColor: c.border,
      padding: 2,
      justifyContent: 'center',
    },
    trackFill: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      borderRadius: 999,
      backgroundColor: c.primary,
    },
    knob: {
      width: 24,
      height: 24,
      borderRadius: 999,
      backgroundColor: c.surface,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
  }));

  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      friction: 9,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  const knobTranslate = anim.interpolate({ inputRange: [0, 1], outputRange: [0, KNOB_TRAVEL] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      hitSlop={8}
      onPress={(event) => onValueChange(!value, event)}
      style={styles.track}
    >
      <Animated.View style={[styles.trackFill, { opacity: anim }]} pointerEvents="none" />
      <Animated.View style={[styles.knob, { transform: [{ translateX: knobTranslate }] }]} />
    </Pressable>
  );
}
