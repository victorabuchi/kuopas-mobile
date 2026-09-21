import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { getLocale } from './i18n';
import type {
  BookingHub,
  Building,
  BuildingPost,
  BuildingPostComment,
  BuildingPostType,
  ChatListItem,
  ChatThread,
  Community,
  CommunityMessage,
  CommunityThread,
  Complaint,
  ComplaintCategory,
  ComplaintThread,
  DirectOverview,
  DirectThread,
  GroupSelection,
  Household,
  LeaseOverview,
  ListingInput,
  Market,
  MatchProfile,
  LaundryOverview,
  Message,
  NewsCategory,
  NewsPost,
  NoticeboardCategory,
  ParkingOverview,
  PhotoAttachment,
  Profile,
  Residents,
  Roommates,
  SaunaOverview,
  SimpleMessage,
  SpaceOverview,
  VideoAttachment,
  WellbeingCase,
} from './types';

const TOKEN_KEY = 'kuopas_session_token';

// The web app's own pages use Next.js server actions behind cookie sessions.
// These calls target the parallel `/api/mobile/*` bearer-token surface in
// kuopas/web that mirrors the same logic (see README).
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {}

// Local development stores uploads on the web server and returns paths like
// /uploads/x.jpg; production returns absolute storage URLs.
export function mediaUrl(url: string): string {
  return url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
}

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; form?: FormData } = {},
): Promise<T> {
  const token = await getToken();
  const locale = await getLocale();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'x-kuopas-locale': locale,
      // A FormData body sets its own multipart Content-Type (with boundary).
      ...(options.form ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.form ?? (options.body ? JSON.stringify(options.body) : undefined),
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

// Opens the web Google flow in an auth session. The server finishes at the
// kuopas://auth deep link with either ?token=... or ?error=...
export async function loginWithGoogle(): Promise<boolean> {
  const result = await WebBrowser.openAuthSessionAsync(`${API_BASE_URL}/api/auth/google?intent=mobile`, 'kuopas://auth');
  if (result.type !== 'success') return false;

  const query = result.url.split('?')[1] ?? '';
  const params = new URLSearchParams(query);
  const error = params.get('error');
  if (error) throw new ApiError(error);
  const token = params.get('token');
  if (!token) throw new ApiError('Google sign-in failed.');

  await SecureStore.setItemAsync(TOKEN_KEY, token);
  return true;
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
export async function getMe(): Promise<Profile> {
  return request<Profile>('/api/mobile/me');
}

// Mirrors FeedPage's query in kuopas/web/src/app/(app)/feed/page.tsx
export async function getFeed(tab: BuildingPostType): Promise<BuildingPost[]> {
  return request<BuildingPost[]>(`/api/mobile/feed?type=${tab}`);
}

// A React Native FormData file part is a { uri, name, type } object.
function photoForm(fields: Record<string, string>, photo: PhotoAttachment | null): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  if (photo) form.append('photo', photo as unknown as Blob);
  return form;
}

// Mirrors createNoticeboardPostAction in kuopas/web/src/lib/building-post-actions.ts
export async function createNoticeboardPost(
  title: string,
  content: string,
  category: NoticeboardCategory,
  photo: PhotoAttachment | null = null,
): Promise<BuildingPost> {
  if (photo) {
    return request<BuildingPost>('/api/mobile/feed/posts', {
      method: 'POST',
      form: photoForm({ title, content, category }, photo),
    });
  }
  return request<BuildingPost>('/api/mobile/feed/posts', {
    method: 'POST',
    body: { title, content, category },
  });
}

// Mirrors markPostsReadAction in kuopas/web/src/lib/building-post-actions.ts
export async function markPostsRead(postIds: string[]): Promise<void> {
  await request('/api/mobile/feed/read', { method: 'POST', body: { postIds } });
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

// Mirrors HomePage's NewsPost query in kuopas/web/src/app/(app)/home/page.tsx
export async function getNews(tab: NewsCategory): Promise<NewsPost[]> {
  return request<NewsPost[]>(`/api/mobile/home?tab=${tab}`);
}

// Mirrors MoveInGuideOverlay / move-in-guide-actions.ts in kuopas/web
export async function getMoveInChecklist(): Promise<string[]> {
  const { completed } = await request<{ completed: string[] }>('/api/mobile/move-in-guide');
  return completed;
}

export async function toggleMoveInItem(itemKey: string): Promise<string[]> {
  const { completed } = await request<{ completed: string[] }>('/api/mobile/move-in-guide', {
    method: 'POST',
    body: { itemKey },
  });
  return completed;
}

export async function dismissMoveInGuide(): Promise<void> {
  await request('/api/mobile/move-in-guide/dismiss', { method: 'POST' });
}

// Mirrors ChatTab in kuopas/web/src/app/(app)/messages/page.tsx and replyToNoticeAction
export async function getNotices(): Promise<SimpleMessage[]> {
  return request<SimpleMessage[]>('/api/mobile/notices');
}

export async function replyToNotice(content: string): Promise<SimpleMessage> {
  return request<SimpleMessage>('/api/mobile/notices', { method: 'POST', body: { content } });
}

// Mirrors ComplaintsTab, the complaint thread page and complaint-actions.ts in kuopas/web
export async function getComplaints(): Promise<Complaint[]> {
  return request<Complaint[]>('/api/mobile/complaints');
}

export async function submitComplaint(
  category: ComplaintCategory,
  description: string,
  photo: PhotoAttachment | null = null,
  video: VideoAttachment | null = null,
): Promise<Complaint> {
  if (photo || video) {
    const form = photoForm({ category, description }, photo);
    if (video) form.append('video', video as unknown as Blob);
    return request<Complaint>('/api/mobile/complaints', { method: 'POST', form });
  }
  return request<Complaint>('/api/mobile/complaints', { method: 'POST', body: { category, description } });
}

export async function getComplaintThread(complaintId: string): Promise<ComplaintThread> {
  return request<ComplaintThread>(`/api/mobile/complaints/${complaintId}`);
}

export async function sendComplaintMessage(complaintId: string, content: string): Promise<SimpleMessage> {
  return request<SimpleMessage>(`/api/mobile/complaints/${complaintId}/messages`, {
    method: 'POST',
    body: { content },
  });
}

// Mirrors DirectTab, the direct message thread page and direct-message-actions.ts in kuopas/web
export async function getDirectOverview(): Promise<DirectOverview> {
  return request<DirectOverview>('/api/mobile/direct');
}

export async function startConversation(otherTenantId: string): Promise<string> {
  const { id } = await request<{ id: string }>('/api/mobile/direct', { method: 'POST', body: { otherTenantId } });
  return id;
}

export async function getDirectThread(conversationId: string): Promise<DirectThread> {
  return request<DirectThread>(`/api/mobile/direct/${conversationId}`);
}

export async function sendDirectMessage(conversationId: string, content: string): Promise<SimpleMessage> {
  return request<SimpleMessage>(`/api/mobile/direct/${conversationId}/messages`, {
    method: 'POST',
    body: { content },
  });
}

// Mirrors the Communities pages and community-actions.ts in kuopas/web
export async function getCommunities(): Promise<Community[]> {
  return request<Community[]>('/api/mobile/communities');
}

export async function createCommunity(name: string, description: string): Promise<string> {
  const { id } = await request<{ id: string }>('/api/mobile/communities', {
    method: 'POST',
    body: { name, description },
  });
  return id;
}

export async function getCommunityThread(communityId: string): Promise<CommunityThread> {
  return request<CommunityThread>(`/api/mobile/communities/${communityId}`);
}

export async function joinCommunity(communityId: string): Promise<void> {
  await request(`/api/mobile/communities/${communityId}/join`, { method: 'POST' });
}

export async function leaveCommunity(communityId: string): Promise<void> {
  await request(`/api/mobile/communities/${communityId}/leave`, { method: 'POST' });
}

export async function sendCommunityMessage(communityId: string, content: string): Promise<CommunityMessage> {
  return request<CommunityMessage>(`/api/mobile/communities/${communityId}/messages`, {
    method: 'POST',
    body: { content },
  });
}

// Mirrors the Laundry page and laundry-actions.ts in kuopas/web
export async function getLaundry(machineId: string | null, week: string): Promise<LaundryOverview> {
  const params = new URLSearchParams({ week });
  if (machineId) params.set('machine', machineId);
  return request<LaundryOverview>(`/api/mobile/laundry?${params.toString()}`);
}

export async function bookLaundrySlot(machineId: string, startsAt: string): Promise<void> {
  await request('/api/mobile/laundry/bookings', { method: 'POST', body: { machineId, startsAt } });
}

export async function cancelLaundryBooking(bookingId: string): Promise<void> {
  await request(`/api/mobile/laundry/bookings/${bookingId}`, { method: 'DELETE' });
}

// Mirrors the Sauna page and sauna-actions.ts in kuopas/web
export async function getSauna(slotId: string | null, week: string): Promise<SaunaOverview> {
  const params = new URLSearchParams({ week });
  if (slotId) params.set('slot', slotId);
  return request<SaunaOverview>(`/api/mobile/sauna?${params.toString()}`);
}

export async function bookSaunaSlot(slotId: string, startsAt: string, group?: GroupSelection): Promise<void> {
  await request('/api/mobile/sauna/bookings', {
    method: 'POST',
    body: { slotId, startsAt, participants: group?.participants ?? [], inviteApartment: group?.inviteApartment ?? false },
  });
}

export async function cancelSaunaBooking(bookingId: string): Promise<void> {
  await request(`/api/mobile/sauna/bookings/${bookingId}`, { method: 'DELETE' });
}

// Mirrors the Parking page and parking-actions.ts in kuopas/web
export async function getParking(): Promise<ParkingOverview> {
  return request<ParkingOverview>('/api/mobile/parking');
}

export async function claimParkingSpot(spotId: string): Promise<void> {
  await request(`/api/mobile/parking/${spotId}/claim`, { method: 'POST' });
}

export async function releaseParkingSpot(spotId: string): Promise<void> {
  await request(`/api/mobile/parking/${spotId}/release`, { method: 'POST' });
}

// Mirrors the Booking hub in kuopas/web/src/app/(app)/booking and booking-actions.ts
export async function getBookingHub(): Promise<BookingHub> {
  return request<BookingHub>('/api/mobile/booking');
}

export async function respondToInvite(kind: 'sauna' | 'space', bookingId: string, decision: 'accept' | 'decline'): Promise<void> {
  await request('/api/mobile/booking/respond', { method: 'POST', body: { kind, bookingId, decision } });
}

export async function getResidents(): Promise<Residents> {
  return request<Residents>('/api/mobile/booking/residents');
}

export async function getSpace(spaceId: string, week: string): Promise<SpaceOverview> {
  return request<SpaceOverview>(`/api/mobile/booking/spaces/${spaceId}?week=${week}`);
}

export async function bookSpace(
  spaceId: string,
  input: { startsAt: string; hours: number; note: string } & GroupSelection,
): Promise<void> {
  await request(`/api/mobile/booking/spaces/${spaceId}/bookings`, { method: 'POST', body: input });
}

export async function cancelSpaceBooking(spaceId: string, bookingId: string): Promise<void> {
  await request(`/api/mobile/booking/spaces/${spaceId}/bookings/${bookingId}`, { method: 'DELETE' });
}

// Mirrors the Household hub and household-actions.ts in kuopas/web
export async function getHousehold(): Promise<Household> {
  return request<Household>('/api/mobile/household');
}

export async function createBill(input: {
  title: string;
  category: string;
  total: string;
  paidById: string;
  dueDate: string;
  participants: { id: string; weight: number }[];
}): Promise<void> {
  await request('/api/mobile/household/bills', { method: 'POST', body: input });
}

export async function deleteBill(billId: string): Promise<void> {
  await request(`/api/mobile/household/bills/${billId}`, { method: 'DELETE' });
}

export async function setSharePaid(shareId: string, paid: boolean): Promise<void> {
  await request(`/api/mobile/household/shares/${shareId}/paid`, { method: 'POST', body: { paid } });
}

export async function createChore(title: string, everyDays: number): Promise<void> {
  await request('/api/mobile/household/chores', { method: 'POST', body: { title, everyDays } });
}

export async function deleteChore(choreId: string): Promise<void> {
  await request(`/api/mobile/household/chores/${choreId}`, { method: 'DELETE' });
}

export async function completeChoreTask(taskId: string): Promise<void> {
  await request(`/api/mobile/household/tasks/${taskId}/complete`, { method: 'POST' });
}

// Mirrors reportChatMessageAction in kuopas/web/src/lib/household-actions.ts
export async function reportChatMessage(groupId: string, messageId: string): Promise<void> {
  await request(`/api/mobile/chats/${groupId}/messages/${messageId}/report`, { method: 'POST', body: {} });
}

// Mirrors the Roommates page and matching-actions.ts in kuopas/web
export async function getRoommates(): Promise<Roommates> {
  return request<Roommates>('/api/mobile/roommates');
}

export async function saveMatchProfile(profile: MatchProfile): Promise<void> {
  await request('/api/mobile/roommates/profile', { method: 'POST', body: profile });
}

export async function connectWith(toId: string): Promise<void> {
  await request('/api/mobile/roommates/connect', { method: 'POST', body: { toId } });
}

export async function respondConnection(connectionId: string, accept: boolean): Promise<void> {
  await request(`/api/mobile/roommates/connections/${connectionId}`, { method: 'POST', body: { accept } });
}

// Mirrors the Marketplace page and market-actions.ts in kuopas/web
export async function getMarket(): Promise<Market> {
  return request<Market>('/api/mobile/market');
}

export async function createListing(input: ListingInput): Promise<void> {
  await request('/api/mobile/market/listings', { method: 'POST', body: input });
}

export async function requestListing(listingId: string, message: string): Promise<void> {
  await request(`/api/mobile/market/listings/${listingId}`, { method: 'POST', body: { message } });
}

export async function closeListing(listingId: string): Promise<void> {
  await request(`/api/mobile/market/listings/${listingId}`, { method: 'DELETE' });
}

export async function respondListingRequest(requestId: string, accept: boolean): Promise<void> {
  await request(`/api/mobile/market/requests/${requestId}`, { method: 'POST', body: { accept } });
}

export async function withdrawListingRequest(requestId: string): Promise<void> {
  await request(`/api/mobile/market/requests/${requestId}`, { method: 'DELETE' });
}

// Mirrors the Lease page, verification-actions.ts and guarantor-actions.ts in kuopas/web
export async function getLease(): Promise<LeaseOverview> {
  return request<LeaseOverview>('/api/mobile/lease');
}

export async function requestEmailCode(email: string): Promise<{ devCode: string | null }> {
  return request<{ devCode: string | null }>('/api/mobile/verification/email-code', { method: 'POST', body: { email } });
}

export async function confirmEmailCode(code: string): Promise<void> {
  await request('/api/mobile/verification/confirm', { method: 'POST', body: { code } });
}

export async function submitVerificationDocument(
  method: string,
  institution: string,
  studentNumber: string,
  file: PhotoAttachment,
): Promise<void> {
  const form = new FormData();
  form.append('method', method);
  form.append('institution', institution);
  form.append('studentNumber', studentNumber);
  form.append('file', file as unknown as Blob);
  await request('/api/mobile/verification/document', { method: 'POST', form });
}

export async function requestGuarantor(
  input: { institutionId: string } | { guarantorName: string; guarantorEmail: string; guarantorPhone: string },
): Promise<void> {
  await request('/api/mobile/guarantor', { method: 'POST', body: input });
}

// Mirrors the Wellbeing page and wellbeing-actions.ts in kuopas/web
export async function getWellbeing(): Promise<WellbeingCase[]> {
  return request<WellbeingCase[]>('/api/mobile/wellbeing');
}

export async function submitWellbeing(input: {
  category: string;
  severity: string;
  description: string;
  consent: boolean;
}): Promise<void> {
  await request('/api/mobile/wellbeing', { method: 'POST', body: input });
}

export async function closeWellbeing(caseId: string): Promise<void> {
  await request(`/api/mobile/wellbeing/${caseId}/close`, { method: 'POST' });
}
