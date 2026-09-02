import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyName, domain, primaryColor, name, email, password } =
      body;

    if (!companyName || !domain || !name || !email || !password) {
      return NextResponse.json(
        { error: "Company name, domain, admin name, email and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const existing = await prisma.website.findUnique({ where: { domain } });
    if (existing) {
      return NextResponse.json(
        { error: "A website with this domain is already registered." },
        { status: 409 }
      );
    }

    const website = await prisma.website.create({
      data: {
        name: companyName,
        domain,
        primaryColor: primaryColor || "#00A76F",
      },
    });

    const agent = await prisma.agent.create({
      data: {
        websiteId: website.id,
        email,
        name,
        password: hashPassword(password),
        role: "admin",
      },
    });

    await prisma.subscription.create({
      data: { websiteId: website.id, plan: "free", price: 0 },
    });

    const secret = process.env.SESSION_SECRET || "natasun-chat-insecure-dev-secret";
    const token = createToken({ sub: agent.id, websiteId: website.id }, secret);

    return NextResponse.json({
      ok: true,
      website: { id: website.id, name: website.name, domain: website.domain },
      agent: { id: agent.id, name: agent.name, email: agent.email, role: agent.role },
      token,
    });
  } catch (e: any) {
    console.error("[onboarding] error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
