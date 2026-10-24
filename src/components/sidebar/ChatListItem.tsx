import {
  Avatar,
  Badge,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import GroupIcon from '@mui/icons-material/Group';
import type { Chat } from '../../types';

interface Props {
  chat: Chat;
  selected: boolean;
  onClick: () => void;
}

export default function ChatListItem({ chat, selected, onClick }: Props) {
  const typeIcon =
    chat.type === 'channel' ? (
      <CampaignIcon fontSize="small" />
    ) : chat.type === 'group' ? (
      <GroupIcon fontSize="small" />
    ) : null;

  const lastMessageText = chat.lastMessage?.text || 'No messages yet';
  const timestamp = chat.lastMessage?.createdAt
    ? chat.lastMessage.createdAt.toDate().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <ListItemButton selected={selected} onClick={onClick} sx={{ borderRadius: 1, mx: 1, mb: 0.5 }}>
      <ListItemAvatar>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          color="success"
          invisible={chat.type !== 'private'}
        >
          <Avatar src={chat.photoURL}>{chat.name[0]?.toUpperCase()}</Avatar>
        </Badge>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {typeIcon}
            <Typography noWrap variant="body2" sx={{ fontWeight: 600 }}>
              {chat.name}
            </Typography>
          </Box>
        }
        secondary={
          <Typography noWrap variant="caption" color="text.secondary">
            {lastMessageText}
          </Typography>
        }
      />
      <Typography variant="caption" color="text.secondary">
        {timestamp}
      </Typography>
    </ListItemButton>
  );
}
