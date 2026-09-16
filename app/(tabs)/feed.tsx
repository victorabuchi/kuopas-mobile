import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as api from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { displayNameFor } from '../../lib/names';
import type { BuildingPost, BuildingPostType, NoticeboardCategory } from '../../lib/types';
import { useDictionary } from '../../lib/use-dictionary';

const TAB_VALUES: BuildingPostType[] = ['announcement', 'noticeboard'];
const CATEGORY_VALUES: NoticeboardCategory[] = ['furniture', 'lost_found', 'borrow', 'giveaway', 'other'];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function FeedScreen() {
  const { locale, dict } = useDictionary();
  const { tenant } = useAuth();
  const t = dict.feedBoard;

  const [tab, setTab] = useState<BuildingPostType>('announcement');
  const [posts, setPosts] = useState<BuildingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoticeboardCategory>('furniture');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const categoryLabel: Record<NoticeboardCategory, string> = {
    furniture: t.categoryFurniture,
    lost_found: t.categoryLostFound,
    borrow: t.categoryBorrow,
    giveaway: t.categoryGiveaway,
    other: t.categoryOther,
  };

  const loadPosts = useCallback(() => {
    setIsLoading(true);
    api
      .getFeed(tab)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false));
  }, [tab]);

  useEffect(loadPosts, [loadPosts]);

  async function onSubmitPost() {
    if (!title || !content) return;
    const post = await api.createNoticeboardPost(title, content, category);
    setPosts((prev) => [post, ...prev]);
    setTitle('');
    setContent('');
  }

  async function onReact(postId: string) {
    await api.reactToPost(postId);
    loadPosts();
  }

  async function onComment(postId: string) {
    const text = commentDrafts[postId];
    if (!text) return;
    const comment = await api.commentOnPost(postId, text);
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post)),
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  }

  async function onReport(target: { postId?: string; commentId?: string }) {
    await api.reportPost(target);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <Text style={styles.pageTitle}>{t.title}</Text>

      <View style={styles.tabs}>
        {TAB_VALUES.map((value) => (
          <Pressable key={value} onPress={() => setTab(value)} style={[styles.tab, tab === value && styles.tabActive]}>
            <Text style={tab === value ? styles.tabTextActive : styles.tabText}>
              {value === 'announcement' ? t.tabAnnouncements : t.tabNoticeboard}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'noticeboard' && (
        <View style={styles.composer}>
          <TextInput value={title} onChangeText={setTitle} placeholder={t.postTitle} style={styles.input} />
          <View style={styles.categoryRow}>
            {CATEGORY_VALUES.map((value) => (
              <Pressable
                key={value}
                onPress={() => setCategory(value)}
                style={[styles.categoryChip, category === value && styles.categoryChipActive]}
              >
                <Text style={category === value ? styles.categoryChipTextActive : styles.categoryChipText}>
                  {categoryLabel[value]}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={t.postContent}
            multiline
            style={[styles.input, styles.textarea]}
          />
          <Pressable style={styles.submit} onPress={onSubmitPost}>
            <Text style={styles.submitText}>{t.submit}</Text>
          </Pressable>
        </View>
      )}

      {isLoading && <ActivityIndicator style={styles.loading} />}

      {!isLoading && posts.length === 0 && (
        <Text style={styles.empty}>{tab === 'announcement' ? t.noAnnouncementsYet : t.noNoticeboardYet}</Text>
      )}

      {posts.map((post) => {
        const senderName = post.authorStaff ? t.kuopas : displayNameFor(post.authorTenant!, 'building');
        const reacted = tenant ? post.reactions.some((r) => r.tenantId === tenant.id) : false;
        const title = locale === 'en' && post.titleEn ? post.titleEn : post.title;
        const body = locale === 'en' && post.contentEn ? post.contentEn : post.content;

        return (
          <View key={post.id} style={styles.post}>
            <View style={styles.postHeader}>
              <View style={styles.postAvatar}>
                <Text style={styles.postAvatarText}>{initials(senderName)}</Text>
              </View>
              <View>
                <Text style={styles.postSender}>{senderName}</Text>
                <Text style={styles.postMeta}>{new Date(post.createdAt).toLocaleString()}</Text>
              </View>
            </View>

            <Text style={styles.postTitle}>{title}</Text>
            <Text style={styles.postContent}>{body}</Text>
            {post.photoUrl && <Image source={{ uri: post.photoUrl }} style={styles.postPhoto} />}
            {post.noticeboardCategory && (
              <Text style={styles.categoryBadge}>{categoryLabel[post.noticeboardCategory]}</Text>
            )}

            <View style={styles.postActions}>
              <Pressable onPress={() => onReact(post.id)}>
                <Text style={[styles.postAction, reacted && styles.postActionActive]}>
                  👍 {post.reactions.length}
                </Text>
              </Pressable>
              {post.type === 'announcement' && <Text style={styles.reactionsOnlyNote}>{t.reactionsOnly}</Text>}
              {post.authorTenant && tenant && post.authorTenant.id !== tenant.id && (
                <Pressable onPress={() => onReport({ postId: post.id })}>
                  <Text style={styles.postAction}>{t.report}</Text>
                </Pressable>
              )}
            </View>

            {post.type === 'noticeboard' && (
              <>
                {post.comments.length > 0 && (
                  <View style={styles.commentsPreview}>
                    {post.comments.slice(-3).map((comment) => (
                      <View key={comment.id} style={styles.comment}>
                        <Text style={styles.commentAuthor}>{displayNameFor(comment.author, 'building')}</Text>
                        <Text>{comment.content}</Text>
                        {tenant && comment.author.id !== tenant.id && (
                          <Pressable onPress={() => onReport({ commentId: comment.id })}>
                            <Text style={styles.commentReport}>{t.reportComment}</Text>
                          </Pressable>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.commentForm}>
                  <TextInput
                    value={commentDrafts[post.id] ?? ''}
                    onChangeText={(text) => setCommentDrafts((prev) => ({ ...prev, [post.id]: text }))}
                    placeholder={t.commentPlaceholder}
                    style={styles.commentInput}
                  />
                  <Pressable onPress={() => onComment(post.id)}>
                    <Text style={styles.commentSubmit}>{t.reply}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f6f8' },
  pageContent: { padding: 16, gap: 16 },
  pageTitle: { fontSize: 22, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#e9ebee' },
  tabActive: { backgroundColor: '#2f7d5c' },
  tabText: { color: '#5b616e', fontSize: 13 },
  tabTextActive: { color: '#fff', fontSize: 13, fontWeight: '600' },
  composer: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8 },
  input: { borderWidth: 1, borderColor: '#d8dbe0', borderRadius: 10, padding: 10, fontSize: 14 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#e9ebee' },
  categoryChipActive: { backgroundColor: '#2f7d5c' },
  categoryChipText: { fontSize: 12, color: '#5b616e' },
  categoryChipTextActive: { fontSize: 12, color: '#fff', fontWeight: '600' },
  submit: { backgroundColor: '#2f7d5c', borderRadius: 10, padding: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
  loading: { marginTop: 24 },
  empty: { textAlign: 'center', color: '#8a8f98', marginTop: 24 },
  post: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eaf5ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: { color: '#2f7d5c', fontWeight: '700', fontSize: 12 },
  postSender: { fontWeight: '600', fontSize: 14 },
  postMeta: { fontSize: 12, color: '#8a8f98' },
  postTitle: { fontWeight: '700', fontSize: 15 },
  postContent: { fontSize: 14, color: '#2c2f36' },
  postPhoto: { width: '100%', height: 180, borderRadius: 10 },
  categoryBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    color: '#2f7d5c',
    backgroundColor: '#eaf5ef',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  postAction: { fontSize: 13, color: '#5b616e' },
  postActionActive: { color: '#2f7d5c', fontWeight: '700' },
  reactionsOnlyNote: { fontSize: 12, color: '#8a8f98' },
  commentsPreview: { gap: 4 },
  comment: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, fontSize: 13 },
  commentAuthor: { fontWeight: '600', fontSize: 13 },
  commentReport: { fontSize: 11, color: '#8a8f98' },
  commentForm: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#d8dbe0', borderRadius: 10, padding: 8, fontSize: 13 },
  commentSubmit: { color: '#2f7d5c', fontWeight: '600', fontSize: 13 },
});
