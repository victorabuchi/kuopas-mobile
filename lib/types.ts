export type Unit = {
  id: string;
  code: string;
  floor: number;
};

export type Stairwell = {
  id: string;
  label: string;
  units: Unit[];
};

export type Building = {
  id: string;
  name: string;
  stairwells: Stairwell[];
};

export type Tenant = {
  id: string;
  name: string;
  pseudonym: string | null;
  email: string;
};

export type ChatGroupScope = 'unit' | 'building' | 'stairwell' | 'floor';

export type ChatGroup = {
  id: string;
  name: string;
  scope: ChatGroupScope;
};

export type Message = {
  id: string;
  content: string;
  sentAt: string;
  sender: Tenant;
};

export type ChatListItem = {
  membershipId: string;
  group: ChatGroup;
  lastMessage: { senderName: string; content: string; sentAt: string } | null;
};

export type ChatThread = {
  group: ChatGroup & { memberCount: number };
  messages: Message[];
};

export type BuildingPostType = 'announcement' | 'noticeboard';

export type NoticeboardCategory = 'furniture' | 'lost_found' | 'borrow' | 'giveaway' | 'other';

export type BuildingPostComment = {
  id: string;
  content: string;
  createdAt: string;
  author: Tenant;
};

export type BuildingPost = {
  id: string;
  type: BuildingPostType;
  noticeboardCategory: NoticeboardCategory | null;
  title: string;
  titleEn: string | null;
  content: string;
  contentEn: string | null;
  photoUrl: string | null;
  createdAt: string;
  authorTenant: Tenant | null;
  authorStaff: { id: string } | null;
  comments: BuildingPostComment[];
  reactions: { tenantId: string }[];
};
