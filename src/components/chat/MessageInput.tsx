import { useRef, useState } from 'react';
import { Box, IconButton, TextField, CircularProgress, Snackbar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { sendMessage, setTyping } from '../../firebase/chats';
import { uploadChatMedia } from '../../firebase/storage';
import { useAuthStore } from '../../store/authStore';
import { t } from '../../i18n/strings';
import { useUIStore } from '../../store/uiStore';

interface Props {
  chatId: string;
}

let typingTimeout: ReturnType<typeof setTimeout>;

export default function MessageInput({ chatId }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const language = useUIStore((s) => s.language);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function handleTyping(value: string) {
    setText(value.slice(0, 2000));
    if (!profile) return;
    setTyping(chatId, profile.uid, true).catch(() => {});
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setTyping(chatId, profile.uid, false).catch(() => {});
    }, 2000);
  }

  async function handleSendText() {
    if (!text.trim() || !profile) return;
    const messageText = text.trim().slice(0, 2000);
    setText('');
    await sendMessage({
      chatId,
      senderId: profile.uid,
      type: 'text',
      text: messageText,
    });
    setTyping(chatId, profile.uid, false).catch(() => {});
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const url = await uploadChatMedia(chatId, file);
      const isImage = file.type.startsWith('image/');
      await sendMessage({
        chatId,
        senderId: profile.uid,
        type: isImage ? 'image' : 'file',
        mediaUrl: url.slice(0, 1500),
        mediaName: file.name.slice(0, 255),
        mediaSize: file.size,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to upload attachment. Ensure Firebase Storage is enabled.',
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        if (!profile) return;
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setUploading(true);
        try {
          const url = await uploadChatMedia(chatId, file);
          await sendMessage({
            chatId,
            senderId: profile.uid,
            type: 'voice',
            mediaUrl: url.slice(0, 1500),
          });
        } catch (err) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : 'Failed to upload voice note. Ensure Firebase Storage is enabled.',
          );
        } finally {
          setUploading(false);
        }
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Microphone access is required for voice messages.',
      );
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <input type="file" hidden ref={fileInputRef} onChange={handleFileSelected} />
      <IconButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        <AttachFileIcon />
      </IconButton>
      <TextField
        fullWidth
        size="small"
        placeholder={t(language, 'typeMessage')}
        value={text}
        onChange={(e) => handleTyping(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
          }
        }}
      />
      {uploading && <CircularProgress size={22} />}
      {text.trim() ? (
        <IconButton color="primary" onClick={handleSendText}>
          <SendIcon />
        </IconButton>
      ) : (
        <IconButton
          color={recording ? 'error' : 'default'}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? <StopIcon /> : <MicIcon />}
        </IconButton>
      )}
      <Snackbar
        open={Boolean(errorMsg)}
        autoHideDuration={4000}
        onClose={() => setErrorMsg(null)}
        message={errorMsg || ''}
      />
    </Box>
  );
}
