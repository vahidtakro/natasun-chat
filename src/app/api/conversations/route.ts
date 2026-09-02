import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// List all conversations for an agent's website, with optional filter
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const websiteId = searchParams.get("websiteId");
  const status = searchParams.get("status") || "Open";
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 50);

  if (!websiteId) {
    return NextResponse.json({ error: "websiteId is required." }, { status: 400 });
  }

  const where: any = { websiteId };
  if (status === "Assigned") {
    where.status = "Open";
    where.agentId = { not: null };
  } else if (status === "Closed") {
    where.status = "closed";
  } else {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1, // not used for preview, but keeps cardinality low
        },
        agent: { select: { id: true, name: true, avatar: true } },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  return NextResponse.json({ ok: true, items, total });
}

export const dynamic = "force-dynamic";
