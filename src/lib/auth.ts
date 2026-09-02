import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "nc_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionAgent = {
  id: string;
  email: string;
  name: string;
  websiteId: string;
  role: string;
};

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function createToken(payload: object, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const expires = Date.now() + SESSION_TTL_MS;
  const data = `${body}.${expires}`;
  const sig = sign(data, secret);
  return `${data}.${sig}`;
}

export function verifyToken(token: string, secret: string): any | null {
  const [body, expires, sig] = token.split(".");
  if (!body || !expires || !sig) return null;
  const data = `${body}.${expires}`;
  if (sign(data, secret) !== sig) return null;
  if (Number(expires) < Date.now()) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(plain, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(candidate, "hex"),
    Buffer.from(hash, "hex")
  );
}

const getSecret = () => process.env.SESSION_SECRET || "natasun-chat-insecure-dev-secret";

export async function getSession(): Promise<SessionAgent | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token, getSecret());
  if (!payload?.sub) return null;
  const agent = await prisma.agent.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, websiteId: true, role: true },
  });
  return agent;
}

export async function setSession(agentId: string) {
  const secret = getSecret();
  const token = createToken({ sub: agentId }, secret);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}
