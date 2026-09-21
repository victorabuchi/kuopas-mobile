import type { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Locale } from '../lib/i18n';
import { colors } from '../lib/theme';
import LanguageSelector from './LanguageSelector';

// The layout of Rannikon's login and register screens: a full-screen page, the
// language selector at the top right, then the logo, a title and a subtitle
// centred above the form.
export default function AuthLayout({
  heading,
  lede,
  locale,
  onLocaleChange,
  children,
}: {
  heading: string;
  lede: string;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.langBar, { paddingTop: insets.top + 8 }]}>
        <LanguageSelector locale={locale} onChange={onLocaleChange} />
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={require('../assets/kuopas-logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Kuopas" />
        <Text style={styles.title}>{heading}</Text>
        <Text style={styles.subtitle}>{lede}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const auth = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  hint: { fontSize: 12, color: colors.faint, marginTop: 4 },
  input: {
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  error: { fontSize: 14, color: '#cf2e2e', marginBottom: 12, textAlign: 'center' },
  button: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonPressed: { backgroundColor: '#03552d' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  suomiFi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f3f3',
    borderWidth: 1,
    borderColor: '#e7e7e7',
  },
  suomiFiText: { fontSize: 15, fontWeight: '700', color: '#939393' },
  suomiFiTag: { fontSize: 11, color: '#939393' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e7e7e7' },
  dividerText: { fontSize: 12, color: colors.faint },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonText: { fontSize: 15, fontWeight: '600', color: '#3c4043' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 24 },
  footerText: { fontSize: 14, color: colors.faint },
  link: { fontSize: 14, fontWeight: '600', color: colors.accent },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  langBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16 },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  logo: { height: 48, width: 252, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.accent, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.faint, textAlign: 'center', marginBottom: 28 },
});

export function Divider({ text }: { text: string }) {
  return (
    <View style={auth.divider}>
      <View style={auth.dividerLine} />
      <Text style={auth.dividerText}>{text}</Text>
      <View style={auth.dividerLine} />
    </View>
  );
}
