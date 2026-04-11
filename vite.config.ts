import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function safePublicCopyPlugin(): Plugin {
  return {
    name: 'safe-public-copy',
    apply: 'build',
    configResolved(config) {
      const origCopyPublicDir = (config as any).copyPublicDir;
      if (origCopyPublicDir !== false) {
        (config as any).copyPublicDir = true;
      }
    },
    buildStart() {
      const publicDir = path.resolve(__dirname, 'public');
      const locked = ['image copy copy.png', 'image copy.png', 'image.png'];
      locked.forEach(name => {
        const src = path.join(publicDir, name);
        if (fs.existsSync(src)) {
          try {
            fs.accessSync(src, fs.constants.R_OK);
          } catch {
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    copyPublicDir: false,
    rollupOptions: {
      plugins: [
        {
          name: 'manual-public-copy',
          writeBundle(options) {
            const outDir = options.dir || path.resolve(__dirname, 'dist');
            const publicDir = path.resolve(__dirname, 'public');
            const skipped = ['image copy copy.png', 'image copy.png', 'image.png'];

            function copyDirSafe(src: string, dest: string) {
              if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
              const entries = fs.readdirSync(src);
              for (const entry of entries) {
                if (skipped.includes(entry)) continue;
                const srcPath = path.join(src, entry);
                const destPath = path.join(dest, entry);
                const stat = fs.statSync(srcPath);
                if (stat.isDirectory()) {
                  copyDirSafe(srcPath, destPath);
                } else {
                  try {
                    fs.copyFileSync(srcPath, destPath);
                  } catch {}
                }
              }
            }

            copyDirSafe(publicDir, outDir);
          },
        } as any,
      ],
    },
  },
});
