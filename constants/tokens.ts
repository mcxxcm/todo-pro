export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const StatusColors = {
  warning: "#ff9500",
  success: "#34c759",
  danger: "#ff3b30",
} as const;

export const Radius = {
  xs: 4,
  sm: 6,
  md: 10,
  card: 16,
  button: 12,
  pill: 999,
} as const;

export const Opacity = {
  disabled: 0.45,
  muted: 0.58,
  subtle: 0.72,
  glassLight: 0.84,
  glassDark: 0.72,
} as const;

export const Shadows = {
  card: {
    light:
      "0 1px 2px rgba(255, 255, 255, 0.9) inset, 0 4px 12px rgba(0, 0, 0, 0.03), 0 16px 40px rgba(17, 24, 28, 0.06)",
    dark:
      "0 1px 1px rgba(255, 255, 255, 0.08) inset, 0 4px 16px rgba(0, 0, 0, 0.22), 0 20px 48px rgba(0, 0, 0, 0.45)",
  },
  floating: {
    light: "0 2px 8px rgba(0, 0, 0, 0.03), 0 12px 32px rgba(17, 24, 28, 0.08)",
    dark: "0 4px 16px rgba(0, 0, 0, 0.2), 0 16px 40px rgba(0, 0, 0, 0.35)",
  },
} as const;

export const Glass = {
  background: {
    light: "rgba(255, 255, 255, 0.35)",
    dark: "rgba(255, 255, 255, 0.04)",
  },
  border: {
    light: "rgba(255, 255, 255, 0.50)",
    dark: "rgba(255, 255, 255, 0.08)",
  },
  inputBackground: {
    light: "rgba(255, 255, 255, 0.40)",
    dark: "rgba(16, 20, 22, 0.18)",
  },
  blurIntensity: {
    light: 75,
    dark: 90,
  },
  rim: {
    light: "rgba(255, 255, 255, 0.92)",
    dark: "rgba(255, 255, 255, 0.22)",
  },
  refraction: {
    light: "rgba(255, 255, 255, 0.45)",
    dark: "rgba(255, 255, 255, 0.1)",
  },
  depth: {
    light: "rgba(19, 28, 30, 0.04)",
    dark: "rgba(255, 255, 255, 0.04)",
  },
  surface: {
    base: {
      light: "#f5f6f2",
      dark: "#0b0d0e",
    },
    naturalLight: {
      light: "rgba(240, 232, 218, 0.55)", // Champagne Sand-Gold
      dark: "rgba(210, 190, 160, 0.04)",
    },
    naturalFalloff: {
      light: "rgba(216, 222, 228, 0.20)", // Slate Blue-Grey
      dark: "rgba(140, 160, 180, 0.03)",
    },
    ambientShade: {
      light: "rgba(32, 38, 38, 0.03)",
      dark: "rgba(0, 0, 0, 0.18)",
    },
    quietLine: {
      light: "rgba(255, 255, 255, 0.45)",
      dark: "rgba(255, 255, 255, 0.03)",
    },
  },
} as const;

export const Motion = {
  duration: {
    fast: 160,
    standard: 220,
    slow: 320,
  },
  translate: {
    listEnterY: 8,
  },
  stagger: {
    listItem: 24,
    maxListDelay: 160,
  },
} as const;
