import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import AuthLayout, { auth, Divider } from '../components/AuthLayout';
import GoogleIcon from '../components/GoogleIcon';
import { useAuth } from '../lib/auth-context';
import { colors } from '../lib/theme';
import { useDictionary } from '../lib/use-dictionary';

// Mirrors kuopas/web/src/app/login/page.tsx, laid out like Rannikon's login screen.
export default function LoginScreen() {
  const { locale, setLocale, dict } = useDictionary();
  const { login, loginWithGoogle } = useAuth();
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
      router.replace('/(tabs)/home');
    } catch {
      // Mirrors the generic error in kuopas/web/src/lib/auth-actions.ts loginAction
      setError('Incorrect email or password.');
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
          autoComplete="current-password"
          placeholderTextColor={colors.faint}
          style={auth.input}
        />
      </View>

      {error && <Text style={auth.error}>{error}</Text>}

      <Pressable
        style={({ pressed }) => [auth.button, pressed && auth.buttonPressed, isSubmitting && auth.buttonDisabled]}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={auth.buttonText}>{t.submit}</Text>}
      </Pressable>

      <Divider text={t.orShort} />

      <Pressable style={auth.googleButton} onPress={onGoogle}>
        <GoogleIcon />
        <Text style={auth.googleButtonText}>{t.google}</Text>
      </Pressable>

      <View style={auth.footer}>
        <Text style={auth.footerText}>{t.newTenant}</Text>
        <Link href="/register" style={auth.link}>
          {t.register}
        </Link>
      </View>
    </AuthLayout>
  );
}
