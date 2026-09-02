"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Stack,
  Chip,
  Tooltip,
} from "@mui/material";
import ChatBubbleOutline from "@mui/icons-material/ChatBubbleOutline";
import Forum from "@mui/icons-material/Forum";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import Logout from "@mui/icons-material/Logout";
import TimerOutlined from "@mui/icons-material/TimerOutlined";
import PeopleOutline from "@mui/icons-material/PeopleOutline";
import Dashboard from "@mui/icons-material/Dashboard";

const DRAWER_WIDTH = 240;

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: <Dashboard /> },
  { label: "Inbox", href: "/dashboard/inbox", icon: <Forum /> },
  { label: "Agents", href: "/dashboard/agents", icon: <PeopleOutline /> },
  { label: "Settings", href: "/dashboard/settings", icon: <SettingsOutlined /> },
];

export function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("nc_agent");
    if (stored) {
      setAgent(JSON.parse(stored));
    } else {
      router.replace("/login");
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("nc_token");
    localStorage.removeItem("nc_agent");
    router.replace("/login");
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", borderRight: "1px solid rgba(145,158,171,.16)" },
        }}
      >
        <Toolbar sx={{ px: 2, gap: 1.5, alignItems: "center" }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #00A76F, #007867)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <ChatBubbleOutline fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1}>
              Natasun
            </Typography>
            <Typography variant="caption" color="#00A76F" fontWeight={600}>
              Chat
            </Typography>
          </Box>
        </Toolbar>
        <Divider />
        <List sx={{ px: 1, pt: 1 }}>
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <ListItemButton
                key={item.href}
                onClick={() => router.push(item.href)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor: active ? "rgba(0,167,111,.1)" : "transparent",
                  color: active ? "#007867" : "text.primary",
                  "&:hover": { bgcolor: active ? "rgba(0,167,111,.16)" : "rgba(145,158,171,.08)" },
                  "& .MuiListItemIcon-root": { color: active ? "#007867" : "inherit", minWidth: 36 },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
              </ListItemButton>
            );
          })}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider />
        <List sx={{ px: 1, pb: 1 }}>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 36 }}><Logout /></ListItemIcon>
            <ListItemText primary="Log out" primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
          </ListItemButton>
        </List>
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, borderTop: "1px solid rgba(145,158,171,.16)" }}>
          <Avatar sx={{ bgcolor: "#00A76F", width: 36, height: 36 }}>
            {(agent?.name || "A").charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {agent?.name || "Agent"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {agent?.email || ""}
            </Typography>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}
