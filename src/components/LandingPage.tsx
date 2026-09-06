import React from 'react';
import { Sparkles, ShieldCheck, Lock, ArrowRight, BookOpen, Compass } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 sm:p-10 text-center">
          {/* Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-stone-900 text-amber-300 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight mb-3">
            Reflections Journal
          </h1>

          <p className="text-stone-600 text-base leading-relaxed mb-8 max-w-md mx-auto">
            A sanctuary for your daily thoughts, ideas, and contemplations. Converse with Gemini 3.6 Flash to uncover perspectives, synthesize takeaways, and brainstorm your next steps.
          </p>

          {/* Security & Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-900">User Data Isolation</p>
                <p className="text-[11px] text-stone-500 leading-snug">
                  Strict Firestore security rules ensure your reflections are visible only to you.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-900">Gemini 3.6 Flash</p>
                <p className="text-[11px] text-stone-500 leading-snug">
                  Intelligent multi-turn dialogue, synthesis, and creative brainstorming companion.
                </p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
              <strong>Sign-in Notice:</strong> {errorMessage}
            </div>
          )}

          {/* Sign In Button */}
          <button
            id="google-signin-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-all font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting to Firebase Auth...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-stone-400 text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypted federated authentication via Firebase</span>
          </div>
        </div>
      </div>
    </div>
  );
};
