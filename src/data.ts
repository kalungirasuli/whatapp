import { Chat } from './types';

const AI_AVATAR = "/79fd36db-6d51-44a5-af73-bc63277d2b95.jpg";

const USER_AVATAR = "/c25e2e6c-05e8-494a-b825-5dc562566817.jpg";


export const CURRENT_USER_AVATAR = USER_AVATAR;

export const initialChat: Chat = {
  id: 'whatappseller',
  name: 'whatAppSeller',
  avatar: AI_AVATAR,
  about: 'Your WhatsApp marketplace assistant',
  online: true,
  messages: []
};

export function now(): string {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
