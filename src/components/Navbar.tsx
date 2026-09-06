import React from 'react';
import { Sparkles, LogOut, Plus, BookOpen, ShieldCheck } from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onNewReflection: () => void;
  onLogout: () => void;
  isWritingNew: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNewReflection,
  onLogout,
  isWritingNew,
}) => {
  return (
    <header id="app-navbar" className="border-b border-stone-200 bg-white/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-semibold text-lg text-stone-900 tracking-tight">
                Reflections
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Gemini 3.6
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Private AI-assisted journaling & reflection
            </p>
          </div>
        </div>

        {/* User profile & actions */}
        {user && (
          <div className="flex items-center gap-3">
            <button
              id="nav-new-reflection-btn"
              onClick={onNewReflection}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isWritingNew
                  ? 'bg-stone-100 text-stone-800 border border-stone-300'
                  : 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Reflection</span>
            </button>

            <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-stone-200 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-medium text-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-stone-800 leading-tight">
                  {user.displayName || 'User'}
                </p>
                <p className="text-[11px] text-stone-500 truncate max-w-[140px]">
                  {user.email || 'Authenticated'}
                </p>
              </div>

              <button
                id="nav-logout-btn"
                onClick={onLogout}
                title="Sign Out"
                className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors ml-1"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
