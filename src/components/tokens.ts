// src/components/tokens.ts

// 🎨 Color System
export const colors = {
  primary: "#6F17FF",     // Vibrant brand color (buttons, highlights)
  accent: "#00C2A8",      // Supporting accent (success, highlights)
  background: "#F7F7FB",  // App background
  surface: "#FFFFFF",     // Card or elevated surfaces
  textPrimary: "#111111", // Main text color
  textSecondary: "#666666", // Muted text or placeholder
  muted: "#666666",       // Added: semantic 'muted' color (same as textSecondary)
  success: "#16A34A",     // Success state
  error: "#DC2626",       // Error state
  border: "#E6E6F0",      // Border and divider color
};

// 📏 Spacing Scale (consistent 4-based system)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// 🧩 Border Radius (consistent rounded design)
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 9999, // For fully rounded buttons or avatars
};

// 🅰️ Typography System
export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
};
