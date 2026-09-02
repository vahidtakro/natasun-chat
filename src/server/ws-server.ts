import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORT = Number(process.env.WS_PORT || 3001);
const CORS_ORIGINS = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((o) => o.trim());

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGINS, methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

// Map of socket id -> { websiteId, agentId?, visitorId? }
const clients = new Map<string, { role: string; websiteId: string; agentId?: string; visitorId?: string; conversationId?: string }>();

io.on("connection", (socket) => {
  socket.on(
    "agent:auth",
    async (payload: { websiteId: string; agentId: string; token: string }, cb?: (res: any) => void) => {
      // In production, verify token server-side. Keep simple for now.
      if (!payload.websiteId || !payload.agentId) {
        cb?.({ ok: false, error: "Missing auth data" });
        return;
      }
      clients.set(socket.id, {
        role: "agent",
        websiteId: payload.websiteId,
        agentId: payload.agentId,
      });
      socket.join(`website:${payload.websiteId}`);
      socket.join(`agent:${payload.agentId}`);
      await prisma.agent.update({
        where: { id: payload.agentId },
        data: { isOnline: true },
      });
      io.to(`website:${payload.websiteId}`).emit("agents:update");
      cb?.({ ok: true });
    }
  );

  socket.on(
    "visitor:auth",
    (payload: { websiteId: string; visitorId: string; conversationId?: string }, cb?: (res: any) => void) => {
      if (!payload.websiteId || !payload.visitorId) {
        cb?.({ ok: false, error: "Missing visitor data" });
        return;
      }
      clients.set(socket.id, {
        role: "visitor",
        websiteId: payload.websiteId,
        visitorId: payload.visitorId,
        conversationId: payload.conversationId,
      });
      socket.join(`website:${payload.websiteId}`);
      socket.join(`visitor:${payload.visitorId}`);
      if (payload.conversationId) socket.join(`conv:${payload.conversationId}`);
      cb?.({ ok: true });
    }
  );

  socket.on("visitor:message", async (payload: { conversationId: string; content: string; type?: string }, cb?: (res: any) => void) => {
    const client = clients.get(socket.id);
    if (!client || client.role !== "visitor") {
      cb?.({ ok: false, error: "Not authorized" });
      return;
    }
    try {
      const message = await prisma.message.create({
        data: {
          conversationId: payload.conversationId,
          content: payload.content,
          type: payload.type || "text",
          isAgent: false,
        },
      });
      await prisma.conversation.update({
        where: { id: payload.conversationId },
        data: { lastMessage: payload.content, unreadCount: { increment: 1 }, updatedAt: new Date() },
      });
      io.to(`conv:${payload.conversationId}`).emit("message:new", {
        ...message,
        createdAt: message.createdAt.toISOString(),
      });
      // Notify all agents of this website about a new visitor message
      // (used to trigger browser notifications for non-active conversations).
      const conv = await prisma.conversation.findUnique({
        where: { id: payload.conversationId },
        select: { visitorName: true, visitorEmail: true, status: true },
      });
      io.to(`website:${client.websiteId}`).emit("message:notify", {
        conversationId: payload.conversationId,
        visitorName: conv?.visitorName || "New visitor",
        visitorEmail: conv?.visitorEmail || "",
        content: payload.content,
        createdAt: message.createdAt.toISOString(),
      });
      cb?.({ ok: true, message });
    } catch (e: any) {
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on("agent:message", async (payload: { conversationId: string; content: string; type?: string }, cb?: (res: any) => void) => {
    const client = clients.get(socket.id);
    if (!client || client.role !== "agent") {
      cb?.({ ok: false, error: "Not authorized" });
      return;
    }
    try {
      const message = await prisma.message.create({
        data: {
          conversationId: payload.conversationId,
          agentId: client.agentId,
          content: payload.content,
          type: payload.type || "text",
          isAgent: true,
        },
      });
      await prisma.conversation.update({
        where: { id: payload.conversationId },
        data: { lastMessage: payload.content, updatedAt: new Date() },
      });
      io.to(`conv:${payload.conversationId}`).emit("message:new", {
        ...message,
        createdAt: message.createdAt.toISOString(),
      });
      cb?.({ ok: true, message });
    } catch (e: any) {
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on("conversation:open", (payload: { conversationId: string }) => {
    socket.join(`conv:${payload.conversationId}`);
    const client = clients.get(socket.id);
    if (client) client.conversationId = payload.conversationId;
  });

  socket.on("conversation:typing", (payload: { conversationId: string; isTyping: boolean }) => {
    socket.to(`conv:${payload.conversationId}`).emit("conversation:typing", {
      conversationId: payload.conversationId,
      isTyping: payload.isTyping,
      role: clients.get(socket.id)?.role,
    });
  });

  socket.on("conversation:markRead", async (payload: { conversationId: string }) => {
    const client = clients.get(socket.id);
    if (!client) return;
    try {
      const conv = await prisma.conversation.findUnique({ where: { id: payload.conversationId } });
      if (!conv) return;
      if (client.role === "agent") {
        await prisma.message.updateMany({
          where: { conversationId: payload.conversationId, isAgent: false, read: false },
          data: { read: true },
        });
        await prisma.conversation.update({
          where: { id: payload.conversationId },
          data: { unreadCount: 0 },
        });
      }
    } catch {}
  });

  socket.on("conversation:assign", async (payload: { conversationId: string; agentId: string }, cb?: (res: any) => void) => {
    const client = clients.get(socket.id);
    if (!client || client.role !== "agent") {
      cb?.({ ok: false, error: "Not authorized" });
      return;
    }
    try {
      await prisma.conversation.update({
        where: { id: payload.conversationId },
        data: { agentId: payload.agentId },
      });
      await prisma.chatAssignment.upsert({
        where: { conversationId_agentId: { conversationId: payload.conversationId, agentId: payload.agentId } },
        create: { conversationId: payload.conversationId, agentId: payload.agentId },
        update: { assignedAt: new Date() },
      });
      io.to(`website:${client.websiteId}`).emit("conversation:assigned", payload);
      cb?.({ ok: true });
    } catch (e: any) {
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on("conversation:close", async (payload: { conversationId: string }, cb?: (res: any) => void) => {
    const client = clients.get(socket.id);
    if (!client || client.role !== "agent") {
      cb?.({ ok: false, error: "Not authorized" });
      return;
    }
    try {
      await prisma.conversation.update({
        where: { id: payload.conversationId },
        data: { status: "closed" },
      });
      io.to(`website:${client.websiteId}`).emit("conversation:closed", payload);
      cb?.({ ok: true });
    } catch (e: any) {
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on("disconnect", async () => {
    const client = clients.get(socket.id);
    if (client?.role === "agent" && client.agentId) {
      await prisma.agent.update({
        where: { id: client.agentId },
        data: { isOnline: false },
      });
      io.to(`website:${client.websiteId}`).emit("agents:update");
    }
    clients.delete(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[natasun-chat] WebSocket server listening on port ${PORT}`);
});
