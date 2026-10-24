/**
 * Firestore Security Rules Test Specification (Phase 0 TDD)
 * Verifies that all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface AdversarialTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const dirtyDozenTests: AdversarialTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on User Profile',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      uid: 'user_1',
      displayName: 'Alice',
      username: 'alice',
      photoURL: '',
      status: 'online',
      language: 'en',
      isAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Identity Spoofing on Chat Creation',
    operation: 'create',
    path: '/chats/chat_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      type: 'private',
      name: 'Direct',
      photoURL: '',
      memberIds: ['user_1', 'user_2'],
      adminIds: ['user_2'],
      createdBy: 'user_2',
      isBroadcastOnly: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Write Attempt',
    operation: 'create',
    path: '/chats/chat_1',
    auth: { uid: 'user_1', email_verified: false },
    payload: {
      type: 'private',
      name: 'Direct',
      photoURL: '',
      memberIds: ['user_1', 'user_2'],
      adminIds: ['user_1'],
      createdBy: 'user_1',
      isBroadcastOnly: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Cross-User PII Read on Private Subcollection',
    operation: 'get',
    path: '/users/victim_uid/private/info',
    auth: { uid: 'attacker_uid', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'ID Poisoning with Oversized Path Variable',
    operation: 'create',
    path: `/chats/${'a'.repeat(300)}`,
    auth: { uid: 'user_1', email_verified: true },
    payload: {},
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Value Poisoning on Whitelisted Update Key',
    operation: 'update',
    path: '/chats/chat_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      name: 'x'.repeat(5000),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Broadcast Channel Unauthorized Post by Non-Admin',
    operation: 'create',
    path: '/chats/channel_1/messages/msg_1',
    auth: { uid: 'non_admin_member', email_verified: true },
    payload: {
      chatId: 'channel_1',
      senderId: 'non_admin_member',
      memberIds: ['admin_1', 'non_admin_member'],
      type: 'text',
      text: 'Unauthorized announcement',
      mediaUrl: '',
      mediaName: '',
      mediaSize: 0,
      voiceDurationSec: 0,
      readBy: ['non_admin_member'],
      deleted: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Orphaned Chat Creation Without Existing User Profile',
    operation: 'create',
    path: '/chats/chat_orphan',
    auth: { uid: 'ghost_user', email_verified: true },
    payload: {
      type: 'group',
      name: 'Ghost Group',
      photoURL: '',
      memberIds: ['ghost_user'],
      adminIds: ['ghost_user'],
      createdBy: 'ghost_user',
      isBroadcastOnly: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Timestamp Forgery / Backdating Message Creation',
    operation: 'create',
    path: '/chats/chat_1/messages/msg_forged',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      chatId: 'chat_1',
      senderId: 'user_1',
      memberIds: ['user_1', 'user_2'],
      type: 'text',
      text: 'Backdated message',
      mediaUrl: '',
      mediaName: '',
      mediaSize: 0,
      voiceDurationSec: 0,
      createdAt: 0,
      updatedAt: 0,
      readBy: ['user_1'],
      deleted: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immortal Field Mutation on Message Sender',
    operation: 'update',
    path: '/chats/chat_1/messages/msg_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      senderId: 'user_2',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal State Mutation on Already Deleted Message',
    operation: 'update',
    path: '/chats/chat_1/messages/msg_deleted',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      text: 'Restored text after delete',
      deleted: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unfiltered Collection List Scraping on Private Info',
    operation: 'list',
    path: '/users/user_1/private',
    auth: { uid: 'user_1', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
