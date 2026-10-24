import { Box } from '@mui/material';
import Sidebar from '../sidebar/Sidebar';
import ChatWindow from '../chat/ChatWindow';
import { useUIStore } from '../../store/uiStore';
import { useEffect, useState } from 'react';
import { subscribeToUserChats } from '../../firebase/chats';
import { useAuthStore } from '../../store/authStore';
import type { Chat } from '../../types';

export default function MainLayout() {
  const activeChatId = useUIStore((s) => s.activeChatId);
  const profile = useAuthStore((s) => s.profile);
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!profile?.uid) return;
    return subscribeToUserChats(profile.uid, setChats);
  }, [profile?.uid]);

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <ChatWindow chat={activeChat} />
    </Box>
  );
}
