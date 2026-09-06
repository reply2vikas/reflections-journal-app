import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, stripUndefined } from '../lib/firebase';
import type { JournalEntry, ChatTurn, EntryMode } from '../types';

/**
 * Returns user-isolated entries collection reference
 */
function getUserEntriesRef(userId: string) {
  if (!userId) {
    throw new Error('User ID is required to access user-isolated collection.');
  }
  return collection(db, 'users', userId, 'entries');
}

/**
 * Real-time listener for user's journal entries
 */
export function subscribeToUserEntries(
  userId: string,
  onEntries: (entries: JournalEntry[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  try {
    const q = query(getUserEntriesRef(userId), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const entries: JournalEntry[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId || userId,
            title: data.title || 'Untitled Reflection',
            initialPrompt: data.initialPrompt || '',
            content: data.content || '',
            mode: (data.mode as EntryMode) || 'reflect',
            geminiReply: data.geminiReply || '',
            modelUsed: data.modelUsed || 'gemini-3.6-flash',
            turns: Array.isArray(data.turns) ? data.turns : [],
            mood: data.mood || 'neutral',
            tags: Array.isArray(data.tags) ? data.tags : [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
        });
        onEntries(entries);
      },
      (err) => {
        console.error('Firestore snapshot subscription error:', err);
        onError(err);
      }
    );
  } catch (err: any) {
    console.error('Error establishing Firestore subscription:', err);
    onError(err);
    return () => {};
  }
}

export interface CreateEntryInput {
  userId: string;
  title: string;
  initialPrompt: string;
  content: string;
  mode: EntryMode;
  geminiReply: string;
  modelUsed: string;
  mood?: string;
  tags?: string[];
}

/**
 * Atomically creates a new user journal entry and first interaction in Firestore
 */
export async function createJournalEntry(input: CreateEntryInput): Promise<JournalEntry> {
  const colRef = getUserEntriesRef(input.userId);
  const newDocRef = doc(colRef);
  const now = new Date().toISOString();

  const firstUserTurn: ChatTurn = {
    id: `turn-${Date.now()}-user`,
    role: 'user',
    text: input.content || input.initialPrompt,
    timestamp: now,
  };

  const firstModelTurn: ChatTurn = {
    id: `turn-${Date.now()}-model`,
    role: 'model',
    text: input.geminiReply,
    timestamp: now,
  };

  const newEntry: JournalEntry = {
    id: newDocRef.id,
    userId: input.userId,
    title: input.title.trim() || 'Reflection ' + new Date().toLocaleDateString(),
    initialPrompt: input.initialPrompt,
    content: input.content,
    mode: input.mode,
    geminiReply: input.geminiReply,
    modelUsed: input.modelUsed,
    turns: [firstUserTurn, firstModelTurn],
    mood: input.mood || 'neutral',
    tags: input.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  // Zero-crash payload hygiene: strip all undefined values before write
  const sanitizedPayload = stripUndefined(newEntry);
  await setDoc(newDocRef, sanitizedPayload);
  return newEntry;
}

/**
 * Appends a user prompt and Gemini reply to an existing journal entry
 */
export async function appendConversationTurn(
  userId: string,
  entryId: string,
  existingTurns: ChatTurn[],
  userText: string,
  modelReply: string,
  modelUsed: string
): Promise<ChatTurn[]> {
  const now = new Date().toISOString();
  const newUserTurn: ChatTurn = {
    id: `turn-${Date.now()}-user`,
    role: 'user',
    text: userText,
    timestamp: now,
  };

  const newModelTurn: ChatTurn = {
    id: `turn-${Date.now()}-model`,
    role: 'model',
    text: modelReply,
    timestamp: now,
  };

  const updatedTurns = [...existingTurns, newUserTurn, newModelTurn];

  const docRef = doc(db, 'users', userId, 'entries', entryId);
  await updateDoc(
    docRef,
    stripUndefined({
      turns: updatedTurns,
      modelUsed,
      updatedAt: now,
    })
  );

  return updatedTurns;
}

/**
 * Deletes a journal entry
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(docRef);
}
