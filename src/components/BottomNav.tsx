import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  HouseIcon,
  BookOpenIcon,
  DumbbellIcon,
  ChartIcon,
  UserIcon,
} from './glyphs';
import { colors, fonts } from '../theme';
import type { TabKey } from '../navigation/types';
import type { IconProps } from './icons';

export type Tab = {
  key: TabKey;
  label: string;
  Icon: (props: IconProps) => React.JSX.Element;
};

export const TABS: readonly Tab[] = [
  { key: 'Home', label: 'Home', Icon: HouseIcon },
  { key: 'Subjects', label: 'Learn', Icon: BookOpenIcon },
  { key: 'Practice', label: 'Practice', Icon: DumbbellIcon },
  { key: 'Progress', label: 'Progress', Icon: ChartIcon },
  { key: 'Profile', label: 'Profile', Icon: UserIcon },
];

type BottomNavProps = {
  active: TabKey;
  onSelect?: (key: TabKey) => void;
};

export default function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <View style={styles.bar}>
      {TABS.map(({ key, label, Icon }) => {
        const on = key === active;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onSelect?.(key)}
            style={[styles.item, on && styles.itemActive]}
          >
            <Icon size={20} color={on ? colors.primary : colors.slate} />
            <Text style={[styles.label, on && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  item: {
    width: 64,
    height: 58,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  itemActive: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
    color: colors.slate,
  },
  labelActive: {
    color: colors.primary,
  },
});