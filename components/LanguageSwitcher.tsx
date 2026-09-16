import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Locale } from '../lib/i18n';

const LABELS: Record<Locale, string> = { en: 'English', fi: 'Suomi' };

export default function LanguageSwitcher({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  return (
    <View style={styles.switcher}>
      {(Object.keys(LABELS) as Locale[]).map((value) => (
        <Pressable key={value} onPress={() => onChange(value)} hitSlop={8}>
          <Text style={[styles.option, value === locale && styles.optionActive]}>{LABELS[value]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  switcher: { flexDirection: 'row', gap: 12 },
  option: { fontSize: 13, color: '#8a8f98' },
  optionActive: { color: '#111', fontWeight: '600' },
});
