import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Link,
  IconButton,
  Popover,
  Tooltip,
  ButtonBase,
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AddReactionOutlinedIcon from '@mui/icons-material/AddReactionOutlined';
import {
  ALLOWED_REACTION_EMOJIS,
  type Message,
  type ReactionEmoji,
} from '../../types';
import { toggleMessageReaction } from '../../firebase/chats';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { t } from '../../i18n/strings';

interface Props {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const language = useUIStore((s) => s.language);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const time = message.createdAt
    ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const activeReactions = ALLOWED_REACTION_EMOJIS.map((emoji) => {
    const uids = message.reactions?.[emoji] ?? [];
    return {
      emoji,
      uids,
      count: uids.length,
      hasReacted: Boolean(profile?.uid && uids.includes(profile.uid)),
    };
  }).filter((item) => item.count > 0);

  async function handleSelectReaction(emoji: ReactionEmoji) {
    setAnchorEl(null);
    if (!profile?.uid) return;
    await toggleMessageReaction({
      chatId: message.chatId,
      messageId: message.id,
      uid: profile.uid,
      emoji,
    });
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        mb: 1.25,
        px: 2,
        '&:hover .reaction-trigger': {
          opacity: 1,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: isOwn ? 'row-reverse' : 'row',
          gap: 0.5,
          maxWidth: '70%',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: isOwn ? 'primary.main' : 'background.paper',
            color: isOwn ? 'primary.contrastText' : 'text.primary',
          }}
        >
          {message.type === 'text' && (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.text}
            </Typography>
          )}
          {message.type === 'image' && (
            <Box
              component="img"
              src={message.mediaUrl}
              alt="attachment"
              sx={{ maxWidth: '100%', borderRadius: 1, display: 'block' }}
            />
          )}
          {message.type === 'file' && (
            <Link
              href={message.mediaUrl}
              target="_blank"
              rel="noopener"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'inherit' }}
            >
              <InsertDriveFileIcon fontSize="small" />
              {message.mediaName || 'Download file'}
            </Link>
          )}
          {message.type === 'voice' && (
            <Box component="audio" controls src={message.mediaUrl} sx={{ maxWidth: 220 }} />
          )}
          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'right', opacity: 0.7, mt: 0.25 }}
          >
            {time}
          </Typography>
        </Paper>

        {!message.deleted && (
          <Tooltip title={t(language, 'addReaction')}>
            <IconButton
              size="small"
              className="reaction-trigger"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                opacity: anchorEl ? 1 : { xs: 0.65, sm: 0 },
                transition: 'opacity 0.15s ease-in-out',
                color: 'text.secondary',
              }}
            >
              <AddReactionOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {activeReactions.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            mt: 0.5,
            justifyContent: isOwn ? 'flex-end' : 'flex-start',
          }}
        >
          {activeReactions.map(({ emoji, count, hasReacted }) => (
            <ButtonBase
              key={emoji}
              onClick={() => handleSelectReaction(emoji)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 4,
                border: 1,
                borderColor: hasReacted ? 'primary.main' : 'divider',
                bgcolor: hasReacted ? 'action.selected' : 'background.paper',
                fontSize: '0.78rem',
                lineHeight: 1.3,
                transition: 'transform 0.1s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <span>{emoji}</span>
              <Typography
                component="span"
                variant="caption"
                sx={{
                  fontWeight: hasReacted ? 700 : 500,
                  color: hasReacted ? 'primary.main' : 'text.secondary',
                }}
              >
                {count}
              </Typography>
            </ButtonBase>
          ))}
        </Box>
      )}

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: isOwn ? 'left' : 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: isOwn ? 'right' : 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 6,
              px: 1,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
            },
          },
        }}
      >
        {ALLOWED_REACTION_EMOJIS.map((emoji) => {
          const isSelected = Boolean(
            profile?.uid && message.reactions?.[emoji]?.includes(profile.uid),
          );
          return (
            <IconButton
              key={emoji}
              size="small"
              onClick={() => handleSelectReaction(emoji)}
              sx={{
                fontSize: '1.2rem',
                bgcolor: isSelected ? 'action.selected' : 'transparent',
                '&:hover': {
                  transform: 'scale(1.2)',
                },
                transition: 'transform 0.12s ease',
              }}
            >
              {emoji}
            </IconButton>
          );
        })}
      </Popover>
    </Box>
  );
}
