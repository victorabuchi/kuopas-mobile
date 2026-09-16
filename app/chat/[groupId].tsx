import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as api from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { displayNameFor } from '../../lib/names';
import type { ChatThread, Message } from '../../lib/types';
import { useDictionary } from '../../lib/use-dictionary';

export default function ChatThreadScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { dict } = useDictionary();
  const { tenant } = useAuth();
  const t = dict.chatThread;

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    api
      .getChatThread(groupId)
      .then(setThread)
      .catch(() => setThread(null))
      .finally(() => setIsLoading(false));
  }, [groupId]);

  async function onSend() {
    if (!draft.trim()) return;
    const message = await api.sendMessage(groupId, draft);
    setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
    setDraft('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  if (isLoading) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!thread) return null;

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.topBarTitle}>{thread.group.name}</Text>
          <Text style={styles.topBarSubtitle}>
            {thread.group.memberCount} {dict.groups.members}
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        data={thread.messages}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>{t.noMessagesSayHello}</Text>}
        renderItem={({ item }) => {
          const isOwn = tenant ? item.sender.id === tenant.id : false;
          return (
            <View style={[styles.row, isOwn ? styles.rowOut : styles.rowIn]}>
              {!isOwn && <Text style={styles.senderName}>{displayNameFor(item.sender, thread.group.scope)}</Text>}
              <View style={[styles.bubble, isOwn ? styles.bubbleOut : styles.bubbleIn]}>
                <Text style={isOwn ? styles.bubbleTextOut : styles.bubbleTextIn}>{item.content}</Text>
                <Text style={styles.time}>
                  {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t.placeholder}
          style={styles.composerInput}
          autoComplete="off"
        />
        <Pressable style={styles.send} onPress={onSend}>
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f6f8' },
  loadingPage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eceef1',
  },
  back: { fontSize: 28, color: '#2f7d5c' },
  topBarTitle: { fontWeight: '700', fontSize: 16 },
  topBarSubtitle: { fontSize: 12, color: '#8a8f98' },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: '#8a8f98', marginTop: 24 },
  row: { maxWidth: '80%', gap: 2 },
  rowIn: { alignSelf: 'flex-start' },
  rowOut: { alignSelf: 'flex-end' },
  senderName: { fontSize: 12, color: '#8a8f98' },
  bubble: { borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, gap: 2 },
  bubbleIn: { backgroundColor: '#fff' },
  bubbleOut: { backgroundColor: '#2f7d5c' },
  bubbleTextIn: { color: '#111', fontSize: 14 },
  bubbleTextOut: { color: '#fff', fontSize: 14 },
  time: { fontSize: 10, color: '#8a8f98', alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eceef1',
  },
  composerInput: { flex: 1, borderWidth: 1, borderColor: '#d8dbe0', borderRadius: 20, padding: 10, fontSize: 14 },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2f7d5c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontSize: 16 },
});
