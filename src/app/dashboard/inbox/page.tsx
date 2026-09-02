"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  Paper,
} from "@mui/material";
import Send from "@mui/icons-material/Send";
import Search from "@mui/icons-material/Search";
import Close from "@mui/icons-material/Close";
import MoreVert from "@mui/icons-material/MoreVert";
import CloseRounded from "@mui/icons-material/CloseRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import AssignmentInd from "@mui/icons-material/AssignmentInd";
import { io } from "socket.io-client";
import axios from "axios";
import { useConversationStore, useSocket } from "@/lib/store";
import { ensureNotificationPermission, notifyAgent } from "@/lib/notify";

export default function InboxPage() {
  const router = useRouter();
  const { conversations, setConversations, activeConversationId, setActiveConversation, typing, setTyping } = useConversationStore();
  const socketState = useSocket();
  const [agent, setAgent] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<any>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    const a = localStorage.getItem("nc_agent");
    if (!a) { router.replace("/login"); return; }
    setAgent(JSON.parse(a));
    ensureNotificationPermission();
    return () => {
      socket?.disconnect();
    };
  }, [router]);

  useEffect(() => {
    if (!agent) return;
    (async () => {
      try {
        const [convRes, agentsRes] = await Promise.all([
          axios.get(`/api/conversations?websiteId=${agent.websiteId}`),
          axios.get(`/api/agents?websiteId=${agent.websiteId}`),
        ]);
        setConversations(convRes.data.items);
        setAgents(agentsRes.data.agents);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [agent, setConversations]);

  useEffect(() => {
    if (!agent) return;
    const s = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001", {
      transports: ["websocket", "polling"],
    });
    setSocket(s);

    s.on("connect", () => {
      s.emit("agent:auth", { websiteId: agent.websiteId, agentId: agent.id }, () => {});
    });

    s.on("message:new", (msg: any) => {
      if (msg.conversationId === activeConversationId) {
        setMessages((m) => {
          if (m.some((x) => x.id === msg.id)) return m;
          return [...m, msg];
        });
      }
      // update conversation preview
      setConversations((prev) =>
        prev.map((c) => (c.id === msg.conversationId ? { ...c, lastMessage: msg.content, updatedAt: msg.createdAt } : c))
      );
    });

    // New visitor message in a conversation the agent is NOT currently viewing.
    // Update the unread badge and alert the agent (notification + sound).
    s.on("message:notify", (notif: any) => {
      const isActive = notif.conversationId === activeConversationId;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === notif.conversationId
            ? {
                ...c,
                lastMessage: notif.content,
                updatedAt: notif.createdAt,
                unreadCount: isActive ? c.unreadCount : (c.unreadCount || 0) + 1,
              }
            : c
        )
      );
      if (!isActive) {
        notifyAgent({ visitorName: notif.visitorName, content: notif.content });
      }
    });

    s.on("conversation:closed", ({ conversationId }: any) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, status: "closed" } : c))
      );
    });

    s.on("conversation:assigned", ({ conversationId }: any) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, status: "Open" } : c))
      );
    });

    s.on("conversation:typing", (d: any) => {
      if (d.role === "visitor" && d.conversationId === activeConversationId) {
        setTyping(d.isTyping);
      }
    });

    return () => { s.disconnect(); };
  }, [agent, activeConversationId, setConversations, setTyping]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!activeConversationId) { setMessages([]); return; }
    (async () => {
      try {
        const res = await axios.get(`/api/conversations/${activeConversationId}/messages`);
        setMessages(res.data.messages);
        socket?.emit("conversation:open", { conversationId: activeConversationId });
        socket?.emit("conversation:markRead", { conversationId: activeConversationId });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [activeConversationId, socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, activeConversationId]);

  const filtered = conversations.filter((c) => {
    const matchesSearch =
      !search ||
      (c.visitorName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.lastMessage || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "All" ||
      (filter === "Open" && c.status === "Open") ||
      (filter === "Closed" && c.status === "closed") ||
      (filter === "Assigned" && c.status === "Open" && c.agentId);
    return matchesSearch && matchesFilter;
  });

  const sendTyping = useCallback(() => {
    if (!socket || !activeConversationId) return;
    socket.emit("conversation:typing", { conversationId: activeConversationId, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("conversation:typing", { conversationId: activeConversationId, isTyping: false });
    }, 1000);
  }, [socket, activeConversationId]);

  function sendMessage() {
    const content = input.trim();
    if (!content || !socket || !activeConversationId) return;
    socket.emit("agent:message", { conversationId: activeConversationId, content }, (res: any) => {
      if (res?.ok) {
        setInput("");
      }
    });
  }

  function closeConversation() {
    if (!socket || !activeConversationId) return;
    socket.emit("conversation:close", { conversationId: activeConversationId });
    setMenuAnchor(null);
  }

  function assignTo(agentId: string) {
    if (!socket || !activeConversationId) return;
    socket.emit("conversation:assign", { conversationId: activeConversationId, agentId });
    setMenuAnchor(null);
  }

  return (
    <Box component="main" sx={{ flexGrow: 1, height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Box sx={{ p: { xs: 2, sm: 3 }, pb: 1 }}>
        <Typography variant="h4" fontWeight={800}>
          Inbox
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {loading ? "Loading conversations…" : `${conversations.length} conversations`}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flex: 1, minHeight: 0, px: { xs: 1, sm: 2, md: 3 }, pb: 3, gap: 2 }}>
        {/* Conversation list */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: "100%", md: 380 },
            borderRadius: 4,
            border: "1px solid rgba(145,158,171,.16)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Box sx={{ p: 2, borderBottom: "1px solid rgba(145,158,171,.16)" }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: "text.secondary" }} /> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "background.default" } }}
            />
            <Stack direction="row" spacing={1} mt={1.5}>
              {["All", "Open", "Assigned", "Closed"].map((f) => (
                <Chip
                  key={f}
                  label={f}
                  onClick={() => setFilter(f)}
                  sx={{
                    cursor: "pointer",
                    fontWeight: 600,
                    bgcolor: filter === f ? "#00A76F" : "transparent",
                    color: filter === f ? "#fff" : "text.secondary",
                    "&:hover": { bgcolor: filter === f ? "#007867" : "rgba(145,158,171,.12)" },
                    border: filter === f ? "none" : "1px solid rgba(145,158,171,.3)",
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={28} /></Box>
            ) : filtered.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={6}>
                No matching conversations.
              </Typography>
            ) : (
              filtered.map((c) => {
                const active = c.id === activeConversationId;
                return (
                  <Box
                    key={c.id}
                    onClick={() => setActiveConversation(c.id)}
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      borderLeft: active ? "3px solid #00A76F" : "3px solid transparent",
                      bgcolor: active ? "rgba(0,167,111,.06)" : "transparent",
                      "&:hover": { bgcolor: active ? "rgba(0,167,111,.1)" : "rgba(145,158,171,.05)" },
                      borderBottom: "1px solid rgba(145,158,171,.1)",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: "#007867", width: 40, height: 40 }}>
                        {(c.visitorName || "G").charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1" fontWeight={600} noWrap sx={{ fontSize: 14 }}>
                            {c.visitorName || "Guest"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color={c.unreadCount > 0 ? "text.primary" : "text.secondary"} noWrap sx={{ fontSize: 13, maxWidth: "80%" }}>
                            {c.lastMessage || "New conversation"}
                          </Typography>
                          {c.unreadCount > 0 && (
                            <Chip size="small" label={c.unreadCount} sx={{ bgcolor: "#00A76F", color: "#fff", fontWeight: 700, height: 18, minWidth: 18, fontSize: 11 }} />
                          )}
                        </Stack>
                        {c.status === "closed" && (
                          <Chip size="small" label="Closed" sx={{ mt: 0.5, height: 18, fontSize: 11, bgcolor: "rgba(145,158,171,.2)" }} />
                        )}
                      </Box>
                    </Stack>
                  </Box>
                );
              })
            )}
          </Box>
        </Paper>

        {/* Chat window */}
        {activeConv ? (
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              borderRadius: 4,
              border: "1px solid rgba(145,158,171,.16)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} p={2} borderBottom="1px solid rgba(145,158,171,.16)">
              <Avatar sx={{ bgcolor: "#007867", width: 40, height: 40 }}>
                {(activeConv.visitorName || "G").charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {activeConv.visitorName || "Guest"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activeConv.status === "closed" ? "Closed" : "In conversation"}
                </Typography>
              </Box>
              {activeConv.status !== "closed" && (
                <>
                  <Tooltip title="More options">
                    <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                  <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                    <Typography variant="caption" color="text.secondary" px={2} py={1}>
                      Assign to agent
                    </Typography>
                    {agents.map((a) => (
                      <MenuItem key={a.id} onClick={() => assignTo(a.id)}>
                        <ListItemIcon><AssignmentInd fontSize="small" /></ListItemIcon>
                        {a.name} {a.id === activeConv.agentId && "• current"}
                      </MenuItem>
                    ))}
                    <Divider />
                    <MenuItem onClick={closeConversation} sx={{ color: "error.main" }}>
                      <ListItemIcon><Close fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
                      Close conversation
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Stack>

            <Box ref={bodyRef} sx={{ flex: 1, overflowY: "auto", p: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
              {messages.map((m) => (
                <Stack
                  key={m.id}
                  alignItems={m.isAgent ? "flex-end" : "flex-start"}
                >
                  {!m.isAgent && (
                    <Typography variant="caption" color="text.secondary" mb={0.5}>
                      {activeConv.visitorName || "Visitor"}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      maxWidth: "70%",
                      px: 1.75,
                      py: 1.25,
                      borderRadius: "16px",
                      borderBottomRightRadius: m.isAgent ? "5px" : "16px",
                      borderBottomLeftRadius: m.isAgent ? "16px" : "5px",
                      bgcolor: m.isAgent ? "#00A76F" : "#fff",
                      color: m.isAgent ? "#fff" : "text.primary",
                      boxShadow: "0 1px 2px rgba(0,0,0,.05)",
                      border: m.isAgent ? "none" : "1px solid rgba(145,158,171,.16)",
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {m.content}
                    </Typography>
                    <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5} mt={0.5}>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Typography>
                      {m.isAgent && (
                        m.read ? <CheckRounded sx={{ fontSize: 14, opacity: 0.9 }} /> : <CheckRounded sx={{ fontSize: 14, opacity: 0.5 }} />
                      )}
                    </Stack>
                  </Box>
                </Stack>
              ))}
              {/* Typing indicator */}
              {typing && (
                <Stack alignItems="flex-start">
                  <Box sx={{ px: 2, py: 1, borderRadius: "16px", borderBottomLeftRadius: "5px", bgcolor: "#fff", border: "1px solid rgba(145,158,171,.16)" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", gap: 0.4 }}>
                      <span style={{ animation: "blink 1.2s infinite" }}>.</span>
                      <span style={{ animation: "blink 1.2s infinite .2s" }}>.</span>
                      <span style={{ animation: "blink 1.2s infinite .4s" }}>.</span>
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>

            <Box sx={{ p: 2, borderTop: "1px solid rgba(145,158,171,.16)", bgcolor: "background.paper" }}>
              <Stack direction="row" spacing={1} alignItems="flex-end">
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type your reply…"
                  value={input}
                  inputRef={inputRef}
                  onChange={(e) => { setInput(e.target.value); if (e.target.value.trim()) sendTyping(); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "background.default" },
                  }}
                />
                <IconButton
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  sx={{
                    bgcolor: "#00A76F",
                    color: "#fff",
                    width: 46,
                    height: 46,
                    "&:hover": { bgcolor: "#007867" },
                    "&.Mui-disabled": { bgcolor: "rgba(145,158,171,.2)", color: "text.secondary" },
                  }}
                >
                  <Send />
                </IconButton>
              </Stack>
            </Box>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              borderRadius: 4,
              border: "1px dashed rgba(145,158,171,.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 0,
            }}
          >
            <Stack alignItems="center" spacing={1} color="text.secondary">
              <IconButton sx={{ bgcolor: "rgba(0,167,111,.1)", color: "#007867", width: 64, height: 64, mb: 1 }}>
                <CloseRounded fontSize="large" />
              </IconButton>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                No conversation selected
              </Typography>
              <Typography variant="body2">Select a conversation from the list to start chatting.</Typography>
            </Stack>
          </Paper>
        )}
      </Box>

      <style>{`@keyframes blink{0%,80%,100%{opacity:.2}40%{opacity:1}}`}</style>
    </Box>
  );
}
