export type EntryMode = 'reflect' | 'summary' | 'brainstorm' | 'chat';

export interface ChatTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  initialPrompt: string;
  content: string;
  mode: EntryMode;
  geminiReply: string;
  modelUsed?: string;
  turns: ChatTurn[];
  mood?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
