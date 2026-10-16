import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { SparklesIcon } from './icons';
import { colors, fonts, shadow } from '../theme';
import { useThemedStyles } from '../themeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
};

/**
 * Spring-animated dialog used to explain that a subject's curriculum is not
 * available yet. Kept generic so other "coming soon" affordances can reuse it.
 */
export default function ComingSoonModal({
  visible,
  onClose,
  title = 'Curriculum unavailable',
  message = 'This subject is coming soon. We are still connecting its lessons.',
  confirmLabel = 'Got it',
}: Props) {
  const styles = useThemedStyles(createStyles);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.8);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, scale]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <Animated.View
          style={[styles.card, { opacity, transform: [{ scale }] }]}
          accessibilityRole="alert"
        >
          <View style={styles.iconWrap}>
            <SparklesIcon size={30} color={colors.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable
            style={styles.button}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
          >
            <Text style={styles.buttonText}>{confirmLabel}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = () =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      backgroundColor: 'rgba(15,18,35,0.55)',
    },
    card: {
      width: '100%',
      maxWidth: 340,
      alignItems: 'center',
      gap: 10,
      padding: 24,
      borderRadius: 24,
      backgroundColor: colors.surface,
      ...shadow.card,
    },
    iconWrap: {
      width: 62,
      height: 62,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
      marginBottom: 2,
    },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 18,
      lineHeight: 23,
      textAlign: 'center',
      color: colors.ink,
    },
    message: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      color: colors.slate,
    },
    button: {
      marginTop: 8,
      height: 48,
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.onPrimary,
    },
  });
