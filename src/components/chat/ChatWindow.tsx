import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { subscribeToMessages, subscribeToTyping } from '../../firebase/chats';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { t } from '../../i18n/strings';
import type { Chat, Message } from '../../types';

interface Props {
  chat: Chat | undefined;
}

export default function ChatWindow({ chat }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const language = useUIStore((s) => s.language);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chat) return;
    const unsubMsg = subscribeToMessages(chat.id, setMessages);
    const unsubTyping = subscribeToTyping(chat.id, setTypingMap);
    return () => {
      unsubMsg();
      unsubTyping();
    };
  }, [chat?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!chat) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <Typography color="text.secondary">{t(language, 'noChatSelected')}</Typography>
      </Box>
    );
  }

  const othersTyping = Object.entries(typingMap).some(
    ([uid, isTyping]) => isTyping && uid !== profile?.uid,
  );
  const canSend = !chat.isBroadcastOnly || chat.adminIds.includes(profile?.uid || '');

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <ChatHeader chat={chat} isTyping={othersTyping} />
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 2 }}>
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} isOwn={m.senderId === profile?.uid} />
        ))}
        <div ref={bottomRef} />
      </Box>
      {canSend ? (
        <MessageInput chatId={chat.id} />
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Only admins can post in this channel
          </Typography>
        </Box>
      )}
    </Box>
  );
}
