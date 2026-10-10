import React from 'react';
import { formatMessageTime } from '../../utils/dateUtils';
import { Check, CheckCheck } from 'lucide-react';

export const MessageBubble = ({ message, isOutgoing }) => {
  return (
    <div className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} mb-3 group`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-2xs text-sm leading-relaxed ${
          isOutgoing
            ? 'bg-indigo-600 text-white rounded-br-xs'
            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        
        {/* Footer Meta (Timestamp + Read status) */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] select-none ${
            isOutgoing ? 'text-indigo-200' : 'text-slate-400'
          }`}
        >
          <span>{formatMessageTime(message.timestamp)}</span>
          {isOutgoing && (
            <span>
              {message.read ? (
                <CheckCheck className="w-3.5 h-3.5 text-indigo-200" title="Read" />
              ) : (
                <Check className="w-3.5 h-3.5 text-indigo-300" title="Sent" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
