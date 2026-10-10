import React from 'react';
import { useChat } from '../../hooks/useChat';
import { Avatar } from '../common/Avatar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { MessageSquarePlus, UserX } from 'lucide-react';

export const UserSearch = () => {
  const { searchResults, isSearching, startConversationWithUser, searchQuery } = useChat();

  if (isSearching) {
    return <LoadingSpinner label="Searching registered users..." className="py-8" />;
  }

  if (searchResults.length === 0 && searchQuery.trim()) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <UserX className="w-10 h-10 mb-2 stroke-[1.5]" />
        <p className="text-sm font-medium text-slate-600">No users found</p>
        <p className="text-xs text-slate-400 mt-1">No matching account found for "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 overflow-y-auto max-h-full">
      <div className="px-4 py-2 bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Search Results ({searchResults.length})
      </div>
      {searchResults.map((user) => (
        <div
          key={user.id}
          onClick={() => startConversationWithUser(user)}
          className="flex items-center justify-between p-3.5 hover:bg-indigo-50/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={user.name} src={user.avatar} online={user.online} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-all shadow-2xs group-hover:scale-105 cursor-pointer"
            title="Start Chat"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
