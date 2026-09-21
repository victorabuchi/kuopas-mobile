import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PillTabs from '../../components/PillTabs';
import ComplaintsTab from '../../components/messages/ComplaintsTab';
import DirectTab from '../../components/messages/DirectTab';
import FeedTab from '../../components/messages/FeedTab';
import NoticesTab from '../../components/messages/NoticesTab';
import SupportTab from '../../components/messages/SupportTab';
import { colors } from '../../lib/theme';
import { useDictionary } from '../../lib/use-dictionary';

const TAB_VALUES = ['chat', 'announcements', 'noticeboard', 'complaints', 'support', 'direct'] as const;
type TabValue = (typeof TAB_VALUES)[number];

// Mirrors kuopas/web/src/app/(app)/messages/page.tsx
export default function MessagesScreen() {
  const { locale, dict } = useDictionary();
  const [tab, setTab] = useState<TabValue>('chat');

  const titleByTab: Record<TabValue, string> = {
    chat: dict.notices.fromKuopas,
    announcements: dict.feedBoard.title,
    noticeboard: dict.feedBoard.title,
    complaints: dict.complaints.title,
    support: dict.support.title,
    direct: dict.messages.title,
  };

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'chat', label: dict.notices.fromKuopas },
    { value: 'announcements', label: dict.feedBoard.tabAnnouncements },
    { value: 'noticeboard', label: dict.feedBoard.tabNoticeboard },
    { value: 'complaints', label: dict.nav.complaints },
    { value: 'support', label: dict.nav.support },
    { value: 'direct', label: dict.messages.directTab },
  ];

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>{titleByTab[tab]}</Text>
      <PillTabs tabs={tabs} active={tab} onChange={setTab} />

      <View style={styles.body}>
        {tab === 'chat' && <NoticesTab dict={dict} />}
        {tab === 'announcements' && <FeedTab key="announcement" tab="announcement" locale={locale} dict={dict} />}
        {tab === 'noticeboard' && <FeedTab key="noticeboard" tab="noticeboard" locale={locale} dict={dict} />}
        {tab === 'complaints' && <ComplaintsTab dict={dict} />}
        {tab === 'support' && <SupportTab dict={dict} />}
        {tab === 'direct' && <DirectTab dict={dict} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, paddingTop: 16, gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: '700', paddingHorizontal: 16 },
  body: { flex: 1 },
});
