import { Frown, Heart, LockKeyhole, Meh, Smile } from 'lucide-react-native';
import { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DeckTopBar } from '../components/DeckTopBar';
import { resolveActivityArtwork } from '../constants/activity-artwork';
import { colors, radius, spacing, typography } from '../constants/theme';
import { DiscoveryItem } from '../data/discovery';

type EventFeedbackScreenProps = {
  canSetContinuity: boolean;
  event: DiscoveryItem;
  onBack: () => void;
  onSubmit: (input: {
    body?: string;
    continuity?: {
      wantsCircleSuggestions: boolean;
      wantsSimilarEvents: boolean;
    };
    rating: number;
  }) => void;
};

const feelings = [
  { Icon: Frown, label: 'Not good', rating: 1 },
  { Icon: Frown, label: 'Could improve', rating: 2 },
  { Icon: Meh, label: 'Okay', rating: 3 },
  { Icon: Smile, label: 'Good', rating: 4 },
  { Icon: Heart, label: 'Lovely', rating: 5 },
];

export function EventFeedbackScreen({
  canSetContinuity,
  event,
  onBack,
  onSubmit,
}: EventFeedbackScreenProps) {
  const [rating, setRating] = useState(4);
  const [body, setBody] = useState('');
  const [meetAgain, setMeetAgain] = useState<'maybe' | 'no' | 'yes'>('yes');

  return (
    <View style={styles.screen}>
      <DeckTopBar onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>How was {event.title}?</Text>
        <ImageBackground
          imageStyle={styles.heroImage}
          source={resolveActivityArtwork(event)}
          style={styles.hero}
        >
          <View style={styles.heroShade} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <Text style={styles.heroMeta}>
              {event.time} · {event.location}
            </Text>
          </View>
        </ImageBackground>

        <Text style={styles.sectionTitle}>How did it feel?</Text>
        <Text style={styles.sectionHint}>
          Choose the option that best describes your experience.
        </Text>
        <View style={styles.feelings}>
          {feelings.map(({ Icon, label, rating: value }) => {
            const selected = rating === value;
            return (
              <Pressable
                accessibilityLabel={`${label}, ${value} out of 5`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={value}
                onPress={() => setRating(value)}
                style={[styles.feeling, selected && styles.feelingSelected]}
              >
                <Icon
                  color={selected ? colors.success : colors.primary}
                  size={27}
                />
                <Text
                  style={[
                    styles.feelingText,
                    selected && styles.feelingTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>
          Anything Niva or the host should know?
        </Text>
        <Text style={styles.sectionHint}>Optional</Text>
        <View style={styles.inputWrap}>
          <TextInput
            accessibilityLabel="Private event feedback"
            maxLength={200}
            multiline
            onChangeText={setBody}
            placeholder="Share any thoughts, thanks, or suggestions…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            textAlignVertical="top"
            value={body}
          />
          <Text style={styles.counter}>{body.length}/200</Text>
        </View>

        <Text style={styles.sectionTitle}>
          Would you meet this group again?
        </Text>
        <Text style={styles.sectionHint}>Help Niva suggest the right fit.</Text>
        <View style={styles.continuityRow}>
          {(
            [
              ['yes', 'Yes'],
              ['maybe', 'Maybe'],
              ['no', 'Not this time'],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: meetAgain === value }}
              key={value}
              onPress={() => setMeetAgain(value)}
              style={[
                styles.continuityChoice,
                meetAgain === value && styles.continuitySelected,
              ]}
            >
              <Text
                style={[
                  styles.continuityText,
                  meetAgain === value && styles.continuityTextSelected,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.privateNote}>
          <LockKeyhole color={colors.primary} size={18} />
          <Text style={styles.privateText}>
            Your written feedback is shared with the host without your name.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            onSubmit({
              body: body.trim() || undefined,
              continuity: canSetContinuity
                ? {
                    wantsCircleSuggestions: meetAgain === 'yes',
                    wantsSimilarEvents: meetAgain !== 'no',
                  }
                : undefined,
              rating,
            })
          }
          style={styles.submitButton}
        >
          <Text style={styles.submitText}>Send feedback</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  continuityChoice: {
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 58,
  },
  continuityRow: {
    borderRadius: radius.md,
    flexDirection: 'row',
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  continuitySelected: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  continuityText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '700',
    textAlign: 'center',
  },
  continuityTextSelected: { color: colors.success, fontWeight: '900' },
  counter: {
    bottom: spacing.sm,
    color: colors.muted,
    fontSize: typography.small,
    position: 'absolute',
    right: spacing.md,
  },
  feeling: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 104,
    paddingHorizontal: 3,
  },
  feelingSelected: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  feelingText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
  },
  feelingTextSelected: { color: colors.success, fontWeight: '900' },
  feelings: { flexDirection: 'row', gap: 6, marginTop: spacing.md },
  hero: {
    height: 165,
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  heroCopy: { padding: spacing.md },
  heroImage: { borderRadius: radius.lg },
  heroMeta: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: 4,
  },
  heroShade: {
    backgroundColor: 'rgba(5,23,42,0.35)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  input: {
    color: colors.ink,
    fontSize: typography.body,
    lineHeight: 23,
    minHeight: 120,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  inputWrap: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    position: 'relative',
  },
  privateNote: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  privateText: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.small,
    lineHeight: 19,
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  sectionHint: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 3,
  },
  sectionTitle: {
    color: colors.primaryDark,
    fontSize: typography.subheading,
    fontWeight: '900',
    marginTop: spacing.xl,
  },
  skipButton: { alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  skipText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '900',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 56,
  },
  submitText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '900',
  },
  title: {
    color: colors.primaryDark,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    marginTop: spacing.md,
  },
});
