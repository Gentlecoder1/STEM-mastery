import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CheckCircleIcon,
  ArrowRightIcon,
} from '../components/icons';
import {
  CloseIcon,
  GaugeIcon,
  ScanSearchIcon,
  TrendingUpIcon,
  XCircleIcon,
} from '../components/glyphs';
import { ActionButton, Pill, ProgressBar } from '../components/PracticeUI';
import { colors, fonts, lightColors, shadow } from '../theme';
import type { RootScreenProps } from '../navigation/types';
import { useThemedStyles, useTheme } from '../themeContext';

export default function PracticeLessonScreen({
  navigation,
}: RootScreenProps<'PracticeLesson'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { statusBarStyle } = useTheme();

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, { paddingTop: insets.top + 2 }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close lesson"
        >
          <CloseIcon size={19} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>TARGETED REVIEW • 2 OF 4</Text>
          <ProgressBar progress={50} style={styles.headerProgress} />
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 108 },
        ]}
      >
        <Pill bg={colors.orangeSoft} tint={colors.orange}>
          <ScanSearchIcon size={13} color={colors.orange} />
          <Text style={styles.pillLabel}>YOUR MISCONCEPTION</Text>
        </Pill>

        <Text style={styles.headline}>Velocity changes. Acceleration describes the change.</Text>

        <View style={styles.misconceptionCard}>
          <XCircleIcon size={20} color={colors.danger} />
          <View style={styles.blockCopy}>
            <Text style={styles.labelDanger}>NOT QUITE</Text>
            <Text style={styles.blockText}>“A steeper line is acceleration.”</Text>
          </View>
        </View>

        <View style={styles.visualPanel}>
          <View style={styles.panel}>
            <GaugeIcon size={34} color={lightColors.surface} />
            <Text style={styles.panelTitle}>Velocity</Text>
            <Text style={styles.panelCaption}>How fast and which direction now</Text>
            <Text style={styles.velocityValue}>5 m/s →</Text>
          </View>
          <View style={styles.panel}>
            <TrendingUpIcon size={34} color={lightColors.surface} />
            <Text style={styles.panelTitle}>Acceleration</Text>
            <Text style={styles.panelCaption}>How quickly velocity changes</Text>
            <Text style={styles.accelValue}>+2 m/s²</Text>
          </View>
        </View>

        <View style={styles.rememberCard}>
          <CheckCircleIcon size={21} color={colors.success} />
          <View style={styles.blockCopy}>
            <Text style={styles.labelSuccess}>REMEMBER</Text>
            <Text style={styles.blockText}>
              A changing slope means changing velocity. Changing velocity over time is
              acceleration.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <ActionButton
          onPress={() => navigation.navigate('Practice')}
          leading={<ArrowRightIcon size={18} color={colors.onPrimary} />}
        >
          Try a quick check
        </ActionButton>
      </View>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  missing: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 5 },
  headerEyebrow: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
    color: colors.orange,
  },
  headerProgress: { height: 10 },
  headerSpacer: { width: 40 },

  content: { paddingHorizontal: 20, paddingTop: 8, gap: 15 },
  pillLabel: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 12, color: colors.orange },

  headline: {
    fontFamily: fonts.regular,
    fontSize: 28,
    lineHeight: 31,
    color: colors.ink,
  },

  misconceptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.pinkBorder,
    backgroundColor: colors.pinkSoft,
    gap: 9,
    ...shadow.frame,
  },
  blockCopy: { flex: 1, gap: 3 },
  labelDanger: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    color: colors.danger,
  },
  labelSuccess: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    color: colors.success,
  },
  blockText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.ink },

  visualPanel: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    padding: 14,
    borderRadius: 24,
    backgroundColor: lightColors.inkDeep,
  },
  panel: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  panelTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    lineHeight: 16,
    color: lightColors.surface,
  },
  panelCaption: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13.5,
    color: '#C9D0EB',
    textAlign: 'center',
  },
  velocityValue: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: colors.yellow },
  accelValue: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 21, color: lightColors.teal },

  rememberCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.greenSoft,
    backgroundColor: colors.greenSoft,
    gap: 9,
    ...shadow.frame,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});