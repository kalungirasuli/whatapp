import { Chat } from './types';

const AI_AVATAR = "/79fd36db-6d51-44a5-af73-bc63277d2b95.jpg";

const USER_AVATAR = "/c25e2e6c-05e8-494a-b825-5dc562566817.jpg";


export const CURRENT_USER_AVATAR = USER_AVATAR;

export const initialChat: Chat = {
  id: 'chatgpt',
  name: 'ChatGPT · 4o',
  avatar: AI_AVATAR,
  about: 'Your everyday AI assistant',
  online: true,
  messages: []
};

const cannedReplies: string[] = [
"Great question! Let me break that down for you step by step. 🧠",
"Here's how I'd approach it — keep it simple and iterate from there.",
"Absolutely! I can help with that. Want a short version or a detailed one?",
"Nice one 😄 — here are a few ideas you could run with.",
"Done! Let me know if you'd like me to refine or expand on anything.",
"Sure thing. I've put together a clear answer for you below. ✅"];


export function getAiReply(userText: string): string {
  const lower = userText.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hey there! 👋 How can I help you today?';
  }
  if (lower.includes('thank')) {
    return "You're very welcome! 😊 Anything else I can do?";
  }
  if (lower.includes('recipe') || lower.includes('cook')) {
    return "How about a 15-min garlic butter pasta? Boil pasta, sauté garlic in butter, toss with parmesan & parsley. 🍝";
  }
  if (lower.includes('code') || lower.includes('bug') || lower.includes('react')) {
    return "Sure! Share the snippet and describe the expected vs. actual behavior — I'll spot the issue fast. 🧑‍💻";
  }
  return cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
}

export function now(): string {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}