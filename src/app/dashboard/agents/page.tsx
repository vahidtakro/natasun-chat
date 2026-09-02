"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Container,
  Stack,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  MenuItem,
  LinearProgress,
  Alert,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import PersonAdd from "@mui/icons-material/PersonAdd";
import axios from "axios";

type Agent = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  isOnline: boolean;
  createdAt: string;
};

export default function AgentsPage() {
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "agent" });

  useEffect(() => {
    const a = localStorage.getItem("nc_agent");
    if (!a) { router.replace("/login"); return; }
    setAgent(JSON.parse(a));
  }, [router]);

  useEffect(() => {
    if (!agent) return;
    (async () => {
      try {
        const res = await axios.get(`/api/agents?websiteId=${agent.websiteId}`);
        setAgents(res.data.agents);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [agent]);

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await axios.post("/api/agents", { ...form, websiteId: agent.websiteId });
      setAgents((prev) => [...prev, res.data.agent]);
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "agent" });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create agent.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 } }}>
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight={800}>Agents</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage the people who reply to conversations on this website.
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
              Add agent
            </Button>
          </Stack>

          {loading ? (
            <LinearProgress sx={{ borderRadius: 2, height: 6 }} />
          ) : agents.length === 0 ? (
            <Card sx={{ borderRadius: 4, p: 6, textAlign: "center" }}>
              <PersonAdd sx={{ fontSize: 48, color: "#00A76F", mb: 2 }} />
              <Typography variant="h6" fontWeight={600}>No agents yet</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Add your first agent to start responding to conversations.
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
                Add agent
              </Button>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {agents.map((a) => (
                <Grid item xs={12} sm={6} md={4} key={a.id}>
                  <Card sx={{ borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,.04)", height: "100%" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: a.isOnline ? "#00A76F" : "rgba(145,158,171,.3)", width: 52, height: 52 }}>
                          {a.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>
                            {a.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {a.email}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" gap={1}>
                        <Chip
                          size="small"
                          label={a.isOnline ? "Online" : "Offline"}
                          sx={{
                            bgcolor: a.isOnline ? "rgba(0,167,111,.1)" : "rgba(145,158,171,.1)",
                            color: a.isOnline ? "#007867" : "text.secondary",
                            fontWeight: 600,
                          }}
                        />
                        <Chip size="small" label={a.role === "admin" ? "Admin" : "Agent"} sx={{ bgcolor: "rgba(142,51,255,.1)", color: "#8e33ff", fontWeight: 600 }} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle fontWeight={700}>Add new agent</DialogTitle>
          <form onSubmit={createAgent}>
            <DialogContent>
              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
              <Stack spacing={2.5} mt={1}>
                <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <TextField label="Email" type="email" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <TextField label="Password" type="password" fullWidth value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <TextField
                  select
                  label="Role"
                  fullWidth
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <MenuItem value="agent">Agent</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Adding…" : "Add agent"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
}
