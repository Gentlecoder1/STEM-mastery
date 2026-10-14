import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, shadow, type ThemeColors } from '../theme';
import { useThemedStyles } from '../themeContext';

type DrawerItem = {
  title: string;
  body: string;
};

type BottomSheetDrawerProps = {
  visible: boolean;
  title: string;
  description: string;
  items: readonly DrawerItem[];
  children?: ReactNode;
  onClose: () => void;
};

export default function BottomSheetDrawer({
  visible,
  title,
  description,
  items,
  children,
  onClose,
}: BottomSheetDrawerProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.dismissArea} onPress={onClose} accessibilityLabel="Close drawer" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
            <View style={styles.handle} />
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            {children ?? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.items}>
                {items.map((item) => (
                  <View key={item.title} style={styles.item}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemBody}>{item.body}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  fill: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 14, 30, 0.42)',
  },
  dismissArea: { flex: 1 },
  sheet: {
    maxHeight: '78%',
    paddingTop: 10,
    paddingHorizontal: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: c.canvas,
    ...shadow.card,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: c.border,
    marginBottom: 16,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleCopy: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 27, color: c.ink },
  description: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.slate },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  closeText: { fontFamily: fonts.regular, fontSize: 24, lineHeight: 26, color: c.ink },
  items: { gap: 10, paddingTop: 18, paddingBottom: 8 },
  item: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    gap: 4,
  },
  itemTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18, color: c.ink },
  itemBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.slate },
});
