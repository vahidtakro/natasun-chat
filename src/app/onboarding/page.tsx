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
  Alert,
  IconButton,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ChatBubbleOutline from "@mui/icons-material/ChatBubbleOutline";
import PriceCheck from "@mui/icons-material/PriceCheck";
import Public from "@mui/icons-material/Public";
import axios from "axios";

const steps = ["Site details", "Admin account"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#00A76F");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleNext() {
    setError("");
    if (step === 0) {
      if (!companyName || !domain) {
        setError("Please fill in your company name and website domain.");
        return;
      }
      setStep(1);
    } else {
      if (!name || !email || !password) {
        setError("Please fill in all fields.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      setLoading(true);
      try {
        const res = await axios.post("/api/onboarding", {
          companyName,
          domain,
          primaryColor,
          name,
          email,
          password,
        });
        localStorage.setItem("nc_token", res.data.token);
        localStorage.setItem("nc_agent", JSON.stringify(res.data.agent));
        router.push("/dashboard");
      } catch (err: any) {
        setError(err?.response?.data?.error || "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
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
              Create your <span style={{ color: "#00A76F" }}>workspace</span>
            </Typography>
          </Stack>

          <Card sx={{ width: "100%", borderRadius: "20px", boxShadow: "0 16px 48px rgba(0,0,0,.08)" }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {step === 0 ? (
                <Stack spacing={2.5}>
                  <Typography variant="body2" color="text.secondary">
                    This is your workspace — where your website&apos;s conversations and agents live.
                  </Typography>
                  <TextField
                    label="Company / Website name"
                    fullWidth
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    InputProps={{ startAdornment: <Public sx={{ mr: 1, color: "text.secondary" }} /> }}
                  />
                  <TextField
                    label="Domain (e.g. natasun.com)"
                    fullWidth
                    value={domain}
                    onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                    required
                    placeholder="example.com"
                  />
                  <Stack direction="row" spacing={2} alignItems="center">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{ width: 44, height: 44, border: "none", borderRadius: 10, cursor: "pointer", background: "transparent" }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Widget color</Typography>
                      <Typography variant="caption" color="text.secondary">Pick a brand accent color</Typography>
                    </Box>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={2.5}>
                  <TextField
                    label="Your name"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                </Stack>
              )}

              <Stack direction="row" spacing={2} mt={4} justifyContent="space-between">
                <Button
                  variant="outlined"
                  onClick={() => setStep(0)}
                  disabled={step === 0 || loading}
                >
                  Back
                </Button>
                <Button variant="contained" onClick={handleNext} disabled={loading}>
                  {loading ? "Creating…" : step === 1 ? "Start chatting" : "Continue"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
