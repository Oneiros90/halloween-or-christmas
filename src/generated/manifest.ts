export type SlotKind = "image" | "video" | "audio";

export type SlotAsset = {
  path: string;
  kind: SlotKind;
};

export type ThemeAssets = {
  background: SlotAsset | null;
  foreground: SlotAsset | null;
  music: SlotAsset | null;
};

export type ThemeId = "halloween" | "christmas" | "default";

export const THEME_IDS: ThemeId[] = ["halloween", "christmas", "default"];

export const MANIFEST: Record<ThemeId, ThemeAssets> = {
  halloween: {
    background: { path: "./assets/halloween/background.mp4?v=ded495563978", kind: "video" },
    foreground: null,
    music: { path: "./assets/halloween/music.mp3?v=85e31fe621fd", kind: "audio" },
  },
  christmas: {
    background: { path: "./assets/christmas/background.mp4?v=5454b7305054", kind: "video" },
    foreground: { path: "./assets/christmas/foreground.png?v=395ca1a546f0", kind: "image" },
    music: { path: "./assets/christmas/music.mp3?v=b8e6282f6a9a", kind: "audio" },
  },
  default: {
    background: { path: "./assets/default/background.jpg?v=74120789dbdf", kind: "image" },
    foreground: null,
    music: null,
  },
};
