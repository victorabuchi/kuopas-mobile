import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as api from '../lib/api-client';
import type { getDictionary } from '../lib/dictionary';
import { colors } from '../lib/theme';

const ITEM_KEYS = ['keys', 'internet', 'waste', 'laundry', 'mailbox', 'contacts'] as const;

// Mirrors MoveInGuideOverlay in kuopas/web/src/app/(app)/MoveInGuideOverlay.tsx
export default function MoveInGuideOverlay({
  dict,
  onDismiss,
}: {
  dict: ReturnType<typeof getDictionary>;
  onDismiss: () => void;
}) {
  const t = dict.moveInGuide;
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    api.getMoveInChecklist().then(setCompleted).catch(() => {});
  }, []);

  const itemLabel: Record<(typeof ITEM_KEYS)[number], string> = {
    keys: t.itemKeys,
    internet: t.itemInternet,
    waste: t.itemWaste,
    laundry: t.itemLaundry,
    mailbox: t.itemMailbox,
    contacts: t.itemContacts,
  };

  async function onToggle(key: string) {
    setCompleted(await api.toggleMoveInItem(key));
  }

  async function onContinue() {
    await api.dismissMoveInGuide();
    onDismiss();
  }

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.cardContent}>
            <Text style={styles.welcome}>{t.welcome}</Text>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.lede}>{t.lede}</Text>

            <View style={styles.list}>
              {ITEM_KEYS.map((key) => {
                const isDone = completed.includes(key);
                return (
                  <Pressable key={key} style={styles.item} onPress={() => onToggle(key)}>
                    <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                      {isDone && <Text style={styles.check}>✓</Text>}
                    </View>
                    <Text style={[styles.label, isDone && styles.labelDone]}>{itemLabel[key]}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.continueButton} onPress={onContinue}>
              <Text style={styles.continueText}>{t.continueButton}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.card, borderRadius: 16, maxHeight: '90%' },
  cardContent: { padding: 24, gap: 12 },
  welcome: { fontSize: 24, fontWeight: '800' },
  title: { fontSize: 16, fontWeight: '700', color: colors.accent },
  lede: { fontSize: 14, color: colors.muted },
  list: { gap: 10, marginVertical: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { color: '#fff', fontWeight: '800', fontSize: 14 },
  label: { fontSize: 15, flex: 1 },
  labelDone: { color: colors.faint, textDecorationLine: 'line-through' },
  continueButton: { backgroundColor: colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  continueText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
