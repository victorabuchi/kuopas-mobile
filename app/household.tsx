import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ChoreWheel from '../components/ChoreWheel';
import PillTabs from '../components/PillTabs';
import * as api from '../lib/api-client';
import type { getLiving } from '../lib/living';
import { splitCents } from '../lib/split';
import { colors } from '../lib/theme';
import type { Household } from '../lib/types';
import { useDictionary } from '../lib/use-dictionary';

type T = ReturnType<typeof getLiving>['household'];
type Tab = 'bills' | 'chores' | 'chat';

// Mirrors kuopas/web/src/app/(app)/household/page.tsx
export default function HouseholdScreen() {
  const { locale, living } = useDictionary();
  const t = living.household;

  const [tab, setTab] = useState<Tab>('bills');
  const [data, setData] = useState<Household | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .getHousehold()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
  }, []);

  useFocusEffect(load);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    load();
  }

  const nameOf = useMemo(
    () => new Map((data?.members ?? []).map((m) => [m.id, m.id === data?.meId ? t.you : m.name])),
    [data, t.you],
  );

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: t.title }} />
      <PillTabs
        tabs={[
          { value: 'bills' as const, label: t.tabBills },
          { value: 'chores' as const, label: t.tabChores },
          { value: 'chat' as const, label: t.tabChat },
        ]}
        active={tab}
        onChange={setTab}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error && <Text style={styles.error}>{error}</Text>}
        {!data && !error && <ActivityIndicator />}
        {data && tab === 'bills' && <BillsTab data={data} nameOf={nameOf} t={t} locale={locale} run={run} />}
        {data && tab === 'chores' && <ChoresTab data={data} nameOf={nameOf} t={t} locale={locale} run={run} />}
        {data && tab === 'chat' && <ChatTab data={data} t={t} />}
      </ScrollView>
    </View>
  );
}

type TabProps = {
  data: Household;
  nameOf: Map<string, string>;
  t: T;
  locale: string;
  run: (action: () => Promise<void>) => Promise<void>;
};

