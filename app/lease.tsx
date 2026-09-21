import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import PillTabs from '../components/PillTabs';
import * as api from '../lib/api-client';
import { fs } from '../lib/feature-styles';
import { formatMoney } from '../lib/lease';
import type { getLiving } from '../lib/living';
import { pickDocument } from '../lib/pick-photo';
import type { LeaseOverview, PhotoAttachment } from '../lib/types';
import { useDictionary } from '../lib/use-dictionary';

type T = ReturnType<typeof getLiving>['lease'];
type V = ReturnType<typeof getLiving>['verify'];
type Tab = 'lease' | 'guarantor' | 'verify' | 'room';
type Reload = () => void;

const TABS: Tab[] = ['lease', 'guarantor', 'verify', 'room'];

// Mirrors kuopas/web/src/app/(app)/lease/page.tsx
export default function LeaseScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const { locale, living } = useDictionary();
  const t = living.lease;

  const [tab, setTab] = useState<Tab>(TABS.includes(params.tab as Tab) ? (params.tab as Tab) : 'lease');
  const [data, setData] = useState<LeaseOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .getLease()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
  }, []);

  useFocusEffect(load);

  const labels: Record<Tab, string> = { lease: t.tabLease, guarantor: t.tabGuarantor, verify: t.tabVerify, room: t.tabRoom };
  const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(locale === 'fi' ? 'fi-FI' : 'en-GB', { timeZone: 'UTC' });

  return (
    <View style={fs.page}>
      <Stack.Screen options={{ title: t.title }} />
      <PillTabs tabs={TABS.map((value) => ({ value, label: labels[value] }))} active={tab} onChange={setTab} />
      <ScrollView contentContainerStyle={fs.content} keyboardShouldPersistTaps="handled">
        {error && <Text style={[fs.notice, fs.noticeErr]}>{error}</Text>}
        {!data && !error && <ActivityIndicator />}
        {data && tab === 'lease' && <LeaseTab data={data} t={t} dateFmt={dateFmt} locale={locale} />}
        {data && tab === 'guarantor' && <GuarantorTab data={data} t={t} reload={load} />}
        {data && tab === 'verify' && <VerifyTab data={data} v={living.verify} reload={load} />}
        {data && tab === 'room' && <RoomTab data={data} t={t} />}
      </ScrollView>
    </View>
  );
}

function LeaseTab({ data, t, dateFmt, locale }: { data: LeaseOverview; t: T; dateFmt: (iso: string) => string; locale: string }) {
  if (data.leases.length === 0) return <Text style={fs.notice}>{t.noLease}</Text>;

  const money = (cents: number) => formatMoney(cents, locale === 'fi' ? 'fi-FI' : 'en-FI');
  const now = Date.now();

  return (
    <>
      {data.leases.map((lease) => {
        const start = new Date(lease.startDate).getTime();
        const end = new Date(lease.endDate).getTime();
        const upcoming = start > now;
        const days = Math.ceil(((upcoming ? start : end) - now) / 86_400_000);
        const total = lease.charges.reduce((sum, c) => sum + c.amountCents, 0);
        const statusLabel =
          lease.status === 'cancelled' ? t.cancelled : lease.status === 'ended' || end < now ? t.ended : upcoming ? t.upcoming : t.active;

        return (
          <View key={lease.id} style={fs.card}>
            <View style={fs.between}>
              <View style={fs.flex}>
                <Text style={fs.cardTitle}>{(t.kinds as Record<string, string>)[lease.kind] ?? lease.kind}</Text>
                <Text style={fs.meta}>
                  {dateFmt(lease.startDate)} - {dateFmt(lease.endDate)}
                </Text>
              </View>
              <Text style={[fs.badge, statusLabel === t.active ? fs.badgeOk : null]}>{statusLabel}</Text>
            </View>

            <View style={fs.kv}>
              <Text style={fs.kvLabel}>{t.unit}</Text>
              <Text style={fs.kvValue}>{lease.unitCode}</Text>
            </View>
            <View style={fs.kv}>
              <Text style={fs.kvLabel}>{t.rent}</Text>
              <Text style={fs.kvValue}>{money(lease.monthlyRentCents)}</Text>
            </View>
            <View style={fs.kv}>
              <Text style={fs.kvLabel}>{t.deposit}</Text>
              <Text style={fs.kvValue}>{money(lease.depositCents)}</Text>
            </View>
            <View style={fs.kv}>
              <Text style={fs.kvLabel}>{t.upfront}</Text>
              <Text style={fs.kvValue}>{lease.upfrontMonths > 0 ? `${lease.upfrontMonths} ${t.months}` : t.upfrontNone}</Text>
            </View>
            {days > 0 && lease.status === 'active' && (
              <View style={fs.kv}>
                <Text style={fs.kvLabel}>{upcoming ? t.startsIn : t.daysLeft}</Text>
                <Text style={fs.kvValue}>{days}</Text>
              </View>
            )}

            <Text style={fs.sectionHeading}>{t.schedule}</Text>
            <Text style={fs.lede}>{t.scheduleLede}</Text>
            {lease.charges.map((c) => (
              <View key={c.id} style={fs.between}>
                <View style={fs.flex}>
                  <Text style={fs.body}>
                    {dateFmt(c.periodStart)} - {dateFmt(c.periodEnd)}
                  </Text>
                  <Text style={fs.meta}>
                    {t.due} {dateFmt(c.dueDate)}
                    {c.prorated ? ` · ${t.prorated}` : ''}
                  </Text>
                </View>
                <Text style={fs.itemTitle}>{money(c.amountCents)}</Text>
                <Text style={[fs.badge, c.paidAt ? fs.badgeOk : null]}>{c.paidAt ? t.paid : t.unpaid}</Text>
              </View>
            ))}
            <View style={fs.kv}>
              <Text style={fs.kvLabel}>{t.total}</Text>
              <Text style={fs.kvValue}>{money(total)}</Text>
            </View>
          </View>
        );
      })}
    </>
  );
}

