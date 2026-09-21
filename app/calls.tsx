import { Stack } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';
import { useDictionary } from '../lib/use-dictionary';

// Mirrors kuopas/web/src/app/(app)/calls/page.tsx
export default function CallsScreen() {
  const { dict } = useDictionary();
  const t = dict.calls;

  const numbers = [
    { title: dict.support.customerService, hours: dict.support.hours, display: '+358 (0)20 710 9740', tel: '+358207109740' },
    {
      title: dict.support.maintenanceEmergency,
      hours: dict.support.maintenanceHours,
      display: '+358 (0)44 764 0760',
      tel: '+358447640760',
    },
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t.title }} />
      <Text style={styles.lede}>{t.lede}</Text>
      {numbers.map((n) => (
        <View key={n.tel} style={styles.card}>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{n.title}</Text>
            <Text style={styles.hours}>{n.hours}</Text>
            <Text style={styles.number}>{n.display}</Text>
          </View>
          <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${n.tel}`)}>
            <Text style={styles.callBtnText}>{t.call}</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12 },
  lede: { fontSize: 14, color: colors.muted },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  hours: { fontSize: 13, color: colors.muted },
  number: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  callBtn: { backgroundColor: colors.accent, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 18 },
  callBtnText: { color: '#fff', fontWeight: '600' },
});
