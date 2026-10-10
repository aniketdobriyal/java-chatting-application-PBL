import React from 'react';
import { MessageSquare, ShieldCheck, Zap, Users } from 'lucide-react';

export const EmptyChat = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center select-none">
      <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-100 mb-6">
        <MessageSquare className="w-10 h-10" />
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome to Chat Connect</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-8">
        Select a conversation from the sidebar or search for registered users to begin messaging.
      </p>

      {/* Feature Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full text-left">
        <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <Zap className="w-5 h-5 text-indigo-600 mb-1.5" />
          <h3 className="text-xs font-bold text-slate-800">Fast Messaging</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Real-time UI state updates with auto-scroll</p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1.5" />
          <h3 className="text-xs font-bold text-slate-800">Spring Boot Ready</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Dual-mode REST API service architecture</p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <Users className="w-5 h-5 text-amber-600 mb-1.5" />
          <h3 className="text-xs font-bold text-slate-800">User Search</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Search directory to start new conversations</p>
        </div>
      </div>
    </div>
  );
};
