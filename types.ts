export type ContentType = 'movie' | 'series' | 'tv';
export type QualityType = '4K' | '1080p' | '720p' | 'CAM' | 'DVD';

export interface Episode {
  id: string;
  title: string;
  seasonNumber: number;
  episodeNumber: number;
  streamUrl: string;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  thumbnailUrl: string;
  categories: string[];
  addedAt: string;
  isHit?: boolean;
  quality?: QualityType; // New: Quality
  addedBy?: string; // New: Admin/Mod who added it
  // Specific to Movie & TV
  streamUrl?: string;
  // Specific to Series
  episodes?: Episode[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  isThinking?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
}

export const CATEGORIES = ['Action', 'Sci-Fi', 'Drama', 'Comedy', 'Horror', 'Documentary', 'Anime', 'News', 'Sports', 'Kids', 'Music'];

// --- AUTH & FEATURES ---

export type UserRole = 'admin' | 'mod' | 'user';

export interface WatchHistoryItem {
    timestamp: number;
    duration: number;
    lastWatched: string;
}

export interface User {
  id: string;
  username: string;
  password: string; 
  email?: string; // New: Email
  role: UserRole;
  isBanned?: boolean;
  avatarUrl?: string;
  favorites: string[]; 
  watchHistory: Record<string, WatchHistoryItem>; 
  // Stats
  registeredAt: string;
  lastActive: string;
  // Points System
  points: number; // New: Points
  awardedContentIds: string[]; // New: Track which content gave points
}

export interface Comment {
  id: string;
  contentId: string;
  userId: string;
  username: string;
  userRole?: UserRole; 
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface ContentRequest {
  id: string;
  userId: string;
  username: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// --- NOTIFICATIONS ---
export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  isSticky: boolean;
  createdAt: string;
}

export interface SiteSettings {
    discordLink: string;
}

// --- LANGUAGE ---
export type Language = 'en' | 'pl';
