import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import PillTabs from '../components/PillTabs';
import VerifyGate from '../components/VerifyGate';
import * as api from '../lib/api-client';
import { fs } from '../lib/feature-styles';
import type { getLiving } from '../lib/living';
import type { Market } from '../lib/types';
import { useDictionary } from '../lib/use-dictionary';

type T = ReturnType<typeof getLiving>['market'];
type Tab = 'browse' | 'mine' | 'new' | 'requests';
type Run = (action: () => Promise<void>) => Promise<void>;

// Mirrors kuopas/web/src/app/(app)/marketplace/page.tsx
export default function MarketplaceScreen() {
  const { locale, living } = useDictionary();
  const t = living.market;

  const [tab, setTab] = useState<Tab>('browse');
  const [data, setData] = useState<Market | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .getMarket()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
  }, []);

  useFocusEffect(load);

  const run: Run = async (action) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    load();
  };

  return (
    <View style={fs.page}>
      <Stack.Screen options={{ title: t.title }} />
      {data?.verified && (
        <PillTabs
          tabs={[
            { value: 'browse' as const, label: t.tabBrowse },
            { value: 'mine' as const, label: t.tabMine },
            { value: 'new' as const, label: t.tabNew },
            { value: 'requests' as const, label: t.tabRequests },
          ]}
          active={tab}
          onChange={setTab}
        />
      )}
      <ScrollView contentContainerStyle={fs.content} keyboardShouldPersistTaps="handled">
        {error && <Text style={[fs.notice, fs.noticeErr]}>{error}</Text>}
        {!data && !error && <ActivityIndicator />}
        {data && !data.verified && <VerifyGate message={t.verifyFirst} action={t.goVerify} />}
        {data?.verified && tab === 'browse' && <BrowseTab data={data} t={t} locale={locale} run={run} />}
        {data?.verified && tab === 'mine' && <MineTab data={data} t={t} locale={locale} run={run} />}
        {data?.verified && tab === 'new' && (
          <NewTab
            t={t}
            onCreate={async (input) => {
              await api.createListing(input);
              setTab('mine');
              load();
            }}
          />
        )}
        {data?.verified && tab === 'requests' && <RequestsTab data={data} t={t} run={run} />}
      </ScrollView>
    </View>
  );
}

const money = (cents: number | null, locale: string) =>
  cents == null ? '' : new Intl.NumberFormat(locale === 'fi' ? 'fi-FI' : 'en-FI', { style: 'currency', currency: 'EUR' }).format(cents / 100);
const day = (iso: string | null, locale: string) =>
  iso ? new Date(iso).toLocaleDateString(locale === 'fi' ? 'fi-FI' : 'en-GB', { timeZone: 'UTC' }) : '';

