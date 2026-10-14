import { forwardRef } from 'react';
import {
  TextInput,
  type NativeSyntheticEvent,
  type TargetedEvent,
  type TextInputProps,
} from 'react-native';

import { useKeyboardScroll } from './KeyboardAwareScrollView';

/**
 * Drop-in TextInput that reports focus to the nearest `KeyboardAwareScrollView`
 * so the field is scrolled above the keyboard automatically.
 */
export const TextField = forwardRef<TextInput, TextInputProps>(function TextField(
  { onFocus, ...rest },
  ref,
) {
  const { scrollToInput } = useKeyboardScroll();

  return (
    <TextInput
      ref={ref}
      {...rest}
      onFocus={(event: NativeSyntheticEvent<TargetedEvent>) => {
        scrollToInput(event.nativeEvent.target);
        onFocus?.(event);
      }}
    />
  );
});
