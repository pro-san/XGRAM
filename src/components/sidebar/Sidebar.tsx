import { useEffect, useState } from 'react';
import {
  Box,
  List,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';
import ChatListItem from './ChatListItem';
import NewChatDialog from '../dialogs/NewChatDialog';
import { subscribeToUserChats } from '../../firebase/chats';
import { signOut } from '../../firebase/auth';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { t } from '../../i18n/strings';
import type { Chat } from '../../types';

export default function Sidebar() {
  const profile = useAuthStore((s) => s.profile);
  const { activeChatId, setActiveChatId, themeMode, toggleTheme, language, setLanguage } =
    useUIStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState<'group' | 'channel' | 'direct' | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = subscribeToUserChats(profile.uid, setChats);
    return () => unsub();
  }, [profile?.uid]);

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box
      sx={{
        width: 340,
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar src={profile?.photoURL}>{profile?.displayName?.[0]}</Avatar>
        <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {t(language, 'appName')}
        </Typography>
        <Tooltip title="Toggle theme">
          <IconButton onClick={toggleTheme}>
            {themeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Language">
          <IconButton onClick={(e) => setLangAnchor(e.currentTarget)}>
            <LanguageIcon />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={langAnchor} open={!!langAnchor} onClose={() => setLangAnchor(null)}>
          <MenuItem
            onClick={() => {
              setLanguage('en');
              setLangAnchor(null);
            }}
          >
            English
          </MenuItem>
          <MenuItem
            onClick={() => {
              setLanguage('km');
              setLangAnchor(null);
            }}
          >
            ភាសាខ្មែរ
          </MenuItem>
        </Menu>
        <Tooltip title="New">
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
          <MenuItem
            onClick={() => {
              setDialogOpen('direct');
              setMenuAnchor(null);
            }}
          >
            New Direct Message
          </MenuItem>
          <MenuItem
            onClick={() => {
              setDialogOpen('group');
              setMenuAnchor(null);
            }}
          >
            {t(language, 'newGroup')}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setDialogOpen('channel');
              setMenuAnchor(null);
            }}
          >
            {t(language, 'newChannel')}
          </MenuItem>
        </Menu>
        <Tooltip title="Sign Out">
          <IconButton onClick={() => signOut()}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ px: 1.5, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t(language, 'searchChats')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <List sx={{ flexGrow: 1, overflowY: 'auto', py: 0 }}>
        {filtered.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            selected={chat.id === activeChatId}
            onClick={() => setActiveChatId(chat.id)}
          />
        ))}
      </List>

      {dialogOpen && (
        <NewChatDialog
          mode={dialogOpen}
          onClose={() => setDialogOpen(null)}
          onCreated={(id) => {
            setDialogOpen(null);
            setActiveChatId(id);
          }}
        />
      )}
    </Box>
  );
}
