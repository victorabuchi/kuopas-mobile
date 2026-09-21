import { useRef, useState, type ReactElement } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../lib/theme';

export type ThreadMessage = {
  id: string;
  content: string;
  sentAt: string;
  isOwn: boolean;
  senderName?: string | null;
};

export default function ThreadView({
  messages,
  emptyText,
  placeholder,
  onSend,
  header,
  maxLength,
  keyboardOffset = 90,
}: {
  messages: ThreadMessage[];
  emptyText: string;
  placeholder: string;
  onSend: (content: string) => Promise<void>;
  header?: ReactElement;
  maxLength?: number;
  keyboardOffset?: number;
}) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ThreadMessage>>(null);

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(content);
      setDraft('');
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send.');
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      <FlatList
        ref={listRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        data={messages}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
        renderItem={({ item }) => (
          <View style={[styles.row, item.isOwn ? styles.rowOut : styles.rowIn]}>
            {!item.isOwn && item.senderName ? <Text style={styles.senderName}>{item.senderName}</Text> : null}
            <View style={[styles.bubble, item.isOwn ? styles.bubbleOut : styles.bubbleIn]}>
              <Text style={item.isOwn ? styles.bubbleTextOut : styles.bubbleTextIn}>{item.content}</Text>
              <Text style={styles.time}>
                {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        )}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          maxLength={maxLength}
          style={styles.composerInput}
          autoComplete="off"
        />
        <Pressable style={styles.send} onPress={send} disabled={sending}>
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 10, flexGrow: 1 },
  empty: { textAlign: 'center', color: colors.faint, marginTop: 24 },
  row: { maxWidth: '80%', gap: 2 },
  rowIn: { alignSelf: 'flex-start' },
  rowOut: { alignSelf: 'flex-end' },
  senderName: { fontSize: 12, color: colors.faint },
  bubble: { borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, gap: 2 },
  bubbleIn: { backgroundColor: colors.card },
  bubbleOut: { backgroundColor: colors.accent },
  bubbleTextIn: { color: colors.text, fontSize: 14 },
  bubbleTextOut: { color: '#fff', fontSize: 14 },
  time: { fontSize: 10, color: colors.faint, alignSelf: 'flex-end' },
  error: { color: colors.danger, fontSize: 13, paddingHorizontal: 16, paddingBottom: 4 },
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  composerInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 10, fontSize: 14 },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontSize: 16 },
});
