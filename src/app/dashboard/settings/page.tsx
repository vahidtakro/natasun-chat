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
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  LinearProgress,
  IconButton,
  Collapse,
  Tooltip,
  Snackbar,
} from "@mui/material";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Code from "@mui/icons-material/Code";
import Check from "@mui/icons-material/Check";
import axios from "axios";

type Website = {
  id: string;
  name: string;
  domain: string;
  primaryColor: string;
  logo: string | null;
  locale: string;
  subscription?: { plan: string; price: number; status: string } | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);
  const [domain, setDomain] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#00A76F");
  const [name, setName] = useState("");

  useEffect(() => {
    const a = localStorage.getItem("nc_agent");
    if (!a) { router.replace("/login"); return; }
    setAgent(JSON.parse(a));
  }, [router]);

  useEffect(() => {
    if (!agent) return;
    (async () => {
      try {
        const res = await axios.get(`/api/website?websiteId=${agent.websiteId}`);
        setWebsite(res.data.website);
        setDomain(res.data.website.domain);
        setName(res.data.website.name);
        setPrimaryColor(res.data.website.primaryColor);
        setAppUrl(process.env.NEXT_PUBLIC_APP_URL || "");
        setWsUrl(process.env.NEXT_PUBLIC_WS_URL || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [agent]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await axios.patch("/api/website", {
        websiteId: agent.websiteId,
        name,
        domain,
        primaryColor,
      });
      setWebsite((w) => (w ? { ...w, name, domain, primaryColor } : w));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error(err);
      setSaved(false);
      alert(err?.response?.data?.error || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  const snippet = `<!-- Natasun Chat Widget -->
<script>
  (function(window,document) {
    var t = document.currentScript || document.scripts[document.scripts.length-1];
    var s = document.createElement('script');
    s.async = true;
    s.src = "${appUrl || 'https://chat.natasun.com'}/widget.js";
    s.setAttribute('data-domain', "${domain || 'yourdomain.com'}");
    s.setAttribute('data-base-url', "${appUrl || 'https://chat.natasun.com'}");
    s.setAttribute('data-ws-url', "${wsUrl || 'wss://chat.natasun.com'}");
    s.setAttribute('data-color', "${primaryColor}");
    t.parentNode.insertBefore(s, t);
  })(window, document);
<\/script>`;

  function copySnippet() {
    navigator.clipboard?.writeText(snippet);
  }

  return (
    <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 } }}>
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Settings</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure your workspace and install the chat widget.
            </Typography>
          </Box>

          {loading ? (
            <LinearProgress sx={{ borderRadius: 2, height: 6 }} />
          ) : (
            <>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,.04)" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} mb={3}>
                        Workspace
                      </Typography>
                      <Stack component="form" onSubmit={save} spacing={2.5}>
                        <TextField label="Workspace name" fullWidth value={name} onChange={(e) => setName(e.target.value)} required />
                        <TextField label="Domain" fullWidth value={domain} onChange={(e) => setDomain(e.target.value.toLowerCase().trim())} helperText="Must match your website's domain." />
                        <Stack direction="row" spacing={2} alignItems="center">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            style={{ width: 44, height: 44, border: "none", borderRadius: 10, cursor: "pointer", background: "transparent" }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>Widget color</Typography>
                            <Typography variant="caption" color="text.secondary">Brand accent color</Typography>
                          </Box>
                        </Stack>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Plan: {website?.subscription?.plan || "free"}
                          </Typography>
                        </Box>
                        <Button type="submit" variant="contained" disabled={saving} sx={{ alignSelf: "flex-start" }}>
                          {saving ? "Saving…" : "Save changes"}
                        </Button>
                        {saved && (
                          <Alert severity="success" sx={{ borderRadius: 2 }} icon={<Check />}>
                            Changes saved.
                          </Alert>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,.04)", height: "100%" }}>
                    <CardContent sx={{ p: 3 }} component={Stack} spacing={2}>
                      <Typography variant="h6" fontWeight={700}>
                        Install widget
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add this script to your website&apos;s <code>&lt;head&gt;</code> to start collecting conversations.
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<Code />}
                        onClick={() => setShowSnippet((s) => !s)}
                      >
                        {showSnippet ? "Hide snippet" : "Show snippet"}
                      </Button>
                      <Collapse in={showSnippet}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: "#0b1220",
                            color: "#d1e7ff",
                            position: "relative",
                            fontSize: 12,
                            fontFamily: "monospace",
                            maxHeight: 300,
                            overflow: "auto",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          <Box sx={{ position: "sticky", top: 0, display: "flex", justifyContent: "flex-end" }}>
                            <Tooltip title="Copy">
                              <IconButton onClick={copySnippet} size="small" sx={{ bgcolor: "rgba(255,255,255,.1)", color: "#fff" }}>
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          {snippet}
                        </Paper>
                      </Collapse>
                      <Snackbar open={showSnippet} autoHideDuration={3000} message="Use the copy button" />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
