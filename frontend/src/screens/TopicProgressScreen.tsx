import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '../components/icons';
import { ProgressBar } from '../components/PracticeUI';
import { colors, fonts, shadow } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { useProgress } from '../progressContext';
import { useCatalog } from '../catalogContext';
import { navigateToTab } from '../navigation/tabs';
import type { RootScreenProps } from '../navigation/types';

export default function TopicProgressScreen({
  navigation,
}: RootScreenProps<'TopicProgress'>) {
  const insets = useSafeAreaInsets();
  const { statusBarStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { topics } = useCatalog();
  const { topicAssessments } = useProgress();

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.headerAction}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeftIcon size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Topic quiz results</Text>
          <Text style={styles.headerSubtitle}>Scores are based on the full topic quiz</Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 14 }]}
      >
        {topics.map((topic) => {
          const assessment = topicAssessments[topic.id];
          const score = assessment?.scorePct ?? 0;
          return (
            <Pressable
              key={topic.id}
              style={styles.topicCard}
              onPress={() => navigation.navigate('TopicOverview', { topicId: topic.id })}
              accessibilityRole="button"
            >
              <View style={styles.topicHeading}>
                <View style={styles.topicCopy}>
                  <Text style={styles.topicTitle}>{topic.name}</Text>
                  <Text style={styles.topicSubtitle}>
                    {assessment
                      ? `${assessment.passed ? 'Passed' : 'Not passed'} · ${score}% quiz score`
                      : 'Quiz not taken'}
                  </Text>
                </View>
                {assessment?.passed ? (
                  <CheckCircleIcon size={22} color={colors.success} />
                ) : (
                  <ArrowRightIcon size={18} color={colors.primary} />
                )}
              </View>
              <ProgressBar progress={score} track={colors.border} fill={assessment?.passed ? colors.success : colors.primary} />
            </Pressable>
          );
        })}
        {topics.length === 0 ? (
          <Text style={styles.empty}>Topic quiz results will appear here after the curriculum loads.</Text>
        ) : null}
      </ScrollView>
      <BottomNav active="Progress" onSelect={navigateToTab(navigation, 'Progress')} />
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.canvas },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 18,
      paddingBottom: 14,
    },
    headerAction: {
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
    headerTitle: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 22, color: colors.ink },
    headerSubtitle: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 15, color: colors.slate },
    content: { paddingHorizontal: 18, gap: 10 },
    topicCard: {
      padding: 15,
      gap: 13,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...shadow.frame,
    },
    topicHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    topicCopy: { flex: 1, gap: 4 },
    topicTitle: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19, color: colors.ink },
    topicSubtitle: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.slate },
    empty: { padding: 20, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.slate },
  });
