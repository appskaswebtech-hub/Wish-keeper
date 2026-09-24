import nodemailer from "nodemailer";
import type { StoreSettings } from "@prisma/client";

function getTransport(settings: StoreSettings | null) {
  if (settings?.smtpHost && settings.smtpUser && settings.smtpPassword) {
    const port = settings.smtpPort || 587;
    return {
      transporter: nodemailer.createTransport({
        host: settings.smtpHost,
        port,
        secure: port === 465,
        auth: { user: settings.smtpUser, pass: settings.smtpPassword },
      }),
      from: `${settings.smtpFromName || "WishKeeper"} <${settings.smtpFromEmail || settings.smtpUser}>`,
    };
  }

  if (process.env.DEFAULT_SMTP_HOST && process.env.DEFAULT_SMTP_USER && process.env.DEFAULT_SMTP_PASS) {
    const port = Number(process.env.DEFAULT_SMTP_PORT || 587);
    return {
      transporter: nodemailer.createTransport({
        host: process.env.DEFAULT_SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.DEFAULT_SMTP_USER, pass: process.env.DEFAULT_SMTP_PASS },
      }),
      from: process.env.DEFAULT_SMTP_FROM || "WishKeeper <no-reply@wishkeeper.app>",
    };
  }

  return null;
}

export async function sendAlertEmail(
  settings: StoreSettings | null,
  to: string,
  subject: string,
  html: string
) {
  const transport = getTransport(settings);
  if (!transport) {
    console.warn("[mailer] No SMTP credentials configured, skipping send to", to);
    return { skipped: true };
  }
  await transport.transporter.sendMail({ from: transport.from, to, subject, html });
  return { skipped: false };
}

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export interface EmailProduct {
  title: string;
  url: string;
  image?: string | null;
  price?: string | null;
}

export interface AlertContext {
  shopName: string;
  customerName?: string | null;
  product: EmailProduct;
  more: EmailProduct[];
  oldPrice?: string;
}

const FONT = "'DM Sans', Arial, Helvetica, sans-serif";

function productRow(p: EmailProduct, opts: { cta: string; big: boolean; oldPrice?: string }) {
  const size = opts.big ? 104 : 72;
  const img = p.image
    ? `<img src="${esc(p.image)}" width="${size}" height="${size}" alt="${esc(p.title)}" style="display:block;width:${size}px;height:${size}px;object-fit:cover;border-radius:10px;border:0;">`
    : `<div style="width:${size}px;height:${size}px;background:#f1ede4;border-radius:10px;"></div>`;
  const price = p.price
    ? opts.oldPrice
      ? `<div style="margin-top:6px;font-size:15px;"><span style="text-decoration:line-through;color:#a39a8e;">${esc(opts.oldPrice)}</span> <strong style="color:#b8922a;">${esc(p.price)}</strong></div>`
      : `<div style="margin-top:6px;font-size:15px;font-weight:700;color:#b8922a;">${esc(p.price)}</div>`
    : "";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee4d0;">
    <tr>
      <td width="${size + 16}" valign="middle" style="padding:16px 16px 16px 0;">${img}</td>
      <td valign="middle" style="padding:16px 0;font-family:${FONT};">
        <div style="font-size:${opts.big ? 17 : 15}px;font-weight:700;color:#1a1612;line-height:1.3;">${esc(p.title)}</div>
        ${price}
      </td>
      <td align="right" valign="middle" style="padding:16px 0 16px 12px;">
        <a href="${esc(p.url)}" style="display:inline-block;background:#1a1612;color:#ffffff;text-decoration:none;font-family:${FONT};font-size:12px;font-weight:600;padding:10px 18px;border-radius:100px;white-space:nowrap;">${esc(opts.cta)}</a>
      </td>
    </tr>
  </table>`;
}

function layout(
  ctx: AlertContext,
  o: { preheader: string; heading: string; intro: string; cta: string; showOldPrice?: boolean }
) {
  const name = ctx.customerName && ctx.customerName.trim() ? esc(ctx.customerName.trim()) : "there";
  const more = ctx.more.length
    ? `<div style="margin-top:30px;">
        <div style="font-family:${FONT};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#a39a8e;font-weight:700;padding-bottom:10px;">More from your wishlist</div>
        ${ctx.more.map((m) => productRow(m, { cta: "View", big: false })).join("")}
      </div>`
    : "";

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f3efe6;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe6;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td align="center" style="padding:28px 32px 8px;font-family:${FONT};font-size:14px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#1a1612;">${esc(ctx.shopName)}</td></tr>
        <tr><td style="padding:14px 32px 0;font-family:${FONT};">
          <div style="font-size:14px;color:#4a4238;">Dear ${name},</div>
          <h1 style="margin:14px 0 8px;font-size:24px;line-height:1.25;color:#1a1612;font-weight:700;">${esc(o.heading)}</h1>
          <div style="font-size:14px;line-height:1.65;color:#6b6257;">${o.intro}</div>
        </td></tr>
        <tr><td style="padding:18px 32px 0;">
          ${productRow(ctx.product, { cta: o.cta, big: true, oldPrice: o.showOldPrice ? ctx.oldPrice : undefined })}
          ${more}
        </td></tr>
        <tr><td style="padding:30px 20px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a1612;border-radius:14px;">
            <tr><td style="padding:20px 24px;font-family:${FONT};">
              <div style="font-size:15px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#d4a843;">${esc(ctx.shopName)}</div>
              <div style="margin-top:8px;font-size:11.5px;line-height:1.6;color:#a39a8e;">You are receiving this because you saved an item to your wishlist at ${esc(ctx.shopName)}.</div>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function backInStockTemplate(ctx: AlertContext) {
  const t = ctx.product.title;
  return {
    subject: `It's back: ${t} is in stock again`,
    html: layout(ctx, {
      preheader: `${t} from your wishlist is available again.`,
      heading: "Good news, it's back in stock",
      intro: `<strong>${esc(t)}</strong>, an item you saved, is available again. Popular pieces tend to sell out quickly, so we would not wait too long.`,
      cta: "Buy Now",
    }),
  };
}

export function lowStockTemplate(ctx: AlertContext) {
  const t = ctx.product.title;
  return {
    subject: `Going fast: ${t} is almost gone`,
    html: layout(ctx, {
      preheader: `Only a few left of ${t}.`,
      heading: "Only a few left",
      intro: `Stock is running low on <strong>${esc(t)}</strong>, which is on your wishlist. If you have been thinking about it, now is the time.`,
      cta: "Get It Now",
    }),
  };
}

export function priceDropTemplate(ctx: AlertContext) {
  const t = ctx.product.title;
  return {
    subject: `Price drop: ${t} is now ${ctx.product.price ?? "on sale"}`,
    html: layout(ctx, {
      preheader: `${t} just got cheaper.`,
      heading: "Your wishlist just got cheaper",
      intro: `Good timing. <strong>${esc(t)}</strong> has dropped in price since you saved it.`,
      cta: "Shop the Deal",
      showOldPrice: true,
    }),
  };
}

export function priceIncreaseTemplate(ctx: AlertContext) {
  const t = ctx.product.title;
  return {
    subject: `Heads up: the price of ${t} has changed`,
    html: layout(ctx, {
      preheader: `A price update on ${t}.`,
      heading: "A price update on your wishlist",
      intro: `The price of <strong>${esc(t)}</strong> has changed since you saved it. We wanted you to hear it from us first.`,
      cta: "View Product",
      showOldPrice: true,
    }),
  };
}
