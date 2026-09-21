import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { getDictionary } from '../../lib/dictionary';
import { colors } from '../../lib/theme';

function ContactRow({ label, href }: { label: string; href?: string }) {
  const content = <Text style={href ? styles.contactLink : styles.contactText}>{label}</Text>;
  return href ? (
    <Pressable style={styles.contactRow} onPress={() => Linking.openURL(href)}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.contactRow}>{content}</View>
  );
}

// Mirrors SupportTab in kuopas/web/src/app/(app)/messages/page.tsx
export default function SupportTab({ dict }: { dict: ReturnType<typeof getDictionary> }) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{dict.support.customerService}</Text>
        <Text style={styles.hours}>{dict.support.hours}</Text>
        <ContactRow label="+358 (0)20 710 9740" href="tel:+358207109740" />
        <ContactRow label="customerservice@kuopas.fi" href="mailto:customerservice@kuopas.fi" />
        <ContactRow label="Torikatu 15, 70110 Kuopio" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{dict.support.maintenanceEmergency}</Text>
        <Text style={styles.hours}>{dict.support.maintenanceHours}</Text>
        <ContactRow label="+358 (0)44 764 0760" href="tel:+358447640760" />
        <ContactRow label="huolto@kuopas.fi" href="mailto:huolto@kuopas.fi" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  hours: { fontSize: 13, color: colors.muted },
  contactRow: { paddingVertical: 4 },
  contactLink: { fontSize: 14, color: colors.accent, fontWeight: '600' },
  contactText: { fontSize: 14, color: colors.body },
});
