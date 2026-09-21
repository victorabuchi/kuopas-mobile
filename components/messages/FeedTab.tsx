import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as api from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import type { Locale } from '../../lib/i18n';
import type { getDictionary } from '../../lib/dictionary';
import { displayNameFor } from '../../lib/names';
import { pickPhoto } from '../../lib/pick-photo';
import { colors, initials } from '../../lib/theme';
import type { BuildingPost, BuildingPostType, NoticeboardCategory, PhotoAttachment } from '../../lib/types';

const CATEGORY_VALUES: NoticeboardCategory[] = ['furniture', 'lost_found', 'borrow', 'giveaway', 'other'];

// Mirrors FeedTab in kuopas/web/src/app/(app)/messages/page.tsx
export default function FeedTab({
  tab,
  locale,
  dict,
}: {
  tab: BuildingPostType;
  locale: Locale;
  dict: ReturnType<typeof getDictionary>;
}) {
  const { tenant } = useAuth();
  const t = dict.feedBoard;

  const [posts, setPosts] = useState<BuildingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoticeboardCategory>('furniture');
  const [photo, setPhoto] = useState<PhotoAttachment | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      .then((loaded) => {
        setPosts(loaded);
        if (tab === 'announcement') api.markPostsRead(loaded.map((p) => p.id)).catch(() => {});
      })
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false));
  }, [tab]);

  useEffect(loadPosts, [loadPosts]);

  async function onSubmitPost() {
    if (!title.trim() || !content.trim()) return;
    setError(null);
    try {
      const post = await api.createNoticeboardPost(title, content, category, photo);
      setPosts((prev) => [post, ...prev]);
      setTitle('');
      setContent('');
      setPhoto(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post.');
    }
  }

  async function onReact(postId: string) {
    await api.reactToPost(postId);
    loadPosts();
  }

  async function onComment(postId: string) {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;
    const comment = await api.commentOnPost(postId, text);
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post)),
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} keyboardShouldPersistTaps="handled">
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
          <Pressable style={styles.photoBtn} onPress={async () => setPhoto(await pickPhoto())}>
            <Text style={styles.photoBtnText}>{photo ? photo.name : t.photo}</Text>
          </Pressable>
          {photo && <Image source={{ uri: photo.uri }} style={styles.photoPreview} />}
          {error && <Text style={styles.error}>{error}</Text>}
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
        const postTitle = locale === 'en' && post.titleEn ? post.titleEn : post.title;
        const body = locale === 'en' && post.contentEn ? post.contentEn : post.content;

        return (
          <View key={post.id} style={styles.post}>
            <View style={styles.postHeader}>
              <View style={[styles.postAvatar, !post.authorStaff && styles.postAvatarNoticeboard]}>
                <Text style={styles.postAvatarText}>{initials(senderName)}</Text>
              </View>
              <View>
                <Text style={styles.postSender}>{senderName}</Text>
                <Text style={styles.postMeta}>{new Date(post.createdAt).toLocaleString()}</Text>
              </View>
            </View>

            <Text style={styles.postTitle}>{postTitle}</Text>
            <Text style={styles.postContent}>{body}</Text>
            {post.photoUrl && <Image source={{ uri: api.mediaUrl(post.photoUrl) }} style={styles.postPhoto} />}
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
                <Pressable onPress={() => api.reportPost({ postId: post.id })}>
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
                          <Pressable onPress={() => api.reportPost({ commentId: comment.id })}>
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
  page: { flex: 1, backgroundColor: colors.bg },
  pageContent: { padding: 16, gap: 16 },
  composer: { backgroundColor: colors.card, borderRadius: 12, padding: 12, gap: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, fontSize: 14 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: colors.chip },
  categoryChipActive: { backgroundColor: colors.accent },
  categoryChipText: { fontSize: 12, color: colors.muted },
  categoryChipTextActive: { fontSize: 12, color: '#fff', fontWeight: '600' },
  photoBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10 },
  photoBtnText: { fontSize: 13, color: colors.muted },
  photoPreview: { width: '100%', height: 140, borderRadius: 10 },
  error: { color: colors.danger, fontSize: 13 },
  submit: { backgroundColor: colors.accent, borderRadius: 10, padding: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
  loading: { marginTop: 24 },
  empty: { textAlign: 'center', color: colors.faint, marginTop: 24 },
  post: { backgroundColor: colors.card, borderRadius: 12, padding: 14, gap: 8 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarNoticeboard: { backgroundColor: colors.accentSoft },
  postAvatarText: { color: colors.accent, fontWeight: '700', fontSize: 12 },
  postSender: { fontWeight: '600', fontSize: 14 },
  postMeta: { fontSize: 12, color: colors.faint },
  postTitle: { fontWeight: '700', fontSize: 15 },
  postContent: { fontSize: 14, color: colors.body },
  postPhoto: { width: '100%', height: 180, borderRadius: 10 },
  categoryBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  postAction: { fontSize: 13, color: colors.muted },
  postActionActive: { color: colors.accent, fontWeight: '700' },
  reactionsOnlyNote: { fontSize: 12, color: colors.faint },
  commentsPreview: { gap: 4 },
  comment: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  commentAuthor: { fontWeight: '600', fontSize: 13 },
  commentReport: { fontSize: 11, color: colors.faint },
  commentForm: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  commentInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 8, fontSize: 13 },
  commentSubmit: { color: colors.accent, fontWeight: '600', fontSize: 13 },
});
