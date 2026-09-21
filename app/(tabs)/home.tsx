import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MoveInGuideOverlay from '../../components/MoveInGuideOverlay';
import PillTabs from '../../components/PillTabs';
import * as api from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { updatesLabel } from '../../lib/labels';
import { colors } from '../../lib/theme';
import type { NewsCategory, NewsPost } from '../../lib/types';
import { useDictionary } from '../../lib/use-dictionary';

// Mirrors kuopas/web/src/app/(app)/home/page.tsx
export default function HomeScreen() {
  const { locale, dict } = useDictionary();
  const { tenant, refreshProfile } = useAuth();
  const [tab, setTab] = useState<NewsCategory>('news');
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [guideDismissed, setGuideDismissed] = useState(false);

  const tabs = [
    { value: 'news' as const, label: dict.home.tabNews },
    { value: 'updates' as const, label: dict.home.tabUpdates },
    { value: 'promotions' as const, label: dict.home.tabPromotions },
    { value: 'discounts' as const, label: dict.home.tabDiscounts },
    { value: 'events' as const, label: dict.home.tabEvents },
  ];

  useEffect(() => {
    setIsLoading(true);
    api
      .getNews(tab)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false));
  }, [tab]);

  return (
    <View style={styles.page}>
      {tenant && !tenant.hasSeenMoveInGuide && !guideDismissed && (
        <MoveInGuideOverlay
          dict={dict}
          onDismiss={() => {
            setGuideDismissed(true);
            refreshProfile();
          }}
        />
      )}

      <Text style={styles.pageTitle}>{updatesLabel(locale)}</Text>
      <PillTabs tabs={tabs} active={tab} onChange={setTab} />

      <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent}>
        {isLoading && <ActivityIndicator style={styles.loading} />}
        {!isLoading && posts.length === 0 && (
          <Text style={styles.empty}>
            {dict.home.emptyPrefix} {tabs.find((t) => t.value === tab)?.label.toLowerCase()} {dict.home.emptySuffix}
          </Text>
        )}
        {posts.map((post) => (
          <Pressable
            key={post.id}
            style={styles.post}
            disabled={!post.sourceUrl}
            onPress={() => Linking.openURL(post.sourceUrl)}
          >
            <View style={styles.postHeader}>
              <View style={styles.newsBadge}>
                <Text style={styles.newsBadgeText}>N</Text>
              </View>
              <View>
                <Text style={styles.postSender}>{dict.home.kuopasNews}</Text>
                <Text style={styles.postMeta}>{new Date(post.publishedAt).toLocaleDateString()}</Text>
              </View>
            </View>
            <Text style={styles.newsTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.summary}</Text>
            {post.sourceUrl ? <Text style={styles.newsLink}>{dict.home.readFullArticle}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, paddingTop: 16, gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: '700', paddingHorizontal: 16 },
  feed: { flex: 1 },
  feedContent: { padding: 16, gap: 12 },
  loading: { marginTop: 24 },
  empty: { textAlign: 'center', color: colors.faint, marginTop: 24 },
  post: { backgroundColor: colors.card, borderRadius: 12, padding: 14, gap: 8 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  newsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsBadgeText: { color: colors.accent, fontWeight: '800' },
  postSender: { fontWeight: '600', fontSize: 14 },
  postMeta: { fontSize: 12, color: colors.faint },
  newsTitle: { fontWeight: '700', fontSize: 15 },
  postContent: { fontSize: 14, color: colors.body },
  newsLink: { fontSize: 13, color: colors.accent, fontWeight: '600' },
});
