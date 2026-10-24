import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
  arrayUnion,
} from 'firebase/firestore';
import { auth, db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import {
  ALLOWED_REACTION_EMOJIS,
  type Chat,
  type ChatType,
  type Message,
  type MessageReactions,
  type MessageType,
  type ReactionEmoji,
} from '../types';

export function subscribeToUserChats(
  uid: string,
  callback: (chats: Chat[]) => void,
) {
  const q = query(
    collection(db, 'chats'),
    where('memberIds', 'array-contains', uid),
  );
  return onSnapshot(
    q,
    (snap) => {
      const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Chat);
      chats.sort((a, b) => {
        const aTime =
          a.lastMessage?.createdAt?.toMillis?.() ??
          a.updatedAt?.toMillis?.() ??
          a.createdAt?.toMillis?.() ??
          0;
        const bTime =
          b.lastMessage?.createdAt?.toMillis?.() ??
          b.updatedAt?.toMillis?.() ??
          b.createdAt?.toMillis?.() ??
          0;
        return bTime - aTime;
      });
      callback(chats);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    },
  );
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void,
) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};
  const path = `chats/${chatId}/messages`;
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    where('memberIds', 'array-contains', uid),
    limit(500),
  );
  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Message,
      );
      messages.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
        const bTime = b.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
      callback(messages);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export async function createChat(opts: {
  type: ChatType;
  name: string;
  memberIds: string[];
  createdBy: string;
  photoURL?: string;
  isBroadcastOnly?: boolean;
}) {
  const uniqueMembers = Array.from(new Set([opts.createdBy, ...opts.memberIds])).slice(0, 50);
  try {
    const ref = await addDoc(collection(db, 'chats'), {
      type: opts.type,
      name: opts.name.trim().slice(0, 120) || 'Chat',
      photoURL: (opts.photoURL || '').slice(0, 1000),
      memberIds: uniqueMembers,
      adminIds: [opts.createdBy],
      createdBy: opts.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isBroadcastOnly: Boolean(opts.isBroadcastOnly || opts.type === 'channel'),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'chats');
  }
}

async function getChatMemberIds(chatId: string, fallbackUid: string): Promise<string[]> {
  try {
    const chatSnap = await getDoc(doc(db, 'chats', chatId));
    if (chatSnap.exists()) {
      const data = chatSnap.data();
      if (Array.isArray(data.memberIds) && data.memberIds.length > 0) {
        return data.memberIds.slice(0, 50);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `chats/${chatId}`);
  }
  return [fallbackUid];
}

export async function sendMessage(opts: {
  chatId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  voiceDurationSec?: number;
}) {
  const memberIds = await getChatMemberIds(opts.chatId, opts.senderId);
  const messagesPath = `chats/${opts.chatId}/messages`;
  const messagesRef = collection(db, 'chats', opts.chatId, 'messages');
  const safeText = (opts.text || '').slice(0, 2000);
  try {
    await addDoc(messagesRef, {
      chatId: opts.chatId,
      senderId: opts.senderId,
      memberIds,
      type: opts.type,
      text: safeText,
      mediaUrl: (opts.mediaUrl || '').slice(0, 1500),
      mediaName: (opts.mediaName || '').slice(0, 255),
      mediaSize: Math.max(0, Math.min(52428800, Math.floor(opts.mediaSize || 0))),
      voiceDurationSec: Math.max(0, Math.min(3600, Math.floor(opts.voiceDurationSec || 0))),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      readBy: [opts.senderId],
      reactions: {},
      deleted: false,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, messagesPath);
  }

  const chatPath = `chats/${opts.chatId}`;
  const chatRef = doc(db, 'chats', opts.chatId);
  try {
    await updateDoc(chatRef, {
      updatedAt: serverTimestamp(),
      lastMessage: {
        text: opts.type === 'text' ? safeText : `[${opts.type}]`,
        senderId: opts.senderId,
        type: opts.type,
        createdAt: serverTimestamp(),
      },
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, chatPath);
  }
}

export async function toggleMessageReaction(opts: {
  chatId: string;
  messageId: string;
  uid: string;
  emoji: ReactionEmoji;
}) {
  if (!ALLOWED_REACTION_EMOJIS.includes(opts.emoji)) {
    return;
  }
  const path = `chats/${opts.chatId}/messages/${opts.messageId}`;
  const ref = doc(db, 'chats', opts.chatId, 'messages', opts.messageId);
  let currentReactions: MessageReactions = {};
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.reactions && typeof data.reactions === 'object') {
      currentReactions = { ...data.reactions };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const sanitizedReactions: MessageReactions = {};
  for (const key of ALLOWED_REACTION_EMOJIS) {
    const list = currentReactions[key];
    if (Array.isArray(list)) {
      const validUids = list
        .filter((u): u is string => typeof u === 'string' && u.length >= 1 && u.length <= 128)
        .slice(0, 50);
      if (validUids.length > 0) {
        sanitizedReactions[key] = validUids;
      }
    }
  }

  const existingForEmoji = sanitizedReactions[opts.emoji] ?? [];
  const hasReacted = existingForEmoji.includes(opts.uid);
  if (hasReacted) {
    const updatedList = existingForEmoji.filter((id) => id !== opts.uid);
    if (updatedList.length > 0) {
      sanitizedReactions[opts.emoji] = updatedList;
    } else {
      delete sanitizedReactions[opts.emoji];
    }
  } else {
    sanitizedReactions[opts.emoji] = [...existingForEmoji, opts.uid].slice(0, 50);
  }

  try {
    await updateDoc(ref, {
      reactions: sanitizedReactions,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markMessageRead(
  chatId: string,
  messageId: string,
  uid: string,
) {
  const path = `chats/${chatId}/messages/${messageId}`;
  const ref = doc(db, 'chats', chatId, 'messages', messageId);
  try {
    await updateDoc(ref, {
      readBy: arrayUnion(uid),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function setTyping(chatId: string, uid: string, isTyping: boolean) {
  const memberIds = await getChatMemberIds(chatId, uid);
  const path = `chats/${chatId}/typing/${uid}`;
  const ref = doc(db, 'chats', chatId, 'typing', uid);
  try {
    await setDoc(ref, {
      uid,
      chatId,
      memberIds,
      isTyping,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToTyping(
  chatId: string,
  callback: (typing: Record<string, boolean>) => void,
) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};
  const path = `chats/${chatId}/typing`;
  const q = query(
    collection(db, 'chats', chatId, 'typing'),
    where('memberIds', 'array-contains', uid),
  );
  return onSnapshot(
    q,
    (snap) => {
      const result: Record<string, boolean> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        result[data.uid] = data.isTyping;
      });
      callback(result);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}
