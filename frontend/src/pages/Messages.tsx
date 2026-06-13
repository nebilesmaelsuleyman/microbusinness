import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { messagesApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Conversation, Message } from '../api/client';
import './Messages.css';

function getOtherParticipant(conv: Conversation, myId: string) {
  const other = conv.participants.find((p) => {
    const pid = typeof p === 'string' ? p : p._id;
    return pid !== myId;
  });
  if (!other || typeof other === 'string') return { name: 'User', id: other as string };
  return { name: other.name || other.phoneNumber || 'User', id: other._id };
}

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const recipientId = searchParams.get('to');

  useEffect(() => {
    messagesApi
      .conversations()
      .then((list) => {
        setConvs(list);
        if (list.length > 0 && !activeConv && !recipientId) {
          setActiveConv(list[0]._id);
        }
      })
      .catch(() => setConvs([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }
    messagesApi.getMessages(activeConv).then((msgs) => {
      setMessages(msgs.slice().reverse());
    });
    messagesApi.markRead(activeConv).catch(() => {});
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const body: { conversationId?: string; recipientId?: string; text: string } = { text: text.trim() };
      if (activeConv) body.conversationId = activeConv;
      else if (recipientId) body.recipientId = recipientId;
      else return;

      const msg = await messagesApi.send(body);
      setMessages((prev) => [...prev, msg]);
      setText('');

      if (!activeConv) {
        setActiveConv(msg.conversationId);
        setSearchParams({});
        messagesApi.conversations().then(setConvs).catch(() => {});
      } else {
        setConvs((prev) =>
          prev.map((c) =>
            c._id === activeConv ? { ...c, lastMessage: msg.text, lastMessageAt: msg.createdAt } : c,
          ),
        );
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) return <p className="muted">Loading messages…</p>;

  const canCompose = Boolean(activeConv || recipientId);

  return (
    <div className="messages-page">
      <h1 className="page-title">Messages</h1>
      <div className="messages-layout">
        <aside className="conv-list">
          {convs.length === 0 && !recipientId && (
            <p className="muted conv-empty">No conversations yet.</p>
          )}
          {recipientId && !activeConv && (
            <button type="button" className="conv-item conv-active">
              <span className="conv-name">New message</span>
              <span className="conv-preview">Start typing…</span>
            </button>
          )}
          {convs.map((c) => {
            const other = getOtherParticipant(c, user?.id || '');
            return (
              <button
                key={c._id}
                type="button"
                className={`conv-item ${activeConv === c._id ? 'conv-active' : ''}`}
                onClick={() => {
                  setActiveConv(c._id);
                  setSearchParams({});
                }}
              >
                <span className="conv-name">{other.name}</span>
                <span className="conv-preview">{c.lastMessage || '—'}</span>
              </button>
            );
          })}
        </aside>

        <section className="chat-panel card">
          {!canCompose ? (
            <p className="muted chat-empty">Select a conversation to start chatting.</p>
          ) : (
            <>
              <div className="chat-messages">
                {messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div key={m._id} className={`chat-bubble ${mine ? 'chat-mine' : 'chat-theirs'}`}>
                      <p className="chat-text">{m.text}</p>
                      <span className="chat-time">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form className="chat-compose" onSubmit={handleSend}>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  disabled={sending}
                />
                <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
