import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon, ArrowRightIcon } from '../components/icons';
import { ProgressBar } from '../components/PracticeUI';
import { colors, fonts, shadow } from '../theme';
import type { ColorToken } from '../theme';
import { CONTENT_LABELS, getConceptContent, getConcept } from '../data/learning';
import type { ContentType, LearningContent } from '../data/learning';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles, useTheme } from '../themeContext';

const TYPE_TINT: Record<ContentType, ColorToken> = {
  DEFINITION: 'blue',
  EXPLANATION: 'primary',
  FORMULA: 'ink',
  WORKED_EXAMPLE: 'teal',
  MEDIA: 'violet',
  QUESTION: 'primary',
};

function FormulaBlock({ text }: { text: string }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.formula}>
      <Text style={styles.formulaText}>{text}</Text>
    </View>
  );
}

function ContentCard({ item }: { item: LearningContent }) {
  const styles = useThemedStyles(createStyles);
  const tint = colors[TYPE_TINT[item.contentType]];
  const label = CONTENT_LABELS[item.contentType];
  const repeatedTitle = item.title.toLowerCase().startsWith(label.toLowerCase());
  const title = repeatedTitle
    ? item.contentType === 'DEFINITION'
      ? 'Velocity'
      : item.contentType === 'FORMULA'
        ? 'Velocity formula'
        : null
    : item.title;

  return (
    <View style={styles.lessonSection}>
      <Text style={[styles.lessonLabel, { color: tint }]}>
        {label.toUpperCase()}
      </Text>
      {title ? <Text style={styles.lessonTitle}>{title}</Text> : null}

      {item.contentType === 'FORMULA' ? (
        <FormulaBlock text={item.contentText} />
      ) : (
        <Text style={styles.lessonBody}>{item.contentText}</Text>
      )}

      {item.contentType === 'WORKED_EXAMPLE' ? (
        <View style={styles.exampleNote}>
          <Text style={styles.exampleNoteTitle}>Worked example</Text>
          <Text style={styles.exampleNoteText}>
            Identify the known values, choose the relationship, then calculate.
          </Text>
        </View>
      ) : null}

      {item.contentType === 'MEDIA' ? (
        <View style={styles.mediaNote}>
          <Text style={styles.mediaNoteTitle}>Look for the pattern</Text>
          <Text style={styles.mediaNoteText}>
            Use the graph to connect the written explanation to the motion.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ConceptLearningScreen({
  navigation,
  route,
}: RootScreenProps<'ConceptLearning'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  const { conceptId } = route.params;

  const items = useMemo(() => getConceptContent(conceptId), [conceptId]);
  const concept = getConcept(conceptId);
  const lessonItems = items.filter((item) => item.contentType !== 'QUESTION');
  const quizItems = items.filter((item) => item.contentType === 'QUESTION');

  if (!concept || lessonItems.length === 0) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>No learning content available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.pop(2)}
          accessibilityRole="button"
          accessibilityLabel="Close lesson"
        >
          <ArrowLeftIcon size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Speed and Velocity</Text>
          <Text style={styles.headerSubtitle}>Chapter 6 • SS1 Physics</Text>
        </View>
          <Text style={styles.headerCounter}>{lessonItems.length} lessons</Text>
      </View>

      <ProgressBar progress={concept.mastery} style={styles.headerProgress} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 104 },
        ]}
      >
          {lessonItems.map((item) => <ContentCard key={item.id} item={item} />)}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>Back</Text>
        </Pressable>
        <Pressable
          style={styles.primaryButton}
          onPress={() => quizItems.length > 0
            ? navigation.navigate('ConceptQuiz', { conceptId })
            : navigation.navigate('ConceptDetails', { conceptId })}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>{quizItems.length > 0 ? 'Take quick check' : 'Back to concept'}</Text>
          <ArrowRightIcon size={18} color={colors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  missing: { alignItems: 'center', justifyContent: 'center' },
  missingText: { fontFamily: fonts.medium, fontSize: 14, color: colors.slate },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 2 },
  headerTitle: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 24, color: colors.ink },
  headerSubtitle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 15, color: colors.slate },
  headerCounter: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 12, color: colors.slate },

  headerProgress: { marginHorizontal: 18 },

  scroll: { paddingHorizontal: 18, paddingTop: 22 },

  lessonSection: { paddingBottom: 22, marginBottom: 22, gap: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  lessonLabel: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
  lessonTitle: { fontFamily: fonts.extrabold, fontSize: 25, lineHeight: 30, color: colors.ink },
  lessonBody: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25, color: colors.ink },

  formula: {
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.blueBorder,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
  },
  formulaText: { fontFamily: fonts.semibold, fontSize: 21, lineHeight: 29, color: colors.ink },
  exampleNote: { padding: 14, borderRadius: 12, backgroundColor: colors.greenSoft, gap: 4 },
  exampleNoteTitle: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15, color: colors.teal },
  exampleNoteText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.ink },
  mediaNote: { padding: 14, borderRadius: 12, backgroundColor: colors.violetSoft, gap: 4 },
  mediaNoteTitle: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15, color: colors.violet },
  mediaNoteText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.ink },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryButton: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 18, color: colors.ink },
  primaryButton: {
    flex: 1,
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    ...shadow.card,
  },
  primaryText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 18, color: colors.onPrimary },
});