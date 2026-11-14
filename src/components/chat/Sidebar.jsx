import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { Avatar } from '../common/Avatar';
import { ConversationList } from './ConversationList';
import { UserSearch } from './UserSearch';
import { ProfileModal } from './ProfileModal';
import { Search, X, LogOut, Settings } from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery, conversations } = useChat();
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 w-full overflow-hidden">
      
      {/* 1. Header with Current User Info */}
      <div className="p-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-3 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer group flex-1"
          title="Click to view & edit Profile / Status"
        >
          <Avatar name={user?.name} src={user?.avatar} online={user?.online} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                {user?.name || 'User'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {user?.statusMessage || user?.email}
            </p>
          </div>
        </button>

        {/* Action Buttons: Settings & Logout */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
            title="Profile & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. User Search Bar */}
      <div className="p-3 border-b border-slate-100 bg-white">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations or users..."
            className="w-full pl-9 pr-8 py-2 bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Filter Tabs (Shown when not searching) */}
      {!searchQuery && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All Chats
          </button>
          <button
            onClick={() => setFilterTab('unread')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              filterTab === 'unread'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Unread</span>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] rounded-full font-bold">
                {totalUnread}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 4. List Content (SearchResults or ConversationList) */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? <UserSearch /> : <ConversationList filter={filterTab} />}
      </div>

      {/* Profile Settings Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

    </div>
  );
};
