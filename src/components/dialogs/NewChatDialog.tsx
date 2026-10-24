import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { searchUsers } from '../../firebase/users';
import { createChat } from '../../firebase/chats';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { t } from '../../i18n/strings';
import type { AppUser, Chat } from '../../types';

interface Props {
  mode: 'direct' | 'group' | 'channel';
  existingChats?: Chat[];
  onClose: () => void;
  onCreated: (chatId: string) => void;
}

export default function NewChatDialog({ mode, existingChats = [], onClose, onCreated }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const language = useUIStore((s) => s.language);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<AppUser[]>([]);
  const [selected, setSelected] = useState<AppUser[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    handleSearch('');
  }, [profile?.uid]);

  async function handleSearch(value: string) {
    setSearch(value);
    const users = await searchUsers(value);
    setResults(users.filter((u) => u.uid !== profile?.uid));
  }

  function toggleSelect(user: AppUser) {
    if (mode === 'direct') {
      setSelected((prev) => (prev.find((u) => u.uid === user.uid) ? [] : [user]));
      return;
    }
    setSelected((prev) =>
      prev.find((u) => u.uid === user.uid)
        ? prev.filter((u) => u.uid !== user.uid)
        : [...prev, user],
    );
  }

  async function handleCreate() {
    if (!profile) return;
    if (mode === 'direct' && selected[0]) {
      const targetUser = selected[0];
      const existing = existingChats.find(
        (c) =>
          c.type === 'private' &&
          c.memberIds.includes(profile.uid) &&
          c.memberIds.includes(targetUser.uid) &&
          c.memberIds.length === 2,
      );
      if (existing) {
        onCreated(existing.id);
        return;
      }

      const chatId = await createChat({
        type: 'private',
        name: targetUser.displayName,
        photoURL: targetUser.photoURL,
        memberIds: [profile.uid, targetUser.uid],
        createdBy: profile.uid,
      });
      if (chatId) {
        onCreated(chatId);
      }
      return;
    }
    if ((mode === 'group' || mode === 'channel') && name.trim()) {
      const chatId = await createChat({
        type: mode,
        name: name.trim().slice(0, 120),
        memberIds: [profile.uid, ...selected.map((u) => u.uid)],
        createdBy: profile.uid,
        isBroadcastOnly: mode === 'channel',
      });
      if (chatId) {
        onCreated(chatId);
      }
    }
  }

  const title =
    mode === 'direct'
      ? t(language, 'newDirectMessage')
      : mode === 'group'
        ? t(language, 'newGroup')
        : t(language, 'newChannel');

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {mode !== 'direct' && (
            <TextField
              label={mode === 'group' ? 'Group name' : 'Channel name'}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 120))}
              fullWidth
              autoFocus
            />
          )}
          <TextField
            label={t(language, 'searchUsersLabel')}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            fullWidth
            autoFocus={mode === 'direct'}
          />
          {selected.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {selected.map((u) => (
                <Chip
                  key={u.uid}
                  label={u.displayName}
                  onDelete={() => toggleSelect(u)}
                  size="small"
                />
              ))}
            </Stack>
          )}
          <List dense sx={{ maxHeight: 220, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                {t(language, 'noUsersFound')}
              </Typography>
            ) : (
              results.map((u) => {
                const secondary = u.email ? `@${u.username} • ${u.email}` : `@${u.username}`;
                return (
                  <ListItemButton
                    key={u.uid}
                    onClick={() => toggleSelect(u)}
                    selected={!!selected.find((s) => s.uid === u.uid)}
                  >
                    <ListItemAvatar>
                      <Avatar src={u.photoURL}>{u.displayName[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={u.displayName} secondary={secondary} />
                  </ListItemButton>
                );
              })
            )}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={mode === 'direct' ? selected.length === 0 : !name.trim()}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
