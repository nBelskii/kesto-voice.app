import { useCallback, useEffect, useState } from 'react';

export interface ChatMessage {
  id: string;
  threadId: string;
  threadName: string;
  fromSteamId: string;
  fromName: string;
  text: string;
  timestamp: number;
  mine: boolean;
}

export interface ChatThreadSummary {
  threadId: string;
  threadName: string;
  lastText: string;
  lastTimestamp: number;
  unread: number;
  participantIds: string[];
}

const KEY = 'kesto:chat';
const SEEN_KEY = 'kesto:chatSeen';
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

function loadSeen(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function appendChatMessage(msg: Omit<ChatMessage, 'id'>) {
  const messages = load();
  messages.push({ ...msg, id: crypto.randomUUID() });
  save(messages);
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function markThreadSeen(threadId: string) {
  const seen = loadSeen();
  seen[threadId] = Date.now();
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
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

function summarize(): ChatThreadSummary[] {
  const messages = load();
  const seen = loadSeen();
  const byThread = new Map<string, ChatMessage[]>();
  for (const m of messages) {
    const list = byThread.get(m.threadId) ?? [];
    list.push(m);
    byThread.set(m.threadId, list);
  }
  return Array.from(byThread.entries())
    .map(([threadId, msgs]) => {
      const last = msgs[msgs.length - 1];
      const lastSeenAt = seen[threadId] ?? 0;
      const unread = msgs.filter((m) => !m.mine && m.timestamp > lastSeenAt).length;
      // Reply targets are whoever has actually spoken in this thread — works
      // for group threads even if we didn't create that group ourselves.
      const participantIds = Array.from(new Set(msgs.filter((m) => !m.mine).map((m) => m.fromSteamId)));
      return { threadId, threadName: last.threadName, lastText: last.text, lastTimestamp: last.timestamp, unread, participantIds };
    })
    .sort((a, b) => b.lastTimestamp - a.lastTimestamp);
}

export function useChatThreads(): ChatThreadSummary[] {
  const [threads, setThreads] = useState<ChatThreadSummary[]>(() => summarize());

  const refresh = useCallback(() => setThreads(summarize()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CHANGED_EVENT, refresh);
  }, [refresh]);

  return threads;
}
