import { useEffect, useRef, useState, useCallback } from "react";

type Message = {
  id: string;
  sender: "shop" | "admin";
  body: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  createdAt: string;
};

const WIDGET_CSS = `
.wksc-launcher{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;background:#b8922a;color:#fff;border:none;box-shadow:0 8px 24px rgba(184,146,42,0.35);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:9999;transition:transform .15s ease,box-shadow .15s ease}
.wksc-launcher:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(184,146,42,0.45)}
.wksc-badge{position:absolute;top:-4px;right:-4px;background:#dc2626;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #fff}
.wksc-panel{position:fixed;right:20px;bottom:88px;width:340px;max-width:calc(100vw - 32px);height:460px;max-height:calc(100vh - 140px);background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.18);display:flex;flex-direction:column;overflow:hidden;z-index:9999;border:1px solid rgba(0,0,0,0.06);font-family:inherit}
.wksc-head{background:linear-gradient(135deg,#1a1612,#2a241c);color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.wksc-head-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700}
.wksc-head-dot{width:8px;height:8px;border-radius:50%;background:#4ade80;flex-shrink:0}
.wksc-head-close{background:none;border:none;color:#fff;opacity:.75;cursor:pointer;padding:4px;display:flex}
.wksc-head-close:hover{opacity:1}
.wksc-head-actions{display:flex;align-items:center;gap:10px}
.wksc-head-end{background:none;border:1px solid rgba(255,255,255,0.3);color:#fff;opacity:.85;cursor:pointer;font-size:11px;font-weight:600;padding:4px 9px;border-radius:7px}
.wksc-head-end:hover{opacity:1;border-color:#fff}
.wksc-head-end:disabled{opacity:.5;cursor:not-allowed}
.wksc-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#faf8f4}
.wksc-empty{margin:auto;text-align:center;color:#9ca3af;font-size:12.5px;padding:0 20px}
.wksc-row{display:block;text-align:left;clear:both}
.wksc-row--shop{text-align:right}
.wksc-bubble{display:inline-block;text-align:left;max-width:78%;padding:8px 12px;border-radius:14px;font-size:13px;line-height:1.5;white-space:normal;overflow-wrap:break-word}
.wksc-row--shop .wksc-bubble{background:#b8922a;color:#fff;border-bottom-right-radius:4px}
.wksc-row--admin .wksc-bubble{background:#fff;color:#1a1612;border:1px solid rgba(0,0,0,0.08);border-bottom-left-radius:4px}
.wksc-attach{display:flex;align-items:center;gap:6px;margin-top:6px;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,0.06);font-size:12px;text-decoration:none;color:inherit}
.wksc-row--shop .wksc-attach{background:rgba(255,255,255,0.18)}
.wksc-attach-img{max-width:180px;max-height:140px;border-radius:8px;display:block;margin-top:6px}
.wksc-time{font-size:10px;color:#b0a89a;margin-top:3px}
.wksc-row--shop .wksc-time{text-align:right}
.wksc-foot{flex-shrink:0;border-top:1px solid rgba(0,0,0,0.06);padding:10px 12px;background:#fff}
.wksc-filechip{display:flex;align-items:center;gap:6px;font-size:11.5px;background:#f9f1e1;color:#8a6a1e;border:1px solid rgba(184,146,42,0.3);border-radius:8px;padding:5px 8px;margin-bottom:8px}
.wksc-filechip button{margin-left:auto;background:none;border:none;color:#b45454;cursor:pointer;font-size:12px}
.wksc-inputrow{display:flex;align-items:flex-end;gap:8px}
.wksc-textarea{flex:1;resize:none;border:1.5px solid #e5e0d6;border-radius:12px;padding:9px 12px;font:inherit;font-size:13px;max-height:90px;outline:none;transition:border-color .15s}
.wksc-textarea:focus{border-color:#b8922a}
.wksc-iconbtn{width:34px;height:34px;flex-shrink:0;border-radius:10px;border:1.5px solid #e5e0d6;background:#fff;color:#6b7280;display:flex;align-items:center;justify-content:center;cursor:pointer}
.wksc-iconbtn:hover{border-color:#b8922a;color:#b8922a}
.wksc-sendbtn{width:34px;height:34px;flex-shrink:0;border-radius:10px;border:none;background:#b8922a;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
.wksc-sendbtn:disabled{opacity:.5;cursor:not-allowed}
.wksc-err{font-size:11.5px;color:#dc2626;margin-bottom:6px}
.wksc-closed-row{display:flex;flex-direction:column;align-items:center;gap:8px;padding:4px 0}
.wksc-closed-note{font-size:11.5px;color:#9ca3af;text-align:center}
.wksc-newchat-btn{background:#b8922a;color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:12.5px;font-weight:700;cursor:pointer}
.wksc-newchat-btn:disabled{opacity:.6;cursor:not-allowed}
.wksc-typing{font-style:italic;opacity:.65}
`;

