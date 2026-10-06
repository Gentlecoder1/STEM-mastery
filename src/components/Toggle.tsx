import { Pressable, View } from 'react-native';
import { useThemedStyles } from '../themeContext';

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
};

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
    trackOn: {
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
    knobOn: {
      alignSelf: 'flex-end',
    },
  }));

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
