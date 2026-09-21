import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as api from '../../lib/api-client';
import { colors, initials } from '../../lib/theme';
import type { Community } from '../../lib/types';
import { useDictionary } from '../../lib/use-dictionary';

// Mirrors kuopas/web/src/app/(app)/communities/page.tsx
export default function CommunitiesScreen() {
  const { dict } = useDictionary();
  const t = dict.communities;

  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      api
        .getCommunities()
        .then(setCommunities)
        .catch(() => setCommunities([]))
        .finally(() => setIsLoading(false));
    }, []),
  );

  const joined = communities.filter((c) => c.isMember);
  const others = communities.filter((c) => !c.isMember);

  async function onCreate() {
    setError(null);
    if (name.trim().length < 3) {
      setError('Name must be 3 to 50 characters');
      return;
    }
    try {
      const id = await api.createCommunity(name, description);
      setName('');
      setDescription('');
      router.push(`/communities/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create.');
    }
  }

  async function onJoin(id: string) {
    await api.joinCommunity(id);
    router.push(`/communities/${id}`);
  }

  function Row({ community }: { community: Community }) {
    return (
      <View style={styles.row}>
        <View style={styles.rowAvatar}>
          <Text style={styles.rowAvatarText}>{initials(community.name)}</Text>
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowName}>{community.name}</Text>
          {community.description ? <Text style={styles.rowDesc}>{community.description}</Text> : null}
          <Text style={styles.rowMeta}>
            {community.memberCount} {t.members}
          </Text>
        </View>
        <Pressable
          style={styles.rowAction}
          onPress={() => (community.isMember ? router.push(`/communities/${community.id}`) : onJoin(community.id))}
        >
          <Text style={styles.rowActionText}>{community.isMember ? t.open : t.join}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>{t.title}</Text>

      <View style={styles.create}>
        <Text style={styles.createHeading}>{t.createHeading}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={50}
          placeholder={t.namePlaceholder}
          style={styles.input}
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          maxLength={200}
          placeholder={t.descriptionPlaceholder}
          style={styles.input}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.createBtn} onPress={onCreate}>
          <Text style={styles.createBtnText}>{t.create}</Text>
        </Pressable>
      </View>

      {isLoading && <ActivityIndicator />}

      {joined.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>{t.yourCommunities}</Text>
          {joined.map((c) => (
            <Row key={c.id} community={c} />
          ))}
        </View>
      )}

      {!isLoading && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>{t.discover}</Text>
          {communities.length === 0 && <Text style={styles.empty}>{t.noneYet}</Text>}
          {communities.length > 0 && others.length === 0 && <Text style={styles.empty}>{t.nothingToJoin}</Text>}
          {others.map((c) => (
            <Row key={c.id} community={c} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingTop: 16, gap: 16 },
  pageTitle: { fontSize: 22, fontWeight: '700' },
  create: { backgroundColor: colors.card, borderRadius: 12, padding: 12, gap: 8 },
  createHeading: { fontSize: 15, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, fontSize: 14 },
  error: { color: colors.danger, fontSize: 13 },
  createBtn: { backgroundColor: colors.accent, borderRadius: 10, padding: 12, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '600' },
  section: { gap: 8 },
  sectionHeading: { fontSize: 13, fontWeight: '700', color: colors.muted },
  empty: { color: colors.faint, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarText: { color: colors.accent, fontWeight: '700' },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontWeight: '600', fontSize: 15 },
  rowDesc: { fontSize: 13, color: colors.muted },
  rowMeta: { fontSize: 12, color: colors.faint },
  rowAction: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.accentSoft },
  rowActionText: { color: colors.accent, fontWeight: '600', fontSize: 13 },
});