function GuarantorTab({ data, t, reload }: { data: LeaseOverview; t: T; reload: Reload }) {
  const { requests, institutions } = data.guarantor;
  const latest = requests[0];
  const approved = requests.find((r) => r.status === 'approved');
  const pending = requests.find((r) => r.status === 'pending');
  const status = approved
    ? t.guarantorApproved
    : pending
      ? t.guarantorPending
      : latest?.status === 'rejected'
        ? t.guarantorRejected
        : t.guarantorNone;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(input: Parameters<typeof api.requestGuarantor>[0]) {
    setError(null);
    try {
      await api.requestGuarantor(input);
      setSent(true);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send.');
    }
  }

  return (
    <>
      <View style={fs.card}>
        <Text style={fs.cardTitle}>{t.guarantorHeading}</Text>
        <Text style={fs.lede}>{t.guarantorLede}</Text>
        <View style={fs.kv}>
          <Text style={fs.kvLabel}>{t.guarantorStatus}</Text>
          <Text style={[fs.badge, approved ? fs.badgeOk : pending ? fs.badgeWarn : latest?.status === 'rejected' ? fs.badgeBad : null]}>
            {status}
          </Text>
        </View>
        {latest?.staffNote ? (
          <Text style={fs.notice}>
            <Text style={fs.bold}>{t.staffNote}:</Text> {latest.staffNote}
          </Text>
        ) : null}
        {sent && <Text style={[fs.notice, fs.noticeOk]}>{t.requestSent}</Text>}
        {error && <Text style={[fs.notice, fs.noticeErr]}>{error}</Text>}
      </View>

      {!approved && !pending && (
        <>
          <Text style={fs.sectionHeading}>{t.institutions}</Text>
          {institutions.length === 0 && <Text style={fs.empty}>{t.noInstitutions}</Text>}
          {institutions.map((inst) => (
            <View key={inst.id} style={fs.card}>
              <Text style={fs.itemTitle}>{inst.name}</Text>
              <Text style={fs.meta}>{inst.description}</Text>
              <Pressable style={fs.primarySmall} onPress={() => send({ institutionId: inst.id })}>
                <Text style={fs.primaryText}>{t.chooseInstitution}</Text>
              </Pressable>
            </View>
          ))}

          <View style={fs.card}>
            <Text style={fs.cardTitle}>{t.personalHeading}</Text>
            <View style={fs.field}>
              <Text style={fs.label}>{t.guarantorName}</Text>
              <TextInput value={name} onChangeText={setName} style={fs.input} />
            </View>
            <View style={fs.field}>
              <Text style={fs.label}>{t.guarantorEmail}</Text>
              <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={fs.input} />
            </View>
            <View style={fs.field}>
              <Text style={fs.label}>{t.guarantorPhone}</Text>
              <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={fs.input} />
            </View>
            <Pressable
              style={fs.primary}
              onPress={() => send({ guarantorName: name, guarantorEmail: email, guarantorPhone: phone })}
            >
              <Text style={fs.primaryText}>{t.requestGuarantor}</Text>
            </Pressable>
          </View>
        </>
      )}
    </>
  );
}

