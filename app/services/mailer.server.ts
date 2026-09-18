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

const wrap = (title: string, body: string, ctaUrl: string, ctaLabel: string) => `
<div style="font-family: 'DM Sans', Arial, sans-serif; background: #faf8f4; padding: 32px 16px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06);">
    <div style="background: #1a1612; padding: 22px 28px;">
      <span style="color: #d4a843; font-weight: 700; font-size: 15px; letter-spacing: 0.02em;">WishKeeper</span>
    </div>
    <div style="padding: 28px;">
      <h1 style="font-size: 19px; color: #1a1612; margin: 0 0 12px;">${title}</h1>
      <div style="font-size: 14px; color: #4a4238; line-height: 1.6;">${body}</div>
      <a href="${ctaUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 22px; background: #b8922a; color: #fff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">${ctaLabel}</a>
    </div>
  </div>
</div>`;

export function backInStockTemplate(productTitle: string, productUrl: string) {
  return {
    subject: `${productTitle} is back in stock!`,
    html: wrap(
      "Good news, it's back!",
      `<strong>${productTitle}</strong>, an item on your wishlist, is back in stock. Grab it before it's gone again.`,
      productUrl,
      "View Product"
    ),
  };
}

export function priceDropTemplate(productTitle: string, productUrl: string, oldPrice: number, newPrice: number, currency: string) {
  return {
    subject: `Price drop: ${productTitle}`,
    html: wrap(
      "The price just dropped",
      `<strong>${productTitle}</strong> on your wishlist is now <strong>${currency}${newPrice.toFixed(2)}</strong>, down from ${currency}${oldPrice.toFixed(2)}.`,
      productUrl,
      "View Product"
    ),
  };
}

export function lowStockTemplate(productTitle: string, productUrl: string) {
  return {
    subject: `${productTitle} is running low on stock`,
    html: wrap(
      "Almost sold out",
      `<strong>${productTitle}</strong> on your wishlist is running low on stock. Order soon before it sells out.`,
      productUrl,
      "View Product"
    ),
  };
}
