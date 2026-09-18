import { useState } from "react";
import type { KeyboardEvent } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { getActiveSubscription } from "../services/billing.server";
import { Page } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { findOrCreateStore, getAnalytics, getStoreSettings, getRecentActivity, getWeeklyComparison, getTopShoppers } from "../services/wishlist.server";
import { resolveLanguage, getSessionLocale } from "../i18n/language.server";
import { getTranslator, getTranslatedList } from "../i18n/translations";
import dashboardStyles from "../styles/dashboard.css?url";

export const links = () => [{ rel: "stylesheet", href: dashboardStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const store = await findOrCreateStore(session.shop, session.accessToken!);
  const analytics = await getAnalytics(store.id);
  const subscription = await getActiveSubscription(admin);
  const hasActivePlan = !!subscription;
  const settings = await getStoreSettings(store.id);
  const language = resolveLanguage(settings?.language, getSessionLocale(session));

  const recentActivity = await getRecentActivity(store.id, 10);

  const productIds = new Set(analytics.topProducts.map((p) => p.productId));
  for (const a of recentActivity) productIds.add(a.productId);

  let productNameMap: Record<string, { title: string; image: string | null }> = {};
  if (productIds.size > 0) {
    const gids = [...productIds].map((id) => (id.startsWith("gid://") ? id : `gid://shopify/Product/${id}`));
    try {
      const res = await admin.graphql(
        `query GetTopProducts($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product { id title featuredImage { url } }
          }
        }`,
        { variables: { ids: gids } }
      );
      const json = await res.json();
      for (const node of json.data?.nodes ?? []) {
        if (node?.id) {
          const numId = node.id.replace("gid://shopify/Product/", "");
          productNameMap[numId] = { title: node.title, image: node.featuredImage?.url || null };
        }
      }
    } catch (_) {}
  }

  const activityCustomerIds = [...new Set(recentActivity.map((a) => a.wishlist.customerId))].filter(
    (id) => !id.startsWith("guest_")
  );
  let activityCustomerMap: Record<string, string> = {};
  if (activityCustomerIds.length > 0) {
    const gids = activityCustomerIds.map((id) => `gid://shopify/Customer/${id}`);
    try {
      const res = await admin.graphql(
        `query GetActivityCustomers($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Customer { id displayName }
          }
        }`,
        { variables: { ids: gids } }
      );
      const json = await res.json();
      for (const node of json.data?.nodes ?? []) {
        if (node?.id) {
          const numId = node.id.replace("gid://shopify/Customer/", "");
          activityCustomerMap[numId] = node.displayName || "Customer";
        }
      }
    } catch (_) {}
  }

  const weeklyComparison = await getWeeklyComparison(store.id);

  const topShoppers = await getTopShoppers(store.id, 10);
  const shopperIds = topShoppers.map((w) => w.customerId).filter((id) => !id.startsWith("guest_"));
  let shopperNameMap: Record<string, string> = {};
  if (shopperIds.length > 0) {
    const gids = shopperIds.map((id) => `gid://shopify/Customer/${id}`);
    try {
      const res = await admin.graphql(
        `query GetShopperNames($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Customer { id displayName }
          }
        }`,
        { variables: { ids: gids } }
      );
      const json = await res.json();
      for (const node of json.data?.nodes ?? []) {
        if (node?.id) {
          const numId = node.id.replace("gid://shopify/Customer/", "");
          shopperNameMap[numId] = node.displayName || "Customer";
        }
      }
    } catch (_) {}
  }

  const health = {
    hasActivePlan,
    headerIconEnabled: settings?.headerIconEnabled ?? true,
    hasActivity: analytics.totalItems > 0,
  };

  return data({
    shop: session.shop,
    analytics,
    hasActivePlan,
    language,
    productNameMap,
    recentActivity,
    activityCustomerMap,
    weeklyComparison,
    topShoppers: topShoppers.map((w) => ({ customerId: w.customerId, itemCount: w.items.length })),
    shopperNameMap,
    health,
  });
};

function Sparkline({ color, data, w = 70, h = 30 }: { color: string; data: number[]; w?: number; h?: number }) {
  const max = Math.max(...data, 1);
  const safeLen = Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => `${(i / safeLen) * w},${h - (v / max) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: "block" }}>
      <polyline points={pts} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C${midX},${p0.y} ${midX},${p1.y} ${p1.x},${p1.y}`;
  }
  return d;
}

