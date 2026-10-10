import React, { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { MessageBubble } from './MessageBubble';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatDateDivider } from '../../utils/dateUtils';
import { MessageSquareDashed } from 'lucide-react';

export const MessageList = () => {
  const { messages, isLoadingMessages, activeConversation } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new message or active conversation change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeConversation]);

  if (isLoadingMessages) {
    return <LoadingSpinner label="Loading messages..." className="py-16" />;
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 my-auto">
        <div className="p-4 bg-indigo-50 rounded-2xl mb-3 text-indigo-600">
          <MessageSquareDashed className="w-8 h-8" />
        </div>
        <p className="text-sm font-semibold text-slate-700">No messages yet</p>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
          Send a greeting to start chatting with {activeConversation?.participant?.name || 'this contact'}.
        </p>
      </div>
    );
  }

  // Group messages by formatted date
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = formatDateDivider(msg.timestamp);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {Object.entries(groupedMessages).map(([dateLabel, msgGroup]) => (
        <React.Fragment key={dateLabel}>
          {/* Date Divider */}
          <div className="flex items-center justify-center my-4">
            <span className="px-3 py-1 bg-slate-200/80 text-slate-600 text-[11px] font-semibold rounded-full shadow-2xs">
              {dateLabel}
            </span>
          </div>

          {/* Group Messages */}
          {msgGroup.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOutgoing={msg.senderId === user?.id}
            />
          ))}
        </React.Fragment>
      ))}

      {/* Anchor for Auto Scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
};
