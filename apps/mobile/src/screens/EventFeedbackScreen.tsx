import { ArrowLeft, Star } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

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

export function EventFeedbackScreen({
  canSetContinuity,
  event,
  onBack,
  onSubmit,
}: EventFeedbackScreenProps) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [wantsSimilarEvents, setWantsSimilarEvents] = useState(true);
  const [wantsCircleSuggestions, setWantsCircleSuggestions] = useState(true);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onBack}
          style={styles.iconButton}
        >
          <ArrowLeft color={colors.ink} size={22} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.topBarTitle}>Event feedback</Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>How was {event.title}?</Text>
        <Text style={styles.subtitle}>
          This is shared with the Niva team to improve future gatherings. It is
          not a public review feed.
        </Text>
        <Text style={styles.label}>Your rating</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              accessibilityLabel={`${value} star rating`}
              accessibilityRole="button"
              key={value}
              onPress={() => setRating(value)}
              style={styles.starButton}
            >
              <Star
                color={value <= rating ? colors.accent : colors.border}
                fill={value <= rating ? colors.accent : 'transparent'}
                size={33}
                strokeWidth={2.2}
              />
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>What worked or could improve?</Text>
        <TextInput
          maxLength={1000}
          multiline
          onChangeText={setBody}
          placeholder="Optional notes for Niva. Avoid private details about other members."
          placeholderTextColor={colors.muted}
          style={styles.input}
          textAlignVertical="top"
          value={body}
        />
        {canSetContinuity ? (
          <View style={styles.continuityPanel}>
            <Text style={styles.continuityTitle}>Keep the momentum going</Text>
            <Text style={styles.continuityText}>
              Choose whether Niva can use this attended event to suggest the
              next safe group experience. You can change this later in Settings.
            </Text>
            <PreferenceToggle
              label="Suggest similar events"
              onChange={setWantsSimilarEvents}
              text="Use this event's interests when you browse future gatherings."
              value={wantsSimilarEvents}
            />
            <PreferenceToggle
              label="Suggest a small circle"
              onChange={setWantsCircleSuggestions}
              text="Consider a recurring group with related interests."
              value={wantsCircleSuggestions}
            />
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            onSubmit({
              body: body.trim() || undefined,
              continuity: canSetContinuity
                ? { wantsCircleSuggestions, wantsSimilarEvents }
                : undefined,
              rating,
            })
          }
          style={styles.submitButton}
        >
          <Text style={styles.submitText}>Submit feedback</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PreferenceToggle({
  label,
  onChange,
  text,
  value,
}: {
  label: string;
  onChange: (value: boolean) => void;
  text: string;
  value: boolean;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceLabel}>{label}</Text>
        <Text style={styles.preferenceText}>{text}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        onValueChange={onChange}
        thumbColor={colors.surface}
        trackColor={{ false: colors.border, true: colors.secondary }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  continuityPanel: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  continuityText: {
    color: colors.secondary,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  continuityTitle: {
    color: colors.secondary,
    fontSize: typography.body,
    fontWeight: '800',
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  footer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.sm,
    minHeight: 138,
    padding: spacing.md,
  },
  label: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    marginTop: spacing.xl,
  },
  preferenceCopy: { flex: 1 },
  preferenceLabel: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  preferenceRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(16, 98, 84, 0.18)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  preferenceText: {
    color: colors.secondary,
    fontSize: typography.small,
    lineHeight: 18,
    marginTop: 2,
  },
  ratingRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  screen: { backgroundColor: colors.background, flex: 1 },
  starButton: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    width: 42,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 54,
  },
  submitText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  title: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    lineHeight: 34,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: spacing.sm,
  },
  topBarTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
