import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as api from '../../lib/api-client';
import type { getDictionary } from '../../lib/dictionary';
import type { SimpleMessage } from '../../lib/types';
import ThreadView from '../ThreadView';

// Mirrors ChatTab in kuopas/web/src/app/(app)/messages/page.tsx (the "Kuopas" chat)
export default function NoticesTab({ dict }: { dict: ReturnType<typeof getDictionary> }) {
  const t = dict.notices;
  const [messages, setMessages] = useState<SimpleMessage[] | null>(null);

  useEffect(() => {
    api
      .getNotices()
      .then(setMessages)
      .catch(() => setMessages([]));
  }, []);

  if (!messages) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <View style={{ flex: 1 }}>
      <ThreadView
        messages={messages.map((m) => ({ ...m, senderName: t.fromKuopas }))}
        emptyText={t.noMessagesYet}
        placeholder={t.placeholder}
        keyboardOffset={140}
        onSend={async (content) => {
          const message = await api.replyToNotice(content);
          setMessages((prev) => [...(prev ?? []), message]);
        }}
      />
    </View>
  );
}