function BrowseTab({ data, t, locale, run }: { data: Market; t: T; locale: string; run: Run }) {
  const [kind, setKind] = useState<'' | 'sublet' | 'swap'>('');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const shown = data.browse.filter((l) => (kind ? l.kind === kind : true));

  return (
    <>
      <View style={fs.inline}>
        {(
          [
            ['', t.all],
            ['sublet', t.sublet],
            ['swap', t.swap],
          ] as const
        ).map(([value, label]) => (
          <Pressable key={value} style={[fs.chip, kind === value && fs.chipOn]} onPress={() => setKind(value)}>
            <Text style={kind === value ? fs.chipTextOn : fs.chipText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {shown.length === 0 && <Text style={fs.empty}>{t.empty}</Text>}
      {shown.map((l) => (
        <View key={l.id} style={fs.card}>
          <View style={fs.between}>
            <View style={fs.flex}>
              <Text style={fs.cardTitle}>{l.title}</Text>
              <Text style={fs.meta}>
                {l.place} · {l.floor}. {t.floor} · {l.sellerFirstName}
              </Text>
            </View>
            <Text style={[fs.badge, l.kind === 'sublet' ? fs.badgeOk : fs.badgeWarn]}>{l.kind === 'sublet' ? t.sublet : t.swap}</Text>
          </View>
          <Text style={fs.body}>{l.description}</Text>
          {l.kind === 'sublet' && (
            <Text style={fs.meta}>
              {money(l.priceCents, locale)} {t.perMonth} · {day(l.availableFrom, locale)} - {day(l.availableTo, locale)}
            </Text>
          )}
          {l.kind === 'swap' && l.wanted ? (
            <Text style={fs.meta}>
              {t.wantsLabel}: {l.wanted}
            </Text>
          ) : null}
          {l.requested ? (
            <Text style={fs.badge}>{t.requested}</Text>
          ) : l.ownUnit ? null : (
            <View style={fs.field}>
              <Text style={fs.label}>{t.messageLabel}</Text>
              <TextInput
                value={messages[l.id] ?? ''}
                onChangeText={(v) => setMessages((s) => ({ ...s, [l.id]: v }))}
                placeholder={t.messagePlaceholder}
                style={fs.input}
              />
              <Pressable
                style={fs.primarySmall}
                onPress={() => messages[l.id]?.trim() && run(() => api.requestListing(l.id, messages[l.id]!))}
              >
                <Text style={fs.primaryText}>{t.sendRequest}</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </>
  );
}

function MineTab({ data, t, locale, run }: { data: Market; t: T; locale: string; run: Run }) {
  if (data.mine.length === 0) return <Text style={fs.empty}>{t.empty}</Text>;
  return (
    <>
      {data.mine.map((l) => (
        <View key={l.id} style={fs.card}>
          <View style={fs.between}>
            <View style={fs.flex}>
              <Text style={fs.cardTitle}>{l.title}</Text>
              <Text style={fs.meta}>{l.kind === 'sublet' ? t.sublet : t.swap}</Text>
            </View>
            <Text style={[fs.badge, l.status === 'completed' ? fs.badgeOk : l.status === 'pending_approval' ? fs.badgeWarn : null]}>
              {(t.status as Record<string, string>)[l.status] ?? l.status}
            </Text>
          </View>
          {l.status === 'pending_approval' && <Text style={[fs.notice, fs.noticeWarn]}>{t.acceptedNote}</Text>}
          {l.status === 'completed' && (
            <Text style={[fs.notice, fs.noticeOk]}>
              {l.kind === 'sublet' ? t.subleaseDeal : t.swapDeal}
              {l.subleaseFrom ? ` · ${day(l.subleaseFrom, locale)} - ${day(l.subleaseTo, locale)}` : ''}
            </Text>
          )}
          {l.status === 'open' && (
            <>
              <Text style={fs.sectionHeading}>{t.requestsHeading}</Text>
              {l.requests.length === 0 && <Text style={fs.empty}>{t.noRequests}</Text>}
              {l.requests.map((r) => (
                <View key={r.id} style={fs.field}>
                  <Text style={fs.itemTitle}>{r.requesterFirstName}</Text>
                  <Text style={fs.meta}>{r.message}</Text>
                  <View style={fs.inline}>
                    <Pressable style={fs.primarySmall} onPress={() => run(() => api.respondListingRequest(r.id, true))}>
                      <Text style={fs.primaryText}>{t.accept}</Text>
                    </Pressable>
                    <Pressable style={fs.danger} onPress={() => run(() => api.respondListingRequest(r.id, false))}>
                      <Text style={fs.dangerText}>{t.decline}</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}
          {(l.status === 'open' || l.status === 'pending_approval') && (
            <Pressable style={fs.danger} onPress={() => run(() => api.closeListing(l.id))}>
              <Text style={fs.dangerText}>{t.close}</Text>
            </Pressable>
          )}
        </View>
      ))}
    </>
  );
}

function NewTab({ t, onCreate }: { t: T; onCreate: (input: Parameters<typeof api.createListing>[0]) => Promise<void> }) {
  const [kind, setKind] = useState<'sublet' | 'swap'>('sublet');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [wanted, setWanted] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setError(null);
    try {
      await onCreate({ kind, title, description, price, wanted, availableFrom: from, availableTo: to });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not publish.');
    }
  }

  return (
    <View style={fs.card}>
      <Text style={fs.cardTitle}>{t.formHeading}</Text>
      <Text style={fs.lede}>{t.formLede}</Text>

      <View style={fs.field}>
        <Text style={fs.label}>{t.kind}</Text>
        <View style={fs.inline}>
          {(['sublet', 'swap'] as const).map((value) => (
            <Pressable key={value} style={[fs.chip, kind === value && fs.chipOn]} onPress={() => setKind(value)}>
              <Text style={kind === value ? fs.chipTextOn : fs.chipText}>{value === 'sublet' ? t.sublet : t.swap}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={fs.field}>
        <Text style={fs.label}>{t.titleLabel}</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder={t.titlePlaceholder} style={fs.input} />
      </View>
      <View style={fs.field}>
        <Text style={fs.label}>{t.description}</Text>
        <TextInput value={description} onChangeText={setDescription} multiline style={[fs.input, fs.textarea]} />
      </View>
      <View style={fs.field}>
        <Text style={fs.label}>{t.price}</Text>
        <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={fs.input} />
      </View>
      <View style={fs.field}>
        <Text style={fs.label}>{t.wanted}</Text>
        <TextInput value={wanted} onChangeText={setWanted} placeholder={t.wantedPlaceholder} style={fs.input} />
      </View>
      <View style={fs.field}>
        <Text style={fs.label}>{t.from}</Text>
        <TextInput value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" autoCapitalize="none" style={fs.input} />
      </View>
      <View style={fs.field}>
        <Text style={fs.label}>{t.to}</Text>
        <TextInput value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" autoCapitalize="none" style={fs.input} />
      </View>
      {error && <Text style={[fs.notice, fs.noticeErr]}>{error}</Text>}
      <Pressable style={fs.primary} onPress={publish}>
        <Text style={fs.primaryText}>{t.publish}</Text>
      </Pressable>
    </View>
  );
}

function RequestsTab({ data, t, run }: { data: Market; t: T; run: Run }) {
  if (data.requests.length === 0) return <Text style={fs.empty}>{t.empty}</Text>;
  return (
    <>
      {data.requests.map((r) => (
        <View key={r.id} style={fs.card}>
          <View style={fs.between}>
            <View style={fs.flex}>
              <Text style={fs.itemTitle}>{r.listingTitle}</Text>
              <Text style={fs.meta}>{r.message}</Text>
            </View>
            <Text style={[fs.badge, r.status === 'accepted' ? fs.badgeOk : r.status === 'declined' ? fs.badgeBad : null]}>
              {(t.requestStatus as Record<string, string>)[r.status] ?? r.status}
            </Text>
          </View>
          {r.status === 'pending' && (
            <Pressable style={fs.danger} onPress={() => run(() => api.withdrawListingRequest(r.id))}>
              <Text style={fs.dangerText}>{t.withdraw}</Text>
            </Pressable>
          )}
        </View>
      ))}
    </>
  );
}
