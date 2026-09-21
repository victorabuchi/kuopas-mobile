import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BookingGrid from '../../../components/BookingGrid';
import GroupPanel from '../../../components/GroupPanel';
import * as api from '../../../lib/api-client';
import { addDays, formatWeekParam, getWeekStart } from '../../../lib/booking-grid';
import { colors } from '../../../lib/theme';
import type { BookingEntry, SpaceOverview } from '../../../lib/types';
import { useDictionary } from '../../../lib/use-dictionary';

const HOUR_MS = 3_600_000;

// Mirrors kuopas/web/src/app/(app)/booking/space/[spaceId]/page.tsx
export default function SpaceScreen() {
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const { locale, dict, living } = useDictionary();
  const t = living.booking;
  const dayLabels = [dict.days.mon, dict.days.tue, dict.days.wed, dict.days.thu, dict.days.fri, dict.days.sat, dict.days.sun];

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [overview, setOverview] = useState<SpaceOverview | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api
      .getSpace(spaceId, formatWeekParam(weekStart))
      .then(setOverview)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
  }, [spaceId, weekStart]);

  useEffect(refresh, [refresh]);

  // The grid shows one cell per hour, so a multi-hour booking fills several cells.
  const entries = useMemo(() => {
    const out: BookingEntry[] = [];
    for (const b of overview?.bookings ?? []) {
      const end = new Date(b.endsAt).getTime();
      for (let at = new Date(b.startsAt).getTime(); at < end; at += HOUR_MS) {
        out.push({ id: b.id, startsAt: new Date(at).toISOString(), mine: b.mine });
      }
    }
    return out;
  }, [overview]);

  const space = overview?.space;
  const busy = useMemo(() => new Set(entries.map((e) => e.startsAt)), [entries]);

  // A picked start opens the booking panel, limited to the free run after it.
  const pickedOptions = useMemo(() => {
    if (!picked || !space) return [];
    const start = new Date(picked);
    const room = Math.min(space.maxHoursPerBooking, space.closeHour - start.getHours());
    const options: number[] = [];
    for (let n = 1; n <= room; n += 1) {
      if (busy.has(new Date(start.getTime() + (n - 1) * HOUR_MS).toISOString())) break;
      options.push(n);
    }
    return options;
  }, [picked, space, busy]);

  if (!space) {
    return (
      <View style={styles.loading}>
        <Stack.Screen options={{ title: t.title }} />
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator />}
      </View>
    );
  }

  const hours: number[] = [];
  for (let h = space.openHour; h < space.closeHour; h += 1) hours.push(h);

  const rules =
    t.rulesSpace
      .replace('{perBooking}', String(space.maxHoursPerBooking))
      .replace('{perWeek}', String(space.maxHoursPerWeek))
      .replace('{advance}', String(space.advanceDays))
      .replace('{open}', String(space.openHour).padStart(2, '0'))
      .replace('{close}', String(space.closeHour).padStart(2, '0')) +
    ' ' +
    t.capacity.replace('{n}', String(space.capacity));

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
      setPicked(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    refresh();
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: space.name }} />
      {space.description ? <Text style={styles.description}>{space.description}</Text> : null}

      <View style={styles.weekNav}>
        <Pressable style={styles.navBtn} onPress={() => setWeekStart(addDays(weekStart, -7))}>
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <Pressable style={styles.navBtn} onPress={() => setWeekStart(getWeekStart(new Date()))}>
          <Text style={styles.navBtnText}>{t.today}</Text>
        </Pressable>
        <Pressable style={styles.navBtn} onPress={() => setWeekStart(addDays(weekStart, 7))}>
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
        <Text style={styles.weekLabel}>
          {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          {' - '}
          {addDays(weekStart, 6).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.rules}>{rules}</Text>

      {picked && pickedOptions.length > 0 ? (
        <GroupPanel
          key={picked}
          t={t}
          whenLabel={`${new Date(picked).toLocaleDateString(locale === 'fi' ? 'fi-FI' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} ${String(new Date(picked).getHours()).padStart(2, '0')}:00`}
          hoursOptions={pickedOptions}
          capacity={space.capacity}
          withNote
          onCancel={() => setPicked(null)}
          onConfirm={(input) =>
            run(() =>
              api.bookSpace(spaceId, {
                startsAt: picked,
                hours: input.hours,
                note: input.note,
                participants: input.participants,
                inviteApartment: input.inviteApartment,
              }),
            )
          }
        />
      ) : (
        <Text style={styles.rules}>{t.pickHint}</Text>
      )}

      <BookingGrid
        weekStart={weekStart}
        hours={hours}
        timeLabel={(hour) => `${String(hour).padStart(2, '0')}:00`}
        dayLabels={dayLabels}
        bookings={entries}
        maxDaysInAdvance={space.advanceDays}
        youLabel={t.you}
        bookedLabel={t.booked}
        onBook={setPicked}
        onCancel={(id) => run(() => api.cancelSpaceBooking(spaceId, id))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { paddingVertical: 16, paddingHorizontal: 12, gap: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  description: { fontSize: 14, color: colors.muted, paddingHorizontal: 4 },
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  navBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  navBtnText: { fontSize: 14, color: colors.text },
  weekLabel: { fontSize: 13, color: colors.muted, marginLeft: 4 },
  error: { color: colors.danger, fontSize: 14 },
  rules: { fontSize: 13, color: colors.muted, paddingHorizontal: 4 },
});
