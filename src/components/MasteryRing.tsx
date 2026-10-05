import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../theme';

const SIZE = 44;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

type MasteryRingProps = {
  percent: number;
  color: string;
  size?: number;
};

export default function MasteryRing({ percent, color, size = SIZE }: MasteryRingProps) {
  const scale = size / SIZE;
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 44 44">
        <Circle cx={22} cy={22} r={R} stroke={colors.border} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={22}
          cy={22}
          r={R}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(C * clamped) / 100} ${C}`}
          transform="rotate(-90 22 22)"
        />
      </Svg>
      <Text style={[styles.value, { fontSize: 10 * scale, lineHeight: 12 * scale }]}>
        {percent}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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