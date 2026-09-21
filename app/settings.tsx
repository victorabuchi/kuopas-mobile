import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LanguageSwitcher from '../components/LanguageSwitcher';
import PillTabs from '../components/PillTabs';
import { useAuth } from '../lib/auth-context';
import { colors } from '../lib/theme';
import { useDictionary } from '../lib/use-dictionary';

// Mirrors kuopas/web/src/app/(app)/settings/page.tsx
export default function SettingsScreen() {
  const { locale, setLocale, dict } = useDictionary();
  const { tenant, logout } = useAuth();
  const [category, setCategory] = useState<'general' | 'language'>('general');

  const rows = tenant
    ? [
        { label: dict.settings.name, value: tenant.name },
        { label: dict.settings.email, value: tenant.email },
        { label: dict.profile.building, value: tenant.building.name },
        { label: dict.profile.stairwell, value: tenant.stairwell.label },
        { label: dict.profile.unit, value: tenant.unit.code },
        { label: dict.profile.floor, value: String(tenant.unit.floor) },
      ]
    : [];

  async function onLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: dict.settings.title }} />
      <PillTabs
        tabs={[
          { value: 'general' as const, label: dict.settings.generalCategory },
          { value: 'language' as const, label: dict.settings.languageCategory },
        ]}
        active={category}
        onChange={setCategory}
      />

      {category === 'general' && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{dict.settings.generalCategory}</Text>
            {rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.card}>
            <Pressable onPress={onLogout}>
              <Text style={styles.signOut}>{dict.profile.logOut}</Text>
            </Pressable>
          </View>
        </>
      )}

      {category === 'language' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{dict.settings.languageCategory}</Text>
          <Text style={styles.lede}>{dict.settings.languageLede}</Text>
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { paddingVertical: 16, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, gap: 10, marginHorizontal: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  lede: { fontSize: 14, color: colors.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 14, color: colors.muted },
  rowValue: { fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  signOut: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});
