import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import ThreadView from '../../components/ThreadView';
import * as api from '../../lib/api-client';
import { displayNameFor } from '../../lib/names';
import { colors } from '../../lib/theme';
import type { CommunityThread } from '../../lib/types';
import { useDictionary } from '../../lib/use-dictionary';

// Mirrors kuopas/web/src/app/(app)/communities/[communityId]/page.tsx
export default function CommunityScreen() {
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const { dict } = useDictionary();
  const t = dict.communities;

  const [thread, setThread] = useState<CommunityThread | null>(null);

  const load = useCallback(() => {
    api
      .getCommunityThread(communityId)
      .then(setThread)
      .catch(() => setThread(null));
  }, [communityId]);

  useEffect(load, [load]);

  if (!thread) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  const { community } = thread;

  async function onJoin() {
    await api.joinCommunity(communityId);
    load();
  }

  async function onLeave() {
    await api.leaveCommunity(communityId);
    router.back();
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${community.name} · ${community.memberCount} ${t.members}`,
          headerRight: community.isMember
            ? () => (
                <Pressable onPress={onLeave} hitSlop={8}>
                  <Text style={styles.leave}>{t.leave}</Text>
                </Pressable>
              )
            : undefined,
        }}
      />

      {!community.isMember ? (
        <View style={styles.gate}>
          <Text style={styles.gateName}>{community.name}</Text>
          {community.description ? <Text style={styles.gateDesc}>{community.description}</Text> : null}
          <Text style={styles.gateNote}>{t.joinToChat}</Text>
          <Pressable style={styles.joinBtn} onPress={onJoin}>
            <Text style={styles.joinBtnText}>{t.join}</Text>
          </Pressable>
        </View>
      ) : (
        <ThreadView
          messages={thread.messages.map((m) => ({ ...m, senderName: displayNameFor(m.sender, 'building') }))}
          emptyText={t.noMessages}
          placeholder={t.placeholder}
          maxLength={2000}
          header={community.description ? <Text style={styles.description}>{community.description}</Text> : undefined}
          onSend={async (content) => {
            const message = await api.sendCommunityMessage(communityId, content);
            setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  leave: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  description: { textAlign: 'center', color: colors.faint, marginBottom: 12 },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, backgroundColor: colors.bg },
  gateName: { fontSize: 20, fontWeight: '700' },
  gateDesc: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  gateNote: { fontSize: 13, color: colors.faint, textAlign: 'center' },
  joinBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28 },
  joinBtnText: { color: '#fff', fontWeight: '600' },
});
