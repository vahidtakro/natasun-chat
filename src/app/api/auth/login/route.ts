import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({ where: { email } });
    if (!agent || !verifyPassword(password, agent.password)) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const secret = process.env.SESSION_SECRET || "natasun-chat-insecure-dev-secret";
    const token = createToken(
      { sub: agent.id, websiteId: agent.websiteId },
      secret
    );

    return NextResponse.json({
      ok: true,
      token,
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        websiteId: agent.websiteId,
      },
    });
  } catch (e: any) {
    console.error("[login] error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
