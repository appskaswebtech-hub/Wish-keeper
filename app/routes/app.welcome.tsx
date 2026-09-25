import { useCallback, useEffect, useRef, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { data, useLoaderData, useNavigate } from "react-router";
import { Page } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getStoreSettingsByShop } from "../services/wishlist.server";
import { getActiveSubscription } from "../services/billing.server";
import { syncShopPlanFromSubscription } from "../utils/planUtils";
import { resolveLanguage, getSessionLocale } from "../i18n/language.server";
import { getTranslator, getTranslatedList } from "../i18n/translations";

import welcomeStyles from "../styles/welcome.css?url";

export const links = () => [{ rel: "stylesheet", href: welcomeStyles }];

const WELCOME_SEEN_KEY = "wishkeeper_welcome_seen";

// Set SETUP_VIDEO_URL in .env to a YouTube / Vimeo / direct .mp4 link.
// Without it, the page plays the default video below.
const DEFAULT_SETUP_VIDEO = "https://cdn.shopify.com/videos/c/o/v/19203596a56b44f0952c610436c70d25.mp4";
function resolveVideo(raw: string): { kind: "iframe" | "file"; src: string } {
  const url = raw.trim();
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { kind: "file", src: url };
}

const fmt = (n: number) => {
  if (!isFinite(n)) return "0:00";
  const m = Math.floor(n / 60);
  const sec = Math.floor(n % 60).toString().padStart(2, "0");
  return m + ":" + sec;
};

// Custom player: click the video to play/pause, double-click (or the button) for full screen.
// Shopify blocks native fullscreen for embedded apps, so when the browser refuses we expand
// the player over the whole app frame instead (Esc to exit).
function VideoPlayer({ src }: { src: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Read state straight from the element. The server-rendered <video> can finish loading its
  // metadata before React attaches handlers, so React's onLoadedMetadata alone can miss it.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const sync = () => {
      setTime(v.currentTime);
      setDuration(Number.isFinite(v.duration) ? v.duration : 0);
      setPlaying(!v.paused);
      setMuted(v.muted);
    };
    const events = ["loadedmetadata", "loadeddata", "durationchange", "timeupdate", "play", "pause", "seeked", "volumechange"];
    events.forEach((e) => v.addEventListener(e, sync));
    sync();
    return () => events.forEach((e) => v.removeEventListener(e, sync));
  }, [src]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play(); else v.pause();
  }, []);

  const toggleFull = useCallback(async () => {
    if (document.fullscreenElement) { await document.exitFullscreen().catch(() => {}); return; }
    if (expanded) { setExpanded(false); return; }
    if (document.fullscreenEnabled && boxRef.current) {
      try { await boxRef.current.requestFullscreen(); return; } catch { /* fall back below */ }
    }
    setExpanded(true);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const btn: React.CSSProperties = { background: "none", border: 0, color: "#fff", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" };
  const boxStyle: React.CSSProperties = expanded
    ? { position: "fixed", inset: 0, zIndex: 9999, background: "#000" }
    : { position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#111", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" };

  return (
    <div ref={boxRef} style={boxStyle}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        onClick={toggle}
        onDoubleClick={toggleFull}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", cursor: "pointer" }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "22px 12px 10px", background: "linear-gradient(transparent, rgba(0,0,0,0.75))", display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 12 }}>
        <button type="button" aria-label="Play or pause" onClick={toggle} style={btn}>
          {playing
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"/></svg>}
        </button>
        <span style={{ minWidth: 78 }}>{fmt(time)} / {fmt(duration)}</span>
        <input
          type="range" min={0} max={duration || 0} step={0.1} value={time}
          onChange={(e) => { const v = videoRef.current; if (v) v.currentTime = Number(e.target.value); }}
          style={{ flex: 1, accentColor: "#b8922a", cursor: "pointer" }}
        />
        <button type="button" aria-label="Mute" onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted); } }} style={btn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>{muted ? <><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></> : <path d="M15.5 8.5a5 5 0 0 1 0 7"/>}</svg>
        </button>
        <button type="button" aria-label="Full screen" onClick={toggleFull} style={btn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {expanded ? <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/> : <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>}
          </svg>
        </button>
      </div>
    </div>
  );
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const subscription = await getActiveSubscription(admin);
  await syncShopPlanFromSubscription(session.shop, subscription).catch((err) =>
    console.error("[welcome] shop plan sync failed:", err)
  );
  const settings = await getStoreSettingsByShop(session.shop);
  const language = resolveLanguage(settings?.language, getSessionLocale(session));
  const video = resolveVideo(process.env.SETUP_VIDEO_URL || DEFAULT_SETUP_VIDEO);
  return data({ language, video });
};

export default function WelcomePage() {
  const { language, video } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const t = getTranslator(language);
  const steps = getTranslatedList(language, "welcome.steps");

  // Mark as seen as soon as the page opens, so Overview never bounces back here.
  useEffect(() => {
    try { localStorage.setItem(WELCOME_SEEN_KEY, "1"); } catch { /* storage unavailable */ }
  }, []);

  const finish = (to: string) => navigate(to);

  return (
    <Page>
      <TitleBar title={t("welcome.titleBar")} />
      <div className="wl-root">
        <div className="wl-head">
          <div className="wl-eyebrow">{t("welcome.eyebrow")}</div>
          <h1 className="wl-title">{t("welcome.headingPrefix")} <em>{t("welcome.headingEmphasis")}</em> {t("welcome.headingSuffix")}</h1>
          <p className="wl-sub">{t("welcome.sub")}</p>
        </div>

        <div className="wl-video">
          {video.kind === "iframe" ? (
            <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#111", borderRadius: 14, overflow: "hidden" }}>
              <iframe
                src={video.src}
                title={t("welcome.heading")}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            </div>
          ) : (
            <VideoPlayer src={video.src} />
          )}
        </div>

        {steps.length > 0 && (
          <ol className="wl-steps">
            {steps.map((step, i) => (
              <li key={step} className="wl-step">
                <div className="wl-step__num">{i + 1}</div>
                <p className="wl-step__text">{step}</p>
              </li>
            ))}
          </ol>
        )}

        <div className="wl-actions">
          <button type="button" className="wl-btn wl-btn--primary" onClick={() => finish("/app")}>{t("welcome.continue")}</button>
          <button type="button" className="wl-btn wl-btn--ghost" onClick={() => window.open("/instructions", "_blank", "noopener")}>{t("welcome.readGuide")}</button>
        </div>
      </div>
    </Page>
  );
}
