import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { getActiveSubscription } from "../services/billing.server";
import { isWishlistIconEmbedEnabled } from "../services/theme.server";
import { Page } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { findOrCreateStore, getStoreSettings } from "../services/wishlist.server";
import { resolveLanguage, getSessionLocale } from "../i18n/language.server";
import { getTranslator, getTranslatedList } from "../i18n/translations";
import dashboardStyles from "../styles/dashboard.css?url";

export const links = () => [{ rel: "stylesheet", href: dashboardStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const store = await findOrCreateStore(session.shop, session.accessToken!);
  const subscription = await getActiveSubscription(admin);
  const hasActivePlan = !!subscription;
  const settings = await getStoreSettings(store.id);
  const language = resolveLanguage(settings?.language, getSessionLocale(session));
  const appEmbedEnabled = await isWishlistIconEmbedEnabled(admin);

  return data({ shop: session.shop, hasActivePlan, language, appEmbedEnabled });
};

function Sparkline({ color, data }: { color: string; data: number[] }) {
  const w = 70, h = 30;
  const max = Math.max(...data, 1);
  const safeLen = Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => `${(i / safeLen) * w},${h - (v / max) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: "block" }}>
      <polyline points={pts} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

function StatCard({ title, value, icon, iconBg, sparkColor, sparkData, footer, footerIcon, footerIconBg, onClick }: any) {
  return (
    <div
      className="dash-stat-card"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
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

const IconItems = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#7c5cfc" strokeWidth="1.8" /><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#7c5cfc" strokeWidth="1.8" /><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#7c5cfc" strokeWidth="1.8" /><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#7c5cfc" strokeWidth="1.8" /></svg>);
const IconHeart = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="#16a34a"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z" /></svg>);
const IconBag = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>);
const IconTrendUp = (color: string) => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>);

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

export default function Analytics() {
  const { hasActivePlan, language, shop, appEmbedEnabled } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(!hasActivePlan);
  const t = getTranslator(language);
  const subscribeFeatures = getTranslatedList(language, "common.subscribeModal.features");

  return (
    <Page>
      <TitleBar title="Overview" />
      <BillingModal open={modalOpen} onNavigate={() => navigate("/app/billing")} t={t} features={subscribeFeatures} />
      <div className="dash-root">
        <div className="dash-header">
          <div className="dash-header__left">
            <div className="dash-header__eyebrow">Getting Started</div>
            <h1 className="dash-header__title">WishKeeper <em>Overview</em></h1>
          </div>
          <div className="dash-header__right">
            <span className="dash-header__live-dot" />
            {t("dashboard.live")}
          </div>
        </div>
        <div className="dash-setup-card">
          <div className="dash-setup-card__left">
            <div className={`dash-setup-card__icon ${appEmbedEnabled ? "dash-setup-card__icon--on" : "dash-setup-card__icon--neutral"}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            </div>
            <div>
              <p className="dash-setup-card__title">Wishlist Icon Setup</p>
              <p className="dash-setup-card__sub">Make sure the wishlist icon is enabled in your theme's App Embeds.</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {appEmbedEnabled === true && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "var(--green-bg)",
                  color: "#16a34a",
                  border: "1px solid rgba(22,163,74,0.2)",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Enabled
              </span>
            )}
            <a
              href={`https://${shop}/admin/themes/current/editor?context=apps`}
              target="_blank"
              rel="noopener noreferrer"
              className="dash-setup-card__btn"
            >
              Open Theme Editor →
            </a>
          </div>
        </div>
        <div className="dash-guide">
          <h2 className="dash-guide__title">Setting Up Your <em>Theme Editor</em></h2>
          <p className="dash-guide__sub">Follow these steps once to switch on the wishlist icon and place it exactly where you want it.</p>
          <div className="dash-guide-steps">
            <div className="dash-guide-step">
              <span className="dash-guide-step__num">1</span>
              <div>
                <p className="dash-guide-step__title">Open the Theme Editor</p>
                <p className="dash-guide-step__desc">Click "Open Theme Editor" above. This takes you straight into your live theme's customizer with the App Embeds panel ready.</p>
              </div>
            </div>
            <div className="dash-guide-step">
              <span className="dash-guide-step__num">2</span>
              <div>
                <p className="dash-guide-step__title">Enable the WishKeeper App Embed</p>
                <p className="dash-guide-step__desc">In the left sidebar, go to App Embeds and toggle WishKeeper on. It automatically places the heart icon next to your cart icon in the header.</p>
              </div>
            </div>
            <div className="dash-guide-step">
              <span className="dash-guide-step__num">3</span>
              <div>
                <p className="dash-guide-step__title">Pick an Icon Style and Colour</p>
                <p className="dash-guide-step__desc">With WishKeeper selected in the App Embeds list, open its settings on the left: choose "Icon style" (Heart, Bookmark, or Star) and set "Badge color" to match your brand. Changes preview instantly in the editor.</p>
              </div>
            </div>
            <div className="dash-guide-step">
              <span className="dash-guide-step__num">4</span>
              <div>
                <p className="dash-guide-step__title">Save</p>
                <p className="dash-guide-step__desc">Click Save in the top right. Your storefront now shows the wishlist icon live, styled the way you picked, no theme code edits required.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="dash-features">
          <h2 className="dash-features__title">How <em>WishKeeper</em> Works</h2>
          <p className="dash-features__sub">Everything your customers and your store get, out of the box.</p>
          <div className="dash-features-grid">
            <div className="dash-feature-card">
              <div className="dash-feature-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              </div>
              <p className="dash-feature-card__title">Heart Button</p>
              <p className="dash-feature-card__desc">Customers tap the heart icon on any product or collection card to save it instantly, no account required.</p>
            </div>
            <div className="dash-feature-card">
              <div className="dash-feature-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" /></svg>
              </div>
              <p className="dash-feature-card__title">Header Wishlist Icon</p>
              <p className="dash-feature-card__desc">A wishlist icon with a live item-count badge sits right in your store header, next to the cart.</p>
            </div>
            <div className="dash-feature-card">
              <div className="dash-feature-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
              </div>
              <p className="dash-feature-card__title">Customer Wishlist Page</p>
              <p className="dash-feature-card__desc">A dedicated page where customers view, share, and add their saved items to cart, all at once or one by one.</p>
            </div>
            <div className="dash-feature-card">
              <div className="dash-feature-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <p className="dash-feature-card__title">Analytics & Insights</p>
              <p className="dash-feature-card__desc">Track saves, top products, and shopper activity in real time, right here on this page.</p>
            </div>
            <div className="dash-feature-card">
              <div className="dash-feature-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><path d="M8.5 6.5a1.5 1.5 0 013 0M19.5 6.5a1.5 1.5 0 01-3 0" /></svg>
              </div>
              <p className="dash-feature-card__title">Collection Page Hearts</p>
              <p className="dash-feature-card__desc">The same save icon also appears on every product card in your collection and category grids, so shoppers can save without opening the product page.</p>
            </div>
            <div className="dash-feature-card">
              <div className="dash-feature-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="13.5" cy="6.5" r="3" /><path d="M18 3.5c1 1 1 2.5 0 3.5M3 20l4-1 10-10-3-3L4 16l-1 4z" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <p className="dash-feature-card__title">Custom Icon & Colours</p>
              <p className="dash-feature-card__desc">Choose Heart, Bookmark, Star, or upload your own SVG, then set the active colour in Settings to match your brand everywhere the icon appears.</p>
            </div>
          </div>
        </div>
        <div className="dash-hero">
          <svg className="dash-hero__watermark" width="220" height="220" viewBox="0 0 24 24" fill="none">
            <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z" fill="#b8922a" />
          </svg>
          <div className="dash-hero__eyebrow">Wishlist Intelligence</div>
          <h2 className="dash-hero__title">Turn Saved Products <em>Into Sales</em></h2>
          <p className="dash-hero__sub">Every heart click is a signal. WishKeeper turns customer intent into insight, so you always know what your shoppers want next.</p>
          <div className="dash-hero__badges">
            <span className="dash-hero__badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              Real-time tracking
            </span>
            <span className="dash-hero__badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>
              Customer insight
            </span>
            <span className="dash-hero__badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Product trends
            </span>
          </div>
        </div>
        <div className="dash-panel">
          <div className="dash-panel__header">
            <span className="dash-panel__title">
              <span className="dash-panel__title-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" strokeLinecap="round" /></svg>
              </span>
              Explore the App
            </span>
          </div>
          <p className="dash-pages__sub">Every page in WishKeeper, and exactly what it does for your store.</p>
          <div className="dash-pages-grid">
            <PageCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              title="Home"
              desc="Your everyday control room. See total wishlist items, active wishlists, and how many items were added recently, all as clean stat cards you can read in seconds. Below that, a 7-day trend chart shows whether interest is climbing or cooling off, next to a ranked list of your top saved products so you always know what shoppers want most, even before they buy."
              onOpen={() => navigate("/app/home")}
              locked={false}
            />
            <PageCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>}
              title="Wishlists"
              desc="Every customer's wishlist, in one searchable table. Filter the whole list by date range (7, 15, 30, 180 days, or all time) to see recent activity at a glance. Select one or many rows to bulk-delete stale entries, or open any customer to see their full add and remove history with product images, so you understand exactly how their wishlist changed over time."
              onOpen={() => navigate("/app/wishlist")}
              locked={!hasActivePlan}
            />
            <PageCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>}
              title="Reports"
              desc="A per-product table ranking every item by how many times it's been saved to a wishlist, alongside live inventory from your store and its SKU. Alerts Sent and Revenue columns are built in and ready, they'll populate automatically once price-drop email alerts and order attribution go live."
              onOpen={() => navigate("/app/reports")}
              locked={!hasActivePlan}
            />
            <PageCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>}
              title="Settings"
              desc="The full styling and behaviour control panel for your storefront wishlist. Pick an icon style (Heart, Bookmark, Star) or upload your own SVG, set the active colour to match your brand, and choose which product details show on the wishlist page: title, price, vendor, add-to-cart. Adjust the grid layout, item limits per customer, and the storefront language, all saved instantly and reflected live."
              onOpen={() => navigate("/app/settings")}
              locked={!hasActivePlan}
            />
            <PageCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
              title="Billing"
              desc="Manage your WishKeeper subscription in one place: see your current plan, what's included, and your next billing date. Upgrade, downgrade, or cancel any time directly through Shopify's secure billing, no separate payment setup needed. Every other page in the app, Wishlists and Settings, unlocks automatically the moment a plan is active."
              onOpen={() => navigate("/app/billing")}
              locked={false}
            />
            <PageCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>}
              title="Custom Wishlist Button"
              desc="Already have your own 'Add to Wishlist' button somewhere in your theme, not the WishKeeper block? Paste its HTML into Settings and we'll automatically detect it on your product pages and wire up add/remove, no code editing, no CSS selectors."
              onOpen={() => navigate("/app/settings#custom-wishlist-button-section")}
              locked={!hasActivePlan}
            />
          </div>
        </div>
        <div className="dash-storefront">
          <div className="dash-storefront__head">
            <span className="dash-storefront__eyebrow">Storefront Preview</span>
            <h2 className="dash-storefront__title">The Customer <em>Wishlist Page</em></h2>
            <p className="dash-storefront__sub">This is the page every "Wishlist" link or heart icon on your storefront leads to, where customers manage everything they've saved.</p>
          </div>
          <div className="dash-storefront-grid">
            <div className="dash-storefront-card">
              <span className="dash-storefront-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <p className="dash-storefront-card__title">Saved Products, Laid Out Clearly</p>
              <p className="dash-storefront-card__desc">Every saved item shows its product image in a clean grid, along with whatever details you've chosen to display: title, price, and vendor.</p>
            </div>
            <div className="dash-storefront-card">
              <span className="dash-storefront-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <p className="dash-storefront-card__title">Remove One by One, or All at Once</p>
              <p className="dash-storefront-card__desc">Customers can unheart a single product to remove just that item, or use the "Clear wishlist" action to empty the entire list in one tap.</p>
            </div>
            <div className="dash-storefront-card">
              <span className="dash-storefront-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
              </span>
              <p className="dash-storefront-card__title">Add Everything to Cart Together</p>
              <p className="dash-storefront-card__desc">An "Add all to cart" action batches every saved item into the cart in one click, turning a wishlist into a checkout in seconds.</p>
            </div>
            <div className="dash-storefront-card">
              <span className="dash-storefront-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
              </span>
              <p className="dash-storefront-card__title">You Control What Shows</p>
              <p className="dash-storefront-card__desc">From Settings, toggle exactly which fields appear here: image, title, price, vendor, add-to-cart, plus the grid column count, so it always matches your store's look.</p>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

function PageCard({ icon, title, desc, onOpen, locked }: { icon: JSX.Element; title: string; desc: string; onOpen: () => void; locked: boolean }) {
  return (
    <div className="dash-page-card">
      <div className="dash-page-card__top">
        <span className="dash-page-card__icon">{icon}</span>
        {locked && (
          <span className="dash-page-card__lock" title="Requires an active plan">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" /></svg>
          </span>
        )}
      </div>
      <p className="dash-page-card__title">{title}</p>
      <p className="dash-page-card__desc">{desc}</p>
      <button
        type="button"
        className={`dash-page-card__btn${locked ? " dash-page-card__btn--locked" : ""}`}
        onClick={locked ? undefined : onOpen}
        disabled={locked}
      >
        {locked ? "Subscribe to unlock" : "Open page →"}
      </button>
    </div>
  );
}
