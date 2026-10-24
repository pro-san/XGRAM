# ChatX Web Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Global Default-Deny**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **PII Isolation**: User email addresses are stored exclusively in `/users/{userId}/private/{docId}` and never in `/users/{userId}`. Only the owner (`request.auth.uid == userId`) can read or write `/users/{userId}/private/{docId}`.
3. **Master Gate & Relational Sync**:
   - Creating a chat requires the creator (`request.auth.uid`) to have an existing profile document at `/users/$(request.auth.uid)`, to be included in `memberIds` and `adminIds`, and to set `createdBy == request.auth.uid`.
   - Creating or reading a single message `/chats/{chatId}/messages/{messageId}` or typing state `/chats/{chatId}/typing/{typingUid}` requires the user to be an active member of `/chats/{chatId}` via `get(/databases/$(database)/documents/chats/$(chatId))`.
   - In broadcast-only channels (`isBroadcastOnly == true`), only users in `adminIds` of the parent `/chats/{chatId}` document can create messages or update `lastMessage`.
4. **Anti-Update-Gap & Strict Schema Blueprints**:
   - Every `create` and `update` rule calls `isValid[Entity](incoming())` first, enforcing `hasAll`/`hasOnly` keys, string `.size()` bounds, regex ID patterns (`^[a-zA-Z0-9_\-]+$`), and bounded array lengths.
   - Updates are partitioned into named actions using `incoming().diff(existing()).affectedKeys().hasOnly(...)`.
5. **Temporal & Identity Immutability**:
   - All `createdAt`, `updatedAt`, and `lastSeen` fields must equal `request.time`.
   - Immutable fields (`uid`, `createdBy`, `senderId`, `chatId`, `createdAt`, `type`) cannot be altered after creation.
6. **Terminal State Locking**:
   - Once a message has `deleted == true`, no subsequent updates are permitted.
7. **Secure List Queries (Cost-Optimized)**:
   - Every `allow list` rule evaluates `existing()` (`resource.data`) without performing `get()` or `exists()` lookups.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Shadow Field Injection on User Profile)**:
   `POST /users/user_1` with `{ ..., isAdmin: true }` -> Rejected by `hasOnly()` in `isValidUserPublicProfile`.
2. **Payload 2 (Identity Spoofing on Chat Creation)**:
   `POST /chats/chat_1` with `createdBy: "other_user"` -> Rejected by `data.createdBy == request.auth.uid`.
3. **Payload 3 (Unverified Email Write Attempt)**:
   `POST /chats/chat_1` with `request.auth.token.email_verified == false` -> Rejected by `isVerified()`.
4. **Payload 4 (Cross-User PII Read on `/users/victim_uid/private/info`)**:
   `GET /users/victim_uid/private/info` by `attacker_uid` -> Rejected by `request.auth.uid == userId`.
5. **Payload 5 (ID Poisoning / 2KB Path Variable)**:
   `PUT /chats/{2000_char_id}` -> Rejected by `isValidId(chatId)`.
6. **Payload 6 (Value Poisoning on Whitelisted Update Key)**:
   `PATCH /chats/chat_1` updating `name` to a 5,000-character string or boolean -> Rejected by `isValidChat()` wrapping `allow update`.
7. **Payload 7 (Broadcast Channel Unauthorized Post)**:
   `POST /chats/channel_1/messages/msg_1` by a non-admin member when `isBroadcastOnly == true` -> Rejected by `isAllowedToPostInChat(chatId)`.
8. **Payload 8 (Orphaned Chat Creation Without User Profile)**:
   `POST /chats/chat_1` when `/users/$(request.auth.uid)` does not exist -> Rejected by `exists(/databases/$(database)/documents/users/$(request.auth.uid))`.
9. **Payload 9 (Timestamp Forgery / Backdating Message)**:
   `POST /chats/chat_1/messages/msg_1` with `createdAt: Timestamp(2020-01-01)` -> Rejected by `incoming().createdAt == request.time`.
10. **Payload 10 (Immortal Field Mutation on Message)**:
    `PATCH /chats/chat_1/messages/msg_1` changing `senderId` -> Rejected by `incoming().senderId == existing().senderId` and `affectedKeys().hasOnly(...)`.
11. **Payload 11 (Terminal State Mutation on Deleted Message)**:
    `PATCH /chats/chat_1/messages/msg_1` when `existing().deleted == true` -> Rejected by `!existing().deleted`.
12. **Payload 12 (Unfiltered Collection List Scraping)**:
    `LIST /chats` without `where('memberIds', 'array-contains', request.auth.uid)` -> Rejected by `allow list: if isSignedIn() && request.auth.uid in existing().memberIds`.
