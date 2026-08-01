import React, { useState } from 'react';
import {
  SearchIcon,
  MessageSquarePlusIcon,
  MoreVerticalIcon,
  Users2Icon,
  CircleDashedIcon } from
'lucide-react';
import { Chat } from '../types';
import { CURRENT_USER_AVATAR } from '../data';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
}

function lastMessagePreview(chat: Chat): string {
  const last = chat.messages[chat.messages.length - 1];
  if (!last) return '';
  if (last.imageUrl) return '📷 Photo';
  return last.text ?? '';
}

export function Sidebar({ chats, activeChatId, onSelectChat }: SidebarProps) {
  const [query, setQuery] = useState('');

  const filtered = chats.filter((c) =>
  c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <aside className="flex h-full w-full flex-col bg-wa-panel md:w-[30%] md:min-w-[320px] md:max-w-[420px] md:border-r md:border-wa-border">
      {/* Top bar */}
      <header className="flex items-center justify-between bg-wa-panelAlt px-4 py-2.5">
        <img
          src={CURRENT_USER_AVATAR}
          alt="Your profile"
          className="h-10 w-10 rounded-full object-cover" />
        
        <div className="flex items-center gap-1 text-wa-textSecondary">
          <button
            aria-label="Communities"
            className="rounded-full p-2 hover:bg-black/5">
            
            <Users2Icon className="h-5 w-5" />
          </button>
          <button
            aria-label="Status"
            className="rounded-full p-2 hover:bg-black/5">
            
            <CircleDashedIcon className="h-5 w-5" />
          </button>
          <button
            aria-label="New chat"
            className="rounded-full p-2 hover:bg-black/5">
            
            <MessageSquarePlusIcon className="h-5 w-5" />
          </button>
          <button
            aria-label="Menu"
            className="rounded-full p-2 hover:bg-black/5">
            
            <MoreVerticalIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-3 rounded-lg bg-wa-panelAlt px-4 py-1.5">
          <SearchIcon className="h-4 w-4 text-wa-textSecondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or start new chat"
            aria-label="Search chats"
            className="w-full bg-transparent text-sm text-wa-textPrimary placeholder:text-wa-textSecondary focus:outline-none" />
          
        </div>
      </div>

      {/* Chat list */}
      <nav className="wa-scroll flex-1 overflow-y-auto" aria-label="Chats">
        {filtered.map((chat) => {
          const isActive = chat.id === activeChatId;
          const last = chat.messages[chat.messages.length - 1];
          return (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              aria-current={isActive}
              className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
              isActive ? 'bg-wa-panelAlt' : 'hover:bg-wa-panelAlt'}`
              }>
              
              <div className="relative shrink-0">
                <img
                  src={chat.avatar}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover" />
                
                {chat.online &&
                <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-wa-panel bg-wa-green" />
                }
              </div>
              <div className="min-w-0 flex-1 border-b border-wa-border pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-wa-textPrimary">
                    {chat.name}
                  </span>
                  <span
                    className={`shrink-0 text-xs ${
                    chat.unread ? 'text-wa-green' : 'text-wa-textSecondary'}`
                    }>
                    
                    {last?.timestamp}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-wa-textSecondary">
                    {lastMessagePreview(chat)}
                  </span>
                  {chat.unread ?
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-wa-green px-1.5 text-xs font-semibold text-white">
                      {chat.unread}
                    </span> :
                  null}
                </div>
              </div>
            </button>);

        })}
        {filtered.length === 0 &&
        <p className="px-4 py-8 text-center text-sm text-wa-textSecondary">
            No chats found
          </p>
        }
      </nav>
    </aside>);

}