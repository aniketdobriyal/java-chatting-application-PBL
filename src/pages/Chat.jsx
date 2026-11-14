import React from 'react';
import { ChatProvider } from '../context/ChatContext';
import { useChat } from '../hooks/useChat';
import { Sidebar } from '../components/chat/Sidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { EmptyChat } from '../components/chat/EmptyChat';

const ChatContent = () => {
  const { activeConversation, mobileView } = useChat();

  return (
    <div className="h-full h-dvh w-full overflow-hidden bg-slate-100 flex items-center justify-center p-0 md:p-4">
      {/* Container Frame */}
      <div className="h-full w-full max-w-7xl bg-white md:rounded-2xl md:shadow-2xl md:border border-slate-200/80 flex overflow-hidden">
        
        {/* Sidebar Column:
            - Desktop: Always visible (width: 340px to 380px)
            - Mobile: Visible only when mobileView === 'list'
        */}
        <div
          className={`h-full w-full md:w-80 lg:w-96 flex-shrink-0 ${
            mobileView === 'list' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
          }`}
        >
          <Sidebar />
        </div>

        {/* Chat Area Column:
            - Desktop: Takes remaining space (flex-1)
            - Mobile: Visible only when mobileView === 'chat'
        */}
        <div
          className={`h-full flex-1 flex flex-col bg-slate-50/50 min-w-0 ${
            mobileView === 'chat' ? 'flex flex-col' : 'hidden md:flex'
          }`}
        >
          {activeConversation ? (
            <>
              <ChatHeader />
              <MessageList />
              <MessageInput />
            </>
          ) : (
            <EmptyChat />
          )}
        </div>

      </div>
    </div>
  );
};

export const Chat = () => {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
};
