import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import { ChevronRightIcon } from '../components/icons';
import { AtomIcon, FlaskIcon, SigmaIcon } from '../components/glyphs';
import type { SubjectId } from '../theme';
import { colors, fonts, lightColors, shadow, type ColorToken } from '../theme';
import { useTheme, useThemedStyles } from '../themeContext';
import { navigateToTab } from '../navigation/tabs';
import type { RootScreenProps } from '../navigation/types';

type ChallengeTopic = {
  id: string;
  title: string;
  subjectId: SubjectId;
  subject: string;
  tint: ColorToken;
  soft: ColorToken;
  Icon: typeof AtomIcon;
};

// Temporary local topic catalog. The API can replace this list with Neo4j topics later.
const TOPICS: readonly ChallengeTopic[] = [
  { id: 'topic-speed-velocity', title: 'Speed and Velocity', subjectId: 'physics', subject: 'Physics', tint: 'blue', soft: 'blueSoft', Icon: AtomIcon },
  { id: 'topic-motion', title: 'Motion', subjectId: 'physics', subject: 'Physics', tint: 'green', soft: 'greenSoft', Icon: AtomIcon },
  { id: 'topic-acceleration', title: 'Acceleration', subjectId: 'physics', subject: 'Physics', tint: 'orange', soft: 'orangeSoft', Icon: AtomIcon },
  { id: 'topic-linear-equations', title: 'Linear Equations', subjectId: 'mathematics', subject: 'Mathematics', tint: 'violet', soft: 'violetSoft', Icon: SigmaIcon },
  { id: 'topic-atomic-structure', title: 'Atomic Structure', subjectId: 'chemistry', subject: 'Chemistry', tint: 'primary', soft: 'primarySoft', Icon: FlaskIcon },
];

export default function ChallengeScreen({ navigation }: RootScreenProps<'Challenge'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();
  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>STEM Challenge</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 18 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>How much do you know?</Text>
          <Text style={styles.heroText}>Pick a topic and take on 10 random questions. Challenge yourself whether you have studied it or not.</Text>
        </View>
        <Text style={styles.sectionTitle}>Choose a challenge</Text>
        <View style={styles.list}>
          {TOPICS.map(({ id, title, subject, tint, soft, Icon }) => (
            <Pressable
              key={title}
              style={styles.topicRow}
              onPress={() => navigation.navigate('ChallengeQuiz', { topicId: id, topicTitle: title })}
              accessibilityRole="button"
            >
              <View style={[styles.topicIcon, { backgroundColor: colors[soft] }]}><Icon size={22} color={colors[tint]} /></View>
              <View style={styles.topicCopy}><Text style={styles.topicTitle}>{title}</Text><Text style={styles.topicSubtitle}>{subject} • 10 questions</Text></View>
              <ChevronRightIcon size={20} color={colors.slate} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <BottomNav active="Subjects" onSelect={navigateToTab(navigation, 'Subjects')} />
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: 18, paddingBottom: 15, gap: 4 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.slate },
  content: { paddingHorizontal: 18, gap: 15 },
  heroCard: { padding: 20, borderRadius: 20, backgroundColor: lightColors.primary, gap: 8, ...shadow.frame },
  heroEyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1, color: colors.yellow },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 24, color: lightColors.surface },
  heroText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: lightColors.lavender },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  list: { gap: 10 },
  topicRow: { minHeight: 70, padding: 12, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  topicCopy: { flex: 1, gap: 4 },
  topicTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  topicSubtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate },
});
