import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const websiteId = searchParams.get("websiteId");
  if (!websiteId) {
    return NextResponse.json({ error: "websiteId is required." }, { status: 400 });
  }
  const agents = await prisma.agent.findMany({
    where: { websiteId },
    select: { id: true, email: true, name: true, avatar: true, role: true, isOnline: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ ok: true, agents });
}

export async function POST(req: Request) {
  try {
    const { websiteId, name, email, password, role } = await req.json();
    if (!websiteId || !name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    const existing = await prisma.agent.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An agent with this email already exists." }, { status: 409 });
    }
    const agent = await prisma.agent.create({
      data: {
        websiteId,
        name,
        email,
        password: hashPassword(password),
        role: role || "agent",
      },
      select: { id: true, email: true, name: true, avatar: true, role: true, isOnline: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, agent });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
