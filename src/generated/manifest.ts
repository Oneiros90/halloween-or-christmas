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
    background: { path: "./assets/halloween/background.mp4?v=c53335bd1727", kind: "video" },
    foreground: null,
    music: { path: "./assets/halloween/music.mp3?v=724d9583828e", kind: "audio" },
  },
  christmas: {
    background: { path: "./assets/christmas/background.mp4?v=a3c5de5c36bd", kind: "video" },
    foreground: { path: "./assets/christmas/foreground.png?v=395ca1a546f0", kind: "image" },
    music: { path: "./assets/christmas/music.mp3?v=d8dcee6b0689", kind: "audio" },
  },
  default: {
    background: { path: "./assets/default/background.jpg?v=74120789dbdf", kind: "image" },
    foreground: null,
    music: null,
  },
};
