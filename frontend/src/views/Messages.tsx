'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { messagesApi, type Conversation, type Message } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Avatar, PageLoader, EmptyState } from '../components/ui';
import { relativeTime } from '../lib/format';
import { IconInbox, IconArrowRight } from '../components/icons';

const THREAD_POLL_MS = 4000;
const LIST_POLL_MS = 8000;

export default function Messages() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [activeName, setActiveName] = useState<string>('');
  const [thread, setThread] = useState<Message[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const list = await messagesApi.conversations();
      setConversations(list);
      return list;
    } catch {
      return [] as Conversation[];
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Initial load + open a conversation from ?to=<userId>&name=<name> if present.
  useEffect(() => {
    loadConversations().then((list) => {
      const params = new URLSearchParams(window.location.search);
      const to = params.get('to');
      const name = params.get('name');
      if (to) {
        setActive(to);
        setActiveName(name || list.find((c) => c.userId === to)?.name || 'Conversation');
      }
    });
  }, [loadConversations]);

  // Poll the conversation list.
  useEffect(() => {
    const id = setInterval(loadConversations, LIST_POLL_MS);
    return () => clearInterval(id);
  }, [loadConversations]);

  const loadThread = useCallback(async (otherId: string) => {
    try {
      const msgs = await messagesApi.thread(otherId);
      setThread(msgs);
    } catch {
      setThread([]);
    }
  }, []);

  // Load + poll the active thread; refresh the list so unread badges clear.
  useEffect(() => {
    if (!active) return;
    loadThread(active);
    const id = setInterval(() => loadThread(active), THREAD_POLL_MS);
    return () => clearInterval(id);
  }, [active, loadThread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const openConversation = (c: Conversation) => {
    setActive(c.userId);
    setActiveName(c.name);
    setConversations((prev) => prev.map((x) => (x.userId === c.userId ? { ...x, unread: 0 } : x)));
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !active) return;
    setSending(true);
    try {
      const msg = await messagesApi.send(active, body);
      setThread((prev) => [...prev, msg]);
      setDraft('');
      loadConversations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Messages</h1>
      <p className="page-sub">Chat with {user?.role === 'provider' ? 'customers' : 'providers'} directly.</p>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: 480, overflow: 'hidden' }}>
        {/* Conversation list */}
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', maxHeight: 640 }}>
          {loadingList ? (
            <div style={{ padding: 24 }}><PageLoader /></div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 20 }}>
              <EmptyState icon={<IconInbox />} title="No conversations">Start a chat from a provider's page or a job request.</EmptyState>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.userId}
                className="list-row"
                onClick={() => openConversation(c)}
                style={{
                  width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                  background: active === c.userId ? 'var(--surface-2, #f4f4f8)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <Avatar name={c.name || 'U'} src={c.profilePhoto} size="sm" />
                <div className="lr-main" style={{ minWidth: 0 }}>
                  <div className="lr-title" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || 'User'}</span>
                    <span className="tiny muted" style={{ flexShrink: 0 }}>{relativeTime(c.lastAt)}</span>
                  </div>
                  <div className="lr-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.fromMe ? 'You: ' : ''}{c.lastMessage}
                  </div>
                </div>
                {c.unread > 0 && <span className="badge badge-primary" style={{ flexShrink: 0 }}>{c.unread}</span>}
              </button>
            ))
          )}
        </div>

        {/* Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 640 }}>
          {!active ? (
            <div style={{ margin: 'auto', padding: 24 }}>
              <EmptyState icon={<IconInbox />} title="Select a conversation">Choose someone on the left to see your messages.</EmptyState>
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
                {activeName}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {thread.length === 0 ? (
                  <p className="muted small" style={{ margin: 'auto' }}>No messages yet — say hello 👋</p>
                ) : (
                  thread.map((m) => {
                    const mine = m.senderId === user?.id;
                    return (
                      <div key={m._id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                        <div style={{
                          padding: '9px 13px', borderRadius: 14,
                          background: mine ? 'var(--primary)' : 'var(--surface-2, #f1f1f6)',
                          color: mine ? '#fff' : 'var(--ink)',
                          borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {m.body}
                        </div>
                        <div className="tiny muted" style={{ textAlign: mine ? 'right' : 'left', marginTop: 2 }}>{relativeTime(m.createdAt)}</div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border)' }}>
                <input
                  className="input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  autoFocus
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary btn-icon" disabled={sending || !draft.trim()} title="Send"><IconArrowRight /></button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