function valueAtX(points: { x: number; y: number }[], x: number) {
  for (let i = 0; i < points.length - 1; i++) {
    if (x >= points[i].x && x <= points[i + 1].x) {
      const span = points[i + 1].x - points[i].x || 1;
      const t = (x - points[i].x) / span;
      return points[i].y + t * (points[i + 1].y - points[i].y);
    }
  }
  return points[points.length - 1].y;
}

function PremiumChart({ data }: { data: { date: string; count: number }[] }) {
  const W = 560, H = 220, padL = 8, padR = 8, padT = 26, padB = 34;
  const max = Math.max(...data.map((d) => d.count), 1);
  const safeLen = Math.max(data.length - 1, 1);
  const toX = (i: number) => padL + (i / safeLen) * (W - padL - padR);
  const toY = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.count) }));
  const linePath = smoothPath(points);
  const baseline = H - padB;
  const lastPoint = points[points.length - 1];

  const bars: { x: number; y: number }[] = [];
  const barGap = 7;
  for (let x = padL; x <= W - padR; x += barGap) {
    bars.push({ x, y: valueAtX(points, x) });
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="premBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8922a" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#b8922a" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((pct) => (
        <line key={pct} x1={padL} y1={padT + pct * (baseline - padT)} x2={W - padR} y2={padT + pct * (baseline - padT)} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
      ))}
      {bars.map((b, i) => (
        <line key={i} x1={b.x} y1={baseline} x2={b.x} y2={b.y} stroke="url(#premBar)" strokeWidth="2.5" />
      ))}
      <path d={linePath} stroke="#a9791f" strokeWidth="2.25" strokeLinecap="round" fill="none" />
      <line x1={lastPoint.x} y1={padT} x2={lastPoint.x} y2={baseline} stroke="rgba(184,146,42,0.3)" strokeWidth="1" strokeDasharray="3 3" />
      {points.map((p, i) => (
        <g key={data[i].date}>
          <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 3.5 : 2.6} fill="#fff" stroke="#a9791f" strokeWidth={i === points.length - 1 ? 2.2 : 1.6} />
          <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1a1612" fontFamily="DM Sans, sans-serif">{data[i].count}</text>
        </g>
      ))}
      {data.map((d, i) => (
        <text key={d.date} x={toX(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#5c5348" fontFamily="DM Sans, sans-serif">{d.date}</text>
      ))}
    </svg>
  );
}

function DonutChart({ segments, size = 152 }: { segments: { value: number; color: string }[]; size?: number }) {
  const total = Math.max(segments.reduce((s, seg) => s + seg.value, 0), 1);
  const r = 56, cx = size / 2, cy = size / 2, circumference = 2 * Math.PI * r;
  let offset = 0;
  const ticks = [0, 25, 50, 75];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="donutGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0cd6b" />
          <stop offset="55%" stopColor="#d4a843" />
          <stop offset="100%" stopColor="#93731d" />
        </linearGradient>
        <filter id="donutShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#b8922a" floodOpacity="0.35" />
        </filter>
      </defs>
      {ticks.map((tickPct) => {
        const angle = (tickPct / 100) * 2 * Math.PI - Math.PI / 2;
        const inner = r - 11, outer = r + 11;
        const x1 = cx + inner * Math.cos(angle), y1 = cy + inner * Math.sin(angle);
        const x2 = cx + outer * Math.cos(angle), y2 = cy + outer * Math.sin(angle);
        return <line key={tickPct} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--white)" strokeWidth="2" />;
      })}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
      {segments.map((seg, i) => {
        const frac = seg.value / total;
        const dash = Math.max(frac * circumference, frac > 0 ? 2 : 0);
        const circle = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            filter={i === 0 ? "url(#donutShadow)" : undefined}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += dash;
        return circle;
      })}
    </svg>
  );
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function StatCard({ title, value, icon, iconBg, sparkColor, sparkData, footer, footerIcon, footerIconBg, onClick }: any) {
  return (
    <div
      className="dash-stat-card"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <div className="dash-stat-card__row1">
        <div className="dash-stat-card__icon" style={{ background: iconBg }}>{icon}</div>
        <Sparkline color={sparkColor} data={sparkData} />
      </div>
      <p className="dash-stat-card__label">{title}</p>
      <p className="dash-stat-card__value">{value.toLocaleString()}</p>
      <div className="dash-stat-card__divider" />
      <div className="dash-stat-card__footer">
        <span className="dash-stat-card__footer-badge" style={{ background: footerIconBg }}>{footerIcon}</span>
        {footer}
      </div>
    </div>
  );
}

