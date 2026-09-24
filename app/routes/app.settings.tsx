import { useState, useRef, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import {
  useLoaderData,
  useNavigate,
  useFetcher,
} from "react-router";
import { Page } from "@shopify/polaris";
import { getActiveSubscription } from "../services/billing.server";
import { TitleBar, SaveBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  findOrCreateStore,
  getStoreSettings,
  updateStoreSettings,
} from "../services/wishlist.server";
import { resolveLanguage, getSessionLocale } from "../i18n/language.server";
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from "../i18n/languages";
import { getTranslator, getTranslatedList } from "../i18n/translations";
import settingsStyles from "../styles/settings.css?url";

export const links = () => [{ rel: "stylesheet", href: settingsStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const store = await findOrCreateStore(session.shop, session.accessToken!);
  const settings = await getStoreSettings(store.id);
  const subscription = await getActiveSubscription(admin);
  const hasActivePlan = !!subscription;
  const language = resolveLanguage(settings?.language, getSessionLocale(session));
  return data({ shop: session.shop, settings, storeId: store.id, hasActivePlan, language });
};

const ICON_STYLE_MAP: Record<string, { notAdded: string; added: string }> = {
  heart: { notAdded: "heart-outline", added: "heart-filled" },
  bookmark: { notAdded: "bookmark-outline", added: "bookmark-filled" },
  star: { notAdded: "star-outline", added: "star-filled" },
  gift: { notAdded: "gift", added: "gift" },
  bell: { notAdded: "bell", added: "bell" },
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const store = await findOrCreateStore(session.shop, session.accessToken!);
  const formData = await request.formData();
  const language = formData.get("language") as string;
  const iconStyle = (formData.get("iconStyle") as string) || "heart";
  const iconVariant = ICON_STYLE_MAP[iconStyle] || ICON_STYLE_MAP.heart;
  await updateStoreSettings(store.id, {
    language: language === "auto" ? null : language,
    showTitle: formData.get("showTitle") === "true",
    showPrice: formData.get("showPrice") === "true",
    showAddToCart: formData.get("showAddToCart") === "true",
    showVendor: formData.get("showVendor") === "true",
    showShareButton: formData.get("showShareButton") === "true",
    showItemCount: formData.get("showItemCount") === "true",
    headerIconEnabled: formData.get("headerIconEnabled") === "true",
    wishlistDisplayMode: (formData.get("wishlistDisplayMode") as string) || "page",
    gridColumns: parseInt(formData.get("gridColumns") as string) || 5,
    maxItemsPerList: parseInt(formData.get("maxItemsPerList") as string) || 50,
    iconStyle,
    activeColor: (formData.get("activeColor") as string) || "#e74c6f",
    customCss: (formData.get("customCss") as string) || "",
    customIconSvg: (formData.get("customIconSvg") as string) || "",
    customIconColor: (formData.get("customIconColor") as string) || "#e74c6f",
    notAddedIcon: iconVariant.notAdded,
    addedIcon: iconVariant.added,
    alertsEnabled: formData.get("alertsEnabled") === "true",
    lowStockThreshold: parseInt(formData.get("lowStockThreshold") as string) || 5,
    smtpHost: (formData.get("smtpHost") as string) || null,
    smtpPort: formData.get("smtpPort") ? parseInt(formData.get("smtpPort") as string) : null,
    smtpUser: (formData.get("smtpUser") as string) || null,
    smtpPassword: (formData.get("smtpPassword") as string) || null,
    smtpFromName: (formData.get("smtpFromName") as string) || null,
    smtpFromEmail: (formData.get("smtpFromEmail") as string) || null,
    customWishlistButtonHtml: (formData.get("customWishlistButtonHtml") as string) || null,
  });
  return data({ success: true });
};

const IconDisplay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconWand = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2">
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 6.2L11 5M12.2 11.8L11 13" strokeLinecap="round" />
    <path d="M3 21l9-9" strokeLinecap="round" />
    <path d="M12.2 6.2l5.6 5.6-9 9-5.6-5.6 9-9z" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconHeart = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z" />
  </svg>
);

const IconBookmark = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconStar = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="st-toggle" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="st-toggle__track" />
      <span className="st-toggle__thumb" />
    </label>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="st-toggle-row" onClick={() => onChange(!checked)}>
      <div>
        <div className="st-toggle-row__label">{label}</div>
        {hint && <div className="st-toggle-row__hint">{hint}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
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

export default function Settings() {
  const { settings, hasActivePlan, language } = useLoaderData<typeof loader>();
  const t = getTranslator(language);
  const subscribeFeatures = getTranslatedList(language, "common.subscribeModal.features");
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const isSaving = fetcher.state === "submitting";
  const [modalOpen, setModalOpen] = useState(!hasActivePlan);
  const [cssModalOpen, setCssModalOpen] = useState(false);
  const [emailProvider, setEmailProvider] = useState<"default" | "gmail" | "custom">(
    settings?.smtpHost === "smtp.gmail.com" ? "gmail" : settings?.smtpHost ? "custom" : "default"
  );
  const [gmailHelpOpen, setGmailHelpOpen] = useState(false);
  const [customHelpOpen, setCustomHelpOpen] = useState(false);
  const [iconSlotCopied, setIconSlotCopied] = useState(false);
  const customButtonTextareaRef = useRef<HTMLTextAreaElement>(null);
  const ICON_SLOT_SNIPPET = '<div id="wl-manual-icon-slot"></div>';

  function copyIconSlotSnippet() {
    navigator.clipboard.writeText(ICON_SLOT_SNIPPET).then(() => {
      setIconSlotCopied(true);
      setTimeout(() => setIconSlotCopied(false), 2000);
    });
  }

  const [buttonSlotCopied, setButtonSlotCopied] = useState(false);
  const BUTTON_SLOT_SNIPPET = `<div
  class="wl-btn-wrapper"
  data-product-id="{{ product.id }}"
  data-variant-id="{{ product.selected_or_first_available_variant.id }}"
  data-customer-id="{{ customer.id | default: '' }}"
  data-shop="{{ shop.permanent_domain }}"
  data-proxy-url="{{ shop.url }}/apps/wishlist"
>
  <button class="wl-btn wl-btn--full" type="button" aria-label="Add to wishlist">
    <svg class="wl-btn-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
    <span class="wl-btn-text">Add to Wishlist</span>
  </button>
</div>`;

  function copyButtonSlotSnippet() {
    navigator.clipboard.writeText(BUTTON_SLOT_SNIPPET).then(() => {
      setButtonSlotCopied(true);
      setTimeout(() => setButtonSlotCopied(false), 2000);
    });
  }

  useEffect(() => {
    if (window.location.hash === "#custom-wishlist-button-section") {
      const el = document.getElementById("custom-wishlist-button-section");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      customButtonTextareaRef.current?.focus();
    }
  }, []);

  const [form, setForm] = useState({
    showTitle: settings?.showTitle ?? true,
    showPrice: settings?.showPrice ?? true,
    showAddToCart: settings?.showAddToCart ?? true,
    showVendor: settings?.showVendor ?? false,
    showShareButton: settings?.showShareButton ?? true,
    showItemCount: settings?.showItemCount ?? true,
    headerIconEnabled: settings?.headerIconEnabled ?? true,
    wishlistDisplayMode: settings?.wishlistDisplayMode ?? "page",
    gridColumns: String(settings?.gridColumns ?? 5),
    maxItemsPerList: String(settings?.maxItemsPerList ?? 50),
    iconStyle: settings?.iconStyle ?? "heart",
    activeColor: settings?.activeColor ?? "#e74c6f",
    customCss: settings?.customCss ?? "",
    customIconSvg: settings?.customIconSvg ?? "",
    customIconColor: settings?.customIconColor ?? "#e74c6f",
    language: settings?.language ?? "auto",
    alertsEnabled: settings?.alertsEnabled ?? false,
    lowStockThreshold: String(settings?.lowStockThreshold ?? 5),
    smtpHost: settings?.smtpHost ?? "",
    smtpPort: settings?.smtpPort ? String(settings.smtpPort) : "",
    smtpUser: settings?.smtpUser ?? "",
    smtpPassword: settings?.smtpPassword ?? "",
    smtpFromName: settings?.smtpFromName ?? "",
    smtpFromEmail: settings?.smtpFromEmail ?? "",
    customWishlistButtonHtml: settings?.customWishlistButtonHtml ?? "",
  });

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const savedFormRef = useRef(form);
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedFormRef.current);

  const [showSavedToast, setShowSavedToast] = useState(false);
  const savedToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success === true) {
      savedFormRef.current = form;
      setShowSavedToast(true);
      if (savedToastTimer.current) clearTimeout(savedToastTimer.current);
      savedToastTimer.current = setTimeout(() => setShowSavedToast(false), 2600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  function handleDiscard() {
    setForm(savedFormRef.current);
  }

  function handleSave() {
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));
    fetcher.submit(formData, { method: "POST" });
  }

  return (
    <Page>
      <TitleBar title={t("settings.titleBar")} />
        <SaveBar id="settings-save-bar" open={isDirty}>
          <button variant="primary" onClick={handleSave} {...(isSaving ? { loading: "" } : {})}>
            {t("settings.saveBar.save")}
          </button>
          <button onClick={handleDiscard}>{t("settings.saveBar.discard")}</button>
        </SaveBar>
        <BillingModal open={modalOpen} onNavigate={() => navigate("/app/billing")} t={t} features={subscribeFeatures} />
        {showSavedToast && (
          <div className="st-saved-toast">
            <span className="st-saved-toast__ring">
              <span className="st-saved-toast__icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </span>
            <span className="st-saved-toast__title">{t("settings.saveBar.saved")}</span>
          </div>
        )}
      <div className="st-root">
        <div className="st-header">
          <div className="st-header__left">
            <div className="st-header__eyebrow">{t("settings.eyebrow")}</div>
            <h1 className="st-header__title">{t("settings.headingPrefix")} <em>{t("settings.headingEmphasis")}</em></h1>
            <p className="st-header__sub">{t("settings.sub")}</p>
          </div>
        </div>

        <div className="st-grid">
          <div className="st-card">
            <div className="st-card__head">
              <div className="st-card__head-row">
                <div className="st-card__icon"><IconDisplay /></div>
                <h2 className="st-card__title">{t("settings.pageDisplay.title")}</h2>
              </div>
              <p className="st-card__desc">{t("settings.pageDisplay.desc")}</p>
            </div>
            <div className="st-card__body">
              <ToggleRow label={t("settings.pageDisplay.showTitle")} checked={form.showTitle} onChange={(v) => set("showTitle", v)} />
              <ToggleRow label={t("settings.pageDisplay.showPrice")} checked={form.showPrice} onChange={(v) => set("showPrice", v)} />
              <ToggleRow label={t("settings.pageDisplay.showAddToCart")} checked={form.showAddToCart} onChange={(v) => set("showAddToCart", v)} />
              <ToggleRow label={t("settings.pageDisplay.showVendor")} checked={form.showVendor} onChange={(v) => set("showVendor", v)} />
              <ToggleRow label={t("settings.pageDisplay.showItemCount")} checked={form.showItemCount} onChange={(v) => set("showItemCount", v)} />
              <div className="st-divider" />
              <div className="st-field">
                <label className="st-field__label">{t("settings.pageDisplay.wishlistOpensAs")}</label>
                <div className="st-field__select-wrap">
                  <select className="st-field__select" value={form.wishlistDisplayMode} onChange={(e) => set("wishlistDisplayMode", e.target.value)}>
                    <option value="page">{t("settings.pageDisplay.fullPage")}</option>
                    <option value="popup">{t("settings.pageDisplay.popupDrawer")}</option>
                  </select>
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{t("settings.pageDisplay.wishlistOpensAsHint")}</div>
              </div>
              {form.wishlistDisplayMode === "page" && (
                <>
                  <div className="st-divider" />
                  <div className="st-field">
                    <label className="st-field__label">{t("settings.pageDisplay.gridColumns")}</label>
                    <div className="st-field__select-wrap">
                      <select className="st-field__select" value={form.gridColumns} onChange={(e) => set("gridColumns", e.target.value)}>
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={String(n)}>{t("settings.pageDisplay.columnsOption", { n })}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="st-card">
            <div className="st-card__head">
              <div className="st-card__head-row">
                <div className="st-card__icon"><IconWand /></div>
                <h2 className="st-card__title">{t("settings.iconAppearance.title")}</h2>
              </div>
              <p className="st-card__desc">{t("settings.iconAppearance.desc")}</p>
            </div>
            <div className="st-card__body">
              <ToggleRow label={t("settings.iconAppearance.showHeaderIcon")} hint={t("settings.iconAppearance.showHeaderIconHint")} checked={form.headerIconEnabled} onChange={(v) => set("headerIconEnabled", v)} />
              {form.headerIconEnabled && (
                <div className="st-field" style={{ marginTop: 4 }}>
                  <label className="st-field__label">{t("settings.iconAppearance.manualPlacementLabel")}</label>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 10px" }}>{t("settings.iconAppearance.manualPlacementDesc")}</p>
                  <div className="st-code-window">
                    <div className="st-code-window__head">
                      <span className="st-code-window__label">HTML</span>
                      <button type="button" className="st-copy-btn" onClick={copyIconSlotSnippet}>
                        {iconSlotCopied ? t("settings.iconAppearance.copied") : t("settings.iconAppearance.copy")}
                      </button>
                    </div>
                    <textarea className="st-code-window__textarea" readOnly rows={1} value={ICON_SLOT_SNIPPET} onFocus={(e) => e.target.select()} />
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{t("settings.iconAppearance.manualPlacementTip")}</div>
                </div>
              )}
              <div className="st-divider" />
              <div className="st-field">
                <label className="st-field__label">{t("settings.iconAppearance.iconStyle")}</label>
                {form.customIconSvg && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gold-bg)", border: "1px solid var(--gold-border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: 12, color: "var(--gold)", marginBottom: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {t("settings.iconAppearance.svgActiveNotice")}
                  </div>
                )}
                <div className="st-icon-picker" style={form.customIconSvg ? { opacity: 0.4, pointerEvents: "none" } : undefined}>
                  {([
                    { value: "heart", Icon: IconHeart, label: t("settings.iconAppearance.icons.heart") },
                    { value: "bookmark", Icon: IconBookmark, label: t("settings.iconAppearance.icons.bookmark") },
                    { value: "star", Icon: IconStar, label: t("settings.iconAppearance.icons.star") },
                    { value: "gift", label: t("settings.iconAppearance.icons.gift"), Icon: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
                    { value: "bell", label: t("settings.iconAppearance.icons.bell"), Icon: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
                  ] as const).map(({ value, Icon, label }) => (
                    <button key={value} type="button" disabled={!!form.customIconSvg} className={`st-icon-option${form.iconStyle === value ? " active" : ""}`} onClick={() => set("iconStyle", value)}>
                      <Icon size={22} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="st-divider" />

              <div className="st-field">
                <label className="st-field__label">{t("settings.iconAppearance.customSvgLabel")}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", background: "var(--cream)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    {t("settings.iconAppearance.uploadSvg")}
                    <input type="file" accept=".svg,image/svg+xml" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (!file || !file.name.endsWith(".svg")) return; const reader = new FileReader(); reader.onload = (ev) => set("customIconSvg", ev.target?.result as string); reader.readAsText(file); }} />
                  </label>
                  {form.customIconSvg && <button type="button" onClick={() => set("customIconSvg", "")} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>{t("settings.iconAppearance.remove")}</button>}
                  {form.customIconSvg && <span style={{ fontSize: 12, color: "#10b981" }}>{t("settings.iconAppearance.svgLoaded")}</span>}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{t("settings.iconAppearance.svgHint")}</div>
              </div>

              <div className="st-divider" />
              <div className="st-field-row">
                <div className="st-field">
                  <label className="st-field__label">{t("settings.iconAppearance.iconColour")}</label>
                  <div className="st-big-color-wrap">
                    <div className="st-big-color-swatch" style={{ background: form.customIconColor }}>
                      <input type="color" value={form.customIconColor} onChange={(e) => set("customIconColor", e.target.value)} />
                    </div>
                    <span className="st-big-color-val">{form.customIconColor}</span>
                  </div>
                </div>
                <div className="st-field">
                  <label className="st-field__label">{t("settings.iconAppearance.preview")}</label>
                  <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb", borderRadius: 8, color: form.customIconColor }}>
                    {form.customIconSvg
                      ? <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }} dangerouslySetInnerHTML={{ __html: form.customIconSvg }} />
                      : <svg width="22" height="22" viewBox="0 0 24 24" fill={form.customIconColor} stroke={form.customIconColor} strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="st-card" style={{ gridColumn: "1 / -1" }}>
            <div className="st-card__head">
              <div className="st-card__head-row">
                <div className="st-card__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                </div>
                <h2 className="st-card__title">{t("settings.customCss.title")}</h2>
              </div>
              <p className="st-card__desc">{t("settings.customCss.desc")}</p>
            </div>
            <div className="st-card__body">
              <div className="st-code-window">
                <div className="st-code-window__head">
                  <span className="st-code-window__label">{t("settings.customCss.label")}</span>
                  <button
                    type="button"
                    className="st-code-window__maximize"
                    onClick={() => setCssModalOpen(true)}
                    title="Expand editor"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
                  </button>
                </div>
                <textarea
                  className="st-code-window__textarea"
                  rows={10}
                  placeholder={`.wl-page { font-family: inherit; }\n.wl-card { border-radius: 12px; }\n.wl-heart-btn { box-shadow: none; }\n.wl-card-atc { border-radius: 0; }`}
                  value={form.customCss}
                  onChange={(e) => set("customCss", e.target.value)}
                />
              </div>
            </div>
          </div>

          {cssModalOpen && (
            <div className="st-code-modal" onClick={() => setCssModalOpen(false)}>
              <div className="st-code-modal__panel" onClick={(e) => e.stopPropagation()}>
                <div className="st-code-window__head">
                  <span className="st-code-window__label">{t("settings.customCss.label")}</span>
                  <button type="button" className="st-code-window__maximize" onClick={() => setCssModalOpen(false)} title="Close">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
                  </button>
                </div>
                <textarea
                  className="st-code-window__textarea st-code-window__textarea--modal"
                  autoFocus
                  placeholder={`.wl-page { font-family: inherit; }\n.wl-card { border-radius: 12px; }\n.wl-heart-btn { box-shadow: none; }\n.wl-card-atc { border-radius: 0; }`}
                  value={form.customCss}
                  onChange={(e) => set("customCss", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="st-card" id="custom-wishlist-button-section" style={{ gridColumn: "1 / -1" }}>
            <div className="st-card__head">
              <div className="st-card__head-row">
                <div className="st-card__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                </div>
                <h2 className="st-card__title">{t("settings.customButton.title")}</h2>
              </div>
              <p className="st-card__desc">{t("settings.customButton.desc")}</p>
            </div>
            <div className="st-card__body">
              <div className="st-code-window">
                <div className="st-code-window__head">
                  <span className="st-code-window__label">{t("settings.customButton.htmlLabel")}</span>
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "10px 14px 0", lineHeight: 1.5 }}>
                  {t("settings.customButton.tip")}
                </p>
                <textarea
                  ref={customButtonTextareaRef}
                  className="st-code-window__textarea"
                  rows={4}
                  placeholder={`<button class="my-wishlist-btn">Add to Wishlist</button>`}
                  value={form.customWishlistButtonHtml}
                  onChange={(e) => set("customWishlistButtonHtml", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="st-card" style={{ gridColumn: "1 / -1" }}>
            <div className="st-card__head">
              <div className="st-card__head-row">
                <div className="st-card__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                </div>
                <h2 className="st-card__title">{t("settings.manualButton.title")}</h2>
              </div>
              <p className="st-card__desc">{t("settings.manualButton.desc")}</p>
            </div>
            <div className="st-card__body">
              <div className="st-code-window">
                <div className="st-code-window__head">
                  <span className="st-code-window__label">Liquid</span>
                  <button type="button" className="st-copy-btn" onClick={copyButtonSlotSnippet}>
                    {buttonSlotCopied ? t("settings.iconAppearance.copied") : t("settings.iconAppearance.copy")}
                  </button>
                </div>
                <textarea className="st-code-window__textarea" readOnly rows={10} value={BUTTON_SLOT_SNIPPET} onFocus={(e) => e.target.select()} />
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{t("settings.manualButton.tip")}</div>
            </div>
          </div>

          <div className="st-card" style={{ gridColumn: "1 / -1" }}>
            <div className="st-card__head">
              <div className="st-card__head-row">
                <div className="st-card__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><path d="M4 4h16v16H4z" /><path d="M22 6l-10 7L2 6" /></svg>
                </div>
                <h2 className="st-card__title">{t("settings.emailAlerts.title")}</h2>
              </div>
              <p className="st-card__desc">{t("settings.emailAlerts.desc")}</p>
            </div>
            <div className="st-card__body">
              <ToggleRow label={t("settings.emailAlerts.enable")} hint={t("settings.emailAlerts.enableHint")} checked={form.alertsEnabled} onChange={(v) => set("alertsEnabled", v)} />
              <div className="st-divider" />
              <div className="st-field">
                <label className="st-field__label">{t("settings.emailAlerts.lowStockThreshold")}</label>
                <input
                  type="number"
                  min={1}
                  className="st-field__input"
                  style={{ maxWidth: 120 }}
                  value={form.lowStockThreshold}
                  onChange={(e) => set("lowStockThreshold", e.target.value)}
                />
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{t("settings.emailAlerts.lowStockHint")}</div>
              </div>
              <div className="st-divider" />
              <div className="st-field">
                <label className="st-field__label">{t("settings.emailAlerts.senderEmailLabel")}</label>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>{t("settings.emailAlerts.senderEmailDesc")}</div>
                <div className="st-field__select-wrap" style={{ maxWidth: 320 }}>
                  <select
                    className="st-field__select"
                    value={emailProvider}
                    onChange={(e) => {
                      const v = e.target.value as "default" | "gmail" | "custom";
                      setEmailProvider(v);
                      if (v === "default") {
                        set("smtpHost", ""); set("smtpPort", ""); set("smtpUser", ""); set("smtpPassword", ""); set("smtpFromName", ""); set("smtpFromEmail", "");
                      } else if (v === "gmail") {
                        set("smtpHost", "smtp.gmail.com"); set("smtpPort", "587");
                      }
                    }}
                  >
                    <option value="default">{t("settings.emailAlerts.senderOptionDefault")}</option>
                    <option value="gmail">{t("settings.emailAlerts.senderOptionGmail")}</option>
                    <option value="custom">{t("settings.emailAlerts.senderOptionCustom")}</option>
                  </select>
                </div>
              </div>

              {emailProvider === "gmail" && (
                <div className="st-field" style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <label className="st-field__label" style={{ marginBottom: 0 }}>Gmail Details</label>
                    <button type="button" onClick={() => setGmailHelpOpen(true)} style={{ fontSize: 11.5, color: "#b8922a", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      How do I get an App Password?
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input className="st-field__input" placeholder="Gmail address (e.g. store@gmail.com)" value={form.smtpUser} onChange={(e) => set("smtpUser", e.target.value)} />
                    <input type="password" className="st-field__input" placeholder="16-character App Password" value={form.smtpPassword} onChange={(e) => set("smtpPassword", e.target.value)} />
                    <input className="st-field__input" placeholder="From name (e.g. Your Store)" value={form.smtpFromName} onChange={(e) => set("smtpFromName", e.target.value)} />
                    <input className="st-field__input" placeholder="From email (usually same as Gmail address)" value={form.smtpFromEmail} onChange={(e) => set("smtpFromEmail", e.target.value)} />
                  </div>
                </div>
              )}

              {emailProvider === "custom" && (
                <div className="st-field" style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <label className="st-field__label" style={{ marginBottom: 0 }}>Custom Domain SMTP</label>
                    <button type="button" onClick={() => setCustomHelpOpen(true)} style={{ fontSize: 11.5, color: "#b8922a", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      Where do I find these?
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input className="st-field__input" placeholder="SMTP host (e.g. mail.yourstore.com)" value={form.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} />
                    <input className="st-field__input" placeholder="SMTP port (e.g. 587 or 465)" value={form.smtpPort} onChange={(e) => set("smtpPort", e.target.value)} />
                    <input className="st-field__input" placeholder="SMTP username" value={form.smtpUser} onChange={(e) => set("smtpUser", e.target.value)} />
                    <input type="password" className="st-field__input" placeholder="SMTP password" value={form.smtpPassword} onChange={(e) => set("smtpPassword", e.target.value)} />
                    <input className="st-field__input" placeholder="From name (e.g. Your Store)" value={form.smtpFromName} onChange={(e) => set("smtpFromName", e.target.value)} />
                    <input className="st-field__input" placeholder="From email" value={form.smtpFromEmail} onChange={(e) => set("smtpFromEmail", e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {gmailHelpOpen && (
            <div className="st-code-modal" onClick={() => setGmailHelpOpen(false)}>
              <div className="st-code-modal__panel" style={{ maxWidth: 460, height: "auto", maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
                <div className="st-code-window__head">
                  <span className="st-code-window__label">Getting a Gmail App Password</span>
                  <button type="button" className="st-code-window__maximize" onClick={() => setGmailHelpOpen(false)} title="Close">✕</button>
                </div>
                <div style={{ padding: 20, fontSize: 13, color: "#4a4238", lineHeight: 1.7, overflowY: "auto" }}>
                  <ol style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Turn on <strong>2-Step Verification</strong> on the Google account you want to send from (Google Account → Security).</li>
                    <li>Go to <strong>Google Account → Security → App Passwords</strong>.</li>
                    <li>Choose "Mail" as the app, generate it, and copy the 16-character code shown.</li>
                    <li>Paste that code into the <strong>App Password</strong> field here, not your normal Gmail password.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {customHelpOpen && (
            <div className="st-code-modal" onClick={() => setCustomHelpOpen(false)}>
              <div className="st-code-modal__panel" style={{ maxWidth: 460, height: "auto", maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
                <div className="st-code-window__head">
                  <span className="st-code-window__label">Finding Your SMTP Details</span>
                  <button type="button" className="st-code-window__maximize" onClick={() => setCustomHelpOpen(false)} title="Close">✕</button>
                </div>
                <div style={{ padding: 20, fontSize: 13, color: "#4a4238", lineHeight: 1.7, overflowY: "auto" }}>
                  <p style={{ margin: "0 0 12px" }}>If your domain email is hosted through cPanel (common with GoDaddy, Hostinger, Bluehost, etc.):</p>
                  <ol style={{ margin: "0 0 12px", paddingLeft: 18 }}>
                    <li>Log into <strong>cPanel</strong> and open <strong>Email Accounts</strong>.</li>
                    <li>Find the mailbox you want to send from, click <strong>Connect Devices</strong> (or "Configure Mail Client").</li>
                    <li>It'll show you the exact <strong>Outgoing Server (SMTP)</strong> host and port, plus your username.</li>
                    <li>The password is the same one you use to log into that mailbox (or set one in Email Accounts).</li>
                  </ol>
                  <p style={{ margin: 0 }}>If your domain email is elsewhere (e.g. Zoho Mail, Microsoft 365), check that provider's "SMTP settings" help page, the fields are the same shape everywhere.</p>
                </div>
              </div>
            </div>
          )}

          <div className="st-card" style={{ gridColumn: "1 / -1" }}>
            <div className="st-card__head">
              <div className="st-card__head-row">
                <div className="st-card__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <h2 className="st-card__title">{t("settings.language.title")}</h2>
              </div>
              <p className="st-card__desc">{t("settings.language.desc")}</p>
            </div>
            <div className="st-card__body">
              <div className="st-field">
                <label className="st-field__label">{t("settings.language.title")}</label>
                <div className="st-field__select-wrap">
                  <select className="st-field__select" value={form.language} onChange={(e) => set("language", e.target.value)}>
                    <option value="auto">{t("settings.language.auto")}</option>
                    {SUPPORTED_LANGUAGES.map((code) => (
                      <option key={code} value={code}>{LANGUAGE_LABELS[code]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="st-save-bar">
          <button className="st-save-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? t("settings.saveBar.savingHint") : <><IconCheck />{t("settings.saveBar.save")}</>}
          </button>
        </div>
      </div>
    </Page>
  );
}
