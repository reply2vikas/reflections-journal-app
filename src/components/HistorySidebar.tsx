import React, { useState, useMemo } from 'react';
import { Search, Sparkles, MessageSquare, Calendar, ChevronRight, Filter } from 'lucide-react';
import type { JournalEntry } from '../types';

interface HistorySidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewClick: () => void;
  isLoading: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewClick,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesQuery =
        !searchQuery ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.turns.some((t) => t.text.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMood =
        selectedMoodFilter === 'all' || entry.mood === selectedMoodFilter;

      return matchesQuery && matchesMood;
    });
  }, [entries, searchQuery, selectedMoodFilter]);

  const uniqueMoods = useMemo(() => {
    const moods = new Set<string>();
    entries.forEach((e) => {
      if (e.mood) moods.add(e.mood);
    });
    return Array.from(moods);
  }, [entries]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Search and Filters */}
      <div className="p-4 border-b border-stone-100 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries or reflections..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 text-stone-800 placeholder:text-stone-400"
          />
        </div>

        {uniqueMoods.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedMoodFilter('all')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedMoodFilter === 'all'
                  ? 'bg-stone-900 text-white font-medium'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All ({entries.length})
            </button>
            {uniqueMoods.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => setSelectedMoodFilter(mood)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  selectedMoodFilter === mood
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-medium'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="py-12 text-center text-stone-400 text-xs">
            <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto mb-2" />
            <span>Loading your reflections...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-sm font-medium text-stone-700">No reflections found</p>
            <p className="text-xs text-stone-400 mt-1 max-w-[200px] mx-auto">
              {entries.length === 0
                ? 'Your private journal is empty. Begin with your first entry.'
                : 'No entries match your search query.'}
            </p>
            {entries.length === 0 && (
              <button
                type="button"
                onClick={onNewClick}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Write First Entry</span>
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = entry.id === selectedEntryId;
            const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            const turnCount = entry.turns.length;

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-stone-900 bg-stone-50/80 shadow-xs ring-1 ring-stone-900/10'
                    : 'border-stone-100 hover:border-stone-200 bg-white hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {dateStr}
                  </span>
                  {entry.mood && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                      {entry.mood}
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-sm font-semibold text-stone-900 line-clamp-1 mb-1">
                  {entry.title}
                </h3>

                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-2">
                  {entry.content}
                </p>

                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-100/60">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {turnCount} {turnCount === 1 ? 'turn' : 'turns'}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-stone-900 translate-x-0.5' : 'text-stone-300'}`} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
