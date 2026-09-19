import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getBuildings } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import type { Building } from '../lib/types';
import { useDictionary } from '../lib/use-dictionary';

export default function RegisterScreen() {
  const { locale, setLocale, dict } = useDictionary();
  const { register, loginWithGoogle } = useAuth();
  const t = dict.register;

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [unitId, setUnitId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getBuildings().then(setBuildings).catch(() => setBuildings([]));
  }, []);

  async function onSubmit() {
    setError(null);
    if (!name.trim() || !email.trim() || !unitId) {
      // Mirrors kuopas/web/src/lib/auth-actions.ts registerAction
      setError('Name, email, and unit are all required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password, unitId);
      router.replace('/(tabs)/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onGoogle() {
    setError(null);
    try {
      if (await loginWithGoogle()) router.replace('/(tabs)/feed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.logo}>
            <View style={styles.logoDot} />
            <Text style={styles.logoText}>Kuopas</Text>
          </View>
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </View>

        <View style={styles.heading}>
          <Text style={styles.headingText}>{t.heading}</Text>
          <Text style={styles.lede}>{t.lede}</Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.suomiFi}>
          <Text>{t.suomiFi}</Text>
          <Text style={styles.suomiFiTag}>{t.comingSoon}</Text>
        </View>

        <Text style={styles.divider}>{t.or}</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>{t.fullName}</Text>
            <TextInput value={name} onChangeText={setName} autoComplete="name" style={styles.input} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t.email}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t.password}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              style={styles.input}
            />
            <Text style={styles.hint}>{t.passwordHint}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t.unit}</Text>
            <View style={styles.unitList}>
              {buildings.length === 0 && <Text style={styles.hint}>{t.selectUnit}</Text>}
              {buildings.map((building) =>
                building.stairwells.map((stairwell) =>
                  stairwell.units.map((unit) => {
                    const label = `${building.name}, ${stairwell.label}${unit.code} (floor ${unit.floor})`;
                    const selected = unitId === unit.id;
                    return (
                      <Pressable
                        key={unit.id}
                        onPress={() => setUnitId(unit.id)}
                        style={[styles.unitOption, selected && styles.unitOptionSelected]}
                      >
                        <Text style={selected ? styles.unitOptionTextSelected : styles.unitOptionText}>{label}</Text>
                      </Pressable>
                    );
                  }),
                ),
              )}
            </View>
          </View>
          <Pressable style={styles.submit} onPress={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t.submit}</Text>}
          </Pressable>
        </View>

        <Text style={styles.divider}>{dict.login.orShort}</Text>
        <Pressable style={styles.googleBtn} onPress={onGoogle}>
          <Text style={styles.googleText}>{dict.login.google}</Text>
        </Pressable>

        <Text style={styles.footerNote}>
          {t.haveAccount} <Link href="/login">{t.logIn}</Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f6f8', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 16, marginTop: 40, marginBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2f7d5c' },
  logoText: { fontSize: 16, fontWeight: '700' },
  heading: { gap: 4 },
  headingText: { fontSize: 24, fontWeight: '700' },
  lede: { fontSize: 14, color: '#5b616e' },
  error: { color: '#b3261e', fontSize: 14 },
  suomiFi: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  suomiFiTag: { fontSize: 12, color: '#8a8f98' },
  divider: { textAlign: 'center', color: '#8a8f98', fontSize: 13 },
  form: { gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 13, color: '#5b616e' },
  hint: { fontSize: 12, color: '#8a8f98' },
  input: { borderWidth: 1, borderColor: '#d8dbe0', borderRadius: 10, padding: 12, fontSize: 15 },
  unitList: { gap: 6 },
  unitOption: { borderWidth: 1, borderColor: '#d8dbe0', borderRadius: 10, padding: 10 },
  unitOptionSelected: { borderColor: '#2f7d5c', backgroundColor: '#eaf5ef' },
  unitOptionText: { fontSize: 14, color: '#111' },
  unitOptionTextSelected: { fontSize: 14, color: '#2f7d5c', fontWeight: '600' },
  submit: { backgroundColor: '#2f7d5c', borderRadius: 10, padding: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  googleBtn: { backgroundColor: '#f6f8fa', borderWidth: 1, borderColor: '#d0d7de', borderRadius: 10, padding: 13, alignItems: 'center' },
  googleText: { color: '#1a1a18', fontWeight: '600', fontSize: 15 },
  footerNote: { textAlign: 'center', fontSize: 13, color: '#5b616e' },
});
