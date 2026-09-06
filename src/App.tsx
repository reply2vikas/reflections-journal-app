/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logout } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { JournalEditor } from './components/JournalEditor';
import { EntryDetailView } from './components/EntryDetailView';
import { HistorySidebar } from './components/HistorySidebar';
import { generateGeminiReflection } from './services/geminiService';
import {
  subscribeToUserEntries,
  createJournalEntry,
  appendConversationTurn,
  deleteJournalEntry,
  type CreateEntryInput,
} from './services/firestoreService';
import type { JournalEntry, UserProfile, EntryMode } from './types';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isWritingNew, setIsWritingNew] = useState(true);

  // Editor states & persistence protection
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [lastPendingEntry, setLastPendingEntry] = useState<{
    title: string;
    content: string;
    mode: EntryMode;
    mood: string;
  } | null>(null);

  // Detail view multi-turn states
  const [isGeneratingTurn, setIsGeneratingTurn] = useState(false);
  const [turnError, setTurnError] = useState<string | null>(null);
  const [lastPendingTurn, setLastPendingTurn] = useState<string | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        });
        setAuthError(null);
      } else {
        setUser(null);
        setEntries([]);
        setSelectedEntryId(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time entries when user is authenticated
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    setIsLoadingEntries(true);
    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (loadedEntries) => {
        setEntries(loadedEntries);
        setIsLoadingEntries(false);
        // If there are entries and neither an entry is selected nor writing new, auto-select latest
        if (loadedEntries.length > 0 && !selectedEntryId && !isWritingNew) {
          setSelectedEntryId(loadedEntries[0].id);
        }
      },
      (err) => {
        console.error('Failed to load user entries from Firestore:', err);
        setIsLoadingEntries(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle Google Sign-in
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      // Suppress popup-closed-by-user error to avoid noisy banner
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Authentication failed. Please try again.');
      }
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setSelectedEntryId(null);
      setIsWritingNew(true);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Create new journal entry with Gemini and Firestore persistence
  const handleCreateEntry = useCallback(
    async (data: { title: string; content: string; mode: EntryMode; mood: string }) => {
      if (!user) return;
      setIsSubmittingNew(true);
      setEditorError(null);
      setLastPendingEntry(data);

      try {
        // 1. Call server-side Gemini reflection
        const geminiRes = await generateGeminiReflection({
          prompt: data.content,
          mode: data.mode,
          title: data.title,
        });

        // 2. Persist atomically to user-isolated Firestore collection
        const entryInput: CreateEntryInput = {
          userId: user.uid,
          title: data.title || 'Reflection ' + new Date().toLocaleDateString(),
          initialPrompt: data.content,
          content: data.content,
          mode: data.mode,
          geminiReply: geminiRes.reply,
          modelUsed: geminiRes.modelUsed,
          mood: data.mood,
          tags: [data.mode, data.mood],
        };

        const createdEntry = await createJournalEntry(entryInput);

        // 3. Clear draft buffers and transition to detail view
        setLastPendingEntry(null);
        setSelectedEntryId(createdEntry.id);
        setIsWritingNew(false);
      } catch (err: any) {
        console.error('Failed to create and save journal entry:', err);
        setEditorError(
          err?.message || 'Failed to complete reflection. Your text has been preserved. Please retry.'
        );
        throw err;
      } finally {
        setIsSubmittingNew(false);
      }
    },
    [user]
  );

  // Send follow-up conversation turn to Gemini
  const handleSendFollowUp = useCallback(
    async (userText: string) => {
      if (!user || !selectedEntryId) return;
      const currentEntry = entries.find((e) => e.id === selectedEntryId);
      if (!currentEntry) return;

      setIsGeneratingTurn(true);
      setTurnError(null);
      setLastPendingTurn(userText);

      try {
        // Format previous conversation turns for Gemini context
        const conversationHistory = currentEntry.turns.map((t) => ({
          role: t.role,
          text: t.text,
        }));

        // 1. Call Gemini with history
        const geminiRes = await generateGeminiReflection({
          prompt: userText,
          mode: 'chat',
          history: conversationHistory,
          title: currentEntry.title,
        });

        // 2. Save turns atomically to Firestore
        await appendConversationTurn(
          user.uid,
          currentEntry.id,
          currentEntry.turns,
          userText,
          geminiRes.reply,
          geminiRes.modelUsed
        );

        setLastPendingTurn(null);
      } catch (err: any) {
        console.error('Failed to append conversation turn:', err);
        setTurnError(
          err?.message || 'Failed to send turn to Gemini. Your message was preserved. Please retry.'
        );
        throw err;
      } finally {
        setIsGeneratingTurn(false);
      }
    },
    [user, selectedEntryId, entries]
  );

  // Delete current entry
  const handleDeleteEntry = async () => {
    if (!user || !selectedEntryId) return;
    try {
      await deleteJournalEntry(user.uid, selectedEntryId);
      setSelectedEntryId(null);
      setIsWritingNew(true);
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      setTurnError(err?.message || 'Failed to delete reflection.');
    }
  };

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  // Loading initial auth state
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-600 text-sm font-medium">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/60 flex flex-col font-sans text-stone-800">
      <Navbar
        user={user}
        onNewReflection={() => {
          setIsWritingNew(true);
          setSelectedEntryId(null);
        }}
        onLogout={handleLogout}
        isWritingNew={isWritingNew}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user ? (
          <LandingPage
            onSignIn={handleSignIn}
            isLoading={isLoadingAuth}
            errorMessage={authError}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-7rem)]">
            {/* Sidebar with History */}
            <div className="lg:col-span-4 h-full">
              <HistorySidebar
                entries={entries}
                selectedEntryId={selectedEntryId}
                onSelectEntry={(entry) => {
                  setSelectedEntryId(entry.id);
                  setIsWritingNew(false);
                }}
                onNewClick={() => {
                  setIsWritingNew(true);
                  setSelectedEntryId(null);
                }}
                isLoading={isLoadingEntries}
              />
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8 h-full overflow-y-auto">
              {isWritingNew || !selectedEntry ? (
                <JournalEditor
                  userId={user.uid}
                  onSubmit={handleCreateEntry}
                  isSubmitting={isSubmittingNew}
                  error={editorError}
                  initialContent={lastPendingEntry?.content || ''}
                  onCancel={
                    entries.length > 0
                      ? () => {
                          setIsWritingNew(false);
                          if (entries.length > 0) setSelectedEntryId(entries[0].id);
                        }
                      : undefined
                  }
                  onRetry={
                    lastPendingEntry
                      ? () => handleCreateEntry(lastPendingEntry)
                      : undefined
                  }
                />
              ) : (
                <EntryDetailView
                  entry={selectedEntry}
                  onSendFollowUp={handleSendFollowUp}
                  onDelete={handleDeleteEntry}
                  onBack={() => setIsWritingNew(true)}
                  isGeneratingTurn={isGeneratingTurn}
                  error={turnError}
                  onRetry={
                    lastPendingTurn
                      ? () => handleSendFollowUp(lastPendingTurn)
                      : undefined
                  }
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
