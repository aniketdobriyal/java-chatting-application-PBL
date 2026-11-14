import React from 'react';
import { useChat } from '../../hooks/useChat';
import { Avatar } from '../common/Avatar';
import { ArrowLeft, MoreVertical, Phone, Video, Search, Lock } from 'lucide-react';

export const ChatHeader = () => {
  const { activeConversation, setMobileView } = useChat();

  if (!activeConversation) return null;

  const { participant } = activeConversation;
  const hasE2EE = !!participant?.publicKey;

  return (
    <div className="h-16 px-4 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs">
      
      {/* Left: Mobile Back Button & Participant Metadata */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileView('list')}
          className="md:hidden p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Avatar
          name={participant.name}
          src={participant.avatar}
          online={participant.online}
          size="md"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 truncate">{participant.name}</h2>
            {/* E2EE badge — only shown when recipient has a registered public key */}
            {hasE2EE && (
              <span
                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold rounded-full flex-shrink-0"
                title="Messages in this conversation are end-to-end encrypted"
              >
                <Lock className="w-2.5 h-2.5" />
                E2EE
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                participant.online ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
            <span className="truncate">
              {participant.online
                ? (participant.statusMessage ? `Online • ${participant.statusMessage}` : 'Online')
                : (participant.statusMessage ? `Offline • ${participant.statusMessage}` : 'Offline')}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 text-slate-500">
        <button
          className="p-2 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
          title="Search in conversation"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
          title="Voice Call (Demo)"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
          title="Video Call (Demo)"
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
          title="More Options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
