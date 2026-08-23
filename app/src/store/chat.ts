import { useCallback, useEffect, useState } from 'react';

export interface ChatMessage {
  id: string;
  threadId: string;
  fromSteamId: string;
  fromName: string;
  text: string;
  timestamp: number;
  mine: boolean;
}

const KEY = 'kesto:chat';
const CHANGED_EVENT = 'kesto:chatChanged';
const MAX_MESSAGES = 500;

function load(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function save(messages: ChatMessage[]) {
  localStorage.setItem(KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
}

export function appendChatMessage(msg: Omit<ChatMessage, 'id'>) {
  const messages = load();
  messages.push({ ...msg, id: crypto.randomUUID() });
  save(messages);
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function useChatMessages(threadId: string): ChatMessage[] {
  const [messages, setMessages] = useState<ChatMessage[]>(() => load().filter((m) => m.threadId === threadId));

  const refresh = useCallback(() => {
    setMessages(load().filter((m) => m.threadId === threadId));
  }, [threadId]);

  useEffect(() => {
    refresh();
    window.addEventListener(CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CHANGED_EVENT, refresh);
  }, [refresh]);

  return messages;
}
