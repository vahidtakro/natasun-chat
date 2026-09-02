import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Initialize a visitor session for a website (called by the widget)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { domain, name, email, locale } = body;
    if (!domain) {
      return NextResponse.json({ error: "Domain is required." }, { status: 400 });
    }

    const website = await prisma.website.findUnique({ where: { domain } });
    if (!website) {
      return NextResponse.json({ error: "Website not registered." }, { status: 404 });
    }

    let visitor = await prisma.visitor.create({
      data: {
        websiteId: website.id,
        name: name || "Guest",
        email,
        locale,
      },
    });

    // Create an open conversation for this visitor
    const conversation = await prisma.conversation.create({
      data: {
        websiteId: website.id,
        visitorId: visitor.id,
        visitorName: visitor.name,
        visitorEmail: visitor.email,
        status: "Open",
        language: locale,
      },
    });

    return NextResponse.json({
      ok: true,
      website: {
        id: website.id,
        name: website.name,
        domain: website.domain,
        primaryColor: website.primaryColor,
        logo: website.logo,
      },
      visitor: { id: visitor.id, name: visitor.name },
      conversation: { id: conversation.id },
    });
  } catch (e: any) {
    console.error("[widget/init] error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
