import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as api from '../../lib/api-client';
import type { getDictionary } from '../../lib/dictionary';
import { colors, initials } from '../../lib/theme';
import type { DirectOverview } from '../../lib/types';

// Mirrors DirectTab in kuopas/web/src/app/(app)/messages/page.tsx
export default function DirectTab({ dict }: { dict: ReturnType<typeof getDictionary> }) {
  const [overview, setOverview] = useState<DirectOverview | null>(null);

  useFocusEffect(
    useCallback(() => {
      api
        .getDirectOverview()
        .then(setOverview)
        .catch(() => setOverview({ buildingName: '', conversations: [], contacts: [] }));
    }, []),
  );

  if (!overview) return <ActivityIndicator style={{ marginTop: 24 }} />;

  async function onStart(otherTenantId: string) {
    const id = await api.startConversation(otherTenantId);
    router.push(`/messages/${id}`);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeading}>{dict.messages.conversations}</Text>
      {overview.conversations.length === 0 ? (
        <Text style={styles.empty}>{dict.messages.noneYet}</Text>
      ) : (
        overview.conversations.map(({ id, other, lastMessage }) => (
          <Pressable key={id} style={styles.chatRow} onPress={() => router.push(`/messages/${id}`)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(other.name)}</Text>
            </View>
            <View style={styles.chatRowText}>
              <View style={styles.chatRowTop}>
                <Text style={styles.chatRowName}>{other.name}</Text>
                {lastMessage && (
                  <Text style={styles.chatRowTime}>{new Date(lastMessage.sentAt).toLocaleDateString()}</Text>
                )}
              </View>
              <Text style={styles.chatRowPreview} numberOfLines={1}>
                {lastMessage ? lastMessage.content : dict.chats.noMessagesYet}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      <Text style={styles.sectionHeading}>{dict.messages.startNew}</Text>
      {overview.contacts.length === 0 ? (
        <Text style={styles.empty}>
          {dict.messages.everyone} {overview.buildingName}.
        </Text>
      ) : (
        <View style={styles.people}>
          {overview.contacts.map((contact) => (
            <Pressable key={contact.id} style={styles.person} onPress={() => onStart(contact.id)}>
              <Text style={styles.personText}>{contact.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 8 },
  sectionHeading: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 6 },
  empty: { color: colors.faint, textAlign: 'center', marginVertical: 8 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontWeight: '700' },
  chatRowText: { flex: 1, gap: 2 },
  chatRowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  chatRowName: { fontWeight: '600', fontSize: 15 },
  chatRowTime: { fontSize: 12, color: colors.faint },
  chatRowPreview: { fontSize: 13, color: colors.muted },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  person: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  personText: { fontSize: 13, color: colors.text },
});
