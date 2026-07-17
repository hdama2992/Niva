import * as Location from 'expo-location';
import { LocateFixed, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

export type ActivityLocation = {
  city: string;
  latitude?: number;
  locationName: string;
  longitude?: number;
};

type LocationSelectorProps = {
  onChange: (location: ActivityLocation) => void;
  value: ActivityLocation;
};

export function LocationSelector({ onChange, value }: LocationSelectorProps) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string>();

  const useCurrentLocation = async () => {
    setLocating(true);
    setError(undefined);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Allow location access to use your current position.');
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const latitude = current.coords.latitude;
      const longitude = current.coords.longitude;
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const city = address?.city ?? address?.subregion ?? value.city;
      const locationName = [address?.name, address?.district, address?.street]
        .filter(Boolean)
        .filter((part, index, parts) => parts.indexOf(part) === index)
        .join(', ');

      onChange({
        city,
        latitude,
        locationName: locationName || value.locationName || city,
        longitude,
      });
    } catch (locationError) {
      setError(
        locationError instanceof Error
          ? locationError.message
          : 'Unable to read this location.',
      );
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.group}>
      <View style={styles.inputRow}>
        <MapPin color={colors.secondary} size={19} strokeWidth={2.3} />
        <TextInput
          onChangeText={(locationName) =>
            onChange({ city: value.city, locationName })
          }
          placeholder="Venue or public meeting point"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={value.locationName}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={locating}
        onPress={() => void useCurrentLocation()}
        style={styles.locateButton}
      >
        {locating ? (
          <ActivityIndicator color={colors.secondary} size="small" />
        ) : (
          <LocateFixed color={colors.secondary} size={17} strokeWidth={2.4} />
        )}
        <Text style={styles.locateText}>
          {locating ? 'Finding location...' : 'Use current location'}
        </Text>
      </Pressable>
      {value.latitude !== undefined && value.longitude !== undefined ? (
        <Text style={styles.confirmedText}>
          Exact point added for map directions.
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  confirmedText: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '700',
  },
  error: {
    color: colors.primaryDark,
    fontSize: typography.small,
    lineHeight: 18,
  },
  group: { gap: spacing.sm },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    minHeight: 54,
    paddingHorizontal: spacing.sm,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  locateButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 36,
  },
  locateText: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
  },
});
