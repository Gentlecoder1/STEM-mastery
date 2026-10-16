import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, lightColors, shadow } from '../theme';
import { useThemedStyles } from '../themeContext';

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

/**
 * Inline, user-visible banner for catalog/API failures. Surfacing the backend
 * message (e.g. a 503 "Curriculum database is not configured.") makes missing
 * or unreachable services obvious instead of silently showing empty screens.
 */
export default function CatalogNotice({
  title = 'Lessons unavailable',
  message,
  onRetry,
  retryLabel = 'Retry',
}: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card} accessibilityRole="alert">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry} accessibilityRole="button">
          <Text style={styles.buttonText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    card: {
      padding: 16,
      gap: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.orange,
      backgroundColor: colors.orangeSoft,
      ...shadow.frame,
    },
    title: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
    message: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.slate },
    button: {
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.orange,
    },
    buttonText: { fontFamily: fonts.bold, fontSize: 12, color: lightColors.surface },
  });
