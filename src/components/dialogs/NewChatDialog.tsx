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
import { searchUsersByUsername } from '../../firebase/users';
import { createChat } from '../../firebase/chats';
import { useAuthStore } from '../../store/authStore';
import type { AppUser } from '../../types';

interface Props {
  mode: 'direct' | 'group' | 'channel';
  onClose: () => void;
  onCreated: (chatId: string) => void;
}

export default function NewChatDialog({ mode, onClose, onCreated }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<AppUser[]>([]);
  const [selected, setSelected] = useState<AppUser[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    handleSearch('');
  }, [profile?.uid]);

  async function handleSearch(value: string) {
    setSearch(value);
    const users = await searchUsersByUsername(value);
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
      const chatId = await createChat({
        type: 'private',
        name: selected[0].displayName,
        memberIds: [profile.uid, selected[0].uid],
        createdBy: profile.uid,
      });
      onCreated(chatId);
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
      onCreated(chatId);
    }
  }

  const title =
    mode === 'direct' ? 'New Direct Message' : mode === 'group' ? 'New Group' : 'New Channel';

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
            label="Search by username"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            fullWidth
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
                No other registered users found yet.
              </Typography>
            ) : (
              results.map((u) => (
                <ListItemButton
                  key={u.uid}
                  onClick={() => toggleSelect(u)}
                  selected={!!selected.find((s) => s.uid === u.uid)}
                >
                  <ListItemAvatar>
                    <Avatar src={u.photoURL}>{u.displayName[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={u.displayName} secondary={`@${u.username}`} />
                </ListItemButton>
              ))
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
