import { useState, useEffect, useRef } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { useLoaderData, useNavigate, useFetcher } from "react-router";
import { Page } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { getActiveSubscription } from "../services/billing.server";
import { syncShopPlanFromSubscription } from "../utils/planUtils";
import { authenticate } from "../shopify.server";
import { findOrCreateStore, getAllWishlists, deleteWishlist, getStoreSettings } from "../services/wishlist.server";
import { resolveLanguage, getSessionLocale } from "../i18n/language.server";
import { getTranslator, getTranslatedList } from "../i18n/translations";
import wishlistStyles from "../styles/wishlist.css?url";

export const links = () => [{ rel: "stylesheet", href: wishlistStyles }];


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const store = await findOrCreateStore(session.shop, session.accessToken!);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const range = url.searchParams.get("range") || "all";

  const RANGE_DAYS: Record<string, number | null> = {
    "7": 7,
    "15": 15,
    "30": 30,
    "180": 180,
    all: null,
  };
  const days = RANGE_DAYS[range] ?? null;
  const sinceDate = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;

  const data2 = await getAllWishlists(store.id, page, 20, sinceDate);
  const subscription = await getActiveSubscription(admin);
  const hasActivePlan = !!subscription;
  syncShopPlanFromSubscription(session.shop, subscription).catch((err) =>
    console.error("[wishlist admin] shop plan sync failed:", err)
  );

  const customerIds = (data2.wishlists as any[])
    .filter((wl) => !wl.customerId.startsWith("guest_"))
    .map((wl) => `gid://shopify/Customer/${wl.customerId}`);

  let customerMap: Record<string, { name: string; email: string }> = {};
  if (customerIds.length > 0) {
    try {
      const res = await admin.graphql(
        `query GetCustomers($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Customer { id displayName email }
          }
        }`,
        { variables: { ids: customerIds } }
      );
      const json = await res.json();
      if (json.errors) {
        console.error("[wishlist admin] customer lookup GraphQL errors:", JSON.stringify(json.errors));
      }
      for (const node of (json.data?.nodes ?? [])) {
        if (node?.id) {
          const numId = node.id.replace("gid://shopify/Customer/", "");
          customerMap[numId] = { name: node.displayName || "", email: node.email || "" };
        }
      }
    } catch (err: any) {
      console.error(
        "[wishlist admin] customer lookup failed:",
        err?.message,
        err?.graphQLErrors ? JSON.stringify(err.graphQLErrors) : ""
      );
    }
  }

  const settings = await getStoreSettings(store.id);
  const language = resolveLanguage(settings?.language, getSessionLocale(session));

  return data({ ...data2, shop: session.shop, hasActivePlan, customerMap, range, language });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const store = await findOrCreateStore(session.shop, session.accessToken!);
  const formData = await request.formData();
  const wishlistIdsRaw = formData.get("wishlistIds") as string;
  const wishlistId = formData.get("wishlistId") as string;

  const ids = wishlistIdsRaw ? (JSON.parse(wishlistIdsRaw) as string[]) : wishlistId ? [wishlistId] : [];

  if (ids.length === 0) {
    return data({ error: "Missing wishlistId(s)" }, { status: 400 });
  }

  try {
    for (const id of ids) {
      await deleteWishlist(store.id, id);
    }
    return data({ success: true, count: ids.length });
  } catch (err) {
    return data({ error: err instanceof Error ? err.message : "Failed to delete" }, { status: 400 });
  }
};

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

function ConfirmDeleteModal({ label, onConfirm, onCancel, isDeleting, t }: { label: string; onConfirm: () => void; onCancel: () => void; isDeleting: boolean; t: (key: string, vars?: Record<string, string | number>) => string }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }} onClick={onCancel}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 26px", maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fee2e2", border: "1.5px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <IconTrash />
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1a1612", margin: "0 0 8px" }}>{t("wishlistsPage.delete.confirmTitle")}</p>
        <p style={{ fontSize: 13, color: "#6b6257", margin: "0 0 22px", lineHeight: 1.6 }}>
          {t("wishlistsPage.delete.confirmBody", { label })}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ flex: 1, padding: "11px 16px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            {t("wishlistsPage.delete.cancel")}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            style={{ flex: 1, padding: "11px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: isDeleting ? "default" : "pointer", opacity: isDeleting ? 0.7 : 1 }}
          >
            {isDeleting ? t("wishlistsPage.delete.deleting") : t("wishlistsPage.delete.button")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteButton({ wishlistId, label, t }: { wishlistId: string; label: string; t: (key: string, vars?: Record<string, string | number>) => string }) {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== "idle";
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => setConfirmOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: isDeleting ? "#d1d5db" : "#ef4444", cursor: isDeleting ? "default" : "pointer", fontSize: 12, fontWeight: 500, padding: "4px 6px" }}
        title={t("wishlistsPage.delete.tooltip")}
      >
        <IconTrash />{isDeleting ? t("wishlistsPage.delete.deleting") : t("wishlistsPage.delete.button")}
      </button>
      {confirmOpen && (
        <ConfirmDeleteModal
          label={label}
          isDeleting={isDeleting}
          t={t}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            fetcher.submit({ wishlistId }, { method: "POST" });
            setConfirmOpen(false);
          }}
        />
      )}
    </>
  );
}

