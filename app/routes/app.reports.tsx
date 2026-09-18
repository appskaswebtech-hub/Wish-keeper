import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Page } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { getActiveSubscription } from "../services/billing.server";
import { authenticate } from "../shopify.server";
import { findOrCreateStore, getProductReport, getAlertCounts } from "../services/wishlist.server";
import wishlistStyles from "../styles/wishlist.css?url";

export const links = () => [{ rel: "stylesheet", href: wishlistStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const store = await findOrCreateStore(session.shop, session.accessToken!);
  const subscription = await getActiveSubscription(admin);
  const hasActivePlan = !!subscription;

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const ALLOWED_LIMITS = [10, 20, 50, 100];
  const limitParam = parseInt(url.searchParams.get("limit") || "20", 10);
  const limit = ALLOWED_LIMITS.includes(limitParam) ? limitParam : 20;

  const report = await getProductReport(store.id, page, limit);
  const alertCounts = await getAlertCounts(store.id);

  let productInfoMap: Record<string, { title: string; image: string | null; inventory: number | null; sku: string }> = {};
  if (report.rows.length > 0) {
    const gids = report.rows.map((r) =>
      r.productId.startsWith("gid://") ? r.productId : `gid://shopify/Product/${r.productId}`
    );
    try {
      const res = await admin.graphql(
        `query GetProductReportInfo($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
              featuredImage { url }
              totalInventory
              variants(first: 2) { edges { node { sku } } }
            }
          }
        }`,
        { variables: { ids: gids } }
      );
      const json = await res.json();
      for (const node of json.data?.nodes ?? []) {
        if (node?.id) {
          const numId = node.id.replace("gid://shopify/Product/", "");
          const variantEdges = node.variants?.edges ?? [];
          const sku = variantEdges.length > 1 ? `Multiple (${variantEdges.length}+)` : variantEdges[0]?.node?.sku || "—";
          productInfoMap[numId] = {
            title: node.title,
            image: node.featuredImage?.url || null,
            inventory: typeof node.totalInventory === "number" ? node.totalInventory : null,
            sku,
          };
        }
      }
    } catch (_) {}
  }

  return data({ shop: session.shop, hasActivePlan, ...report, limit, productInfoMap, alertCounts });
};

function BillingModal({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f9f1e1", border: "1.5px solid rgba(184,146,42,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="1.6" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#1a1612", margin: "0 0 8px" }}>Subscribe to continue</p>
        <p style={{ fontSize: 13, color: "#6b6257", margin: "0 0 20px", lineHeight: 1.6 }}>You need an active plan to use this app. Plans start from <strong style={{ color: "#b8922a" }}>$9.99 / month</strong>.</p>
        <button onClick={onNavigate} style={{ width: "100%", padding: "12px 24px", background: "#b8922a", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          View Plans
        </button>
      </div>
    </div>
  );
}

const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
);
const IconBox = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="1.5"><path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
);

export default function ProductReport() {
  const { rows, total, page, totalPages, limit, hasActivePlan, productInfoMap, alertCounts } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(!hasActivePlan);

  const infoMap = productInfoMap as Record<string, { title: string; image: string | null; inventory: number | null; sku: string }>;

  if (rows.length === 0 && page === 1) {
    return (
      <Page>
        <TitleBar title="Reports" />
        <BillingModal open={modalOpen} onNavigate={() => navigate("/app/billing")} />
        <div className="wl-root">
          <div className="wl-header">
            <div className="wl-header__left">
              <div className="wl-header__eyebrow">Reports</div>
              <h1 className="wl-header__title">Product <em>Report</em></h1>
            </div>
          </div>
          <div className="wl-card">
            <div className="wl-empty">
              <div className="wl-empty__icon"><IconBox /></div>
              <p className="wl-empty__title">No product activity yet</p>
              <p className="wl-empty__sub">Once customers start saving products, they'll be ranked here with stock and engagement data.</p>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title="Reports" />
      <BillingModal open={modalOpen} onNavigate={() => navigate("/app/billing")} />
      <div className="wl-root">
        <div className="wl-header">
          <div className="wl-header__left">
            <div className="wl-header__eyebrow">Reports</div>
            <h1 className="wl-header__title">Product <em>Report</em></h1>
          </div>
          <div className="wl-header__right">
            <label className="wl-range-filter">
              <span className="wl-range-filter__icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
              </span>
              <select
                className="wl-range-select"
                value={limit}
                onChange={(e) => navigate(`?limit=${e.target.value}&page=1`)}
                aria-label="Products per page"
              >
                <option value="10">Show 10</option>
                <option value="20">Show 20</option>
                <option value="50">Show 50</option>
                <option value="100">Show 100</option>
              </select>
            </label>
            <div className="wl-header__count">
              <span className="wl-header__count-num">{total}</span>
              product{total !== 1 ? "s" : ""} saved
            </div>
          </div>
        </div>

        <div className="wl-card">
          <table className="wl-table">
            <thead className="wl-table__head">
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Inventory</th>
                <th>Wishlist Actions</th>
                <th>Alerts Sent</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: { productId: string; actionCount: number }, index: number) => {
                const info = infoMap[row.productId];
                const name = info?.title || row.productId;
                const serialNo = (page - 1) * limit + index + 1;
                return (
                  <tr key={row.productId} className="wl-table__row">
                    <td style={{ color: "#1a1612", fontWeight: 600, fontSize: 13 }}>{serialNo}</td>
                    <td>
                      <div className="wl-customer">
                        <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: 6, background: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                          {info?.image ? (
                            <img src={info.image} alt={name} width={32} height={32} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                          )}
                        </div>
                        <div className="wl-customer__name">{name}</div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 12.5, color: "#6b6257" }}>{info?.sku || "—"}</span></td>
                    <td>
                      {info?.inventory === null || info?.inventory === undefined ? (
                        <span style={{ fontSize: 12.5, color: "#a39a8e" }}>—</span>
                      ) : (
                        <span className={`wl-badge ${info.inventory > 0 ? "wl-badge--items" : "wl-badge--zero"}`}>{info.inventory}</span>
                      )}
                    </td>
                    <td><span className="wl-badge wl-badge--items">{row.actionCount}</span></td>
                    <td><span style={{ fontSize: 12.5, color: "#6b6257" }}>{(alertCounts as Record<string, number>)[row.productId] || 0}</span></td>
                    <td><span style={{ fontSize: 12.5, color: "#a39a8e" }}>—</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="wl-pagination">
            <button className="wl-pagination__btn" disabled={page <= 1} onClick={() => navigate(`?page=${page - 1}&limit=${limit}`)}>
              <IconChevronLeft />Previous
            </button>
            <span className="wl-pagination__info">Page <span>{page}</span> of <span>{totalPages}</span></span>
            <button className="wl-pagination__btn" disabled={page >= totalPages} onClick={() => navigate(`?page=${page + 1}&limit=${limit}`)}>
              Next<IconChevronRight />
            </button>
          </div>
        )}
      </div>
    </Page>
  );
}
