import { forwardRef } from 'react';
import {
  TextInput,
  type TextInputInstance,
  type TextInputFocusEvent,
  type TextInputProps,
} from 'react-native';

import { useKeyboardScroll } from './KeyboardAwareScrollView';

/**
 * Drop-in TextInput that reports focus to the nearest `KeyboardAwareScrollView`
 * so the field is scrolled above the keyboard automatically.
 */
export const TextField = forwardRef<TextInputInstance, TextInputProps>(function TextField(
  { onFocus, ...rest },
  ref,
) {
  const { scrollToInput } = useKeyboardScroll();

  return (
    <TextInput
      ref={ref}
      {...rest}
      onFocus={(event: TextInputFocusEvent) => {
        scrollToInput(event.nativeEvent.target);
        onFocus?.(event);
      }}
    />
  );
});
