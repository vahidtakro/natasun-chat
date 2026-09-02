"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Natasun brand primary is green (#00A76F)
const brand = {
  primary: {
    lighter: "#C8FAD6",
    light: "#5BE49B",
    main: "#00A76F",
    dark: "#007867",
    darker: "#004B50",
    contrastText: "#FFFFFF",
  },
  secondary: {
    lighter: "#EFD6FF",
    light: "#C684FF",
    main: "#8E33FF",
    dark: "#5119B7",
    darker: "#27097A",
    contrastText: "#FFFFFF",
  },
};

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = createTheme({
    palette: {
      mode: "light",
      primary: { ...brand.primary },
      secondary: { ...brand.secondary },
      background: { default: "#F6F7F9", paper: "#FFFFFF" },
      text: { primary: "#212B36", secondary: "#637381" },
      divider: "rgba(145, 158, 171, 0.16)",
    },
    typography: {
      fontFamily: "'Public Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      h1: { fontWeight: 800 },
      h2: { fontWeight: 800 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { minHeight: 40, borderRadius: 10, boxShadow: "none" },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          "*": { boxSizing: "border-box" },
          body: { margin: 0 },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