function VerifyTab({ data, v, reload }: { data: LeaseOverview; v: V; reload: Reload }) {
  const { verified, approvedMethod, approvedInstitution, records } = data.verification;
  const pending = records.find((r) => r.status === 'pending');
  const methodLabel = (m: string) => (v.methods as Record<string, string>)[m] ?? m;
  const errors: Record<string, string> = {
    code: v.codeWrong,
    not_university: v.notUniversity,
    cooldown: v.cooldown,
    email_unavailable: v.emailUnavailable,
    file: v.docMissing,
  };

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [docMethod, setDocMethod] = useState('enrollment_document');
  const [institution, setInstitution] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [file, setFile] = useState<PhotoAttachment | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err' | 'warn'; text: string } | null>(null);

  // Failed verification calls answer with { "error": "<key>" } which maps to web copy.
  function fail(e: unknown) {
    let text = e instanceof Error ? e.message : 'Something went wrong.';
    try {
      const key = JSON.parse(text).error as string;
      text = errors[key] ?? text;
    } catch {}
    setMessage({ kind: 'err', text });
  }

  async function sendCode() {
    setMessage(null);
    try {
      const { devCode } = await api.requestEmailCode(email.trim());
      setMessage({ kind: 'ok', text: devCode ? `${v.codeSent} ${v.devCodeNote} ${devCode}` : v.codeSent });
    } catch (e) {
      fail(e);
    }
  }

  async function confirm() {
    setMessage(null);
    try {
      await api.confirmEmailCode(code.trim());
      setMessage({ kind: 'ok', text: v.justVerified });
      reload();
    } catch (e) {
      fail(e);
    }
  }

  async function submitDoc() {
    setMessage(null);
    if (!file) {
      setMessage({ kind: 'err', text: v.docMissing });
      return;
    }
    try {
      await api.submitVerificationDocument(docMethod, institution, studentNumber, file);
      setMessage({ kind: 'ok', text: v.docSubmitted });
      setFile(null);
      reload();
    } catch (e) {
      fail(e);
    }
  }

  return (
    <>
      <View style={fs.card}>
        <Text style={fs.cardTitle}>{v.title}</Text>
        <Text style={fs.lede}>{v.lede}</Text>
        <View style={fs.kv}>
          <Text style={fs.kvLabel}>{v.tab}</Text>
          <Text style={[fs.badge, verified ? fs.badgeOk : pending ? fs.badgeWarn : null]}>
            {verified ? v.statusVerified : pending ? v.statusPending : v.statusNone}
          </Text>
        </View>
        {approvedMethod && (
          <View style={fs.kv}>
            <Text style={fs.kvLabel}>{v.verifiedVia}</Text>
            <Text style={fs.kvValue}>
              {methodLabel(approvedMethod)}
              {approvedInstitution ? ` · ${approvedInstitution}` : ''}
            </Text>
          </View>
        )}
        {message && (
          <Text style={[fs.notice, message.kind === 'ok' ? fs.noticeOk : message.kind === 'err' ? fs.noticeErr : fs.noticeWarn]}>
            {message.text}
          </Text>
        )}
      </View>

      {!verified && (
        <>
          <View style={fs.card}>
            <Text style={fs.cardTitle}>{v.emailHeading}</Text>
            <Text style={fs.lede}>{v.emailLede}</Text>
            <View style={fs.field}>
              <Text style={fs.label}>{v.emailLabel}</Text>
              <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={fs.input} />
            </View>
            <Pressable style={fs.primarySmall} onPress={sendCode}>
              <Text style={fs.primaryText}>{v.sendCode}</Text>
            </Pressable>
            <View style={fs.field}>
              <Text style={fs.label}>{v.codeLabel}</Text>
              <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} style={fs.input} />
            </View>
            <Pressable style={fs.ghost} onPress={confirm}>
              <Text style={fs.ghostText}>{v.confirm}</Text>
            </Pressable>
          </View>

          {!pending && (
            <View style={fs.card}>
              <Text style={fs.cardTitle}>{v.docHeading}</Text>
              <Text style={fs.lede}>{v.docLede}</Text>
              <View style={fs.field}>
                <Text style={fs.label}>{v.docType}</Text>
                <View style={fs.inline}>
                  {(['enrollment_document', 'government_id'] as const).map((m) => (
                    <Pressable key={m} style={[fs.chip, docMethod === m && fs.chipOn]} onPress={() => setDocMethod(m)}>
                      <Text style={docMethod === m ? fs.chipTextOn : fs.chipText}>{methodLabel(m)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={fs.field}>
                <Text style={fs.label}>{v.institution}</Text>
                <TextInput value={institution} onChangeText={setInstitution} style={fs.input} />
              </View>
              <View style={fs.field}>
                <Text style={fs.label}>{v.studentNumber}</Text>
                <TextInput value={studentNumber} onChangeText={setStudentNumber} style={fs.input} />
              </View>
              <View style={fs.field}>
                <Text style={fs.label}>{v.file}</Text>
                <Pressable style={fs.option} onPress={async () => setFile((await pickDocument()) ?? file)}>
                  <Text style={fs.body}>{file ? file.name : v.file}</Text>
                </Pressable>
              </View>
              <Pressable style={fs.primary} onPress={submitDoc}>
                <Text style={fs.primaryText}>{v.submitDoc}</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      {records.length > 0 && (
        <>
          <Text style={fs.sectionHeading}>{v.history}</Text>
          {records.map((r) => (
            <View key={r.id} style={[fs.card, fs.between]}>
              <View style={fs.flex}>
                <Text style={fs.itemTitle}>{methodLabel(r.method)}</Text>
                <Text style={fs.meta}>{new Date(r.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={[fs.badge, r.status === 'approved' ? fs.badgeOk : r.status === 'rejected' ? fs.badgeBad : fs.badgeWarn]}>
                {r.status === 'approved' ? v.approved : r.status === 'rejected' ? v.rejected : v.pending}
              </Text>
            </View>
          ))}
        </>
      )}
    </>
  );
}

function RoomTab({ data, t }: { data: LeaseOverview; t: T }) {
  const { media, roommates } = data.room;
  return (
    <>
      <View style={fs.card}>
        <Text style={fs.cardTitle}>{t.roomHeading}</Text>
        <Text style={fs.lede}>{t.roomLede}</Text>
      </View>

      {media.length === 0 && <Text style={fs.empty}>{t.noMedia}</Text>}
      {media.map((m) => (
        <View key={m.id} style={fs.card}>
          {m.kind === 'video' ? (
            <Pressable style={fs.option} onPress={() => Linking.openURL(api.mediaUrl(m.url))}>
              <Text style={fs.itemTitle}>▶ {m.caption ?? 'Video'}</Text>
            </Pressable>
          ) : (
            <Image source={{ uri: api.mediaUrl(m.url) }} style={{ width: '100%', height: 200, borderRadius: 12 }} />
          )}
          {m.caption && m.kind !== 'video' ? <Text style={fs.meta}>{m.caption}</Text> : null}
        </View>
      ))}

      <Text style={fs.sectionHeading}>{t.roommates}</Text>
      {roommates.length === 0 && <Text style={fs.empty}>{t.noRoommates}</Text>}
      {roommates.map((r) => (
        <View key={r.id} style={[fs.card, fs.between]}>
          <View style={fs.flex}>
            <Text style={fs.itemTitle}>{r.name}</Text>
            {r.bio ? <Text style={fs.meta}>{r.bio}</Text> : null}
          </View>
          {r.verified && <Text style={[fs.badge, fs.badgeOk]}>{t.verifiedBadge}</Text>}
        </View>
      ))}
    </>
  );
}