function BillsTab({ data, nameOf, t, locale, run }: TabProps) {
  const money = (cents: number) =>
    new Intl.NumberFormat(locale === 'fi' ? 'fi-FI' : 'en-FI', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  // Net balances: what each other person owes the payer of each unpaid share.
  const owed = new Map<string, number>();
  for (const bill of data.bills) {
    for (const share of bill.shares) {
      if (share.paidAt || share.tenantId === bill.paidById) continue;
      const key = `${share.tenantId}>${bill.paidById}`;
      owed.set(key, (owed.get(key) ?? 0) + share.amountCents);
    }
  }
  const lines: string[] = [];
  const done = new Set<string>();
  for (const [key, cents] of owed) {
    const [debtor, creditor] = key.split('>') as [string, string];
    if (done.has(key)) continue;
    const reverse = owed.get(`${creditor}>${debtor}`) ?? 0;
    done.add(key);
    done.add(`${creditor}>${debtor}`);
    const net = cents - reverse;
    if (net === 0) continue;
    const [from, to] = net > 0 ? [debtor, creditor] : [creditor, debtor];
    lines.push(
      from === data.meId
        ? `${t.youOwe} ${nameOf.get(to)}: ${money(Math.abs(net))}`
        : to === data.meId
          ? `${nameOf.get(from)} ${t.owesYou}: ${money(Math.abs(net))}`
          : `${nameOf.get(from)} ${t.owes} ${nameOf.get(to)}: ${money(Math.abs(net))}`,
    );
  }

  const open = data.bills.filter((b) => b.shares.some((s) => !s.paidAt));
  const settled = data.bills.filter((b) => b.shares.every((s) => s.paidAt));

  function BillRow({ bill }: { bill: Household['bills'][number] }) {
    return (
      <View style={styles.card}>
        <View style={styles.between}>
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>{bill.title}</Text>
            <Text style={styles.meta}>
              {(t.categories as Record<string, string>)[bill.category] ?? bill.category} · {money(bill.totalCents)} · {t.paidByName}{' '}
              {nameOf.get(bill.paidById)}
            </Text>
          </View>
          {bill.paidById === data.meId && (
            <Pressable style={styles.dangerBtn} onPress={() => run(() => api.deleteBill(bill.id))}>
              <Text style={styles.dangerText}>{t.delete}</Text>
            </Pressable>
          )}
        </View>
        {bill.shares.map((share) => (
          <View key={share.id} style={styles.between}>
            <Text style={styles.flex}>
              {nameOf.get(share.tenantId)} · {money(share.amountCents)}
            </Text>
            <View style={styles.inline}>
              <Text style={[styles.badge, share.paidAt ? styles.badgeOk : styles.badgeWarn]}>{share.paidAt ? t.paid : t.pending}</Text>
              {(share.tenantId === data.meId || bill.paidById === data.meId) && share.tenantId !== bill.paidById && (
                <Pressable style={styles.ghostBtn} onPress={() => run(() => api.setSharePaid(share.id, !share.paidAt))}>
                  <Text style={styles.ghostText}>{share.paidAt ? t.markUnpaid : t.markPaid}</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.balanceHeading}</Text>
        {lines.length === 0 ? <Text style={styles.lede}>{t.allSettled}</Text> : lines.map((l) => <Text key={l}>{l}</Text>)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.billsHeading}</Text>
        <Text style={styles.lede}>{t.billsLede}</Text>
      </View>

      <SplitForm data={data} nameOf={nameOf} t={t} run={run} />

      <Text style={styles.sectionHeading}>{t.openBills}</Text>
      {open.length === 0 && <Text style={styles.empty}>{t.noBills}</Text>}
      {open.map((b) => (
        <BillRow key={b.id} bill={b} />
      ))}
      {settled.length > 0 && <Text style={styles.sectionHeading}>{t.settledBills}</Text>}
      {settled.map((b) => (
        <BillRow key={b.id} bill={b} />
      ))}
    </>
  );
}

// Mirrors SplitForm in kuopas/web/src/app/(app)/household/SplitForm.tsx
function SplitForm({ data, nameOf, t, run }: Pick<TabProps, 'data' | 'nameOf' | 't' | 'run'>) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('wifi');
  const [total, setTotal] = useState('');
  const [paidById, setPaidById] = useState(data.meId);
  const [dueDate, setDueDate] = useState('');
  const [included, setIncluded] = useState<Record<string, boolean>>(() => Object.fromEntries(data.members.map((m) => [m.id, true])));
  const [weights, setWeights] = useState<Record<string, string>>(() => Object.fromEntries(data.members.map((m) => [m.id, '1'])));

  const preview = useMemo(() => {
    const cents = Math.round(Number(total.replace(',', '.')) * 100);
    const chosen = data.members.filter((m) => included[m.id]);
    if (!Number.isFinite(cents) || cents <= 0 || chosen.length === 0) return null;
    const parts = splitCents(cents, chosen.map((m) => Math.max(Number(weights[m.id]) || 1, 0.01)));
    return chosen.map((m, i) => ({ id: m.id, name: nameOf.get(m.id) ?? m.name, cents: parts[i]! }));
  }, [total, included, weights, data.members, nameOf]);

  async function save() {
    if (!title.trim() || !preview) return;
    await run(async () => {
      await api.createBill({
        title,
        category,
        total,
        paidById,
        dueDate,
        participants: data.members.filter((m) => included[m.id]).map((m) => ({ id: m.id, weight: Number(weights[m.id]) || 1 })),
      });
      setTitle('');
      setTotal('');
      setDueDate('');
    });
  }

  return (
    <View style={styles.card}>
      <View style={styles.field}>
        <Text style={styles.label}>{t.title_}</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder={t.titlePlaceholder} style={styles.input} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>{t.category}</Text>
        <View style={styles.wrap}>
          {Object.entries(t.categories).map(([key, label]) => (
            <Pressable key={key} style={[styles.chip, category === key && styles.chipOn]} onPress={() => setCategory(key)}>
              <Text style={category === key ? styles.chipTextOn : styles.chipText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>{t.total}</Text>
        <TextInput value={total} onChangeText={setTotal} keyboardType="decimal-pad" style={styles.input} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>{t.paidBy}</Text>
        <View style={styles.wrap}>
          {data.members.map((m) => (
            <Pressable key={m.id} style={[styles.chip, paidById === m.id && styles.chipOn]} onPress={() => setPaidById(m.id)}>
              <Text style={paidById === m.id ? styles.chipTextOn : styles.chipText}>{nameOf.get(m.id)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>{t.dueDate}</Text>
        <TextInput value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" autoCapitalize="none" style={styles.input} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t.splitBetween}</Text>
        {data.members.map((m) => (
          <View key={m.id} style={styles.between}>
            <Pressable style={[styles.inline, styles.flex]} onPress={() => setIncluded((s) => ({ ...s, [m.id]: !s[m.id] }))}>
              <View style={[styles.box, included[m.id] && styles.boxOn]}>{included[m.id] && <Text style={styles.tick}>✓</Text>}</View>
              <Text>{nameOf.get(m.id)}</Text>
            </Pressable>
            <TextInput
              value={weights[m.id] ?? '1'}
              onChangeText={(v) => setWeights((s) => ({ ...s, [m.id]: v }))}
              keyboardType="decimal-pad"
              accessibilityLabel={`${t.weight} ${m.name}`}
              style={[styles.input, styles.weight]}
            />
          </View>
        ))}
        <Text style={styles.meta}>{t.weightHint}</Text>
      </View>

      {preview && (
        <View style={styles.preview}>
          <Text style={styles.bold}>{t.preview}</Text>
          {preview.map((p) => (
            <View key={p.id} style={styles.between}>
              <Text>{p.name}</Text>
              <Text style={styles.bold}>{(p.cents / 100).toFixed(2)} EUR</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.primary} onPress={save}>
        <Text style={styles.primaryText}>{t.saveBill}</Text>
      </Pressable>
    </View>
  );
}

function ChoresTab({ data, nameOf, t, locale, run }: TabProps) {
  const [title, setTitle] = useState('');
  const [everyDays, setEveryDays] = useState('7');
  const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(locale === 'fi' ? 'fi-FI' : 'en-GB');
  const names = data.members.map((m) => nameOf.get(m.id) ?? m.name);
  const now = Date.now();

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.choresHeading}</Text>
        <Text style={styles.lede}>{t.choresLede}</Text>
      </View>

      {data.chores.length === 0 && <Text style={styles.empty}>{t.noChores}</Text>}
      {data.chores.map((chore) => {
        const current = chore.current;
        const idx = Math.max(data.members.findIndex((m) => m.id === current?.assignedToId), 0);
        const overdue = current ? new Date(current.dueDate).getTime() < now : false;
        return (
          <View key={chore.id} style={[styles.card, styles.choreRow]}>
            <ChoreWheel names={names} currentIndex={idx} />
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{chore.title}</Text>
              <Text style={styles.meta}>
                {t.every} {chore.everyDays} {t.days}
              </Text>
              {current && (
                <>
                  <Text style={styles.itemTitle}>
                    {t.upNext}: {nameOf.get(current.assignedToId)}
                  </Text>
                  <Text style={[styles.badge, overdue ? styles.badgeBad : styles.badgeWarn]}>
                    {overdue ? t.overdue : t.due} {dateFmt(current.dueDate)}
                  </Text>
                  <Pressable style={styles.primarySmall} onPress={() => run(() => api.completeChoreTask(current.id))}>
                    <Text style={styles.primaryText}>{t.markDone}</Text>
                  </Pressable>
                </>
              )}
              <Pressable style={styles.dangerBtn} onPress={() => run(() => api.deleteChore(chore.id))}>
                <Text style={styles.dangerText}>{t.removeChore}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.newChore}</Text>
        <View style={styles.field}>
          <Text style={styles.label}>{t.choreName}</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder={t.choreNamePlaceholder} style={styles.input} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t.every}</Text>
          <TextInput value={everyDays} onChangeText={setEveryDays} keyboardType="number-pad" style={styles.input} />
        </View>
        <Pressable
          style={styles.primary}
          onPress={() =>
            title.trim() &&
            run(async () => {
              await api.createChore(title, Number(everyDays) || 7);
              setTitle('');
            })
          }
        >
          <Text style={styles.primaryText}>{t.addChore}</Text>
        </Pressable>
      </View>
    </>
  );
}

function ChatTab({ data, t }: { data: Household; t: T }) {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.boardHeading}</Text>
        <Text style={styles.lede}>{t.boardLede}</Text>
        {data.chatGroupId ? (
          <Pressable style={styles.primary} onPress={() => router.push(`/chat/${data.chatGroupId}`)}>
            <Text style={styles.primaryText}>{t.openChat}</Text>
          </Pressable>
        ) : (
          <Text style={styles.notice}>{t.noApartment}</Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.rules}</Text>
        {t.rulesList.map((rule) => (
          <Text key={rule} style={styles.rule}>
            • {rule}
          </Text>
        ))}
      </View>
      <Text style={styles.sectionHeading}>{t.members}</Text>
      {data.members.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.itemTitle}>{m.name}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, paddingTop: 12 },
  content: { padding: 16, gap: 12 },
  error: { color: colors.danger, fontSize: 14 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  lede: { fontSize: 13, color: colors.muted },
  meta: { fontSize: 12, color: colors.faint },
  empty: { color: colors.faint, textAlign: 'center', marginVertical: 8 },
  sectionHeading: { fontSize: 13, fontWeight: '700', color: colors.muted },
  notice: { backgroundColor: colors.warnSoft, color: colors.warn, padding: 10, borderRadius: 8, overflow: 'hidden' },
  rule: { fontSize: 13, color: colors.body, lineHeight: 20 },
  bold: { fontWeight: '700' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  field: { gap: 6 },
  label: { fontSize: 13, color: colors.muted },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, fontSize: 14 },
  weight: { width: 64, textAlign: 'center', paddingVertical: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.chip },
  chipOn: { backgroundColor: colors.accent },
  chipText: { fontSize: 13, color: colors.muted },
  chipTextOn: { fontSize: 13, color: '#fff', fontWeight: '600' },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  tick: { color: '#fff', fontWeight: '800', fontSize: 12 },
  preview: { backgroundColor: colors.accentSoft, borderRadius: 10, padding: 10, gap: 4 },
  badge: { fontSize: 11, fontWeight: '600', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, overflow: 'hidden', alignSelf: 'flex-start' },
  badgeOk: { backgroundColor: colors.accentSoft, color: colors.accent },
  badgeWarn: { backgroundColor: colors.warnSoft, color: colors.warn },
  badgeBad: { backgroundColor: '#fde7e5', color: colors.danger },
  primary: { backgroundColor: colors.accent, borderRadius: 10, padding: 12, alignItems: 'center' },
  primarySmall: { backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  ghostBtn: { borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border },
  ghostText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  dangerBtn: { borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.danger, alignSelf: 'flex-start' },
  dangerText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  choreRow: { flexDirection: 'row', gap: 12 },
});
