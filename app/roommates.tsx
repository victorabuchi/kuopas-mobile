import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import PillTabs from '../components/PillTabs';
import VerifyGate from '../components/VerifyGate';
import * as api from '../lib/api-client';
import { fs } from '../lib/feature-styles';
import type { getLiving } from '../lib/living';
import { DIMENSIONS } from '../lib/matching';
import { colors } from '../lib/theme';
import type { MatchProfile, Roommates } from '../lib/types';
import { useDictionary } from '../lib/use-dictionary';

type T = ReturnType<typeof getLiving>['roommates'];
type Tab = 'find' | 'profile' | 'connections';

// Mirrors kuopas/web/src/app/(app)/roommates/page.tsx
export default function RoommatesScreen() {
  const { living } = useDictionary();
  const t = living.roommates;

  const [data, setData] = useState<Roommates | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .getRoommates()
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

  const active: Tab = tab ?? (data?.profile ? 'find' : 'profile');

  return (
    <View style={fs.page}>
      <Stack.Screen options={{ title: t.title }} />
      {data?.verified && (
        <PillTabs
          tabs={[
            { value: 'find' as const, label: t.tabFind },
            { value: 'profile' as const, label: t.tabProfile },
            { value: 'connections' as const, label: t.tabConnections },
          ]}
          active={active}
          onChange={setTab}
        />
      )}
      <ScrollView contentContainerStyle={fs.content} keyboardShouldPersistTaps="handled">
        {error && <Text style={[fs.notice, fs.noticeErr]}>{error}</Text>}
        {!data && !error && <ActivityIndicator />}
        {data && !data.verified && <VerifyGate message={t.verifyFirst} action={t.goVerify} />}
        {data?.verified && active === 'profile' && (
          <ProfileTab
            profile={data.profile}
            t={t}
            onSave={async (profile) => {
              await api.saveMatchProfile(profile);
              setSaved(true);
              setTab('find');
              load();
            }}
          />
        )}
        {data?.verified && active === 'find' && <FindTab data={data} t={t} saved={saved} setTab={setTab} run={run} />}
        {data?.verified && active === 'connections' && <ConnectionsTab data={data} t={t} run={run} />}
      </ScrollView>
    </View>
  );
}

