import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as api from '../lib/api-client';
import type { getLiving } from '../lib/living';
import { colors } from '../lib/theme';
import type { GroupSelection, Residents } from '../lib/types';

type T = ReturnType<typeof getLiving>['booking'];

// Mirrors BookingPanel in kuopas/web/src/app/(app)/booking/BookingPanel.tsx
export default function GroupPanel({
  t,
  whenLabel,
  hoursOptions,
  capacity,
  withNote,
  onConfirm,
  onCancel,
}: {
  t: T;
  whenLabel: string;
  hoursOptions: number[];
  capacity: number;
  withNote: boolean;
  onConfirm: (input: { hours: number; note: string } & GroupSelection) => Promise<void>;
  onCancel: () => void;
}) {
  const [residents, setResidents] = useState<Residents | null>(null);
  const [hours, setHours] = useState(hoursOptions[0] ?? 1);
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [inviteApartment, setInviteApartment] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getResidents().then(setResidents).catch(() => setResidents({ roommates: [], others: [] }));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm({ hours, note, participants: selected, inviteApartment });
    } finally {
      setBusy(false);
    }
  }

  function Person({ id, label }: { id: string; label: string }) {
    const on = selected.includes(id);
    return (
      <Pressable style={styles.check} onPress={() => toggle(id)}>
        <View style={[styles.box, on && styles.boxOn]}>{on && <Text style={styles.tick}>✓</Text>}</View>
        <Text style={styles.checkLabel}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{t.panelHeading}</Text>
      <Text style={styles.meta}>
        {t.selected}: <Text style={styles.bold}>{whenLabel}</Text>
      </Text>

      {hoursOptions.length > 1 && (
        <View style={styles.field}>
          <Text style={styles.label}>{t.length}</Text>
          <View style={styles.row}>
            {hoursOptions.map((n) => (
              <Pressable key={n} style={[styles.chip, hours === n && styles.chipOn]} onPress={() => setHours(n)}>
                <Text style={hours === n ? styles.chipTextOn : styles.chipText}>{t.hoursOption.replace('{n}', String(n))}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {withNote && (
        <View style={styles.field}>
          <Text style={styles.label}>{t.note}</Text>
          <TextInput value={note} onChangeText={setNote} maxLength={200} placeholder={t.notePlaceholder} style={styles.input} />
        </View>
      )}

      <View style={styles.group}>
        <Text style={styles.groupTitle}>{t.groupHeading}</Text>
        <Text style={styles.hint}>
          {t.groupLede} {t.capacity.replace('{n}', String(capacity))}
        </Text>

        {!residents && <ActivityIndicator />}

        {residents && residents.roommates.length > 0 && (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.checkLabel}>{t.inviteApartment}</Text>
              <Switch value={inviteApartment} onValueChange={setInviteApartment} trackColor={{ true: colors.accent }} />
            </View>
            <Text style={styles.hint}>{t.yourApartment}</Text>
            {residents.roommates.map((r) => (
              <Person key={r.id} id={r.id} label={r.name} />
            ))}
          </>
        )}

        {residents && residents.others.length > 0 && (
          <>
            <Pressable onPress={() => setShowOthers((v) => !v)}>
              <Text style={styles.link}>
                {showOthers ? '▾' : '▸'} {t.otherResidents}
              </Text>
            </Pressable>
            {showOthers &&
              residents.others.map((r) => (
                <Person key={r.id} id={r.id} label={`${r.name}  ·  ${t.apartmentShort} ${r.unitCode}`} />
              ))}
          </>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={confirm} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{t.confirm}</Text>}
        </Pressable>
        <Pressable style={styles.ghost} onPress={onCancel}>
          <Text style={styles.ghostText}>{t.cancelPanel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.card, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.accent },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, color: colors.muted },
  bold: { fontWeight: '700', color: colors.text },
  field: { gap: 6 },
  label: { fontSize: 13, color: colors.muted },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.chip },
  chipOn: { backgroundColor: colors.accent },
  chipText: { fontSize: 13, color: colors.muted },
  chipTextOn: { fontSize: 13, color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, fontSize: 14 },
  group: { gap: 8 },
  groupTitle: { fontSize: 14, fontWeight: '700' },
  hint: { fontSize: 12, color: colors.faint },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  tick: { color: '#fff', fontWeight: '800', fontSize: 12 },
  checkLabel: { fontSize: 14, flexShrink: 1 },
  link: { fontSize: 13, color: colors.accent, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  primary: { flex: 1, backgroundColor: colors.accent, borderRadius: 10, padding: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '600' },
  ghost: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  ghostText: { color: colors.muted, fontWeight: '600' },
});
