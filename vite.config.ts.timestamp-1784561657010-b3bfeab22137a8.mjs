// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import fs from "fs";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  build: {
    copyPublicDir: false,
    rollupOptions: {
      plugins: [
        {
          name: "manual-public-copy",
          writeBundle(options) {
            const outDir = options.dir || path.resolve(__vite_injected_original_dirname, "dist");
            const publicDir = path.resolve(__vite_injected_original_dirname, "public");
            const skipped = ["image copy copy.png", "image copy.png", "image.png"];
            function copyDirSafe(src, dest) {
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
                  } catch {
                  }
                }
              }
            }
            copyDirSafe(publicDir, outDir);
          }
        }
      ]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIFBsdWdpbiB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcblxuZnVuY3Rpb24gc2FmZVB1YmxpY0NvcHlQbHVnaW4oKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnc2FmZS1wdWJsaWMtY29weScsXG4gICAgYXBwbHk6ICdidWlsZCcsXG4gICAgY29uZmlnUmVzb2x2ZWQoY29uZmlnKSB7XG4gICAgICBjb25zdCBvcmlnQ29weVB1YmxpY0RpciA9IChjb25maWcgYXMgYW55KS5jb3B5UHVibGljRGlyO1xuICAgICAgaWYgKG9yaWdDb3B5UHVibGljRGlyICE9PSBmYWxzZSkge1xuICAgICAgICAoY29uZmlnIGFzIGFueSkuY29weVB1YmxpY0RpciA9IHRydWU7XG4gICAgICB9XG4gICAgfSxcbiAgICBidWlsZFN0YXJ0KCkge1xuICAgICAgY29uc3QgcHVibGljRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3B1YmxpYycpO1xuICAgICAgY29uc3QgbG9ja2VkID0gWydpbWFnZSBjb3B5IGNvcHkucG5nJywgJ2ltYWdlIGNvcHkucG5nJywgJ2ltYWdlLnBuZyddO1xuICAgICAgbG9ja2VkLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICAgIGNvbnN0IHNyYyA9IHBhdGguam9pbihwdWJsaWNEaXIsIG5hbWUpO1xuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhzcmMpKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZzLmFjY2Vzc1N5bmMoc3JjLCBmcy5jb25zdGFudHMuUl9PSyk7XG4gICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgY29weVB1YmxpY0RpcjogZmFsc2UsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgcGx1Z2luczogW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ21hbnVhbC1wdWJsaWMtY29weScsXG4gICAgICAgICAgd3JpdGVCdW5kbGUob3B0aW9ucykge1xuICAgICAgICAgICAgY29uc3Qgb3V0RGlyID0gb3B0aW9ucy5kaXIgfHwgcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2Rpc3QnKTtcbiAgICAgICAgICAgIGNvbnN0IHB1YmxpY0RpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdwdWJsaWMnKTtcbiAgICAgICAgICAgIGNvbnN0IHNraXBwZWQgPSBbJ2ltYWdlIGNvcHkgY29weS5wbmcnLCAnaW1hZ2UgY29weS5wbmcnLCAnaW1hZ2UucG5nJ107XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNvcHlEaXJTYWZlKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRlc3QpKSBmcy5ta2RpclN5bmMoZGVzdCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgIGNvbnN0IGVudHJpZXMgPSBmcy5yZWFkZGlyU3luYyhzcmMpO1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2tpcHBlZC5pbmNsdWRlcyhlbnRyeSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNyY1BhdGggPSBwYXRoLmpvaW4oc3JjLCBlbnRyeSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVzdFBhdGggPSBwYXRoLmpvaW4oZGVzdCwgZW50cnkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhzcmNQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICBjb3B5RGlyU2FmZShzcmNQYXRoLCBkZXN0UGF0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGZzLmNvcHlGaWxlU3luYyhzcmNQYXRoLCBkZXN0UGF0aCk7XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvcHlEaXJTYWZlKHB1YmxpY0Rpciwgb3V0RGlyKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9IGFzIGFueSxcbiAgICAgIF0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUE0QjtBQUM5UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sUUFBUTtBQUhmLElBQU0sbUNBQW1DO0FBK0J6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGNBQWM7QUFBQSxFQUMxQjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLElBQ2YsZUFBZTtBQUFBLE1BQ2IsU0FBUztBQUFBLFFBQ1A7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLFlBQVksU0FBUztBQUNuQixrQkFBTSxTQUFTLFFBQVEsT0FBTyxLQUFLLFFBQVEsa0NBQVcsTUFBTTtBQUM1RCxrQkFBTSxZQUFZLEtBQUssUUFBUSxrQ0FBVyxRQUFRO0FBQ2xELGtCQUFNLFVBQVUsQ0FBQyx1QkFBdUIsa0JBQWtCLFdBQVc7QUFFckUscUJBQVMsWUFBWSxLQUFhLE1BQWM7QUFDOUMsa0JBQUksQ0FBQyxHQUFHLFdBQVcsSUFBSSxFQUFHLElBQUcsVUFBVSxNQUFNLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFDaEUsb0JBQU0sVUFBVSxHQUFHLFlBQVksR0FBRztBQUNsQyx5QkFBVyxTQUFTLFNBQVM7QUFDM0Isb0JBQUksUUFBUSxTQUFTLEtBQUssRUFBRztBQUM3QixzQkFBTSxVQUFVLEtBQUssS0FBSyxLQUFLLEtBQUs7QUFDcEMsc0JBQU0sV0FBVyxLQUFLLEtBQUssTUFBTSxLQUFLO0FBQ3RDLHNCQUFNLE9BQU8sR0FBRyxTQUFTLE9BQU87QUFDaEMsb0JBQUksS0FBSyxZQUFZLEdBQUc7QUFDdEIsOEJBQVksU0FBUyxRQUFRO0FBQUEsZ0JBQy9CLE9BQU87QUFDTCxzQkFBSTtBQUNGLHVCQUFHLGFBQWEsU0FBUyxRQUFRO0FBQUEsa0JBQ25DLFFBQVE7QUFBQSxrQkFBQztBQUFBLGdCQUNYO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFFQSx3QkFBWSxXQUFXLE1BQU07QUFBQSxVQUMvQjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
