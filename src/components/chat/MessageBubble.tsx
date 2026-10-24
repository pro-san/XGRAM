import { Box, Paper, Typography, Link } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import type { Message } from '../../types';

interface Props {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  const time = message.createdAt
    ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Box sx={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', mb: 1, px: 2 }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: '60%',
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
    </Box>
  );
}
