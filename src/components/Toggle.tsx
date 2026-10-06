import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
};

export default function Toggle({ value, onValueChange, label }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={[styles.track, value && styles.trackOn]}
    >
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 46,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: colors.primary,
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.surface,
    shadowColor: '#20294A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
});
