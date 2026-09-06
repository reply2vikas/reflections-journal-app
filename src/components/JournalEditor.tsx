import React, { useState } from 'react';
import { Sparkles, Send, RefreshCw, AlertCircle, Check, Tag } from 'lucide-react';
import type { EntryMode } from '../types';

interface JournalEditorProps {
  userId: string;
  onSubmit: (data: {
    title: string;
    content: string;
    mode: EntryMode;
    mood: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
  initialContent?: string;
  error?: string | null;
  onRetry?: () => void;
}

const MODES: Array<{ id: EntryMode; label: string; desc: string }> = [
  { id: 'reflect', label: 'Reflection', desc: 'Perceptive inquiries & thoughtful feedback' },
  { id: 'summary', label: 'Summarize', desc: 'Structured highlights & emotional takeaways' },
  { id: 'brainstorm', label: 'Brainstorm', desc: 'Creative next steps & perspective expansions' },
  { id: 'chat', label: 'Conversation', desc: 'Open multi-turn exploratory dialogue' },
];

const MOODS = [
  { id: 'calm', label: '🌿 Calm' },
  { id: 'inspired', label: '💡 Inspired' },
  { id: 'focused', label: '🎯 Focused' },
  { id: 'reflective', label: '🔍 Reflective' },
  { id: 'overwhelmed', label: '🌧️ Overwhelmed' },
  { id: 'grateful', label: '🙏 Grateful' },
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  onSubmit,
  isSubmitting,
  onCancel,
  initialContent = '',
  error,
  onRetry,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<EntryMode>('reflect');
  const [mood, setMood] = useState('reflective');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setLocalError('Please write your thoughts or reflection before submitting.');
      return;
    }
    setLocalError(null);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        mode,
        mood,
      });
    } catch (err: any) {
      // The parent handler also tracks errors, but we keep content in state
      setLocalError(err?.message || 'Failed to submit reflection.');
    }
  };

  const activeError = error || localError;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between pb-5 border-b border-stone-100 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-stone-900">
            Write New Reflection
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Express yourself freely. Gemini will reflect, summarize, or brainstorm with you.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs font-medium text-stone-500 hover:text-stone-800 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {activeError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-rose-800 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Persistence / Generation Notice</p>
              <p className="mt-0.5 leading-relaxed">{activeError}</p>
              <p className="text-[11px] text-rose-600 mt-1">
                Your draft has been preserved safely in the editor.
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-xs transition-colors shrink-0 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Save
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="reflection-title" className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
            Title <span className="text-stone-400 font-normal lowercase">(optional)</span>
          </label>
          <input
            id="reflection-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Unpacking today's breakthrough or navigating uncertainty..."
            maxLength={100}
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 text-stone-900 text-sm placeholder:text-stone-400 bg-stone-50/50"
          />
        </div>

        {/* Mode Selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-2 uppercase tracking-wider">
            Gemini Focus Mode
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MODES.map((m) => {
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  disabled={isSubmitting}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                    {m.label}
                  </p>
                  <p className={`text-[10px] mt-0.5 line-clamp-2 leading-snug ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                    {m.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mood Tags */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-2 uppercase tracking-wider">
            Current State of Mind
          </label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMood(item.id)}
                disabled={isSubmitting}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  mood === item.id
                    ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Journal Content */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="reflection-content" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Your Entry
            </label>
            <span className="text-[11px] text-stone-400 font-mono">
              {content.length} characters
            </span>
          </div>
          <textarea
            id="reflection-content"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            placeholder="What is occupying your mind today? Write candidly about a challenge, an accomplishment, or a feeling you want to examine deeper..."
            className="w-full p-4 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 text-stone-900 text-sm leading-relaxed placeholder:text-stone-400 resize-y bg-white"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-stone-500 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Isolated Cloud Firestore & Gemini 3.6 Flash</span>
          </div>

          <button
            id="submit-reflection-btn"
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm group cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Reflecting with Gemini...</span>
              </>
            ) : (
              <>
                <span>Generate Reflection</span>
                <Send className="w-4 h-4 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
