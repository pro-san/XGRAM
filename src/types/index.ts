import { Timestamp } from 'firebase/firestore';

export type ChatType = 'private' | 'group' | 'channel';
export type MessageType = 'text' | 'image' | 'file' | 'voice';
export type Language = 'en' | 'km';
export type ThemeMode = 'light' | 'dark';

export interface AppUser {
  uid: string;
  displayName: string;
  username: string;
  email?: string;
  photoURL: string;
  bio?: string;
  status: 'online' | 'offline';
  lastSeen: Timestamp | null;
  language: Language;
  createdAt: Timestamp | null;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  photoURL: string;
  memberIds: string[];
  adminIds: string[];
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastMessage?: {
    text: string;
    senderId: string;
    type: MessageType;
    createdAt: Timestamp | null;
  };
  // For channels: only admins can post, everyone else reads
  isBroadcastOnly: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  memberIds: string[];
  type: MessageType;
  text: string;
  mediaUrl: string;
  mediaName: string;
  mediaSize: number;
  voiceDurationSec: number;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp | null;
  readBy: string[];
  editedAt?: Timestamp | null;
  deleted: boolean;
}

export interface TypingState {
  uid: string;
  chatId: string;
  memberIds: string[];
  isTyping: boolean;
  updatedAt: Timestamp | null;
}
