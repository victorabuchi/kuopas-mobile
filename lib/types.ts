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
  removed?: boolean;
  reported?: boolean;
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

export type Profile = Tenant & {
  hasSeenMoveInGuide: boolean;
  building: { id: string; name: string };
  stairwell: { id: string; label: string };
  unit: { id: string; code: string; floor: number };
};

export type NewsCategory = 'news' | 'updates' | 'promotions' | 'discounts' | 'events';

export type NewsPost = {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  category: NewsCategory;
  publishedAt: string;
};

export type SimpleMessage = {
  id: string;
  content: string;
  sentAt: string;
  isOwn: boolean;
};

export type ComplaintCategory =
  | 'plumbing'
  | 'electrical'
  | 'heating'
  | 'appliance'
  | 'pest'
  | 'noise'
  | 'structural'
  | 'other';

export type ComplaintStatus = 'new' | 'in_progress' | 'resolved';

export type Complaint = {
  id: string;
  category: ComplaintCategory;
  description: string;
  photoUrl: string | null;
  videoUrl?: string | null;
  status: ComplaintStatus;
  createdAt: string;
};

export type ComplaintThread = {
  complaint: Complaint;
  messages: SimpleMessage[];
};

export type DirectOverview = {
  buildingName: string;
  conversations: {
    id: string;
    other: { id: string; name: string };
    lastMessage: { content: string; sentAt: string } | null;
  }[];
  contacts: { id: string; name: string }[];
};

export type DirectThread = {
  other: { id: string; name: string };
  messages: SimpleMessage[];
};

export type Community = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isMember: boolean;
};

export type CommunityMessage = SimpleMessage & { sender: Tenant };

export type CommunityThread = {
  community: Community;
  messages: CommunityMessage[];
};

export type BookingEntry = { id: string; startsAt: string; mine: boolean };
export type BookingResource = { id: string; label: string; capacity?: number };

export type LaundryOverview = {
  buildingName: string;
  machines: BookingResource[];
  activeMachineId: string | null;
  bookings: BookingEntry[];
};

export type SaunaOverview = {
  buildingName: string;
  slots: BookingResource[];
  activeSlotId: string | null;
  bookings: BookingEntry[];
};

export type ParkingOverview = {
  buildingName: string;
  spots: { id: string; label: string; mine: boolean; takenBy: string | null }[];
};

export type PhotoAttachment = { uri: string; name: string; type: string };

export type Resident = { id: string; name: string; unitCode: string };
export type Residents = { roommates: Resident[]; others: Resident[] };
export type GroupSelection = { participants: string[]; inviteApartment: boolean };

export type BookingHub = {
  invites: { key: string; kind: 'sauna' | 'space'; bookingId: string; title: string; startsAt: string; by: string; at: number }[];
  cards: { key: string; kind: string; spaceId: string | null; name: string | null; description: string | null; count: number }[];
  items: {
    key: string;
    kind: 'laundry' | 'sauna' | 'space';
    title: string;
    startsAt: string;
    role: 'you' | 'organiser' | 'with';
    organiserName: string | null;
    withCount: number;
    spaceId: string | null;
    bookingId: string;
    action: 'leave' | 'cancel' | null;
  }[];
  parking: { label: string } | null;
};

export type SpaceOverview = {
  space: {
    id: string;
    kind: string;
    name: string;
    description: string;
    capacity: number;
    openHour: number;
    closeHour: number;
    maxHoursPerBooking: number;
    maxHoursPerWeek: number;
    advanceDays: number;
  };
  bookings: { id: string; startsAt: string; endsAt: string; mine: boolean }[];
};

export type Household = {
  meId: string;
  members: { id: string; name: string }[];
  bills: {
    id: string;
    title: string;
    category: string;
    totalCents: number;
    paidById: string;
    dueDate: string | null;
    shares: { id: string; tenantId: string; amountCents: number; paidAt: string | null }[];
  }[];
  chores: {
    id: string;
    title: string;
    everyDays: number;
    current: { id: string; assignedToId: string; dueDate: string } | null;
  }[];
  chatGroupId: string | null;
};

export type MatchProfile = {
  answers: Record<string, string>;
  dealbreakers: string[];
  bio: string;
  active: boolean;
};

export type Roommates = {
  verified: boolean;
  profile: MatchProfile | null;
  matches: {
    tenantId: string;
    firstName: string;
    institution: string | null;
    bio: string;
    score: number;
    best: string[];
    differences: string[];
    status: 'accepted' | 'requested' | 'incoming' | null;
  }[];
  connections: {
    incoming: { id: string; name: string }[];
    outgoing: { id: string; name: string }[];
    connected: { id: string; tenantId: string; name: string }[];
  };
};

export type Market = {
  verified: boolean;
  browse: {
    id: string;
    kind: string;
    title: string;
    description: string;
    priceCents: number | null;
    availableFrom: string | null;
    availableTo: string | null;
    wanted: string | null;
    place: string;
    floor: number | null;
    sellerFirstName: string;
    requested: boolean;
    ownUnit: boolean;
  }[];
  mine: {
    id: string;
    kind: string;
    title: string;
    status: string;
    subleaseFrom: string | null;
    subleaseTo: string | null;
    requests: { id: string; message: string; requesterFirstName: string }[];
  }[];
  requests: { id: string; status: string; message: string; listingTitle: string }[];
};

export type ListingInput = {
  kind: 'sublet' | 'swap';
  title: string;
  description: string;
  price: string;
  wanted: string;
  availableFrom: string;
  availableTo: string;
};

export type LeaseOverview = {
  leases: {
    id: string;
    kind: string;
    status: string;
    startDate: string;
    endDate: string;
    unitCode: string;
    monthlyRentCents: number;
    depositCents: number;
    upfrontMonths: number;
    charges: {
      id: string;
      periodStart: string;
      periodEnd: string;
      amountCents: number;
      prorated: boolean;
      dueDate: string;
      paidAt: string | null;
    }[];
  }[];
  guarantor: {
    requests: { id: string; status: string; staffNote: string | null }[];
    institutions: { id: string; name: string; description: string }[];
  };
  verification: {
    verified: boolean;
    approvedMethod: string | null;
    approvedInstitution: string | null;
    records: { id: string; method: string; status: string; createdAt: string }[];
  };
  room: {
    media: { id: string; url: string; kind: string; caption: string | null }[];
    roommates: { id: string; name: string; bio: string | null; verified: boolean }[];
  };
};

export type WellbeingCase = {
  id: string;
  category: string;
  status: string;
  createdAt: string;
  escalatedTo: string | null;
};

export type VideoAttachment = PhotoAttachment;
