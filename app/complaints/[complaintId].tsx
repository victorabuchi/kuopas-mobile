import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { complaintCategoryLabels, complaintStatusLabels } from '../../components/messages/ComplaintsTab';
import ThreadView from '../../components/ThreadView';
import * as api from '../../lib/api-client';
import { colors } from '../../lib/theme';
import type { ComplaintThread } from '../../lib/types';
import { useDictionary } from '../../lib/use-dictionary';

// Mirrors kuopas/web/src/app/(app)/complaints/[complaintId]/page.tsx
export default function ComplaintThreadScreen() {
  const { complaintId } = useLocalSearchParams<{ complaintId: string }>();
  const { dict } = useDictionary();
  const t = dict.complaints;

  const [thread, setThread] = useState<ComplaintThread | null>(null);

  useEffect(() => {
    api
      .getComplaintThread(complaintId)
      .then(setThread)
      .catch(() => setThread(null));
  }, [complaintId]);

  if (!thread) {
    return (
      <View style={styles.loading}>
        <Stack.Screen options={{ title: t.title }} />
        <ActivityIndicator />
      </View>
    );
  }

  const { complaint } = thread;
  const status = complaintStatusLabels(t)[complaint.status];

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: complaintCategoryLabels(t)[complaint.category] }} />
      <ThreadView
        messages={thread.messages.map((m) => ({ ...m, senderName: 'Kuopas' }))}
        emptyText={t.noMessagesYet}
        placeholder={t.placeholder}
        header={
          <View style={styles.detail}>
            <View style={styles.detailTop}>
              <Text style={styles.detailMeta}>{new Date(complaint.createdAt).toLocaleString()}</Text>
              <Text style={[styles.status, { backgroundColor: status.background, color: status.color }]}>
                {status.label}
              </Text>
            </View>
            <Text style={styles.detailDescription}>{complaint.description}</Text>
            {complaint.photoUrl && <Image source={{ uri: api.mediaUrl(complaint.photoUrl) }} style={styles.detailPhoto} />}
            {complaint.videoUrl ? (
              <Pressable onPress={() => Linking.openURL(api.mediaUrl(complaint.videoUrl!))}>
                <Text style={styles.videoLink}>▶ Video</Text>
              </Pressable>
            ) : null}
          </View>
        }
        onSend={async (content) => {
          const message = await api.sendComplaintMessage(complaintId, content);
          setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  detail: { backgroundColor: colors.card, borderRadius: 12, padding: 14, gap: 8, marginBottom: 8 },
  detailTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailMeta: { fontSize: 12, color: colors.faint },
  status: { fontSize: 11, fontWeight: '600', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, overflow: 'hidden' },
  detailDescription: { fontSize: 14, color: colors.body },
  videoLink: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  detailPhoto: { width: '100%', height: 200, borderRadius: 10 },
});
