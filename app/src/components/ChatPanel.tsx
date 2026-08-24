import { useEffect, useRef, useState } from 'react';
import { X, Send } from 'lucide-react';
import { sendSignal } from '../webrtc/signaling';
import { appendChatMessage, markThreadSeen, useChatMessages } from '../store/chat';

export interface ChatThread {
  id: string;
  name: string;
  recipientIds: string[];
}

interface Props {
  thread: ChatThread | null;
  myName: string;
  onClose: () => void;
}

export function ChatPanel({ thread, myName, onClose }: Props) {
  const messages = useChatMessages(thread?.id ?? '');
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, thread]);

  useEffect(() => {
    if (thread) markThreadSeen(thread.id);
  }, [thread, messages.length]);

  if (!thread) return null;

  const send = () => {
    const value = text.trim();
    if (!value) return;
    appendChatMessage({
      threadId: thread.id,
      threadName: thread.name,
      fromSteamId: '',
      fromName: myName,
      text: value,
      timestamp: Date.now(),
      mine: true,
    });
    thread.recipientIds.forEach((id) => {
      sendSignal(id, { kind: 'chat-message', threadId: thread.id, threadName: thread.name, text: value, fromName: myName }).catch(() => {});
    });
    setText('');
  };

  const isGroup = thread.recipientIds.length > 1;

  return (
    <div className="chat-panel">
      <div className="chat-head">
        <div className="chat-title">{thread.name}</div>
        <button className="tbtn" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="chat-list" ref={listRef}>
        {messages.length === 0 && <div className="chat-empty">No messages yet. Say hi!</div>}
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg${m.mine ? ' mine' : ''}`}>
            {isGroup && !m.mine && <div className="chat-msg-from">{m.fromName}</div>}
            <div className="chat-msg-bubble">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          className="finput"
          placeholder="Message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn chat-send" onClick={send}><Send size={14} /></button>
      </div>
    </div>
  );
}
