import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from 'react-native';

type KeyboardScrollContextValue = {
  /** Scrolls the given native node handle fully above the keyboard. */
  scrollToInput: (nodeHandle: number | null | undefined) => void;
};

const KeyboardScrollContext = createContext<KeyboardScrollContextValue>({
  scrollToInput: () => {},
});

export function useKeyboardScroll(): KeyboardScrollContextValue {
  return useContext(KeyboardScrollContext);
}

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  children: ReactNode;
  keyboardVerticalOffset?: number;
};

/**
 * A ScrollView that keeps the focused input visible above the keyboard.
 * Works on Android and iOS without native modules: it uses the built-in
 * `scrollResponderScrollNativeHandleToKeyboard` on the scroll view.
 * Pair it with `<TextField>` so inputs report their focus automatically.
 */
export function KeyboardAwareScrollView({
  children,
  keyboardVerticalOffset = 0,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag',
  showsVerticalScrollIndicator = false,
  contentContainerStyle,
  ...rest
}: KeyboardAwareScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const focusedInput = useRef<number | null>(null);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      const nodeHandle = focusedInput.current;
      if (nodeHandle == null) return;
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(nodeHandle, 28, true);
    });
    return () => subscription.remove();
  }, []);

  const scrollToInput = useCallback((nodeHandle: number | null | undefined) => {
    if (nodeHandle == null) return;
    focusedInput.current = nodeHandle;
    scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(nodeHandle, 28, true);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <KeyboardScrollContext.Provider value={{ scrollToInput }}>
        <ScrollView
          ref={scrollRef}
          style={styles.fill}
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          keyboardDismissMode={keyboardDismissMode}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          {...rest}
        >
          {children}
        </ScrollView>
      </KeyboardScrollContext.Provider>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
