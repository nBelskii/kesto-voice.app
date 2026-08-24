import { Sidebar } from '../components/Sidebar';
import type { ChatThread } from '../components/ChatPanel';
import { useChatThreads } from '../store/chat';
import { formatRelativeTime } from '../store/callHistory';
import type { Screen, SteamFriend, Theme } from '../types';

interface Props {
  friends: SteamFriend[];
  theme: Theme;
  onToggleTheme: () => void;
  onNavigate: (screen: Screen) => void;
  onOpenChat: (thread: ChatThread) => void;
}

export function Messages({ friends, theme, onToggleTheme, onNavigate, onOpenChat }: Props) {
  const threads = useChatThreads();
  const friendsById = new Map(friends.map((f) => [f.steamId, f]));

  const openThread = (threadId: string, threadName: string, participantIds: string[]) => {
    // Reply to whoever has actually messaged in this thread. If we started
    // it and nobody's replied yet, fall back to the friend the id belongs to.
    const friend = friendsById.get(threadId);
    const recipientIds = participantIds.length > 0 ? participantIds : friend ? [friend.steamId] : [];
    onOpenChat({ id: threadId, name: threadName, recipientIds });
  };

  return (
    <div className="app-shell">
      <Sidebar active="messages" onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="cnt">
        <div className="cnt-h"><h1>MESSAGES</h1><div className="sub">All conversations</div></div>
        <div className="cnt-b">
          {threads.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No conversations yet. Message a friend or group to start one.
            </div>
          )}
          {threads.map((t, i) => {
            const name = t.threadName || 'Unknown';
            return (
            <div
              key={t.threadId}
              className="card fc stagger-item"
              style={{ '--i': i, cursor: 'pointer', marginBottom: 6 } as React.CSSProperties}
              onClick={() => openThread(t.threadId, name, t.participantIds)}
            >
              <div className="f-av">{name.slice(0, 2).toUpperCase()}</div>
              <div className="f-info">
                <b>{name}</b>
                <small>{t.lastText}</small>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{formatRelativeTime(t.lastTimestamp)}</div>
                {t.unread > 0 && (
                  <div style={{ marginTop: 4, display: 'inline-block', background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '1px 7px' }}>
                    {t.unread}
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
