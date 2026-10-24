import { Avatar, Box, IconButton, Typography, Snackbar } from '@mui/material';
import CallIcon from '@mui/icons-material/Call';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useState } from 'react';
import type { Chat } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { t } from '../../i18n/strings';

interface Props {
  chat: Chat;
  isTyping: boolean;
}

export default function ChatHeader({ chat, isTyping }: Props) {
  const language = useUIStore((s) => s.language);
  const [notice, setNotice] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Avatar src={chat.photoURL}>{chat.name[0]?.toUpperCase()}</Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {chat.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isTyping
            ? t(language, 'typing')
            : chat.type === 'private'
              ? t(language, 'online')
              : `${chat.memberIds.length} members`}
        </Typography>
      </Box>
      {chat.type === 'private' && (
        <>
          <IconButton onClick={() => setNotice(true)}>
            <CallIcon />
          </IconButton>
          <IconButton onClick={() => setNotice(true)}>
            <VideocamIcon />
          </IconButton>
        </>
      )}
      <Snackbar
        open={notice}
        autoHideDuration={2500}
        onClose={() => setNotice(false)}
        message={t(language, 'comingSoon')}
      />
    </Box>
  );
}
