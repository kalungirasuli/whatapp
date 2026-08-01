import React, { useEffect, useRef, useState } from 'react';
import {
  HistoryIcon,
  MoreVerticalIcon,
  StoreIcon,
  UserRoundIcon } from
'lucide-react';
import { Chat } from '../types';

interface ChatHeaderProps {
  chat: Chat;
  isTyping: boolean;
  onOpenShop: () => void;
  onOpenProfile: () => void;
}

const menuItems = [
{ id: 'history', label: 'Old chats', icon: HistoryIcon },
{ id: 'shop', label: 'Open shop', icon: StoreIcon },
{ id: 'profile', label: 'Profile', icon: UserRoundIcon }];


export function ChatHeader({ chat, isTyping, onOpenShop, onOpenProfile }: ChatHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <header className="flex items-center gap-3 border-b border-wa-border bg-wa-panelAlt px-3 py-2 md:px-5">
      <img
        src={chat.avatar}
        alt="ChatGPT avatar"
        className="h-10 w-10 rounded-full object-cover" />
      
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-medium leading-tight text-wa-textPrimary">
          {chat.name}
        </h1>
        <p className="truncate text-xs text-wa-textSecondary">
          {isTyping ? <span className="text-wa-teal">typing…</span> : chat.online ? 'online' : chat.about}
        </p>
      </div>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-label="Open chat menu"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          className="rounded-full p-2 text-wa-textSecondary hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-wa-green">
          
          <MoreVerticalIcon className="h-5 w-5" />
        </button>
        {isMenuOpen &&
        <div
          role="menu"
          aria-label="Chat options"
          className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-xl border border-wa-border bg-wa-panel py-1 shadow-panel">
          
            {menuItems.map(({ id, label, icon: Icon }) =>
          <button
            key={id}
            type="button"
            role="menuitem"
            onClick={() => {
              setIsMenuOpen(false);
              if (id === 'shop') onOpenShop();
              if (id === 'profile') onOpenProfile();
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-wa-textPrimary hover:bg-wa-panelAlt focus:bg-wa-panelAlt focus:outline-none">
            
                <Icon className="h-4 w-4 text-wa-textSecondary" />
                {label}
              </button>
          )}
          </div>
        }
      </div>
    </header>);

}