function TileCard({ title, value, suffix, sparkData, badge, onClick }: { title: string; value: string; suffix?: string; sparkData: number[]; badge?: { text: string; trend: "up" | "down" | "neutral" }; onClick?: () => void }) {
  return (
    <div className="dash-tile" onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} style={onClick ? { cursor: "pointer" } : undefined}>
      <div className="dash-tile__row1">
        <p className="dash-tile__title">{title}</p>
        <Sparkline color="#b8922a" data={sparkData} w={52} h={22} />
      </div>
      <p className="dash-tile__value">{value}{suffix && <span className="dash-tile__suffix">{suffix}</span>}</p>
      {badge && (
        <span className={`dash-tile__badge dash-tile__badge--${badge.trend}`}>
          {badge.trend === "up" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>}
          {badge.trend === "down" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>}
          {badge.text}
        </span>
      )}
    </div>
  );
}

const IconItems = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#7c5cfc" strokeWidth="1.8" /><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#7c5cfc" strokeWidth="1.8" /><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#7c5cfc" strokeWidth="1.8" /><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#7c5cfc" strokeWidth="1.8" /></svg>);
const IconHeart = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="#16a34a"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z" /></svg>);
const IconBag = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>);
const IconTrendUp = (color: string) => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>);
const IconTrophy = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><path d="M8 21h8M12 17v4M17 4H7v9a5 5 0 0010 0V4z" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 8H4a2 2 0 000 4h3M17 8h3a2 2 0 010 4h-3" strokeLinecap="round" /></svg>);
const IconChart = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>);

function TrophyIllustration() {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="45" fill="#faf8f4" />
      <circle cx="45" cy="45" r="32" fill="#f9f1e1" />
      <path d="M33 27h24v21c0 6.627-5.373 12-12 12s-12-5.373-12-12V27z" fill="rgba(184,146,42,0.20)" stroke="rgba(184,146,42,0.40)" strokeWidth="1.5" />
      <path d="M33 31h-7a7 7 0 007 7v-7zM57 31h7a7 7 0 01-7 7v-7z" fill="rgba(184,146,42,0.15)" stroke="rgba(184,146,42,0.35)" strokeWidth="1.5" />
      <rect x="41" y="60" width="8" height="7" fill="rgba(184,146,42,0.25)" />
      <rect x="35" y="67" width="20" height="3.5" rx="1.75" fill="rgba(184,146,42,0.2)" />
      <path d="M45 33l2 5.5h5.5l-4.5 3.3 1.8 5.5-4.8-3.3-4.8 3.3 1.8-5.5-4.5-3.3H43z" fill="rgba(184,146,42,0.5)" />
    </svg>
  );
}

