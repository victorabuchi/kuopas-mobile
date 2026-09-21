import { router, Stack, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as api from '../lib/api-client';
import { colors } from '../lib/theme';
import type { BookingHub } from '../lib/types';
import { useDictionary } from '../lib/use-dictionary';

type KindKey = keyof ReturnType<typeof useDictionary>['living']['booking']['kinds'];

// Mirrors BookingHubPage in kuopas/web/src/app/(app)/booking/page.tsx
export default function BookingHubScreen() {
  const { locale, living } = useDictionary();
  const t = living.booking;

  const [hub, setHub] = useState<BookingHub | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .getBookingHub()
      .then(setHub)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
  }, []);

  useFocusEffect(load);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'fi' ? 'fi-FI' : 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    load();
  }

  const hrefFor = (kind: string, spaceId: string | null): Href =>
    spaceId ? `/booking/space/${spaceId}` : (`/${kind}` as Href);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t.title }} />
      <Text style={styles.lede}>{t.lede}</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {!hub && !error && <ActivityIndicator />}

      {hub && hub.invites.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>{t.invitesHeading}</Text>
          {hub.invites.map((inv) => (
            <View key={inv.key} style={[styles.row, styles.invite]}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{inv.title}</Text>
                <Text style={styles.rowMeta}>
                  {inv.by} {t.invitedBy} {fmt(inv.startsAt)}
                </Text>
              </View>
              <View style={styles.rowActions}>
                <Pressable style={styles.btn} onPress={() => run(() => api.respondToInvite(inv.kind, inv.bookingId, 'accept'))}>
                  <Text style={styles.btnText}>{t.accept}</Text>
                </Pressable>
                <Pressable style={styles.btnGhost} onPress={() => run(() => api.respondToInvite(inv.kind, inv.bookingId, 'decline'))}>
                  <Text style={styles.btnGhostText}>{t.decline}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {hub && (
        <View style={styles.section}>
          <Text style={styles.heading}>{t.availableHeading}</Text>
          {hub.cards.length === 0 ? (
            <Text style={styles.empty}>{t.nothing}</Text>
          ) : (
            <View style={styles.cards}>
              {hub.cards.map((card) => {
                const kind = card.kind as KindKey;
                const info = t.kinds[kind];
                return (
                  <Pressable key={card.key} style={styles.card} onPress={() => router.push(hrefFor(card.kind, card.spaceId))}>
                    <Text style={styles.cardName}>{card.name ?? info.name}</Text>
                    <Text style={styles.cardBlurb}>
                      {card.spaceId ? card.description || info.blurb : info.blurb.replace('{n}', String(card.count))}
                    </Text>
                    <Text style={styles.cardOpen}>{t.open} ›</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}

      {hub && (
        <View style={styles.section}>
          <Text style={styles.heading}>{t.upcomingHeading}</Text>
          {hub.items.length === 0 && !hub.parking ? (
            <Text style={styles.empty}>{t.noUpcoming}</Text>
          ) : (
            <>
              {hub.parking && (
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>
                      {t.parkingHeld}: {hub.parking.label}
                    </Text>
                    <Text style={styles.rowMeta}>{t.you}</Text>
                  </View>
                  <Pressable style={styles.btnGhost} onPress={() => router.push('/parking')}>
                    <Text style={styles.btnGhostText}>{t.manage}</Text>
                  </Pressable>
                </View>
              )}
              {hub.items.map((item) => {
                const title = item.kind === 'laundry' ? `${t.kinds.laundry.name}: ${item.title}` : item.title;
                const meta =
                  item.role === 'organiser'
                    ? `${t.organiser}: ${item.organiserName}`
                    : item.role === 'with'
                      ? t.withCount.replace('{n}', String(item.withCount))
                      : t.you;
                return (
                  <View key={item.key} style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{title}</Text>
                      <Text style={styles.rowMeta}>
                        {fmt(item.startsAt)} · {meta}
                      </Text>
                    </View>
                    <View style={styles.rowActions}>
                      <Pressable style={styles.btnGhost} onPress={() => router.push(hrefFor(item.kind, item.spaceId))}>
                        <Text style={styles.btnGhostText}>{t.manage}</Text>
                      </Pressable>
                      {item.action === 'leave' && (
                        <Pressable
                          style={styles.btnGhost}
                          onPress={() => run(() => api.respondToInvite(item.kind as 'sauna' | 'space', item.bookingId, 'decline'))}
                        >
                          <Text style={styles.btnGhostText}>{t.leave}</Text>
                        </Pressable>
                      )}
                      {item.action === 'cancel' && item.spaceId && (
                        <Pressable style={styles.btnGhost} onPress={() => run(() => api.cancelSpaceBooking(item.spaceId!, item.bookingId))}>
                          <Text style={styles.btnGhostText}>{t.cancel}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 16 },
  lede: { fontSize: 14, color: colors.muted },
  error: { color: colors.danger, fontSize: 14 },
  section: { gap: 8 },
  heading: { fontSize: 13, fontWeight: '700', color: colors.muted },
  empty: { color: colors.faint, textAlign: 'center', marginVertical: 8 },
  cards: { gap: 8 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, gap: 4 },
  cardName: { fontSize: 16, fontWeight: '700' },
  cardBlurb: { fontSize: 13, color: colors.muted },
  cardOpen: { fontSize: 13, color: colors.accent, fontWeight: '600', marginTop: 4 },
  row: { backgroundColor: colors.card, borderRadius: 12, padding: 12, gap: 8 },
  invite: { borderWidth: 1, borderColor: colors.accent },
  rowText: { gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, color: colors.faint },
  rowActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: { backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 7, paddingHorizontal: 14 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnGhost: { borderRadius: 16, paddingVertical: 7, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
});
