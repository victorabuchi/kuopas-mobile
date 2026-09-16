import * as SecureStore from 'expo-secure-store';
import type {
  Building,
  BuildingPost,
  BuildingPostComment,
  BuildingPostType,
  ChatListItem,
  ChatThread,
  Message,
  NoticeboardCategory,
  Tenant,
} from './types';

const TOKEN_KEY = 'kuopas_session_token';

// The web app (kuopas/web) currently only exposes Next.js server actions behind
// cookie sessions, not JSON endpoints. These calls target a `/api/mobile/*`
// surface that mirrors the same server-action logic 1:1 (see README) and
// still needs to be added to the web repo before real data flows here.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {}

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// Mirrors loginAction in kuopas/web/src/lib/auth-actions.ts
export async function login(email: string, password: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new ApiError('Incorrect email or password.');
  }
  const { token } = await request<{ token: string }>('/api/mobile/login', {
    method: 'POST',
    body: { email: normalizedEmail, password },
  });
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

// Mirrors registerAction in kuopas/web/src/lib/auth-actions.ts
export async function register(name: string, email: string, password: string, unitId: string): Promise<void> {
  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedUnitId = unitId.trim();

  if (!trimmedName || !normalizedEmail || !trimmedUnitId) {
    throw new ApiError('Name, email, and unit are all required.');
  }
  if (password.length < 8) {
    throw new ApiError('Password must be at least 8 characters.');
  }

  const { token } = await request<{ token: string }>('/api/mobile/register', {
    method: 'POST',
    body: { name: trimmedName, email: normalizedEmail, password, unitId: trimmedUnitId },
  });
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

// Mirrors RegisterPage's building query in kuopas/web/src/app/register/page.tsx
export async function getBuildings(): Promise<Building[]> {
  return request<Building[]>('/api/mobile/buildings');
}

// Mirrors logoutAction in kuopas/web/src/lib/auth-actions.ts
export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function isLoggedIn(): Promise<boolean> {
  return (await getToken()) !== null;
}

// Mirrors getSession()-derived Tenant lookups used throughout kuopas/web/src/app/(app)/*
export async function getMe(): Promise<Tenant> {
  return request<Tenant>('/api/mobile/me');
}

// Mirrors FeedPage's query in kuopas/web/src/app/(app)/feed/page.tsx
export async function getFeed(tab: BuildingPostType): Promise<BuildingPost[]> {
  return request<BuildingPost[]>(`/api/mobile/feed?type=${tab}`);
}

// Mirrors createNoticeboardPostAction in kuopas/web/src/lib/building-post-actions.ts
export async function createNoticeboardPost(
  title: string,
  content: string,
  category: NoticeboardCategory,
): Promise<BuildingPost> {
  return request<BuildingPost>('/api/mobile/feed/posts', {
    method: 'POST',
    body: { title, content, category },
  });
}

// Mirrors reactToPostAction in kuopas/web/src/lib/building-post-actions.ts
export async function reactToPost(postId: string): Promise<void> {
  await request(`/api/mobile/feed/posts/${postId}/react`, { method: 'POST' });
}

// Mirrors commentOnPostAction in kuopas/web/src/lib/building-post-actions.ts
export async function commentOnPost(postId: string, content: string): Promise<BuildingPostComment> {
  return request<BuildingPostComment>(`/api/mobile/feed/posts/${postId}/comments`, {
    method: 'POST',
    body: { content },
  });
}

// Mirrors reportPostAction in kuopas/web/src/lib/building-post-actions.ts
export async function reportPost(target: { postId?: string; commentId?: string }): Promise<void> {
  await request('/api/mobile/feed/reports', { method: 'POST', body: target });
}

// Mirrors ChatsPage's query in kuopas/web/src/app/(app)/chats/page.tsx
export async function getChats(): Promise<ChatListItem[]> {
  return request<ChatListItem[]>('/api/mobile/chats');
}

// Mirrors ChatGroupPage's query in kuopas/web/src/app/(app)/chat/[groupId]/page.tsx
export async function getChatThread(groupId: string): Promise<ChatThread> {
  return request<ChatThread>(`/api/mobile/chats/${groupId}`);
}

// Mirrors sendMessageAction in kuopas/web/src/app/actions.ts
export async function sendMessage(groupId: string, content: string): Promise<Message> {
  return request<Message>(`/api/mobile/chats/${groupId}/messages`, {
    method: 'POST',
    body: { content },
  });
}
