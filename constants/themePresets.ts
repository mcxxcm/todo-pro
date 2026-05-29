export type ThemePresetId = string;

export interface ThemePreset {
  id: ThemePresetId;
  label: string;
  colors: {
    light: {
      base: string;
      blob1: string;
      blob2: string;
      blob3: string;
    };
    dark: {
      base: string;
      blob1: string;
      blob2: string;
      blob3: string;
    };
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "dune",
    label: "北欧沙丘",
    colors: {
      light: {
        base: "#f5f4f0",
        blob1: "rgba(180, 175, 168, 0.65)",
        blob2: "rgba(195, 188, 178, 0.55)",
        blob3: "rgba(170, 165, 160, 0.60)",
      },
      dark: {
        base: "#121110",
        blob1: "rgba(150, 145, 135, 0.60)",
        blob2: "rgba(160, 152, 142, 0.50)",
        blob3: "rgba(135, 130, 125, 0.55)",
      },
    },
  },
  {
    id: "aurora",
    label: "极光流体",
    colors: {
      light: {
        base: "#f2f4f5",
        blob1: "rgba(110, 170, 160, 0.55)", // cinematic teal
        blob2: "rgba(120, 145, 175, 0.50)", // deep slate blue
        blob3: "rgba(145, 135, 165, 0.45)", // muted lavender
      },
      dark: {
        base: "#0c0e10",
        blob1: "rgba(60, 160, 140, 0.55)", // emerald glow
        blob2: "rgba(50, 100, 150, 0.50)", // ocean navy glow
        blob3: "rgba(110, 80, 140, 0.45)", // dark twilight glow
      },
    },
  },
  {
    id: "midnight",
    label: "深海夜航",
    colors: {
      light: {
        base: "#f0f2f5",
        blob1: "rgba(100, 140, 190, 0.55)", // slate cobalt
        blob2: "rgba(90, 160, 170, 0.50)", // muted cyan
        blob3: "rgba(130, 120, 170, 0.45)", // slate purple
      },
      dark: {
        base: "#07080a",
        blob1: "rgba(55, 110, 190, 0.60)", // deep cobalt glow
        blob2: "rgba(40, 140, 155, 0.55)", // dark cyan glow
        blob3: "rgba(90, 60, 160, 0.50)", // midnight indigo glow
      },
    },
  },
  {
    id: "sunset",
    label: "落日余晖",
    colors: {
      light: {
        base: "#f8f4f2",
        blob1: "rgba(220, 150, 120, 0.55)", // soft rust
        blob2: "rgba(210, 170, 110, 0.50)", // warm gold
        blob3: "rgba(190, 130, 150, 0.45)", // dusky rose
      },
      dark: {
        base: "#110c0a",
        blob1: "rgba(180, 95, 70, 0.60)",  // dark rust glow
        blob2: "rgba(170, 125, 60, 0.55)", // dark gold glow
        blob3: "rgba(150, 85, 110, 0.50)",  // dark rose glow
      },
    },
  },
];
