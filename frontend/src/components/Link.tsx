import { Pressable, StyleSheet, Text } from 'react-native';
import { fonts } from '../theme';
import { useThemedStyles } from '../themeContext';
import type { ThemeColors } from '../theme';

type LinkProps = {
  text: string;
  action?: string;
  onPress?: () => void;
  bold?: boolean;
};

export default function Link({ text, action, onPress, bold = false }: LinkProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <Text style={styles.text}>
        {text}
        {action ? (
          <Text style={[styles.action, bold && styles.actionBold]}>{' ' + action}</Text>
        ) : null}
      </Text>
    </Pressable>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  wrap: { alignItems: 'center' },
  text: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 14.5227, color: c.slate },
  action: { fontFamily: fonts.bold, color: c.primary },
  actionBold: { fontFamily: fonts.extrabold },
  pressed: { opacity: 0.6 },
});