import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  HouseIcon,
  BookOpenIcon,
  DumbbellIcon,
  ChartIcon,
  UserIcon,
} from './glyphs';
import { colors, fonts } from '../theme';

export const TABS = [
  { key: 'Home', label: 'Home', Icon: HouseIcon },
  { key: 'Subjects', label: 'Learn', Icon: BookOpenIcon },
  { key: 'Practice', label: 'Practice', Icon: DumbbellIcon },
  { key: 'Progress', label: 'Progress', Icon: ChartIcon },
  { key: 'Profile', label: 'Profile', Icon: UserIcon },
];

export default function BottomNav({ active, onSelect }) {
  return (
    <View style={styles.bar}>
      {TABS.map(({ key, label, Icon }) => {
        const on = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect && onSelect(key)}
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