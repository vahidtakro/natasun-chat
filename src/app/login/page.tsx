"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ChatBubbleOutline from "@mui/icons-material/ChatBubbleOutline";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      localStorage.setItem("nc_token", res.data.token);
      localStorage.setItem("nc_agent", JSON.stringify(res.data.agent));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 20% 20%, rgba(0,167,111,.12), transparent 40%), radial-gradient(circle at 80% 80%, rgba(142,51,255,.08), transparent 40%), #F6F7F9",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "14px",
                background: "linear-gradient(135deg, #00A76F, #007867)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 8px 20px rgba(0,167,111,.35)",
              }}
            >
              <ChatBubbleOutline />
            </Box>
            <Typography variant="h4" fontWeight={800} color="text.primary">
              Natasun<span style={{ color: "#00A76F" }}> Chat</span>
            </Typography>
          </Stack>

          <Card sx={{ width: "100%", borderRadius: "20px", boxShadow: "0 16px 48px rgba(0,0,0,.08)" }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Sign in to manage your conversations.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Stack component="form" onSubmit={handleSubmit} spacing={2.5}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <TextField
                  label="Password"
                  type={show ? "text" : "password"}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShow((s) => !s)} edge="end">
                          {show ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </Stack>

              <Typography variant="body2" color="text.secondary" mt={3} textAlign="center">
                New to Natasun Chat?{" "}
                <MuiLink href="/onboarding" underline="always" color="primary.main">
                  Create an account
                </MuiLink>
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
