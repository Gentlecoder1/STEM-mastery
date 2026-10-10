import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { useThemedStyles } from '../themeContext';

const SIZE = 44;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const DURATION = 750;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type MasteryRingProps = {
  percent: number;
  color: string;
  size?: number;
  labelColor?: string;
};

export default function MasteryRing({ percent, color, size = SIZE, labelColor = colors.ink }: MasteryRingProps) {
  const styles = useThemedStyles(createStyles);
  const scale = size / SIZE;
  const clamped = Math.min(100, Math.max(0, percent));
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(value, {
      toValue: clamped,
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, value]);

  const dashOffset = value.interpolate({ inputRange: [0, 100], outputRange: [C, 0] });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 44 44">
        <Circle cx={22} cy={22} r={R} stroke={colors.border} strokeWidth={STROKE} fill="none" />
        <AnimatedCircle
          cx={22}
          cy={22}
          r={R}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C} ${C}`}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 22 22)"
        />
      </Svg>
      <Text style={[styles.value, { fontSize: 10 * scale, lineHeight: 12 * scale, color: labelColor }]}>
        {percent}%
      </Text>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  value: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: fonts.extrabold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.ink,
  },
});
