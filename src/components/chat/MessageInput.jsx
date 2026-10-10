import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { Send, Smile, Paperclip, Loader2 } from 'lucide-react';

export const MessageInput = () => {
  const { sendMessage, isSending, activeConversation } = useChat();
  const [content, setContent] = useState('');

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
    <div className="p-3 sm:p-4 bg-white border-t border-slate-200/80">
      <form onSubmit={handleSend} className="flex items-center gap-2 max-w-full">
        
        {/* Quick Actions (Emoji / Attachment demo icons) */}
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
              activeConversation
                ? `Type a message to ${activeConversation.participant.name}...`
                : 'Select a chat to send messages'
            }
            className="w-full py-2.5 px-4 bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 transition-all"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!content.trim() || isSending || !activeConversation}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer"
          title="Send Message (Enter)"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>

      </form>
    </div>
  );
};
