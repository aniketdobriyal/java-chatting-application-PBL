import React from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { ConversationItem } from './ConversationItem';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { MessageSquareOff } from 'lucide-react';

export const ConversationList = ({ filter = 'all' }) => {
  const { conversations, activeConversation, selectConversation, isLoadingConversations } = useChat();
  const { user } = useAuth();

  if (isLoadingConversations && conversations.length === 0) {
    return <LoadingSpinner label="Loading conversations..." className="py-12" />;
  }

  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'unread') {
      return conv.unreadCount > 0;
    }
    return true;
  });

  if (filteredConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 my-auto">
        <MessageSquareOff className="w-10 h-10 mb-2 stroke-[1.5]" />
        <p className="text-sm font-semibold text-slate-600">
          {filter === 'unread' ? 'No unread messages' : 'No conversations yet'}
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
          {filter === 'unread'
            ? 'All caught up! Messages you receive will appear here.'
            : 'Search for a user in the search bar above to start messaging.'}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 overflow-y-auto">
      {filteredConversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={activeConversation?.id === conv.id}
          onClick={() => selectConversation(conv)}
          currentUserId={user?.id}
        />
      ))}
    </div>
  );
};
