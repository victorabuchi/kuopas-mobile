import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import AuthLayout, { auth, Divider } from '../components/AuthLayout';
import GoogleIcon from '../components/GoogleIcon';
import { getBuildings } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { colors } from '../lib/theme';
import type { Building } from '../lib/types';
import { useDictionary } from '../lib/use-dictionary';

// Mirrors kuopas/web/src/app/register/page.tsx, laid out like Rannikon's register screen.
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
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onGoogle() {
    setError(null);
    try {
      if (await loginWithGoogle()) router.replace('/(tabs)/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    }
  }

  return (
    <AuthLayout heading={t.heading} lede={t.lede} locale={locale} onLocaleChange={setLocale}>
      <View style={auth.suomiFi}>
        <Text style={auth.suomiFiText}>{t.suomiFi}</Text>
        <Text style={auth.suomiFiTag}>{t.comingSoon}</Text>
      </View>

      <Divider text={t.or} />

      <View style={auth.field}>
        <Text style={auth.label}>{t.fullName}</Text>
        <TextInput value={name} onChangeText={setName} autoComplete="name" autoCapitalize="words" placeholderTextColor={colors.faint} style={auth.input} />
      </View>
      <View style={auth.field}>
        <Text style={auth.label}>{t.email}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          placeholderTextColor={colors.faint}
          style={auth.input}
        />
      </View>
      <View style={auth.field}>
        <Text style={auth.label}>{t.password}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholderTextColor={colors.faint}
          style={auth.input}
        />
        <Text style={auth.hint}>{t.passwordHint}</Text>
      </View>
      <View style={auth.field}>
        <Text style={auth.label}>{t.unit}</Text>
        <View style={styles.unitList}>
          {buildings.length === 0 && <Text style={auth.hint}>{t.selectUnit}</Text>}
          {buildings.map((building) =>
            building.stairwells.map((stairwell) =>
              stairwell.units.map((unit) => {
                const label = `${building.name}, ${stairwell.label}${unit.code} (floor ${unit.floor})`;
                const selected = unitId === unit.id;
                return (
                  <Pressable key={unit.id} onPress={() => setUnitId(unit.id)} style={[styles.unitOption, selected && styles.unitOptionSelected]}>
                    <Text style={selected ? styles.unitTextSelected : styles.unitText}>{label}</Text>
                  </Pressable>
                );
              }),
            ),
          )}
        </View>
      </View>

      {error && <Text style={auth.error}>{error}</Text>}

      <Pressable
        style={({ pressed }) => [auth.button, pressed && auth.buttonPressed, isSubmitting && auth.buttonDisabled]}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={auth.buttonText}>{t.submit}</Text>}
      </Pressable>

      <Divider text={dict.login.orShort} />

      <Pressable style={auth.googleButton} onPress={onGoogle}>
        <GoogleIcon />
        <Text style={auth.googleButtonText}>{dict.login.google}</Text>
      </Pressable>

      <View style={auth.footer}>
        <Text style={auth.footerText}>{t.haveAccount}</Text>
        <Link href="/login" style={auth.link}>
          {t.logIn}
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  unitList: { gap: 6 },
  unitOption: { borderWidth: 1, borderColor: '#d0d7de', borderRadius: 8, padding: 10 },
  unitOptionSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  unitText: { fontSize: 14, color: colors.text },
  unitTextSelected: { fontSize: 14, color: colors.accent, fontWeight: '600' },
});
