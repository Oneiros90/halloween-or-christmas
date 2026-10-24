import type { ThemeAssets } from './generated/manifest';

export type ThemeUrls = {
  background: string | null;
  foreground: string | null;
  music: string | null;
};

function fetchBlobUrl(assetPath: string): Promise<string | null> {
  return fetch(assetPath)
    .then((res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch ' + assetPath);
      }
      return res.blob();
    })
    .then((blob) => URL.createObjectURL(blob))
    .catch(() => null);
}

export function preloadTheme(assets: ThemeAssets): Promise<ThemeUrls> {
  const background = assets.background
    ? fetchBlobUrl(assets.background.path)
    : Promise.resolve(null);
  const foreground = assets.foreground
    ? fetchBlobUrl(assets.foreground.path)
    : Promise.resolve(null);
  const music = assets.music ? fetchBlobUrl(assets.music.path) : Promise.resolve(null);

  return Promise.all([background, foreground, music]).then((parts) => {
    return {
      background: parts[0],
      foreground: parts[1],
      music: parts[2],
    };
  });
}
