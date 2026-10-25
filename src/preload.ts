import type { SlotAsset, ThemeAssets } from './generated/manifest';

export type ThemeUrls = {
  background: string | null;
  foreground: string | null;
  music: string | null;
};

function warmImage(path: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    const done = () => {
      resolve(path);
    };
    image.onload = done;
    image.onerror = done;
    image.src = path;
  });
}

function assetUrl(asset: SlotAsset | null): Promise<string | null> {
  if (!asset) {
    return Promise.resolve(null);
  }
  if (asset.kind === 'image') {
    return warmImage(asset.path);
  }
  return Promise.resolve(asset.path);
}

export function preloadTheme(assets: ThemeAssets): Promise<ThemeUrls> {
  return Promise.all([
    assetUrl(assets.background),
    assetUrl(assets.foreground),
    assetUrl(assets.music),
  ]).then((parts) => {
    return {
      background: parts[0],
      foreground: parts[1],
      music: parts[2],
    };
  });
}
