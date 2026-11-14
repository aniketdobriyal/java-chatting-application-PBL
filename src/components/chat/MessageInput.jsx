import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { Send, Smile, Paperclip, Loader2, Lock, AlertTriangle } from 'lucide-react';

export const MessageInput = () => {
  const { sendMessage, isSending, activeConversation, e2eeError } = useChat();
  const [content, setContent] = useState('');

  const hasE2EE = !!activeConversation?.participant?.publicKey;
  const isMock = import.meta.env.VITE_USE_MOCK !== 'false';

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSending || !activeConversation) return;

    setContent('');
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border-t border-slate-200/80">
      {/* E2EE Error Banner */}
      {e2eeError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100 text-red-700 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{e2eeError}</span>
        </div>
      )}

      {/* E2EE Status Hint */}
      {!isMock && activeConversation && (
        <div className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] ${hasE2EE ? 'text-emerald-600 bg-emerald-50/40' : 'text-amber-600 bg-amber-50/40'}`}>
          <Lock className="w-3 h-3" />
          {hasE2EE
            ? 'Messages are end-to-end encrypted with AES-256-GCM'
            : 'Recipient has no E2EE key — messages will be blocked'}
        </div>
      )}

      <div className="p-3 sm:p-4">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-full">
          
          {/* Quick Actions */}
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <button
              type="button"
              className="p-2 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              title="Attach File"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending || !activeConversation}
              placeholder={
                !activeConversation
                  ? 'Select a chat to send messages'
                  : `Type a message to ${activeConversation.participant.name}...`
              }
              className="w-full py-2.5 px-4 bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 transition-all"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!content.trim() || isSending || !activeConversation}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer"
            title="Send Encrypted Message (Enter)"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>

        </form>
      </div>
    </div>
  );
};
