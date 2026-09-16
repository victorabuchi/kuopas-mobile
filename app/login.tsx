import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../lib/auth-context';
import { useDictionary } from '../lib/use-dictionary';

export default function LoginScreen() {
  const { locale, setLocale, dict } = useDictionary();
  const { login } = useAuth();
  const t = dict.login;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.replace('/(tabs)/feed');
    } catch {
      // Mirrors the generic error in kuopas/web/src/lib/auth-actions.ts loginAction
      setError('Incorrect email or password.');
    } finally {
      setIsSubmitting(false);
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
              autoComplete="current-password"
              style={styles.input}
            />
          </View>
          <Pressable style={styles.submit} onPress={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t.submit}</Text>}
          </Pressable>
        </View>

        <Text style={styles.footerNote}>
          {t.newTenant} <Link href="/register">{t.register}</Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f6f8', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 16 },
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
  input: { borderWidth: 1, borderColor: '#d8dbe0', borderRadius: 10, padding: 12, fontSize: 15 },
  submit: { backgroundColor: '#2f7d5c', borderRadius: 10, padding: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  footerNote: { textAlign: 'center', fontSize: 13, color: '#5b616e' },
});
