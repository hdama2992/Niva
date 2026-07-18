import { Camera, ImagePlus, X } from 'lucide-react-native';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import {
  pickActivityCover,
  SelectedImage,
  takeActivityCover,
} from '../services/media';

export function ActivityCoverSelector({
  existingUri,
  onChange,
  value,
}: {
  existingUri?: string;
  onChange: (image?: SelectedImage) => void;
  value?: SelectedImage;
}) {
  const choose = async (source: 'camera' | 'library') => {
    try {
      const selected =
        source === 'camera'
          ? await takeActivityCover()
          : await pickActivityCover();
      if (selected) {
        onChange(selected);
      }
    } catch (error) {
      Alert.alert(
        'Photo unavailable',
        error instanceof Error
          ? error.message
          : 'Niva could not open this photo source.',
      );
    }
  };

  return (
    <View style={styles.group}>
      {value || existingUri ? (
        <View style={styles.previewWrap}>
          <Image
            resizeMode="cover"
            source={{ uri: value?.uri ?? existingUri }}
            style={styles.preview}
          />
          {value ? (
            <Pressable
              accessibilityLabel="Discard replacement cover photo"
              accessibilityRole="button"
              onPress={() => onChange(undefined)}
              style={styles.remove}
            >
              <X color={colors.surface} size={18} strokeWidth={2.7} />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.fallback}>
          <ImagePlus color={colors.info} size={30} strokeWidth={2.1} />
          <Text style={styles.fallbackTitle}>Add an event-specific cover</Text>
          <Text style={styles.fallbackText}>
            If you skip this, Niva uses a curated image matched to the activity.
          </Text>
        </View>
      )}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void choose('library')}
          style={styles.action}
        >
          <ImagePlus color={colors.primary} size={18} strokeWidth={2.4} />
          <Text style={styles.actionText}>Choose photo</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void choose('camera')}
          style={styles.action}
        >
          <Camera color={colors.primary} size={18} strokeWidth={2.4} />
          <Text style={styles.actionText}>Take photo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 48,
  },
  actionText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  fallback: {
    alignItems: 'center',
    backgroundColor: colors.infoSoft,
    borderRadius: radius.lg,
    gap: spacing.xs,
    minHeight: 170,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  fallbackText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    maxWidth: 270,
    textAlign: 'center',
  },
  fallbackTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  group: { gap: spacing.sm },
  preview: { aspectRatio: 3 / 2, width: '100%' },
  previewWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  remove: {
    alignItems: 'center',
    backgroundColor: 'rgba(16,39,66,0.84)',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 40,
  },
});