// Mirrors MatchWizard in kuopas/web/src/app/(app)/roommates/MatchWizard.tsx
function ProfileTab({ profile, t, onSave }: { profile: MatchProfile | null; t: T; onSave: (p: MatchProfile) => Promise<void> }) {
  const total = DIMENSIONS.length + 1;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(profile?.answers ?? {});
  const [breakers, setBreakers] = useState<string[]>(profile?.dealbreakers ?? []);
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [active, setActive] = useState(profile?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const isLast = step === total - 1;
  const dim = DIMENSIONS[step];
  const question = dim ? (t.questions as Record<string, { title: string; options: Record<string, string> }>)[dim.key] : null;
  const canAdvance = isLast || Boolean(dim && answers[dim.key]);

  async function finish() {
    setError(null);
    try {
      await onSave({ answers, dealbreakers: breakers, bio, active });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  }

  return (
    <View style={fs.card}>
      <Text style={fs.cardTitle}>{t.wizardTitle}</Text>
      <Text style={fs.lede}>{t.wizardLede}</Text>

      <View style={{ height: 6, borderRadius: 6, backgroundColor: colors.chip, overflow: 'hidden' }}>
        <View style={{ width: `${((step + 1) / total) * 100}%`, height: '100%', backgroundColor: colors.accent }} />
      </View>
      <Text style={fs.meta}>
        {t.step} {step + 1} {t.of} {total}
      </Text>

      {dim && question && (
        <View style={fs.field}>
          <Text style={fs.itemTitle}>{question.title}</Text>
          {dim.options.map((value) => (
            <Pressable
              key={value}
              style={[fs.option, answers[dim.key] === value && fs.optionOn]}
              onPress={() => setAnswers((s) => ({ ...s, [dim.key]: value }))}
            >
              <Text style={answers[dim.key] === value ? { color: colors.accent, fontWeight: '600' } : undefined}>
                {question.options[value] ?? value}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={fs.inline}
            onPress={() =>
              setBreakers((s) => (s.includes(dim.key) ? s.filter((k) => k !== dim.key) : [...s, dim.key]))
            }
          >
            <View style={[fs.box, breakers.includes(dim.key) && fs.boxOn]}>
              {breakers.includes(dim.key) && <Text style={fs.tick}>✓</Text>}
            </View>
            <Text style={fs.body}>{t.nonNegotiable}</Text>
          </Pressable>
        </View>
      )}

      {isLast && (
        <View style={fs.field}>
          <Text style={fs.itemTitle}>{t.finalStep}</Text>
          <Text style={fs.label}>{t.bioLabel}</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            maxLength={300}
            multiline
            placeholder={t.bioPlaceholder}
            style={[fs.input, fs.textarea]}
          />
          <View style={fs.between}>
            <Text style={[fs.body, fs.flex]}>{t.visibleLabel}</Text>
            <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.accent }} />
          </View>
        </View>
      )}

      {error && <Text style={[fs.notice, fs.noticeErr]}>{error}</Text>}

      <View style={fs.inline}>
        {step > 0 && (
          <Pressable style={fs.ghost} onPress={() => setStep((s) => s - 1)}>
            <Text style={fs.ghostText}>{t.back}</Text>
          </Pressable>
        )}
        {!isLast && (
          <Pressable style={[fs.primarySmall, !canAdvance && { opacity: 0.5 }]} disabled={!canAdvance} onPress={() => setStep((s) => s + 1)}>
            <Text style={fs.primaryText}>{t.next}</Text>
          </Pressable>
        )}
        {isLast && (
          <Pressable style={fs.primarySmall} onPress={finish}>
            <Text style={fs.primaryText}>{t.finish}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function FindTab({
  data,
  t,
  saved,
  setTab,
  run,
}: {
  data: Roommates;
  t: T;
  saved: boolean;
  setTab: (tab: Tab) => void;
  run: (action: () => Promise<void>) => Promise<void>;
}) {
  if (!data.profile) {
    return (
      <View style={fs.card}>
        <Text style={fs.lede}>{t.noProfile}</Text>
        <Pressable style={fs.primarySmall} onPress={() => setTab('profile')}>
          <Text style={fs.primaryText}>{t.startWizard}</Text>
        </Pressable>
      </View>
    );
  }

  const dimLabel = (k: string) => (t.dims as Record<string, string>)[k] ?? k;

  async function message(otherId: string) {
    const id = await api.startConversation(otherId);
    router.push(`/messages/${id}`);
  }

  return (
    <>
      {saved && <Text style={[fs.notice, fs.noticeOk]}>{t.saved}</Text>}
      {!data.profile.active && <Text style={[fs.notice, fs.noticeWarn]}>{t.hiddenNote}</Text>}
      <Text style={fs.sectionHeading}>{t.matchesHeading}</Text>
      {data.matches.length === 0 && <Text style={fs.empty}>{t.noMatches}</Text>}
      {data.matches.map((m) => (
        <View key={m.tenantId} style={fs.card}>
          <View style={fs.between}>
            <View style={fs.flex}>
              <View style={fs.inline}>
                <Text style={fs.itemTitle}>{m.firstName}</Text>
                <Text style={[fs.badge, fs.badgeOk]}>{t.verifiedBadge}</Text>
              </View>
              {m.institution ? <Text style={fs.meta}>{m.institution}</Text> : null}
            </View>
            <Text style={[fs.badge, m.score >= 75 ? fs.badgeOk : fs.badgeWarn]}>
              {m.score}% {t.compatibility}
            </Text>
          </View>
          {m.bio ? <Text style={fs.body}>{m.bio}</Text> : null}
          {m.best.length > 0 && (
            <Text style={fs.meta}>
              {t.matchesOn}: {m.best.map(dimLabel).join(', ')}
            </Text>
          )}
          {m.differences.length > 0 && (
            <Text style={fs.meta}>
              {t.differsOn}: {m.differences.map(dimLabel).join(', ')}
            </Text>
          )}
          {m.status === null && (
            <Pressable style={fs.primarySmall} onPress={() => run(() => api.connectWith(m.tenantId))}>
              <Text style={fs.primaryText}>{t.connect}</Text>
            </Pressable>
          )}
          {m.status === 'requested' && <Text style={fs.badge}>{t.requested}</Text>}
          {m.status === 'incoming' && (
            <Pressable style={fs.primarySmall} onPress={() => run(() => api.connectWith(m.tenantId))}>
              <Text style={fs.primaryText}>{t.accept}</Text>
            </Pressable>
          )}
          {m.status === 'accepted' && (
            <Pressable style={fs.ghost} onPress={() => message(m.tenantId)}>
              <Text style={fs.ghostText}>{t.message}</Text>
            </Pressable>
          )}
        </View>
      ))}
    </>
  );
}

function ConnectionsTab({ data, t, run }: { data: Roommates; t: T; run: (action: () => Promise<void>) => Promise<void> }) {
  const { incoming, outgoing, connected } = data.connections;
  if (incoming.length + outgoing.length + connected.length === 0) return <Text style={fs.empty}>{t.noConnections}</Text>;

  async function message(otherId: string) {
    const id = await api.startConversation(otherId);
    router.push(`/messages/${id}`);
  }

  return (
    <>
      {incoming.length > 0 && <Text style={fs.sectionHeading}>{t.incoming}</Text>}
      {incoming.map((c) => (
        <View key={c.id} style={[fs.card, fs.between]}>
          <Text style={fs.itemTitle}>{c.name}</Text>
          <View style={fs.inline}>
            <Pressable style={fs.primarySmall} onPress={() => run(() => api.respondConnection(c.id, true))}>
              <Text style={fs.primaryText}>{t.accept}</Text>
            </Pressable>
            <Pressable style={fs.danger} onPress={() => run(() => api.respondConnection(c.id, false))}>
              <Text style={fs.dangerText}>{t.decline}</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {outgoing.length > 0 && <Text style={fs.sectionHeading}>{t.outgoing}</Text>}
      {outgoing.map((c) => (
        <View key={c.id} style={[fs.card, fs.between]}>
          <Text style={fs.itemTitle}>{c.name}</Text>
          <Text style={fs.badge}>{t.pending}</Text>
        </View>
      ))}
      {connected.length > 0 && <Text style={fs.sectionHeading}>{t.accepted}</Text>}
      {connected.map((c) => (
        <View key={c.id} style={[fs.card, fs.between]}>
          <Text style={fs.itemTitle}>{c.name}</Text>
          <Pressable style={fs.ghost} onPress={() => message(c.tenantId)}>
            <Text style={fs.ghostText}>{t.message}</Text>
          </Pressable>
        </View>
      ))}
    </>
  );
}
