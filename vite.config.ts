import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

const root = path.dirname(fileURLToPath(import.meta.url));

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function assetsPlugin(): Plugin {
  const assetsDir = path.resolve(root, 'assets');

  return {
    name: 'seasonal-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) {
          next();
          return;
        }
        const urlPath = req.url.split('?')[0];
        if (urlPath.indexOf('/assets/') !== 0) {
          next();
          return;
        }
        const rel = decodeURIComponent(urlPath.replace(/^\/+/, ''));
        const abs = path.resolve(root, rel);
        const inside = path.relative(assetsDir, abs);
        if (inside.indexOf('..') === 0 || path.isAbsolute(inside)) {
          next();
          return;
        }
        if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
          next();
          return;
        }
        const ext = path.extname(abs).toLowerCase();
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(abs).pipe(res);
      });
    },
    closeBundle() {
      const dest = path.resolve(root, 'dist', 'assets');
      fs.cpSync(assetsDir, dest, { recursive: true });
    },
  };
}

function classicScripts(): Plugin {
  return {
    name: 'classic-scripts',
    apply: 'build',
    enforce: 'post',
    writeBundle() {
      const file = path.resolve(root, 'dist', 'index.html');
      if (!fs.existsSync(file)) {
        return;
      }
      let html = fs.readFileSync(file, 'utf8');
      html = html
        .replace(/\s*type="module"/g, '')
        .replace(/\s*crossorigin/g, '')
        .replace(/<link rel="modulepreload"[^>]*>/g, '');
      const match = html.match(/<script>[\s\S]*?<\/script>/);
      if (match && html.indexOf('</body>') !== -1) {
        html = html.replace(match[0], '');
        html = html.replace('</body>', '  ' + match[0] + '\n  </body>');
      }
      fs.writeFileSync(file, html);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    svelte(),
    viteSingleFile({
      useRecommendedBuildConfig: true,
      removeViteModuleLoader: true,
    }),
    classicScripts(),
    assetsPlugin(),
  ],
  esbuild: {
    target: 'es2015',
  },
  build: {
    target: 'es2015',
    cssTarget: 'chrome49',
    cssCodeSplit: false,
    modulePreload: false,
    assetsInlineLimit: 0,
    minify: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
