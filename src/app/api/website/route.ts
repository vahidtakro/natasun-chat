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
    const { websiteId, name, primaryColor, logo } = body;
    if (!websiteId) {
      return NextResponse.json({ error: "websiteId is required." }, { status: 400 });
    }
    const website = await prisma.website.update({
      where: { id: websiteId },
      data: { name, primaryColor, logo },
    });
    return NextResponse.json({ ok: true, website });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
