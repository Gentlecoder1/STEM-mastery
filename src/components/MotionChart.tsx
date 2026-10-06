import Svg, { Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme';
import type { GraphVariant } from '../data/practice';

const W = 324;
const H = 140;

type Segment = { line: string; flat?: boolean };

const SEGMENTS_BY_VARIANT: Record<GraphVariant, Segment> = {
  flat: { line: '30 95 100 63 195 63 270 25', flat: true },
  slope: { line: '30 105 280 25' },
  curved: { line: '30 110 120 58 210 38 280 20' },
  down: { line: '30 28 280 98' },
};

type MotionChartProps = {
  variant: GraphVariant;
  highlight?: boolean;
};

export default function MotionChart({ variant, highlight = true }: MotionChartProps) {
  const { line, flat } = SEGMENTS_BY_VARIANT[variant];
  const showHighlight = highlight && flat;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Line x1={24} y1={10} x2={24} y2={120} stroke={colors.ink} strokeWidth={2} />
      <Line x1={24} y1={120} x2={298} y2={120} stroke={colors.ink} strokeWidth={2} />
      {showHighlight ? <Rect x={103} y={51} width={92} height={24} rx={8} fill="rgba(255, 216, 77, 0.26)" /> : null}
      <Polyline
        points={line}
        fill="none"
        stroke={colors.blue}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showHighlight ? (
        <SvgText
          x={149}
          y={42}
          textAnchor="middle"
          fontFamily={fonts.extrabold}
          fontSize={10}
          fill={colors.orange}
        >
          FLAT SECTION
        </SvgText>
      ) : null}
    </Svg>
  );
}