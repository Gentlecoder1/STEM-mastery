import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import {
  SearchIcon,
  MedalIcon,
  AtomIcon,
  SigmaIcon,
  FlaskIcon,
  CalendarIcon,
} from '../components/glyphs';
import { colors, fonts, shadow } from '../theme';

const SUBJECTS = [
  {
    name: 'Physics',
    icon: AtomIcon,
    tint: '#2979FF',
    badge: '#E8F1FF',
    card: '#E8F1FF',
    border: '#2979FF',
    borderWidth: 2,
    detail: '4 of 8 topics active',
    mastery: 68,
    action: 'CONTINUE',
  },
  {
    name: 'Mathematics',
    icon: SigmaIcon,
    tint: '#00A887',
    badge: '#DFF8F1',
    card: colors.surface,
    border: colors.border,
    borderWidth: 1,
    detail: '6 of 10 topics active',
    mastery: 74,
  },
  {
    name: 'Chemistry',
    icon: FlaskIcon,
    tint: '#9A54E8',
    badge: '#F2E9FC',
    card: colors.surface,
    border: colors.border,
    borderWidth: 1,
    detail: '3 of 9 topics active',
    mastery: 55,
  },
];

function SubjectCard({ subject }) {
  const Icon = subject.icon;
  const active = Boolean(subject.action);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: subject.card,
          borderColor: subject.border,
          borderWidth: subject.borderWidth,
        },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: subject.badge }]}>
        <Icon size={25} color={subject.tint} />
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={styles.cardName}>{subject.name}</Text>
          {active ? (
            <View style={styles.actionPill}>
              <Text style={[styles.actionLabel, { color: subject.tint }]}>
                {subject.action}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.detail}>{subject.detail}</Text>

        <View style={styles.masteryRow}>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${subject.mastery}%`, backgroundColor: subject.tint },
              ]}
            />
          </View>
          <Text style={[styles.masteryValue, { color: subject.tint }]}>
            {subject.mastery}%
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function SubjectsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Subjects</Text>
            <Text style={styles.headerSubtitle}>SS1 • Your learning library</Text>
          </View>
          <Pressable style={styles.headerAction}>
            <SearchIcon size={20} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summary}>
            <View style={styles.summaryIcon}>
              <MedalIcon size={26} color={colors.inkDeep} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryTitle}>Strong week, Iseoluwa!</Text>
              <Text style={styles.summaryText}>You improved Physics mastery by 6%.</Text>
            </View>
          </View>

          {SUBJECTS.map((s) => (
            <SubjectCard key={s.name} subject={s} />
          ))}

          <View style={styles.challenge}>
            <CalendarIcon size={24} color="#FF9F1C" />
            <View style={styles.challengeCopy}>
              <Text style={styles.challengeTitle}>Friday STEM challenge</Text>
              <Text style={styles.challengeText}>Unlocks after one more lesson</Text>
            </View>
            <View style={styles.challengePill}>
              <Text style={styles.challengeLabel}>1 LEFT</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <BottomNav
        active="Subjects"
        onSelect={(k) => k === 'Home' && navigation.navigate('Home')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  body: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: fonts.regular,
    fontSize: 22,
    lineHeight: 25,
    color: colors.ink,
  },
  headerSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.slate,
  },
  headerAction: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  scroll: {
    paddingHorizontal: 18,
    gap: 14,
  },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    ...shadow.frame,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.yellow,
  },
  summaryCopy: {
    flex: 1,
    gap: 3,
  },
  summaryTitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: colors.ink,
  },
  summaryText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.slate,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    ...shadow.frame,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 21,
    color: colors.ink,
  },
  actionPill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  actionLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
  },
  detail: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 15,
    color: colors.slate,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  masteryValue: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
  },

  challenge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengeCopy: {
    flex: 1,
    gap: 3,
  },
  challengeTitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: colors.ink,
  },
  challengeText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.slate,
  },
  challengePill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0D8',
  },
  challengeLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
    color: '#FF9F1C',
  },
});