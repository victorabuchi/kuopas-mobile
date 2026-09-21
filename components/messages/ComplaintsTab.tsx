import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as api from '../../lib/api-client';
import type { getDictionary } from '../../lib/dictionary';
import { pickPhoto, pickVideo } from '../../lib/pick-photo';
import { useDictionary } from '../../lib/use-dictionary';
import { colors } from '../../lib/theme';
import type { Complaint, ComplaintCategory, ComplaintStatus, PhotoAttachment } from '../../lib/types';

const CATEGORY_VALUES: ComplaintCategory[] = [
  'plumbing',
  'electrical',
  'heating',
  'appliance',
  'pest',
  'noise',
  'structural',
  'other',
];

export function complaintCategoryLabels(t: ReturnType<typeof getDictionary>['complaints']) {
  return {
    plumbing: t.categoryPlumbing,
    electrical: t.categoryElectrical,
    heating: t.categoryHeating,
    appliance: t.categoryAppliance,
    pest: t.categoryPest,
    noise: t.categoryNoise,
    structural: t.categoryStructural,
    other: t.categoryOther,
  } satisfies Record<ComplaintCategory, string>;
}

export function complaintStatusLabels(t: ReturnType<typeof getDictionary>['complaints']) {
  return {
    new: { label: t.statusSent, background: colors.chip, color: colors.muted },
    in_progress: { label: t.statusAcknowledged, background: colors.warnSoft, color: colors.warn },
    resolved: { label: t.statusResolved, background: colors.accentSoft, color: colors.accent },
  } satisfies Record<ComplaintStatus, { label: string; background: string; color: string }>;
}

// Mirrors ComplaintsTab in kuopas/web/src/app/(app)/messages/page.tsx
export default function ComplaintsTab({ dict }: { dict: ReturnType<typeof getDictionary> }) {
  const t = dict.complaints;
  const { living } = useDictionary();
  const categoryLabel = complaintCategoryLabels(t);
  const statusLabel = complaintStatusLabels(t);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [category, setCategory] = useState<ComplaintCategory>('other');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<PhotoAttachment | null>(null);
  const [video, setVideo] = useState<PhotoAttachment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      api
        .getComplaints()
        .then(setComplaints)
        .catch(() => setComplaints([]))
        .finally(() => setIsLoading(false));
    }, []),
  );

  async function onSubmit() {
    if (!description.trim()) return;
    setError(null);
    try {
      const complaint = await api.submitComplaint(category, description, photo, video);
      setComplaints((prev) => [complaint, ...prev]);
      setDescription('');
      setPhoto(null);
      setVideo(null);
      setCategory('other');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit.');
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.composer}>
        <Text style={styles.composerHeading}>{t.newComplaint}</Text>
        <View style={styles.categoryRow}>
          {CATEGORY_VALUES.map((value) => (
            <Pressable
              key={value}
              onPress={() => setCategory(value)}
              style={[styles.chip, category === value && styles.chipActive]}
            >
              <Text style={category === value ? styles.chipTextActive : styles.chipText}>{categoryLabel[value]}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t.description}
          multiline
          style={[styles.input, styles.textarea]}
        />
        <Pressable style={styles.photoBtn} onPress={async () => setPhoto(await pickPhoto())}>
          <Text style={styles.photoBtnText}>{photo ? photo.name : t.photo}</Text>
        </Pressable>
        {photo && <Image source={{ uri: photo.uri }} style={styles.photoPreview} />}
        <Pressable style={styles.photoBtn} onPress={async () => setVideo(await pickVideo())}>
          <Text style={styles.photoBtnText}>{video ? video.name : living.maintenance.videoLabel}</Text>
        </Pressable>
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.submit} onPress={onSubmit}>
          <Text style={styles.submitText}>{t.submit}</Text>
        </Pressable>
      </View>

      <Text style={styles.listHeading}>{t.yourComplaints}</Text>
      {isLoading && <ActivityIndicator />}
      {!isLoading && complaints.length === 0 && <Text style={styles.empty}>{t.noneYet}</Text>}
      {complaints.map((complaint) => {
        const status = statusLabel[complaint.status];
        return (
          <Pressable
            key={complaint.id}
            style={styles.row}
            onPress={() => router.push(`/complaints/${complaint.id}`)}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowCategory}>{categoryLabel[complaint.category]}</Text>
              <Text style={styles.rowDescription} numberOfLines={2}>
                {complaint.description}
              </Text>
              <Text style={styles.rowMeta}>{new Date(complaint.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.status, { backgroundColor: status.background, color: status.color }]}>
              {status.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12 },
  composer: { backgroundColor: colors.card, borderRadius: 12, padding: 12, gap: 8 },
  composerHeading: { fontSize: 16, fontWeight: '700' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: colors.chip },
  chipActive: { backgroundColor: colors.accent },
  chipText: { fontSize: 12, color: colors.muted },
  chipTextActive: { fontSize: 12, color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, fontSize: 14 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  photoBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10 },
  photoBtnText: { fontSize: 13, color: colors.muted },
  photoPreview: { width: '100%', height: 140, borderRadius: 10 },
  error: { color: colors.danger, fontSize: 13 },
  submit: { backgroundColor: colors.accent, borderRadius: 10, padding: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
  listHeading: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 4 },
  empty: { color: colors.faint, textAlign: 'center', marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
  },
  rowText: { flex: 1, gap: 2 },
  rowCategory: { fontWeight: '700', fontSize: 14 },
  rowDescription: { fontSize: 13, color: colors.body },
  rowMeta: { fontSize: 12, color: colors.faint },
  status: { fontSize: 11, fontWeight: '600', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, overflow: 'hidden' },
});
