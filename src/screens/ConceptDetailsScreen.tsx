import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MasteryRing from '../components/MasteryRing';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '../components/icons';
import { BookOpenIcon } from '../components/glyphs';
import { colors, fonts, shadow } from '../theme';
import { CONTENT_LABELS, getConcept } from '../data/learning';
import type { RootScreenProps } from '../navigation/types';

export default function ConceptDetailsScreen({ navigation, route }: RootScreenProps<'ConceptDetails'>) {
  const insets = useSafeAreaInsets();
  const concept = getConcept(route.params.conceptId);

  if (!concept) {
    return (
      <View style={[styles.root, styles.missing]}>
        <Text style={styles.missingText}>Concept not found.</Text>
      </View>
    );
  }

  const itemCount = concept.content.length;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 96 },
        ]}
      >
        <View style={styles.header}>
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

        <View style={styles.hero}>
          <View style={styles.heroRing}>
            <MasteryRing percent={concept.mastery} color={concept.tint} size={76} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroStatus, { color: concept.tint }]}>
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
        <View style={[styles.card, { borderLeftColor: concept.tint }]}>
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
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate('ConceptLearning', {
              conceptId: concept.id,
              startAt: 0,
            })
          }
          accessibilityRole="button"
        >
          <BookOpenIcon size={18} color={colors.surface} />
          <Text style={styles.primaryText}>Start Learning</Text>
          <ArrowRightIcon size={18} color={colors.surface} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  missing: { alignItems: 'center', justifyContent: 'center' },
  missingText: { fontFamily: fonts.medium, fontSize: 14, color: colors.slate },
  content: { paddingHorizontal: 18, gap: 12 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
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
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
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
  primaryText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 18, color: colors.surface },
});