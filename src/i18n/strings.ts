import type { Language } from '../types';

export const strings: Record<Language, Record<string, string>> = {
  en: {
    appName: 'ChatX Web',
    login: 'Log In',
    register: 'Sign Up',
    email: 'Email',
    password: 'Password',
    displayName: 'Display Name',
    username: 'Username',
    continueWithGoogle: 'Continue with Google',
    searchChats: 'Search chats',
    newGroup: 'New Group',
    newChannel: 'New Channel',
    typeMessage: 'Message',
    online: 'online',
    offline: 'offline',
    typing: 'typing...',
    noChatSelected: 'Select a chat to start messaging',
    comingSoon: 'Coming in a later phase',
  },
  km: {
    appName: 'ChatX Web',
    login: 'ចូលប្រើប្រាស់',
    register: 'ចុះឈ្មោះ',
    email: 'អ៊ីមែល',
    password: 'ពាក្យសម្ងាត់',
    displayName: 'ឈ្មោះបង្ហាញ',
    username: 'ឈ្មោះអ្នកប្រើប្រាស់',
    continueWithGoogle: 'បន្តជាមួយ Google',
    searchChats: 'ស្វែងរកជជែក',
    newGroup: 'ក្រុមថ្មី',
    newChannel: 'ឆានែលថ្មី',
    typeMessage: 'សារ',
    online: 'កំពុងលើបណ្តាញ',
    offline: 'គ្មានបណ្តាញ',
    typing: 'កំពុងវាយ...',
    noChatSelected: 'ជ្រើសរើសជជែកដើម្បីចាប់ផ្តើមសារ',
    comingSoon: 'នឹងមានក្នុងដំណាក់កាលបន្ទាប់',
  },
};

export function t(lang: Language, key: string): string {
  return strings[lang]?.[key] ?? strings.en[key] ?? key;
}
