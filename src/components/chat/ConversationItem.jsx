import React from 'react';
import { Avatar } from '../common/Avatar';
import { formatConversationTime } from '../../utils/dateUtils';
import { Check, CheckCheck } from 'lucide-react';

export const ConversationItem = ({ conversation, isActive, onClick, currentUserId }) => {
  const { participant, lastMessage, unreadCount } = conversation;

  const isOutgoing = lastMessage?.senderId === currentUserId;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3.5 border-b border-slate-100 cursor-pointer transition-all duration-150 relative ${
        isActive
          ? 'bg-indigo-50/70 text-indigo-950 font-medium'
          : 'hover:bg-slate-50 text-slate-700'
      }`}
    >
      {/* Active Selection Accent */}
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
      )}

      {/* User Avatar */}
      <Avatar
        name={participant.name}
        src={participant.avatar}
        online={participant.online}
        size="md"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-sm truncate ${isActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
            {participant.name}
          </h3>
          {lastMessage && (
            <span className={`text-[11px] flex-shrink-0 ${unreadCount > 0 ? 'font-semibold text-indigo-600' : 'text-slate-400'}`}>
              {formatConversationTime(lastMessage.timestamp)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0 text-xs text-slate-500">
            {isOutgoing && (
              <span className="flex-shrink-0 text-slate-400">
                {lastMessage.read ? (
                  <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </span>
            )}
            <p className="truncate font-normal">
              {lastMessage ? lastMessage.content : <span className="italic text-slate-400">No messages yet</span>}
            </p>
          </div>

          {/* Unread Message Count Badge */}
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex-shrink-0 shadow-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
