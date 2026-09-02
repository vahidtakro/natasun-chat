import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const websiteId = searchParams.get("websiteId");
  if (!websiteId) {
    return NextResponse.json({ error: "websiteId is required." }, { status: 400 });
  }
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    include: { subscription: true },
  });
  if (!website) {
    return NextResponse.json({ error: "Website not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, website });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { websiteId, name, domain, primaryColor, logo } = body;
    if (!websiteId) {
      return NextResponse.json({ error: "websiteId is required." }, { status: 400 });
    }
    const data: any = { name, primaryColor, logo };
    if (typeof domain === "string" && domain.trim()) {
      data.domain = domain.trim().toLowerCase().replace(/\/$/, "");
    }
    const website = await prisma.website.update({
      where: { id: websiteId },
      data,
    });
    return NextResponse.json({ ok: true, website });
  } catch (e: any) {
    // Unique constraint on domain -> friendly error
    if (String(e?.message || "").includes("Unique constraint") || /duplicate|P2002/i.test(String(e?.message || ""))) {
      return NextResponse.json({ error: "This domain is already registered." }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
