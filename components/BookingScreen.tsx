import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BookingGrid from './BookingGrid';
import GroupPanel from './GroupPanel';
import PillTabs from './PillTabs';
import { addDays, formatWeekParam, getWeekStart } from '../lib/booking-grid';
import { colors } from '../lib/theme';
import type { BookingEntry, BookingResource, GroupSelection } from '../lib/types';
import { useDictionary } from '../lib/use-dictionary';

type Overview = {
  buildingName: string;
  resources: BookingResource[];
  activeId: string | null;
  bookings: BookingEntry[];
};

// The layout shared by kuopas/web's Laundry and Sauna pages: resource tabs,
// week navigation, a rules line and the booking grid.
export default function BookingScreen({
  title,
  todayLabel,
  noneSetUp,
  rules,
  hours,
  timeLabel,
  maxDaysInAdvance,
  youLabel,
  bookedLabel,
  load,
  book,
  cancel,
  group,
}: {
  title: string;
  todayLabel: string;
  noneSetUp: string;
  rules: string;
  hours: number[];
  timeLabel: (hour: number) => string;
  maxDaysInAdvance: number;
  youLabel: string;
  bookedLabel: string;
  load: (resourceId: string | null, week: string) => Promise<Overview>;
  book: (resourceId: string, startsAtIso: string, group?: GroupSelection) => Promise<void>;
  cancel: (bookingId: string) => Promise<void>;
  // When set, tapping a free slot opens the group panel (sauna) instead of booking straight away.
  group?: { hoursLength: number };
}) {
  const { locale, dict, living } = useDictionary();
  const [picked, setPicked] = useState<string | null>(null);
  const dayLabels = [
    dict.days.mon,
    dict.days.tue,
    dict.days.wed,
    dict.days.thu,
    dict.days.fri,
    dict.days.sat,
    dict.days.sun,
  ];

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    load(resourceId, formatWeekParam(weekStart))
      .then((next) => {
        setOverview(next);
        if (resourceId === null) setResourceId(next.activeId);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
  }, [load, resourceId, weekStart]);

  useEffect(refresh, [refresh]);

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

  const activeId = resourceId ?? overview?.activeId ?? null;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title }} />

      {!overview && !error && <ActivityIndicator />}

      {overview && overview.resources.length === 0 && (
        <Text style={styles.rules}>
          {noneSetUp} {overview.buildingName}.
        </Text>
      )}

      {overview && overview.resources.length > 0 && activeId && (
        <>
          <PillTabs
            tabs={overview.resources.map((r) => ({ value: r.id, label: r.label }))}
            active={activeId}
            onChange={setResourceId}
          />

          <View style={styles.weekNav}>
            <Pressable style={styles.navBtn} onPress={() => setWeekStart(addDays(weekStart, -7))}>
              <Text style={styles.navBtnText}>‹</Text>
            </Pressable>
            <Pressable style={styles.navBtn} onPress={() => setWeekStart(getWeekStart(new Date()))}>
              <Text style={styles.navBtnText}>{todayLabel}</Text>
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

          {group && picked && activeId ? (
            <GroupPanel
              t={living.booking}
              whenLabel={`${new Date(picked).toLocaleDateString(locale === 'fi' ? 'fi-FI' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} ${timeLabel(new Date(picked).getHours())}`}
              hoursOptions={[group.hoursLength]}
              capacity={overview.resources.find((r) => r.id === activeId)?.capacity ?? 6}
              withNote={false}
              onCancel={() => setPicked(null)}
              onConfirm={(input) =>
                run(() => book(activeId, picked, { participants: input.participants, inviteApartment: input.inviteApartment }))
              }
            />
          ) : group ? (
            <Text style={styles.rules}>{living.booking.pickHint}</Text>
          ) : null}

          <BookingGrid
            weekStart={weekStart}
            hours={hours}
            timeLabel={timeLabel}
            dayLabels={dayLabels}
            bookings={overview.bookings}
            maxDaysInAdvance={maxDaysInAdvance}
            youLabel={youLabel}
            bookedLabel={bookedLabel}
            onBook={(iso) => (group ? setPicked(iso) : run(() => book(activeId, iso)))}
            onCancel={(id) => run(() => cancel(id))}
          />
        </>
      )}

      {error && !overview && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { paddingVertical: 16, paddingHorizontal: 12, gap: 12 },
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  navBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  navBtnText: { fontSize: 14, color: colors.text },
  weekLabel: { fontSize: 13, color: colors.muted, marginLeft: 4 },
  error: { color: colors.danger, fontSize: 14 },
  rules: { fontSize: 13, color: colors.muted, paddingHorizontal: 4 },
});
