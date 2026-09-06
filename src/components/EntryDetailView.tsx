import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Lightbulb,
  FileText,
  User,
  Bot,
} from 'lucide-react';
import type { JournalEntry, ChatTurn } from '../types';

interface EntryDetailViewProps {
  entry: JournalEntry;
  onSendFollowUp: (userText: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onBack: () => void;
  isGeneratingTurn: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const QUICK_PROMPTS = [
  'Can you summarize our key takeaways into 3 bullet points?',
  'What concrete action steps can I take next based on this?',
  'What potential blind spots might I be overlooking?',
  'How can I frame this challenge more positively?',
];

export const EntryDetailView: React.FC<EntryDetailViewProps> = ({
  entry,
  onSendFollowUp,
  onDelete,
  onBack,
  isGeneratingTurn,
  error,
  onRetry,
}) => {
  const [followUpText, setFollowUpText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isGeneratingTurn) return;
    const textToSend = followUpText.trim();
    try {
      await onSendFollowUp(textToSend);
      setFollowUpText('');
    } catch {
      // followUpText remains preserved on error
    }
  };

  const handleCopyText = async () => {
    const formatted = [
      `# ${entry.title}`,
      `Date: ${new Date(entry.createdAt).toLocaleDateString()}`,
      `\n--- Initial Reflection ---`,
      entry.content,
      `\n--- Conversation Thread ---`,
      ...entry.turns.map((t) => `[${t.role === 'user' ? 'You' : 'Gemini'}]:\n${t.text}\n`),
    ].join('\n\n');

    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(entry.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="p-6 sm:p-8 border-b border-stone-100 bg-stone-50/50">
        <div className="flex items-center justify-between gap-4 mb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Reflections</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors shadow-xs"
              title="Copy entry text"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors shadow-xs"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1.5 rounded-lg text-stone-500 text-xs hover:bg-stone-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete reflection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight mb-3">
          {entry.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{formattedDate}</span>
          </div>
          <span className="text-stone-300">•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{formattedTime}</span>
          </div>
          {entry.mood && (
            <>
              <span className="text-stone-300">•</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                {entry.mood}
              </span>
            </>
          )}
          {entry.modelUsed && (
            <>
              <span className="text-stone-300">•</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {entry.modelUsed}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-rose-800 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Operation Error</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
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

      {/* Conversation Thread */}
      <div className="p-6 sm:p-8 space-y-6 max-h-[580px] overflow-y-auto">
        {entry.turns.map((turn, index) => {
          const isUser = turn.role === 'user';
          return (
            <div
              key={turn.id || index}
              className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-medium shadow-xs ${
                  isUser
                    ? 'bg-stone-900 text-stone-100'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-amber-700" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-stone-900 text-stone-50'
                    : 'bg-stone-50 border border-stone-200/80 text-stone-800'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1.5 text-[11px] opacity-75">
                  <span className="font-semibold">{isUser ? 'You' : 'Gemini'}</span>
                  {turn.timestamp && (
                    <span className="text-[10px] opacity-70">
                      {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="whitespace-pre-wrap font-sans text-stone-800 dark:text-stone-100">
                  {turn.text}
                </div>
              </div>
            </div>
          );
        })}

        {isGeneratingTurn && (
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-amber-700 animate-pulse" />
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 max-w-md">
              <div className="flex items-center gap-2 text-stone-600 text-xs">
                <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin" />
                <span>Gemini is reflecting...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-6 sm:px-8 py-3 bg-stone-50 border-t border-stone-100">
        <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Lightbulb className="w-3 h-3 text-amber-600" />
          Continue Exploring
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isGeneratingTurn}
              onClick={() => {
                setFollowUpText(prompt);
              }}
              className="text-xs bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80 px-3 py-1.5 rounded-lg transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Follow-up Turn Input Bar */}
      <div className="p-4 sm:p-6 bg-white border-t border-stone-200">
        <form onSubmit={handleFollowUpSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="followup-input" className="sr-only">
              Reply to Gemini
            </label>
            <textarea
              id="followup-input"
              rows={2}
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              disabled={isGeneratingTurn}
              placeholder="Ask a follow-up, request a breakdown, or share more thoughts..."
              className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 text-stone-900 text-sm leading-relaxed placeholder:text-stone-400 resize-none bg-stone-50/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFollowUpSubmit(e);
                }
              }}
            />
          </div>

          <button
            id="send-followup-btn"
            type="submit"
            disabled={isGeneratingTurn || !followUpText.trim()}
            className="h-[52px] px-5 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
          >
            {isGeneratingTurn ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Reply</span>
                <Send className="w-4 h-4 text-stone-300" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
