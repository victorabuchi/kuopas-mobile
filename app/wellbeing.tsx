import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import * as api from '../lib/api-client';
import { fs } from '../lib/feature-styles';
import { colors } from '../lib/theme';
import type { WellbeingCase } from '../lib/types';
import { useDictionary } from '../lib/use-dictionary';

// Mirrors kuopas/web/src/app/(app)/wellbeing/page.tsx
export default function WellbeingScreen() {
  const { living } = useDictionary();
  const t = living.wellbeing;

  const [cases, setCases] = useState<WellbeingCase[] | null>(null);
  const [category, setCategory] = useState('mental_health');
  const [severity, setSeverity] = useState('concern');
  const [description, setDescription] = useState('');
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .getWellbeing()
      .then(setCases)
      .catch(() => setCases([]));
  }, []);

  useFocusEffect(load);

  async function submit() {
    setError(null);
    setSent(false);
    try {
      await api.submitWellbeing({ category, severity, description, consent });
      setDescription('');
      setConsent(false);
      setSent(true);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send.');
    }
  }

  return (
    <ScrollView style={fs.page} contentContainerStyle={fs.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t.title }} />

      <Text style={[fs.notice, fs.noticeErr, fs.bold]}>{t.emergency}</Text>
      <Text style={fs.lede}>{t.lede}</Text>
      {sent && <Text style={[fs.notice, fs.noticeOk]}>{t.sent}</Text>}

      <View style={fs.card}>
        <Text style={fs.cardTitle}>{t.formHeading}</Text>
        <View style={fs.field}>
          <Text style={fs.label}>{t.category}</Text>
          <View style={fs.wrap}>
            {Object.entries(t.categories).map(([key, label]) => (
              <Pressable key={key} style={[fs.chip, category === key && fs.chipOn]} onPress={() => setCategory(key)}>
                <Text style={category === key ? fs.chipTextOn : fs.chipText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={fs.field}>
          <Text style={fs.label}>{t.severity}</Text>
          <View style={fs.wrap}>
            {Object.entries(t.severities).map(([key, label]) => (
              <Pressable key={key} style={[fs.chip, severity === key && fs.chipOn]} onPress={() => setSeverity(key)}>
                <Text style={severity === key ? fs.chipTextOn : fs.chipText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={fs.field}>
          <Text style={fs.label}>{t.description}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t.descriptionPlaceholder}
            maxLength={4000}
            multiline
            style={[fs.input, fs.textarea]}
          />
        </View>
        <View style={fs.between}>
          <View style={fs.flex}>
            <Text style={fs.body}>{t.consent}</Text>
            <Text style={fs.meta}>{t.consentNote}</Text>
          </View>
          <Switch value={consent} onValueChange={setConsent} trackColor={{ true: colors.accent }} />
        </View>
        {error && <Text style={[fs.notice, fs.noticeErr]}>{error}</Text>}
        <Pressable style={fs.primary} onPress={submit}>
          <Text style={fs.primaryText}>{t.submit}</Text>
        </Pressable>
      </View>

      <Text style={fs.sectionHeading}>{t.yourRequests}</Text>
      {!cases && <ActivityIndicator />}
      {cases && cases.length === 0 && <Text style={fs.empty}>{t.none}</Text>}
      {cases?.map((c) => (
        <View key={c.id} style={fs.card}>
          <View style={fs.between}>
            <View style={fs.flex}>
              <Text style={fs.itemTitle}>{(t.categories as Record<string, string>)[c.category]}</Text>
              <Text style={fs.meta}>{new Date(c.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={[fs.badge, c.status === 'escalated' ? fs.badgeOk : c.status === 'closed' ? null : fs.badgeWarn]}>
              {(t.status as Record<string, string>)[c.status]}
            </Text>
          </View>
          {c.escalatedTo ? (
            <Text style={fs.meta}>
              {t.sharedWith}: {c.escalatedTo}
            </Text>
          ) : null}
          {c.status !== 'closed' && (
            <Pressable
              style={fs.ghost}
              onPress={async () => {
                await api.closeWellbeing(c.id);
                load();
              }}
            >
              <Text style={fs.ghostText}>{t.close}</Text>
            </Pressable>
          )}
        </View>
      ))}

      <View style={fs.card}>
        <Text style={fs.cardTitle}>{t.callTitle}</Text>
        <Pressable style={fs.primarySmall} onPress={() => Linking.openURL('tel:+358207109740')}>
          <Text style={fs.primaryText}>+358 (0)20 710 9740</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