// Floating support chat, available on every /app/* page. Mounted once in
// app/routes/app.tsx so it persists (and keeps its SSE connection) across
// navigation between pages, instead of remounting on every route change.
export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentAt = useRef(0);
  const [closed, setClosed] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [ending, setEnding] = useState(false);
  const [starting, setStarting] = useState(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, []);

  // Initial history load, once.
  useEffect(() => {
    fetch("/app/support/messages")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.messages) {
          setMessages(d.messages);
          setLoaded(true);
          setClosed(Boolean(d.thread?.closedAt));
          scrollToBottom();
        }
      })
      .catch(() => {});
  }, [scrollToBottom]);

  // Live updates via polling. A raw WebSocket was tried here before, but it
  // only ever worked in local dev (it rode on a dev-only Vite plugin -- the
  // production server has no equivalent upgrade handler), so on the live
  // site it just reconnected forever and spammed the server log with 404s
  // while never actually delivering anything. Admin replies are already
  // persisted to the DB the instant they're sent (see
  // app.support.internal-notify.ts), so a short poll of the same endpoint
  // used for the initial load picks them up with at most a few seconds'
  // delay -- in practice indistinguishable from "live" for a chat widget,
  // and it works identically in every environment with zero server setup.
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/app/support/messages")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d?.messages) return;
          setMessages((prev) => {
            const prevIds = new Set(prev.map((m: Message) => m.id));
            const incoming: Message[] = d.messages;
            const fresh = incoming.filter((m) => !prevIds.has(m.id));
            if (fresh.length === 0) return prev;
            const adminFresh = fresh.filter((m) => m.sender === "admin");
            if (adminFresh.length > 0) {
              setUnread((n) => (open ? 0 : n + adminFresh.length));
            }
            scrollToBottom();
            return [...prev, ...fresh];
          });

          // Admin closed the conversation from the dashboard -- reflect that
          // here: collapse an open panel back to the floating icon and lock
          // the input so nothing more can be sent, until the admin replies
          // again (which re-opens it server-side).
          const isClosed = Boolean(d.thread?.closedAt);
          setClosed((wasClosed) => {
            if (isClosed && !wasClosed) setOpen(false);
            return isClosed;
          });

          // No live channel to clear this explicitly, so a recent timestamp
          // is treated as "still typing" -- generous enough (two poll
          // cycles) to survive the gap between polls without flickering.
          const typingAt = d.thread?.adminTypingAt ? new Date(d.thread.adminTypingAt).getTime() : 0;
          setAdminTyping(typingAt > 0 && Date.now() - typingAt < 8000);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      scrollToBottom();
    }
  }, [open, scrollToBottom]);

  const send = useCallback(() => {
    if (sending) return;
    if (!text.trim() && !file) return;
    setSending(true);
    setErr(null);

    const form = new FormData();
    form.set("body", text.trim());
    if (file) form.set("file", file);

    fetch("/app/support/messages", { method: "POST", body: form })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) {
          setErr(d?.error || "Could not send message.");
          return;
        }
        setMessages((prev) => (prev.some((m) => m.id === d.message.id) ? prev : [...prev, d.message]));
        setText("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        scrollToBottom();
      })
      .catch(() => setErr("Could not send message. Check your connection."))
      .finally(() => setSending(false));
  }, [text, file, sending, scrollToBottom]);

  const endChat = useCallback(() => {
    if (ending) return;
    setEnding(true);
    fetch("/app/support/close", { method: "POST" })
      .then(() => {
        setClosed(true);
        setOpen(false);
      })
      .catch(() => {})
      .finally(() => setEnding(false));
  }, [ending]);

  const startNewChat = useCallback(() => {
    if (starting) return;
    setStarting(true);
    fetch("/app/support/reopen", { method: "POST" })
      .then(() => {
        // Server hides everything before this point from now on (old
        // history stays intact for the admin) -- clear it here too so the
        // widget doesn't wait for the next poll to look fresh.
        setMessages([]);
        setClosed(false);
      })
      .catch(() => {})
      .finally(() => setStarting(false));
  }, [starting]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <style>{WIDGET_CSS}</style>

      {!open && (
        <button className="wksc-launcher" onClick={() => setOpen(true)} aria-label="Open support chat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          {unread > 0 && <span className="wksc-badge">{unread > 9 ? "9+" : unread}</span>}
        </button>
      )}

      {open && (
        <div className="wksc-panel">
          <div className="wksc-head">
            <div className="wksc-head-title">
              <span className="wksc-head-dot" />
              Chat with WishKeeper
            </div>
            <div className="wksc-head-actions">
              {!closed && messages.length > 0 && (
                <button type="button" className="wksc-head-end" onClick={endChat} disabled={ending}>
                  End chat
                </button>
              )}
              <button className="wksc-head-close" onClick={() => setOpen(false)} aria-label="Close chat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="wksc-body" ref={listRef}>
            {loaded && messages.length === 0 && (
              <div className="wksc-empty">
                Send us a message and we will get back to you here. You can attach a screenshot or a document too.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={"wksc-row wksc-row--" + m.sender}>
                <div>
                  <div className="wksc-bubble">
                    {m.body}
                    {m.attachmentUrl && m.attachmentType?.startsWith("image/") && (
                      <a href={m.attachmentUrl} target="_blank" rel="noreferrer">
                        <img src={m.attachmentUrl} alt={m.attachmentName || "attachment"} className="wksc-attach-img" />
                      </a>
                    )}
                    {m.attachmentUrl && !m.attachmentType?.startsWith("image/") && (
                      <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="wksc-attach">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        {m.attachmentName || "Attachment"}
                      </a>
                    )}
                  </div>
                  <div className="wksc-time">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {adminTyping && !closed && (
              <div className="wksc-row wksc-row--admin">
                <div className="wksc-bubble wksc-typing">typing...</div>
              </div>
            )}
          </div>

          <div className="wksc-foot">
            {closed ? (
              <div className="wksc-closed-row">
                <span className="wksc-closed-note">This conversation was closed by support.</span>
                <button type="button" className="wksc-newchat-btn" onClick={startNewChat} disabled={starting}>
                  {starting ? "Starting..." : "Start new chat"}
                </button>
              </div>
            ) : (
              <>
                {err && <div className="wksc-err">{err}</div>}
                {file && (
                  <div className="wksc-filechip">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>
                    {file.name}
                    <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>×</button>
                  </div>
                )}
                <div className="wksc-inputrow">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    style={{ display: "none" }}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <button type="button" className="wksc-iconbtn" onClick={() => fileInputRef.current?.click()} aria-label="Attach a file">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                  </button>
                  <textarea
                    className="wksc-textarea"
                    rows={1}
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      const now = Date.now();
                      if (now - lastTypingSentAt.current > 2000) {
                        lastTypingSentAt.current = now;
                        fetch("/app/support/typing", { method: "POST" }).catch(() => {});
                      }
                    }}
                    onKeyDown={onKeyDown}
                  />
                  <button type="button" className="wksc-sendbtn" onClick={send} disabled={sending || (!text.trim() && !file)} aria-label="Send">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
