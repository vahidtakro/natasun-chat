"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  LinearProgress,
  Chip,
  Avatar,
  Button,
} from "@mui/material";
import { useConversationStore } from "@/lib/store";
import axios from "axios";

function StatCard({ icon, label, value, color }: any) {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,.04)", height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              bgcolor: `${color}15`,
              color: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DashboardHomePage() {
  const router = useRouter();
  const { conversations, setConversations, setActiveConversation } = useConversationStore();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);

  const open = conversations.filter((c) => c.status === "Open").length;
  const closed = conversations.filter((c) => c.status === "closed").length;
  const unread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  useEffect(() => {
    const a = localStorage.getItem("nc_agent");
    if (!a) {
      router.replace("/login");
      return;
    }
    setAgent(JSON.parse(a));
  }, [router]);

  useEffect(() => {
    if (!agent) return;
    (async () => {
      try {
        const res = await axios.get(`/api/conversations?websiteId=${agent.websiteId}`);
        setConversations(res.data.items);
        setActiveConversation(null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [agent, setConversations, setActiveConversation]);

  return (
    <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 } }}>
      <Container maxWidth="xl" disableGutters>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Welcome back{agent?.name ? `, ${agent.name.split(" ")[0]}` : ""} 👋
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Here&apos;s what&apos;s happening with your conversations.
            </Typography>
          </Box>

          {loading ? (
            <LinearProgress sx={{ borderRadius: 2, height: 6 }} />
          ) : (
            <>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard icon="💬" label="Total conversations" value={conversations.length || "-"} color="#00A76F" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard icon="🟢" label="Open" value={open || "-"} color="#00A76F" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard icon="🔔" label="Unread messages" value={unread || "-"} color="#f59e0b" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard icon="✅" label="Closed" value={closed || "-"} color="#8e33ff" />
                </Grid>
              </Grid>

              <Card sx={{ borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,.04)" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={700}>
                      Recent conversations
                    </Typography>
                    <Button variant="text" color="primary" onClick={() => router.push("/dashboard/inbox")}>
                      View all
                    </Button>
                  </Stack>
                  {conversations.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" py={4} textAlign="center">
                      No conversations yet. Add the widget to your website and visitors will appear here.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {conversations.slice(0, 5).map((c) => (
                        <Stack
                          key={c.id}
                          direction="row"
                          alignItems="center"
                          spacing={2}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            cursor: "pointer",
                            "&:hover": { bgcolor: "rgba(145,158,171,.06)" },
                          }}
                          onClick={() => {
                            setActiveConversation(c.id);
                            router.push("/dashboard/inbox");
                          }}
                        >
                          <Avatar sx={{ bgcolor: "#007867", width: 36, height: 36 }}>
                            {(c.visitorName || "G").charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body1" fontWeight={600} noWrap>
                              {c.visitorName || "Guest"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {c.lastMessage || "New conversation"}
                            </Typography>
                          </Box>
                          {c.unreadCount > 0 && (
                            <Chip size="small" label={c.unreadCount} sx={{ bgcolor: "#00A76F", color: "#fff", fontWeight: 700 }} />
                          )}
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
