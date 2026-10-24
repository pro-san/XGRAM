# ChatX Web (Telegram-style clone)

A React + TypeScript + Material UI messaging web app backed by Firebase, built as
the web counterpart to the ChatX Messenger Android app, sharing the same
Firebase backend.

## What's implemented (Phase 1)

- Email/password and Google sign-in (Firebase Auth), user profile docs in Firestore
- Real-time 1:1 chats, group chats, and broadcast channels (admin-only posting)
- Real-time message sync via Firestore listeners
- Image and file attachments (Firebase Storage)
- Voice messages (in-browser recording via MediaRecorder, uploaded as audio)
- Typing indicators
- Light/dark theme toggle, English/Khmer language toggle
- Firestore + Storage security rules
- Cloud Function that sends FCM push notifications on new messages

## Not yet implemented (flagged honestly)

- **Voice/video calls**: the call buttons are present in the UI but show a
  "coming soon" notice. Real calling needs a WebRTC signaling layer (e.g. a
  Cloud Function + Firestore-based signaling, or a service like Agora/Twilio),
  which is a separate chunk of work from the rest of the app.
- Message editing/deletion UI, read receipts beyond the `readBy` array, and
  message search are not wired into the UI yet, though the data model supports
  `readBy` and a `deleted` flag.
- Push notification registration (requesting permission + saving the FCM token
  to `users/{uid}.fcmTokens`) isn't wired up client-side yet - the Cloud
  Function that *sends* notifications is ready and waiting for tokens.

## Project structure

```
src/
  firebase/      Firebase SDK init, auth, Firestore chat/user services, Storage upload
  types/          Shared TypeScript types (Chat, Message, AppUser, ...)
  store/          Zustand stores (auth state, UI state: active chat, theme, language)
  theme/          MUI theme (Telegram-like light/dark palettes)
  i18n/           English + Khmer strings
  components/
    auth/         Login/register page
    sidebar/      Chat list, search, new chat menu
    chat/         Chat window, message bubbles, composer (text/image/file/voice)
    dialogs/      New direct message / group / channel dialog
    layout/       Top-level authenticated layout
functions/        Firebase Cloud Functions (push notification trigger)
firestore.rules   Firestore security rules
storage.rules     Storage security rules
```

## Setup

1. Create a Firebase project (or reuse the one behind ChatX Messenger) at
   https://console.firebase.google.com. Enable: Authentication (Email/Password
   and Google), Firestore Database, Storage, Cloud Messaging.

2. Copy your web app config into a `.env` file:
   ```
   cp .env.example .env
   ```
   Fill in the `VITE_FIREBASE_*` values from Project Settings -> General -> Your apps.

3. Install dependencies and run locally:
   ```
   npm install
   npm run dev
   ```

4. Deploy security rules (requires the Firebase CLI: `npm i -g firebase-tools`):
   ```
   firebase login
   firebase init   # select Firestore, Storage, Functions, Hosting; point at this project
   firebase deploy --only firestore:rules,storage:rules
   ```

5. Deploy Cloud Functions:
   ```
   cd functions
   npm install
   npm run build
   firebase deploy --only functions
   ```

6. Build and deploy the web app to Firebase Hosting:
   ```
   npm run build
   firebase deploy --only hosting
   ```

## Data model (Firestore)

- `users/{uid}`: profile, `status`, `language`, `fcmTokens`
- `chats/{chatId}`: `type` (private|group|channel), `memberIds`, `adminIds`,
  `isBroadcastOnly`, `lastMessage`
- `chats/{chatId}/messages/{messageId}`: `senderId`, `type`, `text`/`mediaUrl`,
  `createdAt`, `readBy`
- `chats/{chatId}/typing/{uid}`: ephemeral typing indicator doc
