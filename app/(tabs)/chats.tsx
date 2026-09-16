import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as api from '../../lib/api-client';
import type { ChatListItem } from '../../lib/types';
import { useDictionary } from '../../lib/use-dictionary';

type Tab = 'all' | 'unread' | 'favourites' | 'groups';
const TAB_VALUES: Tab[] = ['all', 'unread', 'favourites', 'groups'];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ChatsScreen() {
  const { dict } = useDictionary();
  const t = dict.chats;

  const [tab, setTab] = useState<Tab>('all');
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getChats()
      .then(setChats)
      .catch(() => setChats([]))
      .finally(() => setIsLoading(false));
  }, []);

  const tabLabel: Record<Tab, string> = {
    all: t.all,
    unread: t.unread,
    favourites: t.favourites,
    groups: t.groups,
  };

  const showChats = tab === 'all' || tab === 'groups';

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>{t.title}</Text>

      <View style={styles.tabs}>
        {TAB_VALUES.map((value) => (
          <Pressable key={value} onPress={() => setTab(value)} style={[styles.tab, tab === value && styles.tabActive]}>
            <Text style={tab === value ? styles.tabTextActive : styles.tabText}>{tabLabel[value]}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading && <ActivityIndicator style={styles.loading} />}

      {!isLoading && showChats && (
        <View style={styles.chatList}>
          {chats.map((item) => (
            <Pressable
              key={item.membershipId}
              style={styles.chatRow}
              onPress={() => router.push(`/chat/${item.group.id}`)}
            >
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>{initials(item.group.name)}</Text>
              </View>
              <View style={styles.chatRowText}>
                <View style={styles.chatRowTop}>
                  <Text style={styles.chatRowName}>{item.group.name}</Text>
                  {item.lastMessage && (
                    <Text style={styles.chatRowTime}>
                      {new Date(item.lastMessage.sentAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <Text style={styles.chatRowPreview} numberOfLines={1}>
                  {item.lastMessage
                    ? `${item.lastMessage.senderName}: ${item.lastMessage.content}`
                    : t.noMessagesYet}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {!isLoading && !showChats && (
        <Text style={styles.empty}>{tab === 'unread' ? t.unreadUnavailable : t.favouritesUnavailable}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f6f8', padding: 16, gap: 16 },
  pageTitle: { fontSize: 22, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#e9ebee' },
  tabActive: { backgroundColor: '#2f7d5c' },
  tabText: { color: '#5b616e', fontSize: 13 },
  tabTextActive: { color: '#fff', fontSize: 13, fontWeight: '600' },
  loading: { marginTop: 24 },
  empty: { textAlign: 'center', color: '#8a8f98', marginTop: 24 },
  chatList: { gap: 4 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eaf5ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: { color: '#2f7d5c', fontWeight: '700' },
  chatRowText: { flex: 1, gap: 2 },
  chatRowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  chatRowName: { fontWeight: '600', fontSize: 15 },
  chatRowTime: { fontSize: 12, color: '#8a8f98' },
  chatRowPreview: { fontSize: 13, color: '#5b616e' },
});
