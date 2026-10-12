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
  const [adminTyping, setAdminTyping] = useState(false);
  const typingHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAt = useRef(0);

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
          scrollToBottom();
        }
      })
      .catch(() => {});
  }, [scrollToBottom]);

  // Live updates over a real WebSocket -- no polling. Browser EventSource
  // can't carry Shopify's session-token auth header the way fetch() does,
  // so we get a short-lived ticket over a normal authenticated fetch first
  // (same as before) and connect with that instead (see
  // app.support.ticket.ts). The ticket is refreshed periodically so a
  // long-open tab reconnects with a fresh one rather than ever hitting an
  // expired one.
  useEffect(() => {
    let socket: WebSocket | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function handlePayload(raw: string) {
      try {
        const payload = JSON.parse(raw);
        if (payload.type === "typing" && payload.sender === "admin") {
          setAdminTyping(true);
          if (typingHideTimer.current) clearTimeout(typingHideTimer.current);
          typingHideTimer.current = setTimeout(() => setAdminTyping(false), 3000);
          return;
        }
        if (payload.type === "message" && payload.message) {
          setAdminTyping(false);
          if (typingHideTimer.current) clearTimeout(typingHideTimer.current);
          setMessages((prev) =>
            prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]
          );
          if (payload.message.sender === "admin") {
            setUnread((n) => (open ? 0 : n + 1));
          }
          scrollToBottom();
        }
      } catch {
        // Ignore malformed frames.
      }
    }

    function connect() {
      fetch("/app/support/ticket", { method: "POST" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (cancelled || !d?.ticket) return;
          if (socket) socket.close();
          const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
          socket = new WebSocket(`${proto}//${window.location.host}/app/support/ws?ticket=${encodeURIComponent(d.ticket)}`);
          socket.onmessage = (ev) => handlePayload(ev.data);
          socket.onclose = () => {
            if (cancelled) return;
            // Dropped connection: reconnect with a fresh ticket shortly.
            reconnectTimer = setTimeout(connect, 3000);
          };
          // Get a fresh ticket and reconnect well before the 20-minute ticket expires.
          refreshTimer = setTimeout(connect, 15 * 60 * 1000);
        })
        .catch(() => {
          // Couldn't get a ticket (offline, etc.); try again shortly.
          if (!cancelled) refreshTimer = setTimeout(connect, 10000);
        });
    }

    connect();
    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
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
            <button className="wksc-head-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
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
            {adminTyping && (
              <div className="wksc-row wksc-row--admin">
                <div className="wksc-bubble wksc-typing">typing...</div>
              </div>
            )}
          </div>

          <div className="wksc-foot">
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
          </div>
        </div>
      )}
    </>
  );
}
