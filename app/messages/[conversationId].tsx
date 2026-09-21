import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import ThreadView from '../../components/ThreadView';
import * as api from '../../lib/api-client';
import type { DirectThread } from '../../lib/types';
import { useDictionary } from '../../lib/use-dictionary';

// Mirrors kuopas/web/src/app/(app)/messages/[conversationId]/page.tsx
export default function DirectThreadScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { dict } = useDictionary();

  const [thread, setThread] = useState<DirectThread | null>(null);

  useEffect(() => {
    api
      .getDirectThread(conversationId)
      .then(setThread)
      .catch(() => setThread(null));
  }, [conversationId]);

  if (!thread) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: thread.other.name }} />
      <ThreadView
        messages={thread.messages}
        emptyText={dict.messages.noMessagesSayHello}
        placeholder={dict.messages.placeholder}
        onSend={async (content) => {
          const message = await api.sendDirectMessage(conversationId, content);
          setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
        }}
      />
    </>
  );
}
