import { useEffect, useState } from 'react';
import {
  Box,
  List,
  ListSubheader,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Badge,
  Typography,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';
import ChatListItem from './ChatListItem';
import NewChatDialog from '../dialogs/NewChatDialog';
import { createChat, subscribeToUserChats } from '../../firebase/chats';
import { searchUsers } from '../../firebase/users';
import { signOut } from '../../firebase/auth';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { t } from '../../i18n/strings';
import type { AppUser, Chat } from '../../types';

export default function Sidebar() {
  const profile = useAuthStore((s) => s.profile);
  const { activeChatId, setActiveChatId, themeMode, toggleTheme, language, setLanguage } =
    useUIStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState('');
  const [userResults, setUserResults] = useState<AppUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [startingDmUid, setStartingDmUid] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<'group' | 'channel' | 'direct' | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = subscribeToUserChats(profile.uid, setChats);
    return () => unsub();
  }, [profile?.uid]);

  const trimmedSearch = search.trim();

  useEffect(() => {
    if (!profile?.uid || !trimmedSearch) {
      setUserResults([]);
      setSearchingUsers(false);
      return;
    }

    let cancelled = false;
    setSearchingUsers(true);

    const timer = window.setTimeout(async () => {
      try {
        const users = await searchUsers(trimmedSearch);
        if (!cancelled) {
          setUserResults(users.filter((u) => u.uid !== profile.uid));
        }
      } finally {
        if (!cancelled) {
          setSearchingUsers(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmedSearch, profile?.uid]);

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(trimmedSearch.toLowerCase()),
  );

  function findExistingPrivateChat(targetUid: string): Chat | undefined {
    if (!profile?.uid) return undefined;
    return chats.find(
      (c) =>
        c.type === 'private' &&
        c.memberIds.includes(profile.uid) &&
        c.memberIds.includes(targetUid) &&
        (c.memberIds.length === 2 || (targetUid === profile.uid && c.memberIds.length === 1)),
    );
  }

  async function handleSelectUserResult(targetUser: AppUser) {
    if (!profile?.uid || startingDmUid) return;

    const existing = findExistingPrivateChat(targetUser.uid);
    if (existing) {
      setActiveChatId(existing.id);
      setSearch('');
      return;
    }

    setStartingDmUid(targetUser.uid);
    try {
      const chatId = await createChat({
        type: 'private',
        name: targetUser.displayName,
        photoURL: targetUser.photoURL,
        memberIds: [profile.uid, targetUser.uid],
        createdBy: profile.uid,
      });
      if (chatId) {
        setActiveChatId(chatId);
        setSearch('');
      }
    } finally {
      setStartingDmUid(null);
    }
  }

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
            {t(language, 'newDirectMessage')}
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
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    edge="end"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
      </Box>

      <List sx={{ flexGrow: 1, overflowY: 'auto', py: 0 }}>
        {trimmedSearch ? (
          <>
            <ListSubheader
              disableSticky
              sx={{
                lineHeight: '28px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 0.5,
              }}
            >
              <span>{t(language, 'peopleSection')}</span>
              {searchingUsers && <CircularProgress size={14} />}
            </ListSubheader>

            {!searchingUsers && userResults.length === 0 ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', px: 2, py: 1 }}
              >
                {t(language, 'noUsersFound')}
              </Typography>
            ) : (
              userResults.map((user) => {
                const existingChat = findExistingPrivateChat(user.uid);
                const isStarting = startingDmUid === user.uid;
                const secondaryParts = [`@${user.username}`];
                if (user.email) {
                  secondaryParts.push(user.email);
                }

                return (
                  <ListItemButton
                    key={user.uid}
                    onClick={() => handleSelectUserResult(user)}
                    disabled={isStarting}
                    sx={{ py: 1 }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={user.status === 'online' ? 'success' : 'default'}
                      >
                        <Avatar src={user.photoURL}>{user.displayName?.[0]}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1 }}>
                            {user.displayName}
                          </Typography>
                          {isStarting ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Chip
                              label={
                                existingChat
                                  ? t(language, 'openDirectMessage')
                                  : t(language, 'startDirectMessage')
                              }
                              size="small"
                              color={existingChat ? 'default' : 'primary'}
                              variant="outlined"
                              sx={{ height: 22, fontSize: '0.68rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {secondaryParts.join(' • ')}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                );
              })
            )}

            <Divider sx={{ my: 0.5 }} />

            <ListSubheader
              disableSticky
              sx={{
                lineHeight: '28px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                py: 0.5,
              }}
            >
              {t(language, 'chatsSection')}
            </ListSubheader>

            {filteredChats.length === 0 ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', px: 2, py: 1 }}
              >
                {t(language, 'noChatsFound')}
              </Typography>
            ) : (
              filteredChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  selected={chat.id === activeChatId}
                  onClick={() => setActiveChatId(chat.id)}
                />
              ))
            )}
          </>
        ) : (
          filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              selected={chat.id === activeChatId}
              onClick={() => setActiveChatId(chat.id)}
            />
          ))
        )}
      </List>

      {dialogOpen && (
        <NewChatDialog
          mode={dialogOpen}
          existingChats={chats}
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
