import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import prisma from "../db.server";
import { publish, ADMIN_CHANNEL } from "./supportBus.server";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "support");
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

export async function getOrCreateThread(shop: string) {
  return prisma.supportThread.upsert({
    where: { shop },
    update: {},
    create: { shop },
  });
}

export async function getMessages(shop: string, limit = 100) {
  const thread = await getOrCreateThread(shop);
  const messages = await prisma.supportMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return { thread, messages };
}

export async function markRead(shop: string, who: "shop" | "admin") {
  const thread = await getOrCreateThread(shop);
  await prisma.supportThread.update({
    where: { id: thread.id },
    data:
      who === "shop"
        ? { shopUnreadCount: 0, shopLastReadAt: new Date() }
        : { adminUnreadCount: 0, adminLastReadAt: new Date() },
  });

  // Let the admin dashboard show "Seen" under its message live, the moment
  // the merchant opens the widget -- same best-effort webhook used for
  // messages and typing, never blocks the read itself if it fails.
  if (who === "shop") {
    notifyAdminDashboardSeen(shop).catch(() => {});
  }
}

async function saveAttachment(file: File, threadId: string) {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("Attachment is larger than 10MB.");
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    throw new Error("That file type isn't supported. Use an image, PDF, Word doc or text file.");
  }
  const dir = path.join(UPLOAD_DIR, threadId);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const safeName = crypto.randomUUID() + ext;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, safeName), buffer);
  return {
    url: `/uploads/support/${threadId}/${safeName}`,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
  };
}

export async function sendMessage(opts: {
  shop: string;
  sender: "shop" | "admin";
  body?: string | null;
  file?: File | null;
}) {
  const thread = await getOrCreateThread(opts.shop);
  const body = (opts.body || "").trim();
  if (!body && !opts.file) {
    throw new Error("Write a message or attach a file.");
  }
  if (opts.sender === "shop" && thread.closedAt) {
    throw new Error("This conversation is closed.");
  }

  let attachment: Awaited<ReturnType<typeof saveAttachment>> | null = null;
  if (opts.file && opts.file.size > 0) {
    attachment = await saveAttachment(opts.file, thread.id);
  }

  const message = await prisma.supportMessage.create({
    data: {
      threadId: thread.id,
      sender: opts.sender,
      body: body || null,
      attachmentUrl: attachment?.url ?? null,
      attachmentName: attachment?.name ?? null,
      attachmentType: attachment?.type ?? null,
      attachmentSize: attachment?.size ?? null,
    },
  });

  await prisma.supportThread.update({
    where: { id: thread.id },
    data:
      opts.sender === "shop"
        ? { adminUnreadCount: { increment: 1 } }
        : { shopUnreadCount: { increment: 1 }, closedAt: null }, // admin replying re-opens a closed thread
  });

  const payload = { type: "message", message };
  // The shop's own widget (any open tab) gets this instantly over its SSE
  // connection; it never has to poll.
  publish(`shop:${opts.shop}`, payload);
  publish(ADMIN_CHANNEL, { ...payload, shop: opts.shop });

  // The admin dashboard is a separate process (possibly a separate server),
  // so it can't see this in-memory publish. Notify it over HTTP instead,
  // fire-and-forget: this must never block or fail sending the merchant's
  // own message just because the dashboard happens to be offline.
  if (opts.sender === "shop") {
    notifyAdminDashboard(opts.shop, message).catch(() => {});
  }

  return message;
}

export async function closeThread(shop: string) {
  const thread = await getOrCreateThread(shop);
  await prisma.supportThread.update({ where: { id: thread.id }, data: { closedAt: new Date() } });
}

export async function reopenThread(shop: string) {
  const thread = await getOrCreateThread(shop);
  await prisma.supportThread.update({ where: { id: thread.id }, data: { closedAt: null } });
}

async function notifyAdminDashboard(shop: string, message: unknown) {
  const url = process.env.ADMIN_DASHBOARD_URL;
  const secret = process.env.SUPPORT_INTERNAL_SECRET;
  if (!url || !secret) return; // Dashboard not configured yet -- nothing to notify.
  await fetch(`${url.replace(/\/$/, "")}/internal/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
    body: JSON.stringify({ shop, message }),
  });
}

async function notifyAdminDashboardSeen(shop: string) {
  const url = process.env.ADMIN_DASHBOARD_URL;
  const secret = process.env.SUPPORT_INTERNAL_SECRET;
  if (!url || !secret) return;
  await fetch(`${url.replace(/\/$/, "")}/internal/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
    body: JSON.stringify({ shop, type: "seen" }),
  });
}