function BillingModal({ open, onNavigate, t, features }: { open: boolean; onNavigate: () => void; t: (key: string, vars?: Record<string, string | number>) => string; features: string[] }) {
  if (!open) return null;
  const [bodyBefore, bodyAfter] = t("common.subscribeModal.body", { price: "@@PRICE@@" }).split("@@PRICE@@");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f9f1e1", border: "1.5px solid rgba(184,146,42,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="1.6" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#1a1612", margin: "0 0 8px" }}>{t("common.subscribeModal.title")}</p>
        <p style={{ fontSize: 13, color: "#6b6257", margin: "0 0 20px", lineHeight: 1.6 }}>{bodyBefore}<strong style={{ color: "#b8922a" }}>$9.99 / month</strong>{bodyAfter}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
          {features.map((f) => (
            <div key={f} style={{ padding: "7px 12px", background: "#faf8f4", border: "1px solid rgba(184,146,42,0.18)", borderRadius: 8, fontSize: 11, fontWeight: 500, color: "#6b6257" }}>{f}</div>
          ))}
        </div>
        <button onClick={onNavigate} style={{ width: "100%", padding: "12px 24px", background: "#b8922a", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          {t("common.subscribeModal.cta")}
        </button>
      </div>
    </div>
  );
}

export default function Index() {
  const { analytics, hasActivePlan, language, productNameMap, recentActivity, activityCustomerMap, weeklyComparison, topShoppers, shopperNameMap, health } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(!hasActivePlan);
  const sparkData = analytics.dailyCounts.map((d: { count: number }) => d.count);
  const t = getTranslator(language);
  const subscribeFeatures = getTranslatedList(language, "common.subscribeModal.features");

  return (
    <Page>
      <TitleBar title="Home" />
      <BillingModal open={modalOpen} onNavigate={() => navigate("/app/billing")} t={t} features={subscribeFeatures} />
      <div className="dash-root">
        <div className="dash-header">
          <div className="dash-header__left">
            <div className="dash-header__eyebrow">{t("dashboard.eyebrow")}</div>
            <h1 className="dash-header__title">{t("dashboard.headingPrefix")} <em>{t("dashboard.headingEmphasis")}</em></h1>
          </div>
          <div className="dash-header__right">
            <span className="dash-header__live-dot" />
            {t("dashboard.live")}
          </div>
        </div>
        <div className={`dash-callout${weeklyComparison.percentChange < 0 ? " dash-callout--down" : ""}`}>
          <span className="dash-callout__icon">
            {weeklyComparison.percentChange >= 0 ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
            )}
          </span>
          <p className="dash-callout__text">
            {weeklyComparison.thisWeek === 0 && weeklyComparison.lastWeek === 0 ? (
              <>No saves yet this week or last, once shoppers start hearting products, your week-over-week trend shows up here.</>
            ) : (
              <>
                <strong>{weeklyComparison.thisWeek} saves</strong> this week, {weeklyComparison.percentChange >= 0 ? "up" : "down"}{" "}
                <strong>{Math.abs(weeklyComparison.percentChange)}%</strong> compared to last week's {weeklyComparison.lastWeek}.
              </>
            )}
          </p>
        </div>
        <div className="dash-bottom-row">
          <div className="dash-tile-grid">
            <TileCard
              title="Total Wishlist Items"
              value={analytics.totalItems.toLocaleString()}
              sparkData={sparkData}
              badge={{ text: `${Math.abs(weeklyComparison.percentChange)}% vs last week`, trend: weeklyComparison.percentChange > 0 ? "up" : weeklyComparison.percentChange < 0 ? "down" : "neutral" }}
            />
            <TileCard
              title="Items Added (7 days)"
              value={analytics.recentItems.toLocaleString()}
              sparkData={sparkData}
              badge={{ text: `${Math.abs(weeklyComparison.percentChange)}% vs last week`, trend: weeklyComparison.percentChange > 0 ? "up" : weeklyComparison.percentChange < 0 ? "down" : "neutral" }}
            />
            <TileCard
              title="Active Wishlists"
              value={analytics.totalWishlists.toLocaleString()}
              sparkData={sparkData}
              badge={{ text: "All time", trend: "neutral" }}
            />
            <TileCard
              title="Engagement This Week"
              value={String(Math.round((Math.min(analytics.recentItems, Math.max(analytics.totalItems, 1)) / Math.max(analytics.totalItems, 1)) * 100))}
              suffix="%"
              sparkData={sparkData}
              badge={{ text: "of all saved items", trend: "neutral" }}
            />
          </div>
          <div className="dash-panel dash-donut-panel">
            <div className="dash-panel__header">
              <span className="dash-panel__title">
                <span className="dash-panel__title-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                </span>
                Engagement
              </span>
            </div>
            <p className="dash-donut__sub">Share of your currently saved items that were added in the last 7 days.</p>
            {(() => {
              const total = Math.max(analytics.totalItems, 1);
              const recent = Math.min(analytics.recentItems, total);
              const older = total - recent;
              const pct = Math.round((recent / total) * 100);
              return (
                <div className="dash-donut">
                  <div className="dash-donut__chart">
                    <DonutChart segments={[{ value: recent, color: "url(#donutGold)" }, { value: older, color: "#f0e9d8" }]} />
                    <div className="dash-donut__center">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#d4a843" className="dash-donut__icon"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z" /></svg>
                      <span className="dash-donut__pct">{pct}%</span>
                      <span className="dash-donut__label">this week</span>
                    </div>
                  </div>
                  <div className="dash-donut__legend">
                    <div className="dash-donut__legend-row">
                      <span className="dash-donut__dot" style={{ background: "#b8922a" }} />
                      <span>Last 7 days</span>
                      <strong>{recent}</strong>
                    </div>
                    <div className="dash-donut__legend-row">
                      <span className="dash-donut__dot" style={{ background: "#f0e9d8" }} />
                      <span>Saved earlier</span>
                      <strong>{older}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        <div className="dash-mid-row dash-mid-row--top">
          <div className="dash-chart-dark">
            <div className="dash-chart-dark__head">
              <div>
                <p className="dash-chart-dark__title">Wishlist Growth</p>
                <p className="dash-chart-dark__range">{t("dashboard.activity.range")}</p>
              </div>
              <div className="dash-chart-dark__stat">
                <span className="dash-chart-dark__dot" />
                <div>
                  <p className="dash-chart-dark__label">Saves this week</p>
                  <p className="dash-chart-dark__value">
                    {weeklyComparison.thisWeek}
                    <span className={`dash-chart-dark__change${weeklyComparison.percentChange < 0 ? " dash-chart-dark__change--down" : ""}`}>
                      {weeklyComparison.percentChange >= 0 ? "+" : ""}{weeklyComparison.percentChange}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <PremiumChart data={analytics.dailyCounts} />
          </div>
          <div className="dash-panel">
            <div className="dash-panel__header">
              <span className="dash-panel__title">
                <span className="dash-panel__title-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><path d="M13 2 3 14h7v8l10-12h-7z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                Growth Insights
              </span>
            </div>
            {(() => {
              const days = analytics.dailyCounts as { date: string; count: number }[];
              const peak = days.reduce((m, d) => (d.count > m.count ? d : m), days[0]);
              const avg = (days.reduce((s, d) => s + d.count, 0) / days.length).toFixed(1);
              const today = days[days.length - 1];
              const yesterday = days[days.length - 2] || { count: 0 };
              const diff = today.count - yesterday.count;
              return (
                <div className="dash-insights">
                  <div className="dash-insights__row">
                    <span className="dash-insights__icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><path d="M8 21h8M12 17v4M17 4H7v9a5 5 0 0010 0V4z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    <div>
                      <p className="dash-insights__label">Busiest Day</p>
                      <p className="dash-insights__value">{peak.date} <span>· {peak.count} saves</span></p>
                    </div>
                  </div>
                  <div className="dash-insights__row">
                    <span className="dash-insights__icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 15l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    <div>
                      <p className="dash-insights__label">Daily Average</p>
                      <p className="dash-insights__value">{avg} <span>saves / day</span></p>
                    </div>
                  </div>
                  <div className="dash-insights__row">
                    <span className="dash-insights__icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" /></svg>
                    </span>
                    <div>
                      <p className="dash-insights__label">Today vs Yesterday</p>
                      <p className="dash-insights__value">{today.count} <span>{diff === 0 ? "no change" : `${diff > 0 ? "+" : ""}${diff} vs yesterday`}</span></p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        <div className="dash-mid-row">
          <div className="dash-panel">
            <div className="dash-panel__header">
              <span className="dash-panel__title">
                <span className="dash-panel__title-icon"><IconTrophy /></span>
                {t("dashboard.topProducts.title")}
              </span>
            </div>
            {analytics.topProducts.length === 0 ? (
              <div className="dash-empty">
                <TrophyIllustration />
                <p className="dash-empty__title">{t("dashboard.topProducts.emptyTitle")}</p>
                <p className="dash-empty__sub">{t("dashboard.topProducts.emptySub")}</p>
              </div>
            ) : (
              <div className="dash-products__list">
                {analytics.topProducts.map((product: { productId: string; _count: { productId: number } }, index: number) => {
                  const info = (productNameMap as Record<string, { title: string; image: string | null }>)[product.productId];
                  const name = info?.title || product.productId;
                  return (
                    <div key={product.productId} className="dash-products__row">
                      <div className="dash-products__row-left">
                        <div className="dash-products__rank">{index + 1}</div>
                        <div className="dash-products__thumb">
                          {info?.image ? (
                            <img src={info.image} alt={name} width={32} height={32} />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                          )}
                        </div>
                        <span className="dash-products__name">{name}</span>
                      </div>
                      <span className="dash-products__badge">{product._count.productId} {t(product._count.productId === 1 ? "dashboard.topProducts.save" : "dashboard.topProducts.saves")}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <svg className="dash-panel__watermark" viewBox="0 0 24 24" fill="none">
              <path d="M8 21h8M12 17v4M17 4H7v9a5 5 0 0010 0V4z" stroke="#b8922a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="dash-panel">
            <div className="dash-panel__header">
              <span className="dash-panel__title">
                <span className="dash-panel__title-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" /></svg>
                </span>
                Recent Activity
              </span>
            </div>
            {recentActivity.length === 0 ? (
              <div className="dash-empty">
                <p className="dash-empty__title">No activity yet</p>
                <p className="dash-empty__sub">Saves and removes will show up here as they happen.</p>
              </div>
            ) : (
              <div className="dash-activity__list">
                {recentActivity.map((a: any) => {
                  const info = productNameMap[a.productId];
                  const name = info?.title || a.productId;
                  const customerId = a.wishlist.customerId;
                  const who = customerId.startsWith("guest_") ? "A guest" : activityCustomerMap[customerId] || "A customer";
                  return (
                    <div key={a.id} className="dash-activity__row">
                      <span className={`dash-activity__icon dash-activity__icon--${a.action}`}>
                        {a.action === "added" ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" strokeLinecap="round" /></svg>
                        )}
                      </span>
                      <div>
                        <p className="dash-activity__text"><strong>{who}</strong> {a.action === "added" ? "saved" : "removed"} <strong>{name}</strong></p>
                        <p className="dash-activity__time">{timeAgo(a.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="dash-mid-row">
          <div className="dash-panel">
            <div className="dash-panel__header">
              <span className="dash-panel__title">
                <span className="dash-panel__title-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="10" /></svg>
                </span>
                Store Health
              </span>
            </div>
            <div className="dash-health__list">
              <HealthRow ok={health.hasActivePlan} label="Subscription active" hint={health.hasActivePlan ? "Your plan is active and all pages are unlocked." : "Subscribe to unlock Wishlists and Settings."} actionLabel={health.hasActivePlan ? undefined : "View billing"} onAction={() => navigate("/app/billing")} />
              <HealthRow ok={health.headerIconEnabled} label="Header icon enabled" hint={health.headerIconEnabled ? "The wishlist icon is turned on in Settings." : "Header icon is switched off in Settings."} actionLabel="Open settings" onAction={() => navigate("/app/settings")} />
              <HealthRow ok={health.hasActivity} label="Receiving wishlist activity" hint={health.hasActivity ? "Customers are actively saving products." : "No saves recorded yet, check your theme's App Embeds."} actionLabel={health.hasActivity ? undefined : "Check embed"} onAction={() => navigate("/app")} />
            </div>
          </div>
          <div className="dash-panel">
            <div className="dash-panel__header">
              <span className="dash-panel__title">
                <span className="dash-panel__title-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" strokeLinecap="round" /><path d="M17 3.5a3 3 0 010 5.8M21 21v-2a4 4 0 00-2.5-3.7" strokeLinecap="round" /></svg>
                </span>
                Top Shoppers
              </span>
            </div>
            {topShoppers.length === 0 ? (
              <div className="dash-empty">
                <p className="dash-empty__title">No shoppers yet</p>
                <p className="dash-empty__sub">Customers with saved items will be ranked here.</p>
              </div>
            ) : (
              <div className="dash-metrics-row-list">
                {topShoppers.map((s: { customerId: string; itemCount: number }, i: number) => {
                  const isGuest = s.customerId.startsWith("guest_");
                  const name = isGuest ? "Guest shopper" : shopperNameMap[s.customerId] || "Customer";
                  const initial = name.charAt(0).toUpperCase();
                  return (
                    <div key={s.customerId} className="dash-metrics-row">
                      <span className="dash-products__rank">{i + 1}</span>
                      <div className="dash-metrics-avatar">{initial}</div>
                      <div className="dash-metrics-info">
                        <div className="dash-metrics-name">{name}</div>
                        <div className="dash-metrics-sub">{s.itemCount} item{s.itemCount === 1 ? "" : "s"} saved</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}

function HealthRow({ ok, label, hint, actionLabel, onAction }: { ok: boolean; label: string; hint: string; actionLabel?: string; onAction: () => void }) {
  return (
    <div className="dash-health__row">
      <span className={`dash-health__status ${ok ? "dash-health__status--ok" : "dash-health__status--warn"}`}>
        {ok ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16.5" x2="12" y2="16.5" /></svg>
        )}
      </span>
      <div className="dash-health__body">
        <p className="dash-health__label">{label}</p>
        <p className="dash-health__hint">{hint}</p>
      </div>
      {actionLabel && (
        <button type="button" className="dash-health__action" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}
