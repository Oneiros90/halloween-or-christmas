import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = path.join(root, 'assets');
const outFile = path.join(root, 'src', 'generated', 'manifest.ts');

const THEME_IDS = ['halloween', 'christmas', 'default'];
const SLOTS = ['background', 'foreground', 'music'];

const IMAGE_EXT = {
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.webp': 'image',
  '.gif': 'image',
};
const VIDEO_EXT = {
  '.mp4': 'video',
  '.webm': 'video',
  '.ogv': 'video',
};
const AUDIO_EXT = {
  '.mp3': 'audio',
  '.ogg': 'audio',
  '.wav': 'audio',
  '.m4a': 'audio',
  '.aac': 'audio',
};

const MEDIA_EXT = Object.assign({}, IMAGE_EXT, VIDEO_EXT);
const MUSIC_EXT = AUDIO_EXT;

function kindFor(slot, ext) {
  const table = slot === 'music' ? MUSIC_EXT : MEDIA_EXT;
  return table[ext] || null;
}

function hashFile(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex').slice(0, 12);
}

function collectTheme(themeId) {
  const dir = path.join(assetsRoot, themeId);
  const result = {
    background: null,
    foreground: null,
    music: null,
  };

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return result;
  }

  const files = fs.readdirSync(dir).filter((name) => {
    const abs = path.join(dir, name);
    return fs.statSync(abs).isFile() && !name.startsWith('.');
  });

  for (let i = 0; i < SLOTS.length; i += 1) {
    const slot = SLOTS[i];
    const matches = files.filter((name) => path.parse(name).name.toLowerCase() === slot);
    if (matches.length > 1) {
      throw new Error('Multiple ' + slot + ' files in assets/' + themeId + ': ' + matches.join(', '));
    }
    if (matches.length === 0) {
      continue;
    }

    const fileName = matches[0];
    const ext = path.extname(fileName).toLowerCase();
    const kind = kindFor(slot, ext);
    if (!kind) {
      throw new Error('Unsupported ' + slot + ' file in assets/' + themeId + ': ' + fileName);
    }

    const abs = path.join(dir, fileName);
    const version = hashFile(abs);
    const url = './assets/' + themeId + '/' + fileName + '?v=' + version;
    result[slot] = { path: url, kind: kind };
  }

  return result;
}

const manifest = {};
for (let i = 0; i < THEME_IDS.length; i += 1) {
  const id = THEME_IDS[i];
  manifest[id] = collectTheme(id);
}

function dumpSlot(slot) {
  if (!slot) {
    return 'null';
  }
  return (
    '{ path: ' +
    JSON.stringify(slot.path) +
    ', kind: ' +
    JSON.stringify(slot.kind) +
    ' }'
  );
}

function dumpTheme(theme) {
  return (
    '{\n    background: ' +
    dumpSlot(theme.background) +
    ',\n    foreground: ' +
    dumpSlot(theme.foreground) +
    ',\n    music: ' +
    dumpSlot(theme.music) +
    ',\n  }'
  );
}

const source =
  'export type SlotKind = "image" | "video" | "audio";\n' +
  '\n' +
  'export type SlotAsset = {\n' +
  '  path: string;\n' +
  '  kind: SlotKind;\n' +
  '};\n' +
  '\n' +
  'export type ThemeAssets = {\n' +
  '  background: SlotAsset | null;\n' +
  '  foreground: SlotAsset | null;\n' +
  '  music: SlotAsset | null;\n' +
  '};\n' +
  '\n' +
  'export type ThemeId = "halloween" | "christmas" | "default";\n' +
  '\n' +
  'export const THEME_IDS: ThemeId[] = ["halloween", "christmas", "default"];\n' +
  '\n' +
  'export const MANIFEST: Record<ThemeId, ThemeAssets> = {\n' +
  '  halloween: ' +
  dumpTheme(manifest.halloween) +
  ',\n' +
  '  christmas: ' +
  dumpTheme(manifest.christmas) +
  ',\n' +
  '  default: ' +
  dumpTheme(manifest.default) +
  ',\n' +
  '};\n';

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, source);
console.log('Wrote ' + path.relative(root, outFile));