const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconHeart = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="1.5">
    <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z" />
  </svg>
);

function getInitials(customerId: string, isGuest: boolean): string {
  if (isGuest) return "G";
  const clean = customerId.replace(/\D/g, "");
  return clean ? clean.slice(0, 2) : "C";
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconPlusCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const IconMinusCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const IconImagePlaceholder = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
  </svg>
);

function StatusPill({ isAdd, t }: { isAdd: boolean; t: (key: string, vars?: Record<string, string | number>) => string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px 5px 6px",
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 600,
        background: isAdd ? "#dcfce7" : "#fee2e2",
        color: isAdd ? "#16a34a" : "#ef4444",
      }}
    >
      {isAdd ? <IconPlusCircle /> : <IconMinusCircle />}
      {isAdd ? t("wishlistsPage.history.added") : t("wishlistsPage.history.removed")}
    </span>
  );
}

function HistoryModal({ wishlistId, customerLabel, onClose, t }: { wishlistId: string; customerLabel: string; onClose: () => void; t: (key: string, vars?: Record<string, string | number>) => string }) {
  const fetcher = useFetcher<{ activity?: any[]; productMap?: Record<string, { title: string; image: string | null }>; error?: string }>();

  if (fetcher.state === "idle" && !fetcher.data) {
    fetcher.load(`/app/wishlist/history?wishlistId=${encodeURIComponent(wishlistId)}`);
  }

  const activity = fetcher.data?.activity || [];
  const productMap = fetcher.data?.productMap || {};

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 28px 20px", maxWidth: 620, width: "92%", maxHeight: "75vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#1a1612", margin: 0 }}>{t("wishlistsPage.history.title")}</p>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", margin: "6px 0 0" }}>{t("wishlistsPage.history.subtitle", { label: customerLabel })}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><IconClose /></button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, marginTop: 16 }}>
          {fetcher.state === "loading" && !fetcher.data && (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <div className="wk-loader">
                <span className="wk-loader-letter">W</span>
                <span className="wk-loader-ring" />
              </div>
            </div>
          )}
          {fetcher.data?.error && (
            <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center", padding: "40px 0" }}>{t("wishlistsPage.history.error")}</p>
          )}
          {fetcher.data && activity.length === 0 && (
            <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>{t("wishlistsPage.history.empty")}</p>
          )}
          {activity.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af", padding: "0 0 10px", borderBottom: "1px solid #f1f5f9" }}>{t("wishlistsPage.history.product")}</th>
                  <th style={{ textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af", padding: "0 0 10px", borderBottom: "1px solid #f1f5f9" }}>{t("wishlistsPage.history.status")}</th>
                  <th style={{ textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af", padding: "0 0 10px", borderBottom: "1px solid #f1f5f9" }}>{t("wishlistsPage.history.date")}</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a: any) => {
                  const product = productMap[a.productId];
                  const name = product?.title || a.productId;
                  const image = product?.image;
                  const dateStr = new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  const timeStr = new Date(a.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                  const isAdd = a.action === "added";
                  return (
                    <tr key={a.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "12px 12px 12px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: "#f8fafc", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {image ? <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <IconImagePlaceholder />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1612" }}>{name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 12px 12px 0" }}>
                        <StatusPill isAdd={isAdd} t={t} />
                      </td>
                      <td style={{ padding: "12px 0" }}>
                        <div style={{ fontSize: 13, color: "#1a1612" }}>{dateStr}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{timeStr}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
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

function BulkDeleteBar({ selectedIds, onCleared, t }: { selectedIds: string[]; onCleared: () => void; t: (key: string, vars?: Record<string, string | number>) => string }) {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== "idle";
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && (fetcher.data as any).success) {
      onCleared();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  return (
    <>
      <div className="wl-bulkbar">
        <span className="wl-bulkbar__count">{t("wishlistsPage.bulkBar.selected", { n: selectedIds.length })}</span>
        <button type="button" className="wl-bulkbar__cancel" onClick={onCleared}>{t("wishlistsPage.bulkBar.cancel")}</button>
        <button
          type="button"
          className="wl-bulkbar__delete"
          disabled={isDeleting}
          onClick={() => setConfirmOpen(true)}
        >
          <IconTrash />{isDeleting ? t("wishlistsPage.bulkBar.deleting") : t("wishlistsPage.bulkBar.deleteSelected")}
        </button>
      </div>
      {confirmOpen && (
        <ConfirmDeleteModal
          label={t(selectedIds.length !== 1 ? "wishlistsPage.delete.selectedLabelPlural" : "wishlistsPage.delete.selectedLabel", { n: selectedIds.length })}
          isDeleting={isDeleting}
          t={t}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            fetcher.submit({ wishlistIds: JSON.stringify(selectedIds) }, { method: "POST" });
            setConfirmOpen(false);
          }}
        />
      )}
    </>
  );
}

export default function WishlistAdmin() {
  const { wishlists, total, page, totalPages, hasActivePlan, customerMap, range, language } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const t = getTranslator(language);
  const subscribeFeatures = getTranslatedList(language, "common.subscribeModal.features");
  const [modalOpen, setModalOpen] = useState(!hasActivePlan);
  const [historyFor, setHistoryFor] = useState<{ id: string; label: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allOnPageSelected = wishlists.length > 0 && wishlists.every((wl: any) => selectedIds.has(wl.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (allOnPageSelected) return new Set();
      const next = new Set(prev);
      wishlists.forEach((wl: any) => next.add(wl.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dragState = useRef({ isDown: false, startX: 0, startScrollLeft: 0, moved: false });

  const onDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    dragState.current = { isDown: true, startX: e.pageX, startScrollLeft: el.scrollLeft, moved: false };
    el.classList.add("wl-card--dragging");
  };

  const onDragMouseLeaveOrUp = (e: React.MouseEvent<HTMLDivElement>) => {
    dragState.current.isDown = false;
    e.currentTarget.classList.remove("wl-card--dragging");
  };

  const onDragMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.current.isDown) return;
    e.preventDefault();
    const el = e.currentTarget;
    const delta = e.pageX - dragState.current.startX;
    if (Math.abs(delta) > 3) dragState.current.moved = true;
    el.scrollLeft = dragState.current.startScrollLeft - delta;
  };

  const onDragClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  };

  const dragScrollProps = {
    onMouseDown: onDragMouseDown,
    onMouseLeave: onDragMouseLeaveOrUp,
    onMouseUp: onDragMouseLeaveOrUp,
    onMouseMove: onDragMouseMove,
    onClickCapture: onDragClickCapture,
  };

  if (wishlists.length === 0 && page === 1) {
    return (
      <Page>
        <TitleBar title={t("wishlistsPage.titleEm")} />
        <BillingModal open={modalOpen} onNavigate={() => navigate("/app/billing")} t={t} features={subscribeFeatures} />
        <div className="wl-root">
          <div className="wl-header">
            <div className="wl-header__left">
              <div className="wl-header__eyebrow">{t("wishlistsPage.eyebrow")}</div>
              <h1 className="wl-header__title">{t("wishlistsPage.titlePrefix")} <em>{t("wishlistsPage.titleEm")}</em></h1>
            </div>
            <div className="wl-header__right">
              <label className="wl-range-filter">
                <span className="wl-range-filter__icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </span>
                <select
                  className="wl-range-select"
                  value={range}
                  onChange={(e) => navigate(`?range=${e.target.value}`)}
                  aria-label={t("wishlistsPage.filterAriaLabel")}
                >
                  <option value="7">{t("wishlistsPage.range.last7")}</option>
                  <option value="15">{t("wishlistsPage.range.last15")}</option>
                  <option value="30">{t("wishlistsPage.range.last30")}</option>
                  <option value="180">{t("wishlistsPage.range.last180")}</option>
                  <option value="all">{t("wishlistsPage.range.all")}</option>
                </select>
              </label>
              <div className="wl-header__count">
                <span className="wl-header__count-num">0</span>
                {t("wishlistsPage.totals", { n: 0 })}
              </div>
            </div>
          </div>
          <div className="wl-card" {...dragScrollProps}>
            <div className="wl-empty">
              <div className="wl-empty__icon"><IconHeart /></div>
              <p className="wl-empty__title">{range === "all" ? t("wishlistsPage.empty.titleAll") : t("wishlistsPage.empty.titleRange")}</p>
              <p className="wl-empty__sub">
                {range === "all" ? t("wishlistsPage.empty.subAll") : t("wishlistsPage.empty.subRange")}
              </p>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title={t("wishlistsPage.titleEm")} />
      <BillingModal open={modalOpen} onNavigate={() => navigate("/app/billing")} t={t} features={subscribeFeatures} />
      <div className="wl-root">
        <div className="wl-header">
          <div className="wl-header__left">
            <div className="wl-header__eyebrow">{t("wishlistsPage.eyebrow")}</div>
            <h1 className="wl-header__title">{t("wishlistsPage.titlePrefix")} <em>{t("wishlistsPage.titleEm")}</em></h1>
          </div>
          <div className="wl-header__right">
            <label className="wl-range-filter">
              <span className="wl-range-filter__icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              </span>
              <select
                className="wl-range-select"
                value={range}
                onChange={(e) => navigate(`?range=${e.target.value}`)}
                aria-label={t("wishlistsPage.filterAriaLabel")}
              >
                <option value="7">{t("wishlistsPage.range.last7")}</option>
                <option value="15">{t("wishlistsPage.range.last15")}</option>
                <option value="30">{t("wishlistsPage.range.last30")}</option>
                <option value="180">{t("wishlistsPage.range.last180")}</option>
                <option value="all">{t("wishlistsPage.range.all")}</option>
              </select>
            </label>
            <div className="wl-header__count">
              <span className="wl-header__count-num">{total}</span>
              {t(total !== 1 ? "wishlistsPage.totals" : "wishlistsPage.total", { n: total })}
            </div>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <BulkDeleteBar selectedIds={[...selectedIds]} onCleared={() => setSelectedIds(new Set())} t={t} />
        )}

        <div className="wl-card" {...dragScrollProps}>
          <table className="wl-table">
            <thead className="wl-table__head">
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} aria-label={t("wishlistsPage.table.selectAll")} />
                </th>
                <th style={{ width: 48 }}>{t("wishlistsPage.table.number")}</th>
                <th>{t("wishlistsPage.table.customer")}</th>
                <th>{t("wishlistsPage.table.items")}</th>
                <th>{t("wishlistsPage.table.lastActive")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {wishlists.map((wl: any, index: number) => {
                const isGuest = wl.customerId.startsWith("guest_");
                const initials = getInitials(wl.customerId, isGuest);
                const customer = !isGuest ? (customerMap as any)[wl.customerId] : null;
                const displayName = isGuest
                  ? t("wishlistsPage.table.guest")
                  : customer?.name || customer?.email || (wl.customerId.length > 22 ? wl.customerId.slice(0, 22) + "…" : wl.customerId);
                const lastActive = new Date(wl.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const itemCount: number = wl._count.items;
                const serialNo = (page - 1) * 20 + index + 1;

                return (
                  <tr key={wl.id} className="wl-table__row">
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(wl.id)}
                        onChange={() => toggleOne(wl.id)}
                        aria-label={t("wishlistsPage.table.select", { name: displayName })}
                      />
                    </td>
                    <td style={{ color: "#1a1612", fontWeight: 600, fontSize: 13 }}>{serialNo}</td>
                    <td>
                      <div className="wl-customer">
                        <div className={`wl-avatar${isGuest ? " wl-avatar--guest" : ""}`}>{initials}</div>
                        <div>
                          <div className="wl-customer__name">{displayName}</div>
                          {customer?.email && customer.email !== displayName && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{customer.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setHistoryFor({ id: wl.id, label: displayName })}
                        className={`wl-badge ${itemCount > 0 ? "wl-badge--items" : "wl-badge--zero"}`}
                        style={{ border: "none", cursor: "pointer", font: "inherit" }}
                        title={t("wishlistsPage.table.viewHistory")}
                      >
                        {itemCount} {t(itemCount === 1 ? "wishlistsPage.table.item" : "wishlistsPage.table.items2")}
                      </button>
                    </td>
                    <td><span className="wl-date">{lastActive}</span></td>
                    <td><DeleteButton wishlistId={wl.id} label={displayName} t={t} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="wl-pagination">
            <button className="wl-pagination__btn" disabled={page <= 1} onClick={() => navigate(`?page=${page - 1}&range=${range}`)}>
              <IconChevronLeft />{t("wishlistsPage.pagination.previous")}
            </button>
            <span className="wl-pagination__info">{t("wishlistsPage.pagination.pageOf", { page, total: totalPages })}</span>
            <button className="wl-pagination__btn" disabled={page >= totalPages} onClick={() => navigate(`?page=${page + 1}&range=${range}`)}>
              {t("wishlistsPage.pagination.next")}<IconChevronRight />
            </button>
          </div>
        )}
      </div>
      {historyFor && (
        <HistoryModal wishlistId={historyFor.id} customerLabel={historyFor.label} onClose={() => setHistoryFor(null)} t={t} />
      )}
    </Page>
  );
}

