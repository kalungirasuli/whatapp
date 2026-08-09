import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownIcon, LockIcon, SparklesIcon, CameraIcon, ShoppingBagIcon, CarIcon, SmartphoneIcon } from 'lucide-react';
import { Attachment, Chat } from '../types';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';

interface ChatWindowProps {
  chat: Chat;
  isTyping: boolean;
  isAuthenticated: boolean;
  hasShop: boolean;
  interestedIds: Set<number>;
  onSend: (text: string, attachment?: Attachment) => void;
  onResend: (messageId: string) => void;
  onFollowUp: (prompt: string) => void;
  onInterest: (productId: number, name: string, resultCode?: string) => void;
  onOpenShop: () => void;
  onOpenDashboard: () => void;
  onOpenProfile: () => void;
  onOpenHistory: () => void;
  onLogout: () => void;
}

const QUICK_ACTIONS = [
  { icon: CarIcon, label: 'Find a car', prompt: 'I want to buy a car' },
  { icon: SmartphoneIcon, label: 'Latest phones', prompt: 'Show me the latest phones' },
  { icon: ShoppingBagIcon, label: 'Browse shoes', prompt: 'I need new shoes' },
  { icon: CameraIcon, label: 'Upload a photo', prompt: '' },
];

export function ChatWindow({ chat, isTyping, isAuthenticated, hasShop, interestedIds, onSend, onResend, onFollowUp, onInterest, onOpenShop, onOpenDashboard, onOpenProfile, onOpenHistory, onLogout }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const prevMessageCountRef = useRef(chat.messages.length);
  const isWelcome = chat.messages.length === 0;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const onScroll = () => {
      const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= 120;
      isAtBottomRef.current = isAtBottom;
      setIsScrolledUp(!isAtBottom);
      if (isAtBottom) {
        setNewMessageCount(0);
      }
    };

    element.addEventListener('scroll', onScroll);
    onScroll();
    return () => element.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const isAtBottom = isAtBottomRef.current;
    const prevCount = prevMessageCountRef.current;
    if (chat.messages.length > prevCount) {
      const newMessages = chat.messages.slice(prevCount);
      const incomingMessages = newMessages.filter((message) => message.sender === 'ai');
      const userMessages = newMessages.filter((message) => message.sender === 'user');

      if (isAtBottom || userMessages.length > 0) {
        element.scrollTop = element.scrollHeight;
        setNewMessageCount(0);
      } else if (incomingMessages.length > 0) {
        setNewMessageCount((current) => current + incomingMessages.length);
      }
    }

    prevMessageCountRef.current = chat.messages.length;
  }, [chat.messages]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
      setNewMessageCount(0);
    }
  }, [chat.id]);

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-wa-chatBg">
      <ChatHeader
        chat={chat}
        isTyping={isTyping}
        isAuthenticated={isAuthenticated}
        hasShop={hasShop}
        onOpenShop={onOpenShop}
        onOpenDashboard={onOpenDashboard}
        onOpenProfile={onOpenProfile}
        onOpenHistory={onOpenHistory}
        onLogout={onLogout} />
      

      {isWelcome ?
      <div className="wa-chat-wallpaper flex flex-1 items-center px-3 pb-24 md:px-6">
          <div className="mx-auto w-full max-w-3xl -translate-y-8">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-wa-header text-white shadow-panel">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-wa-textPrimary md:text-3xl">
                Where should we begin?
              </h2>
              <p className="mt-2 text-sm text-wa-textSecondary">
                Ask Lisa anything — one private conversation.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => prompt && onSend(prompt)}
                  className="flex items-center gap-2 rounded-full border border-wa-border bg-wa-panel px-4 py-2 text-sm text-wa-textPrimary shadow-sm transition-colors hover:bg-wa-panelAlt hover:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green">
                  <Icon className="h-4 w-4 text-wa-header" />
                  {label}
                </button>
              ))}
            </div>
            <MessageInput mode="welcome" onSend={onSend} />
          </div>
        </div> :

      <>
          <div ref={scrollRef} className="wa-chat-wallpaper wa-scroll relative flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-3xl flex-col gap-2 px-2 py-4 md:px-6">
              <div className="mx-auto my-2 flex max-w-md items-center gap-2 rounded-lg bg-[#ffeecd] px-3 py-2 text-center text-xs text-[#54656f] shadow-bubble">
                <LockIcon className="h-3.5 w-3.5 shrink-0" />
                <span>Messages are AI-generated and end-to-end delightful. Tap to learn more.</span>
              </div>
              {chat.messages.map((message) =>
            <MessageBubble key={message.id} message={message} interestedIds={interestedIds} onFollowUp={onFollowUp} onInterest={onInterest} onResend={onResend} />
            )}
              {isTyping && <TypingIndicator />}
              {(isScrolledUp || newMessageCount > 0) && (
                <div className="sticky bottom-4 z-50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const element = scrollRef.current;
                      if (!element) return;
                      element.scrollTop = element.scrollHeight;
                      setIsScrolledUp(false);
                      setNewMessageCount(0);
                    }}
                    className="flex items-center gap-2 rounded-full border border-wa-border bg-white px-4 py-2 text-xs font-semibold text-wa-textPrimary shadow-lg transition hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green"
                  >
                    <ArrowDownIcon className="h-4 w-4 text-wa-green" />
                    {newMessageCount > 0 ? `${newMessageCount} new message${newMessageCount > 1 ? 's' : ''}` : ''}
                  </button>
                </div>
              )}
            </div>
          </div>
          <MessageInput mode="conversation" onSend={onSend} />
        </>
      }
    </section>);

}
