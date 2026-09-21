import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../../lib/theme';
import { useDictionary } from '../../lib/use-dictionary';

// The web app's sidebar also lists these; on a phone they sit behind one tab.
// Laundry, sauna and parking live inside Booking, as on web.
export default function MoreScreen() {
  const { dict, living } = useDictionary();

  const items: { href: Href; label: string }[] = [
    { href: '/calls', label: dict.nav.calls },
    { href: '/booking', label: living.booking.title },
    { href: '/household', label: living.household.title },
    { href: '/roommates', label: living.roommates.title },
    { href: '/marketplace', label: living.market.title },
    { href: '/lease', label: living.lease.title },
    { href: '/wellbeing', label: living.wellbeing.title },
    { href: '/settings', label: dict.nav.settings },
  ];
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {items.map((item) => (
        <Pressable key={String(item.href)} style={styles.row} onPress={() => router.push(item.href)}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  label: { fontSize: 16, fontWeight: '600' },
  chevron: { fontSize: 22, color: colors.faint },
});
