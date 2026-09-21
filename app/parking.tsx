import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as api from '../lib/api-client';
import { colors } from '../lib/theme';
import type { ParkingOverview } from '../lib/types';
import { useDictionary } from '../lib/use-dictionary';

// Mirrors kuopas/web/src/app/(app)/parking/page.tsx
export default function ParkingScreen() {
  const { dict } = useDictionary();
  const t = dict.parking;

  const [overview, setOverview] = useState<ParkingOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .getParking()
      .then(setOverview)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
  }, []);

  useEffect(load, [load]);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    load();
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t.title }} />
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.rules}>{t.rules}</Text>

      {!overview && !error && <ActivityIndicator />}

      {overview && overview.spots.length === 0 && (
        <Text style={styles.rules}>
          {t.noneSetUp} {overview.buildingName}.
        </Text>
      )}

      <View style={styles.grid}>
        {overview?.spots.map((spot) => {
          const isTaken = spot.mine || Boolean(spot.takenBy);
          return (
            <View
              key={spot.id}
              style={[styles.spot, spot.mine ? styles.spotMine : isTaken ? styles.spotTaken : styles.spotFree]}
            >
              <Text style={styles.spotLabel}>{spot.label}</Text>
              <Text style={styles.spotStatus}>
                {spot.mine ? t.yourSpot : spot.takenBy ? `${t.takenBy} ${spot.takenBy}` : t.free}
              </Text>
              {spot.mine && (
                <Pressable style={[styles.spotButton, styles.spotButtonRelease]} onPress={() => run(() => api.releaseParkingSpot(spot.id))}>
                  <Text style={styles.spotButtonReleaseText}>{t.release}</Text>
                </Pressable>
              )}
              {!spot.mine && !isTaken && (
                <Pressable style={styles.spotButton} onPress={() => run(() => api.claimParkingSpot(spot.id))}>
                  <Text style={styles.spotButtonText}>{t.claim}</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12 },
  error: { color: colors.danger, fontSize: 14 },
  rules: { fontSize: 14, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  spot: { width: '48%', borderRadius: 12, padding: 12, gap: 6, borderWidth: 1 },
  spotFree: { backgroundColor: colors.card, borderColor: colors.border },
  spotTaken: { backgroundColor: colors.chip, borderColor: colors.chip },
  spotMine: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  spotLabel: { fontSize: 18, fontWeight: '800' },
  spotStatus: { fontSize: 12, color: colors.muted },
  spotButton: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  spotButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  spotButtonRelease: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.accent },
  spotButtonReleaseText: { color: colors.accent, fontWeight: '600', fontSize: 13 },
});
