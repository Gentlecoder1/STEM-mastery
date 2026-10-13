import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MasteryRing from '../components/MasteryRing';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, SparklesIcon } from '../components/icons';
import { BookOpenIcon } from '../components/glyphs';
import { colors, fonts, shadow } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { useProgress } from '../progressContext';
import { CONTENT_LABELS, getConcept, getPreviousConcept } from '../data/learning';
import type { RootScreenProps } from '../navigation/types';

export default function ConceptDetailsScreen({ navigation, route }: RootScreenProps<'ConceptDetails'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { isConceptOpen, isConceptCompleted } = useProgress();
  const concept = getConcept(route.params.conceptId);

  if (!concept) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>Concept not found.</Text>
      </View>
    );
  }

  const itemCount = concept.content.length;
  const isOpen = isConceptOpen(concept.id) || isConceptCompleted(concept.id);
  const previous = getPreviousConcept(concept.id);

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeftIcon size={23} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>CONCEPT</Text>
          <Text style={styles.headerTitle}>{concept.title}</Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (!isOpen && previous ? 210 : 96) },
        ]}
      >
        <View style={styles.hero}>
          <View style={styles.heroRing}>
            <MasteryRing percent={concept.mastery} color={colors[concept.tint]} size={76} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroStatus, { color: colors[concept.tint] }]}>
              {concept.mastery === 0
                ? 'NOT STARTED'
                : concept.mastery >= 80
                  ? 'STRONG'
                  : 'IN PROGRESS'}
            </Text>
            <Text style={styles.heroTitle}>{concept.title}</Text>
            <Text style={styles.heroMeta}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} of content
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Short definition</Text>
        <View style={[styles.card, { borderLeftColor: colors[concept.tint] }]}>
          <Text style={styles.cardBody}>{concept.definition}</Text>
        </View>

        <Text style={styles.sectionTitle}>Why this matters</Text>
        <View style={styles.card}>
          <Text style={styles.cardBody}>{concept.whyItMatters}</Text>
        </View>

        <Text style={styles.sectionTitle}>Prerequisites</Text>
        <View style={styles.chipRow}>
          {concept.prerequisites.map((item) => (
            <View key={item} style={styles.chip}>
              <CheckCircleIcon size={14} color={colors.slate} />
              <Text style={styles.chipText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Related concepts</Text>
        <View style={styles.chipRow}>
          {concept.related.map((item) => (
            <View key={item} style={[styles.chip, styles.chipRelated]}>
              <Text style={[styles.chipText, styles.chipTextRelated]}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Learning content</Text>
          <Text style={styles.link}>{itemCount} items</Text>
        </View>
        <View style={styles.contentList}>
          {concept.content.map((item) => (
            <View key={item.id} style={styles.contentRow}>
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{item.chapterOrder}</Text>
              </View>
              <View style={styles.contentCopy}>
                <Text style={styles.contentTitle}>{item.title}</Text>
                <Text style={styles.contentType}>
                  {CONTENT_LABELS[item.contentType]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {!isOpen && previous ? (
          <View style={styles.keyBanner}>
            <View style={styles.keyBannerHead}>
              <SparklesIcon size={16} color={colors.primary} />
              <Text style={styles.keyBannerTitle}>Jump ahead to this lesson?</Text>
            </View>
            <Text style={styles.keyBannerText}>
              You're skipping past {previous.title}. Pass its key test to open this lesson — just
              like finishing the lesson normally would.
            </Text>
          </View>
        ) : null}

        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            if (!isOpen && previous) {
              navigation.navigate('ConceptQuiz', {
                conceptId: previous.id,
                mode: 'key',
                targetConceptId: concept.id,
              });
              return;
            }
            navigation.navigate('ConceptLearning', {
              conceptId: concept.id,
              startAt: 0,
            });
          }}
          accessibilityRole="button"
        >
          {!isOpen && previous ? (
            <SparklesIcon size={18} color={colors.onPrimary} />
          ) : (
            <BookOpenIcon size={18} color={colors.onPrimary} />
          )}
          <Text style={styles.primaryText}>
            {!isOpen && previous ? 'Take key test to unlock' : 'Start Learning'}
          </Text>
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
  content: { paddingHorizontal: 18, gap: 12 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingBottom: 14 },
  iconButton: {
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
  headerEyebrow: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, color: colors.slate },
  headerTitle: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 25, color: colors.ink },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.frame,
  },
  heroRing: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  heroStatus: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12 },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 21, color: colors.ink },
  heroMeta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.slate },

  sectionTitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: colors.ink },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15, color: colors.primary },

  card: {
    padding: 16,
    borderRadius: 18,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.frame,
  },
  cardBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.ink },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipRelated: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.slate },
  chipTextRelated: { color: colors.primary },

  contentList: { gap: 8 },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  orderBadge: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  orderText: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15, color: colors.primary },
  contentCopy: { flex: 1, gap: 2 },
  contentTitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.ink },
  contentType: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 12, color: colors.slate },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 10,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  keyBanner: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 5,
  },
  keyBannerHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  keyBannerTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  keyBannerText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.ink },
  primaryButton: {
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