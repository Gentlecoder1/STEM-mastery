import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
} from '../components/icons';
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

const TYPE_BADGE: Record<ContentType, ColorToken> = {
  DEFINITION: 'blueSoft',
  EXPLANATION: 'primarySoft',
  FORMULA: 'canvas',
  WORKED_EXAMPLE: 'greenSoft',
  MEDIA: 'violetSoft',
  QUESTION: 'primarySoft',
};

function MediaBlock({ item }: { item: LearningContent }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.mediaFrame}>
      <View style={styles.mediaPlaceholder}>
        <Text style={styles.mediaGlyph}>⌁</Text>
        <Text style={styles.mediaLabel}>{item.mediaURI ?? 'No media attached'}</Text>
      </View>
      <Text style={styles.mediaCaption}>
        Diagram viewer placeholder — swap for your player or image component once mediaURI
        resolves.
      </Text>
    </View>
  );
}

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

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View
          style={[styles.badge, { backgroundColor: colors[TYPE_BADGE[item.contentType]] }]}
        >
          <Text style={[styles.badgeText, { color: tint }]}>
            {CONTENT_LABELS[item.contentType].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.cardStep}>{item.chapterOrder}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>

      {item.contentType === 'FORMULA' ? (
        <FormulaBlock text={item.contentText} />
      ) : (
        <Text style={styles.cardBody}>{item.contentText}</Text>
      )}

      {item.contentType === 'MEDIA' ? <MediaBlock item={item} /> : null}

      {item.contentType === 'WORKED_EXAMPLE' ? (
        <View style={styles.stepRow}>
          <ClockIcon size={14} color={colors.teal} />
          <Text style={styles.stepText}>Work through each step before moving on.</Text>
        </View>
      ) : null}

      {item.contentType === 'QUESTION' ? (
        <View style={styles.questionPrompt}>
          <Text style={styles.questionText}>Think about it, then reveal your answer.</Text>
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

  const [index, setIndex] = useState(route.params.startAt ?? 0);
  const total = items.length;
  const current = items[index];
  const isLast = index === total - 1;
  const progress = total === 0 ? 0 : ((index + 1) / total) * 100;

  if (!concept || !current) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>No learning content available.</Text>
      </View>
    );
  }

  const goNext = () => {
    if (isLast) {
      navigation.navigate('ConceptDetails', { conceptId });
      return;
    }
    setIndex((value) => value + 1);
  };

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close lesson"
        >
          <ArrowLeftIcon size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{concept.title}</Text>
          <Text style={styles.headerCounter}>
            {index + 1} of {total}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 104 },
        ]}
      >
        <ContentCard item={current} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={index === 0}
          accessibilityRole="button"
        >
          <Text style={[styles.secondaryText, index === 0 && styles.secondaryDisabled]}>
            Back
          </Text>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={goNext}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>{isLast ? 'Finish' : 'Next'}</Text>
          {isLast ? (
            <CheckCircleIcon size={18} color={colors.surface} />
          ) : (
            <ArrowRightIcon size={18} color={colors.surface} />
          )}
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
  headerTitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: colors.ink },
  headerCounter: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 12, color: colors.slate },

  progressTrack: {
    height: 10,
    marginHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.primary },

  scroll: { paddingHorizontal: 18, paddingTop: 18 },

  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 12,
    ...shadow.frame,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { height: 25, paddingHorizontal: 10, borderRadius: 999, justifyContent: 'center' },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12 },
  cardStep: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15, color: colors.slate },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: colors.ink },
  cardBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.ink },

  formula: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.border,
    alignItems: 'center',
  },
  formulaText: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, color: colors.ink },

  mediaFrame: { gap: 8 },
  mediaPlaceholder: {
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mediaGlyph: { fontFamily: fonts.regular, fontSize: 24, color: colors.violet },
  mediaLabel: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, color: colors.violet },
  mediaCaption: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.slate },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  stepText: { flex: 1, fontFamily: fonts.medium, fontSize: 12, lineHeight: 15, color: colors.teal },

  questionPrompt: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  questionText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.ink },

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
  secondaryDisabled: { color: colors.slate },
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
  primaryText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 18, color: colors.surface },
});